import { z } from "zod";
import { createTRPCRouter, rateLimitedPublicProcedure } from "../../lib/trpc/server";
import { db } from "../../db";
import { users, passwordResets } from "../../db/schema";
import { eq, or, and, isNull, gt, desc, inArray, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { toE164, phoneLookupCandidates, looksLikePhone } from "../../lib/phone";
import { sendPhoneOtp, checkPhoneOtp } from "../../lib/twilio";
import { sendPasswordResetEmail } from "../../lib/resend";
import { generateOtpCode, hashOtpCode, verifyOtpCode } from "../../lib/otp";
import { isSystemAccountId } from "../../lib/system-user";

const GENERIC_MESSAGE =
  "Si el teléfono o correo está registrado, te enviamos un código para recuperar tu NIP.";

const MAX_ATTEMPTS = 5;
const CODE_TTL_MINUTES = 10;

interface IdentifierLimitEntry {
  count: number;
  windowStart: number;
}

const identifierLimitStore = new Map<string, IdentifierLimitEntry>();
const IDENTIFIER_WINDOW_MS = 10 * 60_000;
const IDENTIFIER_MAX_REQUESTS = 3;

function checkIdentifierRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = identifierLimitStore.get(identifier);
  if (!entry || now - entry.windowStart > IDENTIFIER_WINDOW_MS) {
    identifierLimitStore.set(identifier, { count: 1, windowStart: now });
    return true;
  }
  entry.count += 1;
  return entry.count <= IDENTIFIER_MAX_REQUESTS;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of identifierLimitStore.entries()) {
    if (now - entry.windowStart > IDENTIFIER_WINDOW_MS * 2) identifierLimitStore.delete(key);
  }
}, IDENTIFIER_WINDOW_MS * 2);

function hasRecoverablePhone(phone: string | null | undefined): phone is string {
  return Boolean(phone && phone !== "SYSTEM_INTERNAL");
}

/** Safe server-only diagnostics — never log OTP codes, NIPs, or full emails/phones. */
function logReset(event: string, meta: Record<string, unknown>) {
  console.info(`[passwordReset] ${event}`, meta);
}

