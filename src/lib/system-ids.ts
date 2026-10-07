/** Canonical ledger/bonus issuer used by the app */
export const SYSTEM_USER_ID = "SYSTEM";

/**
 * Legacy sheets-migration reserve account (`SISTEMA`) plus canonical `SYSTEM`.
 * Both must never authenticate, appear in directories, or receive peer transfers.
 *
 * Pure module — safe to import from client components (no DB / Node builtins).
 */
export const SYSTEM_ACCOUNT_IDS = [SYSTEM_USER_ID, "SISTEMA"] as const;

export type SystemAccountId = (typeof SYSTEM_ACCOUNT_IDS)[number];

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
