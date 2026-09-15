import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { eq, and } from "drizzle-orm";
import { createTestCaller } from "../helpers/caller";
import { makeUser, makeProduct, mint } from "../helpers/factories";
import {
  balanceOf,
  expectBalanceCloseTo,
  expectLedgerBalanced,
  countTransfersTo,
} from "../helpers/ledger";
import { db } from "@/db";
import { users, transactions } from "@/db/schema";
import { LIMITS } from "@/lib/limits";

async function setupTransferPair(opts?: {
  senderVerified?: boolean;
  recipientFrozen?: boolean;
  withProduct?: boolean;
  referrerId?: string;
  firstSaleOk?: boolean;
  duplicatorBonus?: number;
}) {
  const sender = await makeUser({
    isVerified: opts?.senderVerified ?? true,
    name: "Sender",
  });
  const recipient = await makeUser({
    status: opts?.recipientFrozen ? "CONGELADO" : "ACTIVO",
    name: "Recipient",
    referrerId: opts?.referrerId,
    firstSaleOk: opts?.firstSaleOk ?? false,
    duplicatorBonus: opts?.duplicatorBonus ?? 0,
  });
  if (opts?.withProduct !== false && !opts?.recipientFrozen) {
    await makeProduct({ sellerId: recipient.id });
  }
  await mint(sender.id, 500);
  const caller = createTestCaller({
    id: sender.id,
    role: sender.role as "SOCIO",
    region: sender.region,
    isVerified: sender.isVerified,
  });
  return { sender, recipient, caller };
}

