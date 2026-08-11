import { TRPCError } from "@trpc/server";
import { transactions } from "@/db/schema";
import { db } from "@/db";
import {
  SYSTEM_USER_ID,
  ensureSystemUser,
  isSystemAccountId,
} from "@/lib/system-user";

type Tx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Only these ledger types may be issued by the SYSTEM account */
export const SYSTEM_ISSUED_TYPES = ["BONO", "MINADO", "PAGO_TRABAJO"] as const;
export type SystemIssuedType = (typeof SYSTEM_ISSUED_TYPES)[number];

export interface IssueFromSystemInput {
  toId: string;
  amount: number;
  concept: string;
  type: SystemIssuedType;
  idempotencyKey?: string | null;
}

/**
 * Sole supported way for application code to mint Túmin from SYSTEM.
 * `fromId` is hardcoded — callers cannot override it (including via API payloads).
 */
export async function issueFromSystem(tx: Tx, input: IssueFromSystemInput) {
  if (isSystemAccountId(input.toId)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No se puede emitir Túmin hacia una cuenta de sistema",
    });
  }

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Monto de emisión inválido",
    });
  }

  if (!input.concept.trim()) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Concepto de emisión requerido",
    });
  }

  if (!(SYSTEM_ISSUED_TYPES as readonly string[]).includes(input.type)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Tipo de emisión no permitido desde SYSTEM",
    });
  }

  await ensureSystemUser(tx);

  const [row] = await tx
    .insert(transactions)
    .values({
      fromId: SYSTEM_USER_ID,
      toId: input.toId,
      amount: input.amount,
      concept: input.concept.trim(),
      type: input.type,
      idempotencyKey: input.idempotencyKey ?? null,
    })
    .returning();

  return row;
}

/** Peer-to-peer transfer must never involve system accounts as sender or recipient */
export function assertPeerTransferParties(fromId: string, toId: string) {
  if (isSystemAccountId(fromId) || isSystemAccountId(toId)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Las cuentas de sistema no participan en transferencias entre socios",
    });
  }
  if (fromId === toId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No puedes enviarte a ti mismo",
    });
  }
}
