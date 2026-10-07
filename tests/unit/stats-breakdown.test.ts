import { describe, expect, it } from "vitest";
import {
  addSlices,
  classifyTransferKind,
  emptyTransactionBreakdown,
  exchangedFromTransferSlices,
  generatedFromEmissionSlices,
  sliceFromTotals,
} from "@/lib/stats-breakdown";

describe("stats-breakdown", () => {
  it("sliceFromTotals coerces nullish to zero", () => {
    expect(sliceFromTotals(null, undefined)).toEqual({ count: 0, amount: 0 });
    expect(sliceFromTotals(3, 12.5)).toEqual({ count: 3, amount: 12.5 });
  });

  it("addSlices sums count and amount", () => {
    expect(addSlices({ count: 2, amount: 10 }, { count: 1, amount: 5 })).toEqual({
      count: 3,
      amount: 15,
    });
  });

  it("classifyTransferKind splits bazar vs envío libre", () => {
    expect(classifyTransferKind("prod_1")).toBe("bazar");
    expect(classifyTransferKind(null)).toBe("envioLibre");
    expect(classifyTransferKind(undefined)).toBe("envioLibre");
  });

  it("generatedFromEmissionSlices totals bono + minado + pago", () => {
    const generated = generatedFromEmissionSlices(
      { count: 1, amount: 25 },
      { count: 2, amount: 10 },
      { count: 1, amount: 40 }
    );
    expect(generated.total).toEqual({ count: 4, amount: 75 });
    expect(generated.bono.amount).toBe(25);
    expect(generated.minado.count).toBe(2);
    expect(generated.pagoTrabajo.amount).toBe(40);
  });

  it("exchangedFromTransferSlices totals bazar + envío libre", () => {
    const exchanged = exchangedFromTransferSlices(
      { count: 4, amount: 80 },
      { count: 2, amount: 20 }
    );
    expect(exchanged.total).toEqual({ count: 6, amount: 100 });
    expect(exchanged.bazar.count).toBe(4);
    expect(exchanged.envioLibre.amount).toBe(20);
  });

  it("emptyTransactionBreakdown starts at zero", () => {
    const empty = emptyTransactionBreakdown();
    expect(empty.total).toEqual({ count: 0, amount: 0 });
    expect(empty.transferencia.count + empty.bazar.count + empty.envioLibre.count).toBe(0);
  });
});
