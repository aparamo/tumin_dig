import { and, notInArray, sql, type SQL } from "drizzle-orm";
import { users } from "@/db/schema";
import { SYSTEM_ACCOUNT_IDS, isSystemAccountId, isSystemPhone } from "@/lib/system-ids";
import { isSystemUserRegion } from "@/lib/location";

/**
 * Exclude ledger/system rows and technical adscripción labels from member queues.
 * Matches directory belt-and-suspenders filters.
 */
export function excludeTechnicalAccountsCondition(): SQL {
  return and(
    notInArray(users.id, [...SYSTEM_ACCOUNT_IDS]),
    sql`UPPER(TRIM(${users.region})) NOT IN ('SISTEMA', 'SYSTEM', 'GENERAL')`,
    sql`UPPER(TRIM(${users.phone})) NOT IN ('SYSTEM_INTERNAL', 'SYSTEM_PHONE')`
  )!;
}

export function isTechnicalAccount(user: {
  id: string;
  region: string;
  phone: string;
}): boolean {
  return (
    isSystemAccountId(user.id) ||
    isSystemUserRegion(user.region) ||
    user.region.trim().toUpperCase() === "GENERAL" ||
    isSystemPhone(user.phone)
  );
}
