export interface FlowSlice {
  count: number;
  amount: number;
}

export interface TransactionBreakdown {
  transferencia: FlowSlice;
  bazar: FlowSlice;
  envioLibre: FlowSlice;
  bono: FlowSlice;
  minado: FlowSlice;
  pagoTrabajo: FlowSlice;
  total: FlowSlice;
}

export interface GeneratedBreakdown {
  bono: FlowSlice;
  minado: FlowSlice;
  pagoTrabajo: FlowSlice;
  total: FlowSlice;
}

export interface ExchangedBreakdown {
  bazar: FlowSlice;
  envioLibre: FlowSlice;
  total: FlowSlice;
}

export const EMPTY_SLICE: FlowSlice = { count: 0, amount: 0 };

export function emptyTransactionBreakdown(): TransactionBreakdown {
  return {
    transferencia: { ...EMPTY_SLICE },
    bazar: { ...EMPTY_SLICE },
    envioLibre: { ...EMPTY_SLICE },
    bono: { ...EMPTY_SLICE },
    minado: { ...EMPTY_SLICE },
    pagoTrabajo: { ...EMPTY_SLICE },
    total: { ...EMPTY_SLICE },
  };
}

export function emptyGeneratedBreakdown(): GeneratedBreakdown {
  return {
    bono: { ...EMPTY_SLICE },
    minado: { ...EMPTY_SLICE },
    pagoTrabajo: { ...EMPTY_SLICE },
    total: { ...EMPTY_SLICE },
  };
}

export function emptyExchangedBreakdown(): ExchangedBreakdown {
  return {
    bazar: { ...EMPTY_SLICE },
    envioLibre: { ...EMPTY_SLICE },
    total: { ...EMPTY_SLICE },
  };
}

export function addSlices(a: FlowSlice, b: FlowSlice): FlowSlice {
  return { count: a.count + b.count, amount: a.amount + b.amount };
}

export function sliceFromTotals(
  count: number | null | undefined,
  amount: number | null | undefined
): FlowSlice {
  return { count: count ?? 0, amount: amount ?? 0 };
}

/** Peer TRANSFERENCIA with productId → bazar; without → envío libre. */
export function classifyTransferKind(
  productId: string | null | undefined
): "bazar" | "envioLibre" {
  return productId ? "bazar" : "envioLibre";
}

export function generatedFromEmissionSlices(
  bono: FlowSlice,
  minado: FlowSlice,
  pagoTrabajo: FlowSlice
): GeneratedBreakdown {
  return {
    bono,
    minado,
    pagoTrabajo,
    total: addSlices(addSlices(bono, minado), pagoTrabajo),
  };
}

export function exchangedFromTransferSlices(
  bazar: FlowSlice,
  envioLibre: FlowSlice
): ExchangedBreakdown {
  return {
    bazar,
    envioLibre,
    total: addSlices(bazar, envioLibre),
  };
}
