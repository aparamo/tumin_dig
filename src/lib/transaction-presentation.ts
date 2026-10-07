import { z } from "zod";
import { isSystemAccountId } from "@/lib/system-ids";

/** Snapshot shape — local so this module stays client-safe (no `@/db` imports). */
export interface ProductPurchaseSnapshotView {
  name: string;
  priceMxn: number;
  priceTumin: number;
  imageUrl?: string | null;
}

export const transactionLedgerTypeSchema = z.enum([
  "TRANSFERENCIA",
  "BONO",
  "MINADO",
  "PAGO_TRABAJO",
]);

export type TransactionLedgerType = z.infer<typeof transactionLedgerTypeSchema>;

export const transactionKindSchema = z.enum([
  "envio",
  "bazar",
  "bono",
  "minado",
  "pago_trabajo",
]);

export type TransactionKind = z.infer<typeof transactionKindSchema>;

/** Named `flow` (not `direction`) — `direction` is reserved by TanStack infinite queries. */
export const historyFlowSchema = z.enum(["all", "in", "out"]);
export type HistoryFlow = z.infer<typeof historyFlowSchema>;

export const historyTimeRangeSchema = z.enum(["7d", "30d", "90d", "1y", "all"]);
export type HistoryTimeRange = z.infer<typeof historyTimeRangeSchema>;

export const historyKindFilterSchema = z.enum([
  "all",
  "envio",
  "bazar",
  "bono",
  "minado",
  "pago_trabajo",
]);
export type HistoryKindFilter = z.infer<typeof historyKindFilterSchema>;

export interface TransactionParty {
  id: string;
  displayName: string;
  publicProfile: boolean;
}

export interface HistoryProductSnapshot {
  id: string | null;
  name: string;
  priceMxn: number | null;
  priceTumin: number | null;
  imageUrl: string | null;
}

export interface HistoryTransaction {
  id: string;
  amount: number;
  concept: string;
  createdAt: Date;
  isIngreso: boolean;
  type: TransactionLedgerType;
  kind: TransactionKind;
  from: TransactionParty;
  to: TransactionParty;
  product: HistoryProductSnapshot | null;
}

export const TRANSACTION_KIND_LABELS: Record<TransactionKind, string> = {
  envio: "Envío",
  bazar: "Producto o servicio",
  bono: "Bono",
  minado: "Minado",
  pago_trabajo: "Pago de trabajo",
};

const SYSTEM_DISPLAY_NAME = "Sistema Túmin";

export function resolveTransactionKind(input: {
  type: string;
  productId?: string | null;
  productSnapshot?: ProductPurchaseSnapshotView | null;
}): TransactionKind {
  if (input.productId || input.productSnapshot) {
    return "bazar";
  }
  switch (input.type) {
    case "BONO":
      return "bono";
    case "MINADO":
      return "minado";
    case "PAGO_TRABAJO":
      return "pago_trabajo";
    default:
      return "envio";
  }
}

export function partyDisplayName(input: {
  id: string;
  name: string;
  publicName: string | null;
}): string {
  if (isSystemAccountId(input.id)) {
    return SYSTEM_DISPLAY_NAME;
  }
  const publicName = input.publicName?.trim();
  return publicName || input.name;
}

export function buildTransactionParty(input: {
  id: string;
  name: string;
  publicName: string | null;
  publicProfile: boolean;
}): TransactionParty {
  return {
    id: input.id,
    displayName: partyDisplayName(input),
    publicProfile: isSystemAccountId(input.id) ? false : input.publicProfile,
  };
}

export function buildHistoryProduct(
  productId: string | null | undefined,
  snapshot: ProductPurchaseSnapshotView | null | undefined,
  concept: string
): HistoryProductSnapshot | null {
  if (!productId && !snapshot) return null;
  const fromConcept = concept.replace(/^Compra:\s*/i, "").trim();
  return {
    id: productId ?? null,
    name: snapshot?.name ?? (fromConcept || "Producto"),
    priceMxn: snapshot?.priceMxn ?? null,
    priceTumin: snapshot?.priceTumin ?? null,
    imageUrl: snapshot?.imageUrl ?? null,
  };
}

/** Strip LIKE wildcards so user search cannot inject patterns. */
export function sanitizeHistorySearch(raw: string): string {
  return raw.trim().slice(0, 80).replace(/[%_\\]/g, "");
}

export function counterpartOf(
  tx: Pick<HistoryTransaction, "from" | "to" | "isIngreso">
): TransactionParty {
  return tx.isIngreso ? tx.from : tx.to;
}
