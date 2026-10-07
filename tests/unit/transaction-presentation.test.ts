import { describe, expect, it } from "vitest";
import {
  buildHistoryProduct,
  buildTransactionParty,
  counterpartOf,
  partyDisplayName,
  resolveTransactionKind,
  sanitizeHistorySearch,
  TRANSACTION_KIND_LABELS,
} from "@/lib/transaction-presentation";
import { SYSTEM_USER_ID } from "@/lib/system-ids";

describe("resolveTransactionKind", () => {
  it("prefers bazar when productId is set even if type is TRANSFERENCIA", () => {
    expect(
      resolveTransactionKind({
        type: "TRANSFERENCIA",
        productId: "11111111-1111-1111-1111-111111111111",
      })
    ).toBe("bazar");
  });

  it("prefers bazar when only productSnapshot is present", () => {
    expect(
      resolveTransactionKind({
        type: "TRANSFERENCIA",
        productSnapshot: {
          name: "Pan",
          priceMxn: 20,
          priceTumin: 5,
        },
      })
    ).toBe("bazar");
  });

  it("maps ledger types without product to presentation kinds", () => {
    expect(resolveTransactionKind({ type: "TRANSFERENCIA" })).toBe("envio");
    expect(resolveTransactionKind({ type: "BONO" })).toBe("bono");
    expect(resolveTransactionKind({ type: "MINADO" })).toBe("minado");
    expect(resolveTransactionKind({ type: "PAGO_TRABAJO" })).toBe("pago_trabajo");
  });
});

describe("partyDisplayName / buildTransactionParty", () => {
  it("shows Sistema Túmin for system accounts", () => {
    expect(
      partyDisplayName({
        id: SYSTEM_USER_ID,
        name: "Sistema Tumin",
        publicName: null,
      })
    ).toBe("Sistema Túmin");

    const party = buildTransactionParty({
      id: "SISTEMA",
      name: "Legacy",
      publicName: "No usar",
      publicProfile: true,
    });
    expect(party.displayName).toBe("Sistema Túmin");
    expect(party.publicProfile).toBe(false);
  });

  it("prefers publicName for members", () => {
    expect(
      partyDisplayName({
        id: "user_1",
        name: "Legal Name",
        publicName: "  Alias  ",
      })
    ).toBe("Alias");
  });
});

describe("buildHistoryProduct", () => {
  it("returns null without product linkage", () => {
    expect(buildHistoryProduct(null, null, "Envío")).toBeNull();
  });

  it("uses snapshot fields when present", () => {
    const product = buildHistoryProduct(
      "11111111-1111-1111-1111-111111111111",
      {
        name: "Café",
        priceMxn: 40,
        priceTumin: 10,
        imageUrl: "https://example.com/c.jpg",
      },
      "Compra: Café"
    );
    expect(product).toEqual({
      id: "11111111-1111-1111-1111-111111111111",
      name: "Café",
      priceMxn: 40,
      priceTumin: 10,
      imageUrl: "https://example.com/c.jpg",
    });
  });
});

describe("sanitizeHistorySearch / counterpartOf / labels", () => {
  it("strips LIKE wildcards and trims", () => {
    expect(sanitizeHistorySearch("  a%b_c\\d  ")).toBe("abcd");
  });

  it("picks counterpart from isIngreso", () => {
    const from = { id: "a", displayName: "Ana", publicProfile: false };
    const to = { id: "b", displayName: "Bob", publicProfile: true };
    expect(counterpartOf({ from, to, isIngreso: true })).toEqual(from);
    expect(counterpartOf({ from, to, isIngreso: false })).toEqual(to);
  });

  it("exposes Spanish labels for every kind", () => {
    expect(TRANSACTION_KIND_LABELS.bazar).toMatch(/producto/i);
    expect(TRANSACTION_KIND_LABELS.bono).toBe("Bono");
  });
});
