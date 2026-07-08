/** Inclusive start / exclusive end of the calendar month containing `now`. */
export function getCurrentMonthRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  return { start, end };
}

export const AUDIT_REWARD_CONCEPT = "Recompensa de Auditoría Mensual" as const;
export const AUDIT_REWARD_AMOUNT = 30 as const;

export type AuditRewardStatusValue =
  | "NEEDS_ACTIVITY"
  | "NEEDS_PEER_VALIDATION"
  | "READY_TO_CLAIM"
  | "CLAIMED";

export type AuditRewardStatus = {
  status: AuditRewardStatusValue;
  hasActivity: boolean;
  hasPeerValidation: boolean;
  alreadyClaimed: boolean;
};