describe("wallet.sendTumin", () => {
  it("rejects insufficient balance", async () => {
    const { recipient, caller } = await setupTransferPair();
    await expect(
      caller.wallet.sendTumin({
        toId: recipient.id,
        amount: 9999,
        concept: "too much",
        idempotencyKey: randomUUID(),
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST", message: expect.stringMatching(/Saldo/) });
    await expectLedgerBalanced();
  });

  it("rejects unverified sender above MAX_TRANSFER_UNVERIFIED", async () => {
    const { recipient, caller } = await setupTransferPair({ senderVerified: false });
    await expect(
      caller.wallet.sendTumin({
        toId: recipient.id,
        amount: LIMITS.MAX_TRANSFER_UNVERIFIED + 1,
        concept: "over limit",
        idempotencyKey: randomUUID(),
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("is idempotent for the same idempotencyKey", async () => {
    const { sender, recipient, caller } = await setupTransferPair({ firstSaleOk: true });
    const key = randomUUID();
    const first = await caller.wallet.sendTumin({
      toId: recipient.id,
      amount: 50,
      concept: "pago",
      idempotencyKey: key,
    });
    const second = await caller.wallet.sendTumin({
      toId: recipient.id,
      amount: 50,
      concept: "pago",
      idempotencyKey: key,
    });
    expect(second.id).toBe(first.id);
    await expectBalanceCloseTo(sender.id, 450);
    const transfers = await countTransfersTo(recipient.id);
    expect(transfers).toBe(1);
    await expectLedgerBalanced();
  });

  it("rejects transfers involving SYSTEM accounts", async () => {
    const { caller } = await setupTransferPair();
    await expect(
      caller.wallet.sendTumin({
        toId: "SYSTEM",
        amount: 10,
        concept: "nope",
        idempotencyKey: randomUUID(),
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects frozen recipient and recipient without active product", async () => {
    const frozen = await setupTransferPair({ recipientFrozen: true, withProduct: false });
    await expect(
      frozen.caller.wallet.sendTumin({
        toId: frozen.recipient.id,
        amount: 10,
        concept: "frozen",
        idempotencyKey: randomUUID(),
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    const noProduct = await setupTransferPair({ withProduct: false });
    await expect(
      noProduct.caller.wallet.sendTumin({
        toId: noProduct.recipient.id,
        amount: 10,
        concept: "no product",
        idempotencyKey: randomUUID(),
      })
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringMatching(/producto activo/),
    });
  });

  it("grants first-sale bonus exactly once", async () => {
    const { recipient, caller } = await setupTransferPair({ firstSaleOk: false });
    await caller.wallet.sendTumin({
      toId: recipient.id,
      amount: 20,
      concept: "first",
      idempotencyKey: randomUUID(),
    });
    const [after] = await db.select().from(users).where(eq(users.id, recipient.id));
    expect(after.firstSaleOk).toBe(true);

    // Balance: 20 transfer + 25 first sale + 20 duplicator (amount) = 65
    await expectBalanceCloseTo(recipient.id, 20 + LIMITS.FIRST_SALE_BONUS + 20);

    const sender2 = await makeUser({ name: "S2" });
    await mint(sender2.id, 100);
    const c2 = createTestCaller({
      id: sender2.id,
      role: "SOCIO",
      region: sender2.region,
      isVerified: true,
    });
    await c2.wallet.sendTumin({
      toId: recipient.id,
      amount: 10,
      concept: "second",
      idempotencyKey: randomUUID(),
    });
    const bonuses = await db
      .select()
      .from(transactions)
      .where(
        and(eq(transactions.toId, recipient.id), eq(transactions.concept, "Bono Primera Venta"))
      );
    expect(bonuses).toHaveLength(1);
    await expectLedgerBalanced();
  });

  it("caps duplicator bonus at DUPLICATOR_CAP", async () => {
    const nearCap = LIMITS.DUPLICATOR_CAP - 5;
    const { recipient, caller } = await setupTransferPair({
      firstSaleOk: true,
      duplicatorBonus: nearCap,
    });
    await caller.wallet.sendTumin({
      toId: recipient.id,
      amount: 50,
      concept: "dup edge",
      idempotencyKey: randomUUID(),
    });
    const [after] = await db.select().from(users).where(eq(users.id, recipient.id));
    expect(after.duplicatorBonus).toBe(LIMITS.DUPLICATOR_CAP);

    const dupRows = await db
      .select()
      .from(transactions)
      .where(
        and(eq(transactions.toId, recipient.id), eq(transactions.concept, "Bono Duplicador"))
      );
    expect(dupRows).toHaveLength(1);
    expect(dupRows[0].amount).toBeCloseTo(5, 5);
    await expectLedgerBalanced();
  });

  it("pays referral bonus while transfer count ≤ 3 (count includes current transfer)", async () => {
    const referrer = await makeUser({ name: "Referrer" });
    const { recipient, caller } = await setupTransferPair({
      firstSaleOk: true,
      referrerId: referrer.id,
    });

    await caller.wallet.sendTumin({
      toId: recipient.id,
      amount: 100,
      concept: "ref1",
      idempotencyKey: randomUUID(),
    });
    // count after insert is 1 ≤ 3 → referral paid
    await expectBalanceCloseTo(referrer.id, 100 * 0.05);

    // Seed two more prior transfers so next one is the 4th (count=4 > 3 → no bonus)
    const s2 = await makeUser();
    await mint(s2.id, 300);
    const c2 = createTestCaller({ id: s2.id, role: "SOCIO", region: s2.region, isVerified: true });
    await c2.wallet.sendTumin({
      toId: recipient.id,
      amount: 10,
      concept: "ref2",
      idempotencyKey: randomUUID(),
    });
    await c2.wallet.sendTumin({
      toId: recipient.id,
      amount: 10,
      concept: "ref3",
      idempotencyKey: randomUUID(),
    });
    // After 3 transfers, referrer has 5 + 0.5 + 0.5 = 6
    await expectBalanceCloseTo(referrer.id, 5 + 0.5 + 0.5);

    const before = await balanceOf(referrer.id);
    await c2.wallet.sendTumin({
      toId: recipient.id,
      amount: 10,
      concept: "ref4-no-bonus",
      idempotencyKey: randomUUID(),
    });
    // 4th transfer: count after insert is 4 > 3 → no additional referral
    await expectBalanceCloseTo(referrer.id, before);
    await expectLedgerBalanced();
  });

  it("handles float amounts with toBeCloseTo", async () => {
    const { sender, recipient, caller } = await setupTransferPair({ firstSaleOk: true });
    const amount = 0.1 + 0.2; // 0.30000000000000004
    await caller.wallet.sendTumin({
      toId: recipient.id,
      amount,
      concept: "float",
      idempotencyKey: randomUUID(),
    });
    await expectBalanceCloseTo(sender.id, 500 - amount);
    await expectLedgerBalanced();
  });
});