async function findUserByIdentifier(identifier: string) {
  const trimmed = identifier.trim();
  const emailLower = trimmed.toLowerCase();

  // 1) Exact phone OR exact email (case-sensitive email as stored)
  const [exact] = await db
    .select()
    .from(users)
    .where(or(eq(users.phone, trimmed), eq(users.email, trimmed)))
    .limit(1);
  if (exact) return exact;

  // 2) Email case-insensitive
  if (trimmed.includes("@")) {
    const [byEmail] = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${emailLower}`)
      .limit(1);
    if (byEmail) return byEmail;
  }

  // 3) Phone with format variants (10-digit, +52, etc.)
  if (looksLikePhone(trimmed)) {
    const candidates = phoneLookupCandidates(trimmed);
    if (candidates.length > 0) {
      const [byPhone] = await db
        .select()
        .from(users)
        .where(inArray(users.phone, candidates))
        .limit(1);
      if (byPhone) return byPhone;
    }
  }

  return null;
}

/** Priority: email → WhatsApp → SMS. Returns true if any channel accepted the OTP send. */
async function sendResetOtp(user: {
  id: string;
  email: string | null;
  phone: string;
}): Promise<boolean> {
  // 1) Email first (preferred default)
  if (user.email) {
    const hasResendKey = Boolean(process.env.RESEND_API_KEY);
    if (!hasResendKey) {
      logReset("email_skipped_missing_env", {
        userId: user.id,
        hasResendKey: false,
        hasEmailFrom: Boolean(process.env.EMAIL_FROM),
      });
    } else {
      const code = generateOtpCode();
      const codeHash = await hashOtpCode(code);
      const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60_000);

      await db
        .update(passwordResets)
        .set({ consumedAt: new Date() })
        .where(and(eq(passwordResets.userId, user.id), isNull(passwordResets.consumedAt)));

      await db.insert(passwordResets).values({
        userId: user.id,
        channel: "EMAIL",
        codeHash,
        expiresAt,
      });

      try {
        await sendPasswordResetEmail(user.email, code);
        logReset("email_sent", { userId: user.id });
        return true;
      } catch (err) {
        await db
          .update(passwordResets)
          .set({ consumedAt: new Date() })
          .where(and(eq(passwordResets.userId, user.id), isNull(passwordResets.consumedAt)));
        logReset("email_failed", {
          userId: user.id,
          error: err instanceof Error ? err.message : "unknown",
        });
      }
    }
  } else {
    logReset("no_email_on_user", { userId: user.id });
  }

  // 2) WhatsApp, then 3) SMS
  if (hasRecoverablePhone(user.phone)) {
    const twilioConfigured = Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_VERIFY_SERVICE_SID
    );
    if (!twilioConfigured) {
      logReset("phone_skipped_missing_env", { userId: user.id });
      return false;
    }
    try {
      const { channel } = await sendPhoneOtp(toE164(user.phone));
      logReset("phone_sent", { userId: user.id, channel });
      return true;
    } catch (err) {
      logReset("phone_failed", {
        userId: user.id,
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  return false;
}

async function verifyEmailOtp(userId: string, code: string): Promise<boolean> {
  const [pending] = await db
    .select()
    .from(passwordResets)
    .where(
      and(
        eq(passwordResets.userId, userId),
        eq(passwordResets.channel, "EMAIL"),
        isNull(passwordResets.consumedAt),
        gt(passwordResets.expiresAt, new Date())
      )
    )
    .orderBy(desc(passwordResets.createdAt))
    .limit(1);

  if (!pending || pending.attempts >= MAX_ATTEMPTS) return false;

  const ok = await verifyOtpCode(code, pending.codeHash);
  if (ok) {
    await db
      .update(passwordResets)
      .set({ consumedAt: new Date() })
      .where(eq(passwordResets.id, pending.id));
    return true;
  }

  await db
    .update(passwordResets)
    .set({ attempts: pending.attempts + 1 })
    .where(eq(passwordResets.id, pending.id));
  return false;
}

export const passwordResetRouter = createTRPCRouter({
  request: rateLimitedPublicProcedure
    .input(z.object({ identifier: z.string().trim().min(3).max(120) }))
    .mutation(async ({ input }) => {
      const identifier = input.identifier;

      if (!checkIdentifierRateLimit(identifier.toLowerCase())) {
        logReset("rate_limited", { kind: "identifier" });
        return { message: GENERIC_MESSAGE };
      }

      const user = await findUserByIdentifier(identifier);

      if (!user) {
        logReset("user_not_found", {
          identifierKind: looksLikePhone(identifier) ? "phone" : identifier.includes("@") ? "email" : "other",
        });
        return { message: GENERIC_MESSAGE };
      }

      if (isSystemAccountId(user.id) || user.status === "CONGELADO") {
        logReset("user_blocked", { userId: user.id, status: user.status });
        return { message: GENERIC_MESSAGE };
      }

      logReset("user_matched", {
        userId: user.id,
        hasEmail: Boolean(user.email),
        hasPhone: hasRecoverablePhone(user.phone),
      });

      const sent = await sendResetOtp({
        id: user.id,
        email: user.email,
        phone: user.phone,
      });

      logReset("request_done", { userId: user.id, sent });

      return { message: GENERIC_MESSAGE };
    }),

  confirm: rateLimitedPublicProcedure
    .input(
      z.object({
        identifier: z.string().trim().min(3).max(120),
        code: z.string().trim().min(4).max(10),
        newNip: z
          .string()
          .min(4, "El NIP debe tener entre 4 y 6 caracteres")
          .max(6, "El NIP debe tener entre 4 y 6 caracteres"),
      })
    )
    .mutation(async ({ input }) => {
      const user = await findUserByIdentifier(input.identifier);

      if (!user || isSystemAccountId(user.id) || user.status === "CONGELADO") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Código inválido o expirado." });
      }

      let verified = await verifyEmailOtp(user.id, input.code);

      if (!verified && hasRecoverablePhone(user.phone)) {
        try {
          verified = await checkPhoneOtp(toE164(user.phone), input.code);
        } catch {
          verified = false;
        }
      }

      if (!verified) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Código inválido o expirado." });
      }

      const hashedNip = await bcrypt.hash(input.newNip, 10);
      await db
        .update(users)
        .set({ nip: hashedNip, failedLoginAttempts: 0, lockedUntil: null })
        .where(eq(users.id, user.id));

      logReset("nip_updated", { userId: user.id });

      return { success: true as const };
    }),
});
