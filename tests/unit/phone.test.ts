import { describe, expect, it } from "vitest";
import {
  phoneDigits,
  toE164,
  phoneLookupCandidates,
  looksLikePhone,
} from "@/lib/phone";

describe("phoneDigits", () => {
  it("strips non-digits", () => {
    expect(phoneDigits("+52 961-123-4567")).toBe("529611234567");
  });
});

describe("toE164", () => {
  it("assumes MX when no country code", () => {
    expect(toE164("9611234567")).toBe("+529611234567");
  });

  it("keeps existing 52 country code", () => {
    expect(toE164("529611234567")).toBe("+529611234567");
  });
});

describe("phoneLookupCandidates", () => {
  it("returns empty for short input", () => {
    expect(phoneLookupCandidates("123")).toEqual(["123"]);
    expect(phoneLookupCandidates("")).toEqual([]);
  });

  it("returns deduped legacy variants for a 10-digit local number", () => {
    const candidates = phoneLookupCandidates("9611234567");
    expect(candidates).toContain("9611234567");
    expect(candidates).toContain("529611234567");
    expect(candidates).toContain("+529611234567");
    expect(new Set(candidates).size).toBe(candidates.length);
  });

  it("handles already-prefixed input", () => {
    const candidates = phoneLookupCandidates("+52 961 123 4567");
    expect(candidates.length).toBeGreaterThanOrEqual(4);
    expect(candidates).toContain("+529611234567");
  });
});

describe("looksLikePhone", () => {
  it("rejects emails", () => {
    expect(looksLikePhone("a@b.com")).toBe(false);
  });

  it("accepts 10+ digit phones", () => {
    expect(looksLikePhone("9611234567")).toBe(true);
    expect(looksLikePhone("123")).toBe(false);
  });
});
