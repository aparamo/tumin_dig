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
import { users, transactions, messages } from "@/db/schema";
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

  it("links productId on purchase and lists it in getMyPurchases", async () => {
    const sender = await makeUser({ isVerified: true, name: "Buyer" });
    const recipient = await makeUser({
      name: "Seller",
      firstSaleOk: true,
      duplicatorBonus: LIMITS.DUPLICATOR_CAP,
      autoMessagePurchase: true,
    });
    const product = await makeProduct({
      sellerId: recipient.id,
      name: "Café de altura",
      priceMxn: 80,
      priceTumin: 20,
    });
    await mint(sender.id, 100);
    const caller = createTestCaller({
      id: sender.id,
      role: "SOCIO",
      region: sender.region,
      isVerified: true,
    });

    const tx = await caller.wallet.sendTumin({
      toId: recipient.id,
      amount: 20,
      concept: "Compra: Café de altura",
      idempotencyKey: randomUUID(),
      productId: product.id,
    });

    expect(tx.productId).toBe(product.id);
    expect(tx.productSnapshot).toMatchObject({
      name: "Café de altura",
      priceMxn: 80,
      priceTumin: 20,
    });

    const purchases = await caller.wallet.getMyPurchases({ limit: 10, cursor: 0 });
    expect(purchases.items.some((p) => p.id === tx.id && p.productName === "Café de altura")).toBe(
      true
    );

    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.senderId, sender.id));
    expect(msgs.some((m) => m.isAutomated && m.automatedType === "PURCHASE")).toBe(true);
  });

  it("skips purchase auto-message when recipient disabled it", async () => {
    const sender = await makeUser({ isVerified: true, name: "Buyer2" });
    const recipient = await makeUser({
      name: "QuietSeller",
      firstSaleOk: true,
      duplicatorBonus: LIMITS.DUPLICATOR_CAP,
      autoMessagePurchase: false,
    });
    const product = await makeProduct({ sellerId: recipient.id, name: "Miel" });
    await mint(sender.id, 100);
    const caller = createTestCaller({
      id: sender.id,
      role: "SOCIO",
      region: sender.region,
      isVerified: true,
    });

    await caller.wallet.sendTumin({
      toId: recipient.id,
      amount: 10,
      concept: "Compra: Miel",
      idempotencyKey: randomUUID(),
      productId: product.id,
    });

    const msgs = await db
      .select()
      .from(messages)
      .where(and(eq(messages.senderId, sender.id), eq(messages.isAutomated, true)));
    expect(msgs).toHaveLength(0);
  });

  it("lists sales for seller via getMySales and getMySalesStats", async () => {
    const buyer = await makeUser({ isVerified: true, name: "BuyerSales" });
    const seller = await makeUser({
      name: "SellerPanel",
      firstSaleOk: true,
      duplicatorBonus: LIMITS.DUPLICATOR_CAP,
    });
    const product = await makeProduct({
      sellerId: seller.id,
      name: "Pan de maíz",
      priceMxn: 40,
      priceTumin: 15,
    });
    await mint(buyer.id, 200);
    const buyerCaller = createTestCaller({
      id: buyer.id,
      role: "SOCIO",
      region: buyer.region,
      isVerified: true,
    });
    const sellerCaller = createTestCaller({
      id: seller.id,
      role: "SOCIO",
      region: seller.region,
      isVerified: true,
    });

    const tx = await buyerCaller.wallet.sendTumin({
      toId: seller.id,
      amount: 15,
      concept: "Compra: Pan de maíz",
      idempotencyKey: randomUUID(),
      productId: product.id,
    });

    const sales = await sellerCaller.wallet.getMySales({ limit: 10, cursor: 0 });
    expect(sales.stats.totalSales).toBeGreaterThanOrEqual(1);
    expect(sales.items.some((s) => s.id === tx.id && s.productName === "Pan de maíz")).toBe(true);
    expect(sales.items.find((s) => s.id === tx.id)?.buyer.id).toBe(buyer.id);

    const filtered = await sellerCaller.wallet.getMySales({
      limit: 10,
      cursor: 0,
      productId: product.id,
      minAmount: 10,
    });
    expect(filtered.items.some((s) => s.id === tx.id)).toBe(true);

    const stats = await sellerCaller.wallet.getMySalesStats({ timeRange: "30d" });
    expect(stats.summary.totalSales).toBeGreaterThanOrEqual(1);
    expect(stats.summary.totalRevenueTumin).toBeGreaterThanOrEqual(15);
    expect(stats.topProducts.some((p) => p.productId === product.id)).toBe(true);
    expect(stats.salesByDay.length).toBe(30);
  });
});
