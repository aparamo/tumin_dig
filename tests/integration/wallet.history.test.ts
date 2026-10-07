import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { createTestCaller } from "../helpers/caller";
import { makeUser, makeProduct, mint } from "../helpers/factories";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { issueFromSystem } from "@/lib/system-ledger";
import { ensureSystemUser } from "@/lib/system-user";
import { SYSTEM_USER_ID } from "@/lib/system-user";

describe("wallet.getHistory / listHistory", () => {
  it("returns only the caller's movements with enriched parties", async () => {
    const alice = await makeUser({ name: "Alice Hist", publicProfile: true });
    const bob = await makeUser({ name: "Bob Hist", firstSaleOk: true });
    const outsider = await makeUser({ name: "Outsider" });
    await makeProduct({ sellerId: bob.id });
    await mint(alice.id, 200);

    const aliceCaller = createTestCaller({
      id: alice.id,
      role: "SOCIO",
      region: alice.region,
      isVerified: true,
    });
    const outsiderCaller = createTestCaller({
      id: outsider.id,
      role: "SOCIO",
      region: outsider.region,
      isVerified: true,
    });

    await aliceCaller.wallet.sendTumin({
      toId: bob.id,
      amount: 25,
      concept: "Pago prueba historial",
      idempotencyKey: randomUUID(),
    });

    const history = await aliceCaller.wallet.getHistory();
    expect(history.length).toBeGreaterThan(0);
    expect(history.every((tx) => tx.from.id === alice.id || tx.to.id === alice.id)).toBe(
      true
    );

    const transfer = history.find((tx) => tx.concept === "Pago prueba historial");
    expect(transfer).toBeDefined();
    expect(transfer!.kind).toBe("envio");
    expect(transfer!.isIngreso).toBe(false);
    expect(transfer!.to.displayName).toMatch(/Bob/i);

    const outsiderHistory = await outsiderCaller.wallet.listHistory({ limit: 20 });
    expect(
      outsiderHistory.items.some((tx) => tx.concept === "Pago prueba historial")
    ).toBe(false);
  });

  it("paginates with cursor and filters by flow / kind / search", async () => {
    const sender = await makeUser({ name: "Sender Page", firstSaleOk: true });
    const seller = await makeUser({ name: "Seller Page", firstSaleOk: true });
    const product = await makeProduct({ sellerId: seller.id, name: "Miel especial" });
    await mint(sender.id, 500);

    const caller = createTestCaller({
      id: sender.id,
      role: "SOCIO",
      region: sender.region,
      isVerified: true,
    });

    for (let i = 0; i < 3; i++) {
      await caller.wallet.sendTumin({
        toId: seller.id,
        amount: 10 + i,
        concept: `Envio paginado ${i}`,
        idempotencyKey: randomUUID(),
      });
    }

    await caller.wallet.sendTumin({
      toId: seller.id,
      amount: 40,
      concept: `Compra: ${product.name}`,
      productId: product.id,
      idempotencyKey: randomUUID(),
    });

    await ensureSystemUser(db);
    await issueFromSystem(db, {
      toId: sender.id,
      amount: 15,
      concept: "Bono prueba historial",
      type: "BONO",
    });

    const page1 = await caller.wallet.listHistory({ limit: 2, cursor: 0 });
    expect(page1.items).toHaveLength(2);
    expect(page1.nextCursor).toBe(2);

    const page2 = await caller.wallet.listHistory({ limit: 2, cursor: page1.nextCursor! });
    expect(page2.items.length).toBeGreaterThan(0);
    expect(page1.items[0]!.id).not.toBe(page2.items[0]!.id);

    const outgoing = await caller.wallet.listHistory({ limit: 50, flow: "out" });
    expect(outgoing.items.every((tx) => !tx.isIngreso)).toBe(true);

    const incoming = await caller.wallet.listHistory({ limit: 50, flow: "in" });
    expect(incoming.items.every((tx) => tx.isIngreso)).toBe(true);

    const bazar = await caller.wallet.listHistory({ limit: 50, kind: "bazar" });
    expect(bazar.items.length).toBeGreaterThan(0);
    expect(bazar.items.every((tx) => tx.kind === "bazar")).toBe(true);
    expect(bazar.items[0]!.product?.name).toMatch(/Miel/i);

    const envios = await caller.wallet.listHistory({ limit: 50, kind: "envio" });
    expect(envios.items.every((tx) => tx.kind === "envio")).toBe(true);
    expect(envios.items.every((tx) => tx.product == null)).toBe(true);

    const search = await caller.wallet.listHistory({
      limit: 50,
      search: "paginado 1",
    });
    expect(search.items.some((tx) => tx.concept.includes("Envio paginado 1"))).toBe(true);

    const bonos = await caller.wallet.listHistory({ limit: 50, kind: "bono" });
    const bono = bonos.items.find((tx) => tx.concept === "Bono prueba historial");
    expect(bono).toBeDefined();
    expect(bono!.kind).toBe("bono");
    expect(bono!.isIngreso).toBe(true);
    expect(bono!.from.id).toBe(SYSTEM_USER_ID);
    expect(bono!.from.displayName).toBe("Sistema Túmin");
  });

  it("getHistory returns enriched DTO without secrets", async () => {
    const user = await makeUser({ name: "Home User" });
    await mint(user.id, 30);
    const caller = createTestCaller({
      id: user.id,
      role: "SOCIO",
      region: user.region,
      isVerified: true,
    });

    const rows = await caller.wallet.getHistory();
    const mintTx = rows.find((tx) => tx.from.id === SYSTEM_USER_ID);
    expect(mintTx).toBeDefined();
    expect(mintTx).not.toHaveProperty("idempotencyKey");
    expect(JSON.stringify(mintTx)).not.toMatch(/nip/i);

    // Ensure mint rows exist in ledger for the assertion above
    const [ledgerRow] = await db
      .select({ id: transactions.id })
      .from(transactions)
      .limit(1);
    expect(ledgerRow).toBeDefined();
  });
});
