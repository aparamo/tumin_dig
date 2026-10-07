import { MINING_TIMEZONE, civilDateInZone } from "@/lib/mining-day";

export const STATS_PERIODS = ["day", "week", "month", "year", "all"] as const;
export type StatsPeriod = (typeof STATS_PERIODS)[number];

export interface PeriodWindow {
  period: StatsPeriod;
  /** Inclusive start instant (UTC Date), or null for all-time */
  from: Date | null;
  /** Exclusive end instant */
  to: Date | null;
  label: string;
}

/**
 * Calendar windows in America/Mexico_City (same civil calendar as mining).
 * Week = Monday 00:00 through next Monday 00:00.
 * Offset is fixed UTC−06:00 since 2022-10-30.
 */
export function periodWindow(
  period: StatsPeriod,
  now: Date = new Date()
): PeriodWindow {
  if (period === "all") {
    return { period, from: null, to: null, label: "Todo" };
  }

  const civil = civilDateInZone(now);
  const [y, m, d] = civil.split("-").map(Number) as [number, number, number];
  const mxOffsetHours = 6;

  function mxMidnightUtc(year: number, month: number, day: number): Date {
    return new Date(Date.UTC(year, month - 1, day, mxOffsetHours, 0, 0, 0));
  }

  const todayStart = mxMidnightUtc(y, m, d);

  if (period === "day") {
    const to = new Date(todayStart);
    to.setUTCDate(to.getUTCDate() + 1);
    return { period, from: todayStart, to, label: "Hoy" };
  }

  if (period === "week") {
    const wdFmt = new Intl.DateTimeFormat("en-US", {
      timeZone: MINING_TIMEZONE,
      weekday: "short",
    });
    const wd = wdFmt.format(now);
    const map: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    const dayOfWeek = map[wd] ?? 1;
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(todayStart);
    weekStart.setUTCDate(weekStart.getUTCDate() - daysFromMonday);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
    return { period, from: weekStart, to: weekEnd, label: "Semana" };
  }

  if (period === "month") {
    const from = mxMidnightUtc(y, m, 1);
    const to =
      m === 12 ? mxMidnightUtc(y + 1, 1, 1) : mxMidnightUtc(y, m + 1, 1);
    return { period, from, to, label: "Mes" };
  }

  const from = mxMidnightUtc(y, 1, 1);
  const to = mxMidnightUtc(y + 1, 1, 1);
  return { period, from, to, label: "Año" };
}
