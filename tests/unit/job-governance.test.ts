import { describe, expect, it } from "vitest";
import {
  COMMUNITY_VETO_MIN_VOTES,
  DISPUTE_BLOCK_MIN_FLAGS,
  isCommunityVetoActive,
  isDisputePaymentBlocked,
  tallyVotes,
} from "@/lib/job-governance";

describe("tallyVotes / community veto", () => {
  it("counts stances", () => {
    expect(tallyVotes(["ACUERDO", "DESACUERDO", "DESACUERDO"])).toEqual({
      acuerdo: 1,
      desacuerdo: 2,
      total: 3,
    });
  });

  it("requires quorum before veto", () => {
    expect(COMMUNITY_VETO_MIN_VOTES).toBe(3);
    expect(
      isCommunityVetoActive(tallyVotes(["DESACUERDO", "DESACUERDO"]))
    ).toBe(false);
    expect(
      isCommunityVetoActive(
        tallyVotes(["DESACUERDO", "DESACUERDO", "DESACUERDO"])
      )
    ).toBe(true);
  });

  it("does not veto on tie or agreement majority", () => {
    expect(
      isCommunityVetoActive(
        tallyVotes(["ACUERDO", "ACUERDO", "DESACUERDO"])
      )
    ).toBe(false);
    expect(
      isCommunityVetoActive(
        tallyVotes(["ACUERDO", "DESACUERDO", "ACUERDO", "DESACUERDO"])
      )
    ).toBe(false);
  });
});

describe("dispute payment block", () => {
  it("blocks only when open and flags meet threshold", () => {
    expect(DISPUTE_BLOCK_MIN_FLAGS).toBe(2);
    expect(
      isDisputePaymentBlocked({ disputeStatus: "ABIERTA", activeFlagCount: 1 })
    ).toBe(false);
    expect(
      isDisputePaymentBlocked({ disputeStatus: "ABIERTA", activeFlagCount: 2 })
    ).toBe(true);
    expect(
      isDisputePaymentBlocked({ disputeStatus: "RESUELTA", activeFlagCount: 5 })
    ).toBe(false);
    expect(
      isDisputePaymentBlocked({ disputeStatus: null, activeFlagCount: 2 })
    ).toBe(false);
  });
});
