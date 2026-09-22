import { describe, expect, it } from "vitest";
import { rangeToDates } from "@/lib/types/sales";

describe("sales helpers", () => {
  it("rangeToDates returns empty for all", () => {
    expect(rangeToDates("all")).toEqual({});
  });

  it("rangeToDates returns start/end for 7d", () => {
    const { startDate, endDate } = rangeToDates("7d");
    expect(startDate).toBeInstanceOf(Date);
    expect(endDate).toBeInstanceOf(Date);
    expect(endDate!.getTime() - startDate!.getTime()).toBeCloseTo(7 * 24 * 60 * 60 * 1000, -3);
  });
});
