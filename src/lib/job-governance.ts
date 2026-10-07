/** Community veto: majority disagreement with a minimum turnout. */
export const COMMUNITY_VETO_MIN_VOTES = 3;

/** Coordinator dispute: payment blocked once this many active flags exist. */
export const DISPUTE_BLOCK_MIN_FLAGS = 2;

export const JOB_VOTE_MESSAGE_MAX = 500;
export const DISPUTE_REASON_MAX = 500;
export const DISPUTE_MESSAGE_MAX = 2000;
export const DISPUTE_RESOLUTION_NOTE_MAX = 1000;

export interface VoteTally {
  acuerdo: number;
  desacuerdo: number;
  total: number;
}

export function tallyVotes(stances: Array<"ACUERDO" | "DESACUERDO">): VoteTally {
  let acuerdo = 0;
  let desacuerdo = 0;
  for (const s of stances) {
    if (s === "ACUERDO") acuerdo += 1;
    else desacuerdo += 1;
  }
  return { acuerdo, desacuerdo, total: acuerdo + desacuerdo };
}

/** True when community majority disagrees with quorum met. */
export function isCommunityVetoActive(tally: VoteTally): boolean {
  return tally.total >= COMMUNITY_VETO_MIN_VOTES && tally.desacuerdo > tally.acuerdo;
}

/** True when enough active coordinator flags block payment (and dispute is open). */
export function isDisputePaymentBlocked(input: {
  disputeStatus: "ABIERTA" | "RESUELTA" | null;
  activeFlagCount: number;
}): boolean {
  if (input.disputeStatus !== "ABIERTA") return false;
  return input.activeFlagCount >= DISPUTE_BLOCK_MIN_FLAGS;
}
