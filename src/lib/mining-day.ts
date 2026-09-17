/**
 * Civil-day mining clock for the Túmin network.
 * Always America/Mexico_City — never the Node process TZ or the client's browser.
 */

export const MINING_TIMEZONE = "America/Mexico_City" as const;

export type MiningBlockReason = "OK" | "NO_PRODUCT" | "ALREADY_MINED";

export interface LastMiningRecord {
  minedOn: string; // YYYY-MM-DD
  streak: number;
}

export interface EvaluateMiningClaimInput {
  now?: Date;
  last: LastMiningRecord | null;
  hasActiveProduct: boolean;
}

export interface EvaluateMiningClaimResult {
  today: string;
  alreadyMinedToday: boolean;
  canMine: boolean;
  reason: MiningBlockReason;
  /** Streak shown in UI (current if already mined today; else prior streak if yesterday, else 0). */
  displayStreak: number;
  /** Streak that would be written on a successful claim. */
  nextStreak: number;
  nextReward: number;
  /** When the next claim becomes available (now if canMine). */
  nextAvailableAt: Date;
  timezone: typeof MINING_TIMEZONE;
}

const civilDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: MINING_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Calendar date YYYY-MM-DD in America/Mexico_City (or override). */
export function civilDateInZone(
  instant: Date,
  timeZone: string = MINING_TIMEZONE
): string {
  const formatter =
    timeZone === MINING_TIMEZONE
      ? civilDateFormatter
      : new Intl.DateTimeFormat("en-CA", {
          timeZone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
  return formatter.format(instant);
}

/** Add (or subtract) whole calendar days to a YYYY-MM-DD string via UTC noon — no DST drift. */
export function addDaysToCivilDate(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0));
  const yy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(utc.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/**
 * Next midnight (00:00) in America/Mexico_City strictly after `instant`.
 * Mexico City is UTC−6 year-round (no DST since 2022).
 */
export function nextMidnightInZone(
  instant: Date,
  timeZone: string = MINING_TIMEZONE
): Date {
  const today = civilDateInZone(instant, timeZone);
  const tomorrow = addDaysToCivilDate(today, 1);
  // Interpret tomorrow 00:00 in Mexico as UTC+6 hours (CST = UTC−6).
  // America/Mexico_City offset is fixed −06:00 since 2022-10-30.
  const [y, m, d] = tomorrow.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 6, 0, 0, 0));
}

export function rewardForStreak(streak: number): number {
  if (streak >= 30) return 10;
  if (streak >= 15) return 7;
  if (streak >= 7) return 5;
  if (streak >= 3) return 3;
  return 1;
}

export function miningIdempotencyKey(userId: string, minedOn: string): string {
  return `minado:${userId}:${minedOn}`;
}

export function evaluateMiningClaim(
  input: EvaluateMiningClaimInput
): EvaluateMiningClaimResult {
  const now = input.now ?? new Date();
  const today = civilDateInZone(now);
  const yesterday = addDaysToCivilDate(today, -1);

  const alreadyMinedToday = input.last?.minedOn === today;

  let nextStreak = 1;
  let displayStreak = 0;

  if (alreadyMinedToday && input.last) {
    displayStreak = input.last.streak;
    nextStreak = input.last.streak;
  } else if (input.last?.minedOn === yesterday) {
    nextStreak = input.last.streak + 1;
    displayStreak = input.last.streak;
  } else if (input.last) {
    nextStreak = 1;
    displayStreak = 0;
  }

  let reason: MiningBlockReason = "OK";
  if (!input.hasActiveProduct) reason = "NO_PRODUCT";
  else if (alreadyMinedToday) reason = "ALREADY_MINED";

  const canMine = reason === "OK";
  const nextReward = rewardForStreak(nextStreak);

  return {
    today,
    alreadyMinedToday,
    canMine,
    reason,
    displayStreak,
    nextStreak,
    nextReward,
    nextAvailableAt: canMine ? now : nextMidnightInZone(now),
    timezone: MINING_TIMEZONE,
  };
}
