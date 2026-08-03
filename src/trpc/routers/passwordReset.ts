import { z } from "zod";
import { createTRPCRouter, rateLimitedPublicProcedure } from "../../lib/trpc/server";
import { db } from "../../db";
import { users, passwordResets } from "../../db/schema";
import { eq, or, and, isNull, gt, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { toE164 } from "../../lib/phone";
import { sendPhoneOtp, checkPhoneOtp } from "../../lib/twilio";
import { sendPasswordResetEmail } from "../../lib/resend";
import { generateOtpCode, hashOtpCode, verifyOtpCode } from "../../lib/otp";

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

/** Priority: email → WhatsApp → SMS. Returns true if any channel accepted the OTP send. */
async function sendResetOtp(user: {
  id: string;
  email: string | null;
  phone: string;
}): Promise<boolean> {
  // 1) Email first (preferred default)
  if (user.email) {
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
      return true;
    } catch (err) {
      // Invalidate the unused email OTP and fall through to phone channels
      await db
        .update(passwordResets)
        .set({ consumedAt: new Date() })
        .where(and(eq(passwordResets.userId, user.id), isNull(passwordResets.consumedAt)));
      console.error("[passwordReset] sendPasswordResetEmail failed, trying phone:", err);
    }
  }

  // 2) WhatsApp, then 3) SMS (Twilio Verify handles the WhatsApp→SMS fallback)
  if (hasRecoverablePhone(user.phone)) {
    try {
      await sendPhoneOtp(toE164(user.phone));
      return true;
    } catch (err) {
      console.error("[passwordReset] sendPhoneOtp failed:", err);
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
        return { message: GENERIC_MESSAGE };
      }

      const [user] = await db
        .select()
        .from(users)
        .where(or(eq(users.phone, identifier), eq(users.email, identifier)))
        .limit(1);

      if (user && user.id !== "SYSTEM" && user.status !== "CONGELADO") {
        // Prefer email, then WhatsApp, then SMS — never reveal which channel was used
        await sendResetOtp({
          id: user.id,
          email: user.email,
          phone: user.phone,
        });
      }

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
      const [user] = await db
        .select()
        .from(users)
        .where(or(eq(users.phone, input.identifier), eq(users.email, input.identifier)))
        .limit(1);

      if (!user || user.id === "SYSTEM" || user.status === "CONGELADO") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Código inválido o expirado." });
      }

      // Match send priority: try email OTP first, then Twilio (WhatsApp/SMS)
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

      return { success: true as const };
    }),
});
