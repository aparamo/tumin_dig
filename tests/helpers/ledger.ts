import { expect } from "vitest";
import { eq, sql, and } from "drizzle-orm";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { SYSTEM_ACCOUNT_IDS } from "@/lib/system-user";

export async function balanceOf(userId: string): Promise<number> {
  const [received] = await db
    .select({ total: sql<number>`coalesce(sum(${transactions.amount}), 0)` })
    .from(transactions)
    .where(eq(transactions.toId, userId));
  const [sent] = await db
    .select({ total: sql<number>`coalesce(sum(${transactions.amount}), 0)` })
    .from(transactions)
    .where(eq(transactions.fromId, userId));
  return Number(received?.total ?? 0) - Number(sent?.total ?? 0);
}

export async function expectBalanceCloseTo(
  userId: string,
  expected: number,
  precision = 5
) {
  const actual = await balanceOf(userId);
  expect(actual).toBeCloseTo(expected, precision);
}

/**
 * Global ledger invariant: sum of non-SYSTEM balances equals total system issuance.
 * System issuance = sum of amounts where fromId is a system account.
 */
export async function expectLedgerBalanced(precision = 5) {
  const [issued] = await db
    .select({ total: sql<number>`coalesce(sum(${transactions.amount}), 0)` })
    .from(transactions)
    .where(
      sql`${transactions.fromId} IN (${sql.join(
        SYSTEM_ACCOUNT_IDS.map((id) => sql`${id}`),
        sql`, `
      )})`
    );

  const [held] = await db
    .select({
      total: sql<number>`coalesce(
        sum(CASE WHEN ${transactions.toId} NOT IN ('SYSTEM','SISTEMA') THEN ${transactions.amount} ELSE 0 END)
        - sum(CASE WHEN ${transactions.fromId} NOT IN ('SYSTEM','SISTEMA') THEN ${transactions.amount} ELSE 0 END)
      , 0)`,
    })
    .from(transactions);

  expect(Number(held?.total ?? 0)).toBeCloseTo(Number(issued?.total ?? 0), precision);
}

export async function countTransfersTo(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(
      and(eq(transactions.toId, userId), eq(transactions.type, "TRANSFERENCIA"))
    );
  return Number(row?.count ?? 0);
}
