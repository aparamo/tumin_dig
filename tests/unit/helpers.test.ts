import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { assertPeerTransferParties } from "@/lib/system-ledger";
import { isSystemAccountId, isSystemPhone } from "@/lib/system-user";
import {
  normalizeResidenceFields,
  formatPublicLocation,
  formatCompactLocation,
  isMexicoCountry,
  resolveEnrollmentRegionForStorage,
} from "@/lib/location";
import { toFriendlyErrorMessage } from "@/lib/friendly-error";
import { parseErrorMessage } from "@/lib/parse-error";
import { generateInviteToken, getTokenExpiry } from "@/lib/token";
import { generateOtpCode } from "@/lib/otp";
import { isProductCategory, getCategoryPastel, MAX_STARRED_PRODUCTS } from "@/lib/product-categories";
import { uploadLimitToBytes, formatMiB } from "@/lib/uploadthing";
import { toRows } from "@/lib/db-rows";
import { refineTuminShare, productCreateSchema } from "@/lib/schemas/product";
import { useStore } from "@/lib/store";
import { z } from "zod";

describe("system account guards", () => {
  it("identifies SYSTEM and SISTEMA ids", () => {
    expect(isSystemAccountId("SYSTEM")).toBe(true);
    expect(isSystemAccountId("SISTEMA")).toBe(true);
    expect(isSystemAccountId("user_1")).toBe(false);
  });

  it("identifies system phones", () => {
    expect(isSystemPhone("SYSTEM_INTERNAL")).toBe(true);
    expect(isSystemPhone("9611234567")).toBe(false);
  });

  it("assertPeerTransferParties blocks system and self", () => {
    expect(() => assertPeerTransferParties("SYSTEM", "u1")).toThrow(TRPCError);
    expect(() => assertPeerTransferParties("u1", "SISTEMA")).toThrow(TRPCError);
    expect(() => assertPeerTransferParties("u1", "u1")).toThrow(TRPCError);
    expect(() => assertPeerTransferParties("u1", "u2")).not.toThrow();
  });
});

describe("location helpers", () => {
  it("nulls state for non-Mexico countries", () => {
    expect(
      normalizeResidenceFields({
        residenceCountry: "España",
        residenceState: "Madrid",
        residenceCity: "Madrid",
        residencePostalCode: "28001",
      })
    ).toEqual({
      residenceCountry: "España",
      residenceState: null,
      residenceCity: "Madrid",
      residencePostalCode: "28001",
    });
  });

  it("keeps state for México", () => {
    expect(isMexicoCountry("México")).toBe(true);
    const loc = normalizeResidenceFields({
      residenceCountry: "México",
      residenceState: "Veracruz",
      residenceCity: "Xalapa",
      residencePostalCode: "91000",
    });
    expect(loc.residenceState).toBe("Veracruz");
    expect(formatPublicLocation(loc)).toContain("Veracruz");
    expect(formatCompactLocation(loc).length).toBeGreaterThan(0);
  });

  it("resolveEnrollmentRegionForStorage uses OTHER marker", () => {
    expect(resolveEnrollmentRegionForStorage("anything", "OTHER")).toBe("Otro");
  });
});

describe("error message helpers", () => {
  it("toFriendlyErrorMessage handles empty and JSON zod dumps", () => {
    expect(toFriendlyErrorMessage("")).toBe("Algo salió mal. Intenta de nuevo.");
    expect(
      toFriendlyErrorMessage(JSON.stringify([{ message: "El NIP es demasiado corto" }]))
    ).toContain("NIP");
  });

  it("parseErrorMessage falls back safely", () => {
    expect(parseErrorMessage(new Error("Saldo insuficiente"))).toContain("Saldo");
  });
});

describe("token / otp / categories / upload limits", () => {
  it("generateInviteToken is ambiguity-free and non-empty", () => {
    const token = generateInviteToken();
    expect(token.length).toBeGreaterThan(8);
    expect(token).not.toMatch(/[0OIl]/);
  });

  it("getTokenExpiry is ~7 days ahead", () => {
    const expiry = getTokenExpiry();
    const diff = expiry.getTime() - Date.now();
    expect(diff).toBeGreaterThan(6 * 24 * 60 * 60 * 1000);
    expect(diff).toBeLessThan(8 * 24 * 60 * 60 * 1000);
  });

  it("generateOtpCode is zero-padded 6 digits", () => {
    const code = generateOtpCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it("product category helpers", () => {
    expect(MAX_STARRED_PRODUCTS).toBe(5);
    expect(isProductCategory("Alimentos")).toBe(true);
    expect(isProductCategory("NoExiste")).toBe(false);
    expect(getCategoryPastel("Alimentos")).toBeDefined();
  });

  it("uploadLimitToBytes and formatMiB", () => {
    expect(uploadLimitToBytes("4MB")).toBe(4 * 1024 * 1024);
    expect(formatMiB(2 * 1024 * 1024)).toMatch(/2/);
  });
});

describe("toRows / product 10% rule / zustand store", () => {
  it("toRows normalizes array and {rows} shapes", () => {
    expect(toRows([{ a: 1 }])).toEqual([{ a: 1 }]);
    expect(toRows({ rows: [{ a: 2 }] })).toEqual([{ a: 2 }]);
    expect(() => toRows({ nope: true })).toThrow();
  });

  it("productCreateSchema rejects Tumin share under 10%", () => {
    const bad = productCreateSchema.safeParse({
      name: "Test product",
      priceMxn: 95,
      priceTumin: 5,
      categories: ["Alimentos"],
    });
    expect(bad.success).toBe(false);

    const good = productCreateSchema.safeParse({
      name: "Test product",
      priceMxn: 90,
      priceTumin: 10,
      categories: ["Alimentos"],
    });
    expect(good.success).toBe(true);
  });

  it("refineTuminShare allows zero-total edge case", () => {
    const ctx = { addIssue: () => {} } as unknown as z.RefinementCtx;
    expect(() => refineTuminShare({ priceMxn: 0, priceTumin: 0 }, ctx)).not.toThrow();
  });

  it("navigating away from pagar clears pendingPurchase", () => {
    useStore.setState({
      currentScreen: "pagar",
      pendingPurchase: {
        sellerPhone: "9611234567",
        sellerEmail: null,
        sellerId: "s1",
        sellerName: "Seller",
        productName: "Thing",
        priceTumin: 10,
      },
    });
    useStore.getState().setCurrentScreen("inicio");
    expect(useStore.getState().pendingPurchase).toBeNull();
  });
});
