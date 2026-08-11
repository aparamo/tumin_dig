import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";

/** Canonical ledger/bonus issuer used by the app */
export const SYSTEM_USER_ID = "SYSTEM";

/**
 * Legacy sheets-migration reserve account (`SISTEMA`) plus canonical `SYSTEM`.
 * Both must never authenticate, appear in directories, or receive peer transfers.
 */
export const SYSTEM_ACCOUNT_IDS = [SYSTEM_USER_ID, "SISTEMA"] as const;

export type SystemAccountId = (typeof SYSTEM_ACCOUNT_IDS)[number];

type Tx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export function isSystemAccountId(id: string | null | undefined): boolean {
  if (!id) return false;
  return (SYSTEM_ACCOUNT_IDS as readonly string[]).includes(id);
}

/** Phone markers used by internal system rows (never real members) */
export function isSystemPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const p = phone.trim().toUpperCase();
  return p === "SYSTEM_INTERNAL" || p === "SYSTEM_PHONE";
}

function requireSystemNipSecret(): string {
  const secret = process.env.SYSTEM_NIP_SECRET?.trim();
  if (process.env.NODE_ENV === "production") {
    if (!secret || secret === "rotate-me-immediately") {
      throw new Error(
        "SYSTEM_NIP_SECRET must be set to a strong unique value in production"
      );
    }
    return secret;
  }
  return secret && secret.length > 0 ? secret : "rotate-me-immediately";
}

/**
 * Ensures the canonical SYSTEM user exists and stays non-public / frozen / non-privileged.
 * Also hardens the legacy SISTEMA row if present (from sheets migration).
 */
export async function ensureSystemUser(tx?: Tx) {
  const executor = tx ?? db;

  const hardened = {
    status: "CONGELADO" as const,
    /** SOCIO: even a forged JWT would fail coordinatorProcedure */
    role: "SOCIO" as const,
    publicProfile: false,
    showPhone: false,
    showEmail: false,
    showRegion: false,
    isVerified: false,
  };

  const [existingSystem] = await executor
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, SYSTEM_USER_ID))
    .limit(1);

  if (!existingSystem) {
    const nipHash = await bcrypt.hash(requireSystemNipSecret(), 10);
    await executor.insert(users).values({
      id: SYSTEM_USER_ID,
      name: "Sistema Tumin",
      phone: "SYSTEM_INTERNAL",
      nip: nipHash,
      region: "SISTEMA",
      ...hardened,
    });
  } else {
    await executor
      .update(users)
      .set({
        ...hardened,
        region: "SISTEMA",
      })
      .where(eq(users.id, SYSTEM_USER_ID));
  }

  // Legacy migration reserve — hide and deprivilege if it exists; do not create it
  await executor
    .update(users)
    .set({ ...hardened })
    .where(inArray(users.id, ["SISTEMA"]));
}
