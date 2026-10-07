"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Search, X } from "lucide-react";
import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion";
import { TransactionCard } from "@/components/wallet/TransactionCard";
import { TransactionDetailDialog } from "@/components/wallet/TransactionDetailDialog";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import {
  TRANSACTION_KIND_LABELS,
  type HistoryFlow,
  type HistoryKindFilter,
  type HistoryTimeRange,
  type HistoryTransaction,
} from "@/lib/transaction-presentation";

interface HistoryFiltersState {
  search: string;
  flow: HistoryFlow;
  kind: HistoryKindFilter;
  timeRange: HistoryTimeRange;
}

const DEFAULT_FILTERS: HistoryFiltersState = {
  search: "",
  flow: "all",
  kind: "all",
  timeRange: "all",
};

const FILTER_LABEL = "mb-1.5 block text-[10px] font-black uppercase tracking-widest text-muted-foreground";
const FILTER_TRIGGER =
  "h-10 w-full min-w-0 border-2 border-border bg-card text-sm font-bold data-[size=default]:h-10 sm:h-11 sm:data-[size=default]:h-11";

const FLOW_LABELS: Record<HistoryFlow, string> = {
  all: "Todas",
  in: "Recibidas",
  out: "Enviadas",
};

const KIND_LABELS: Record<HistoryKindFilter, string> = {
  all: "Todos",
  envio: TRANSACTION_KIND_LABELS.envio,
  bazar: TRANSACTION_KIND_LABELS.bazar,
  bono: TRANSACTION_KIND_LABELS.bono,
  minado: TRANSACTION_KIND_LABELS.minado,
  pago_trabajo: TRANSACTION_KIND_LABELS.pago_trabajo,
};

const TIME_RANGE_OPTIONS: HistoryTimeRange[] = ["7d", "30d", "90d", "1y", "all"];

const TIME_LABELS: Record<HistoryTimeRange, string> = {
  "7d": "Últimos 7 días",
  "30d": "Últimos 30 días",
  "90d": "Últimos 90 días",
  "1y": "Último año",
  all: "Todo el tiempo",
};

export function Historial() {
  const { data: session } = useSession();
  const [filters, setFilters] = useState<HistoryFiltersState>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<HistoryTransaction | null>(null);
  const debouncedSearch = useDebounce(filters.search, 300);

  const query = trpc.wallet.listHistory.useInfiniteQuery(
    {
      limit: 20,
      search: debouncedSearch.trim() || undefined,
      flow: filters.flow,
      kind: filters.kind,
      timeRange: filters.timeRange,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      initialCursor: 0,
    }
  );

  const items = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data]
  );

  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.flow !== "all" ||
    filters.kind !== "all" ||
    filters.timeRange !== "all";

  if (!session?.user) return null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-3 pb-10 sm:gap-5 sm:p-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Historial</h1>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:text-xs">
            Movimientos de tu monedero
          </p>
        </div>
        {hasActiveFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 text-[10px] font-black uppercase tracking-wide text-muted-foreground"
            onClick={() => setFilters(DEFAULT_FILTERS)}
          >
            <X className="h-3.5 w-3.5" />
            Limpiar
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-end lg:gap-3">
        <div className="relative min-w-0 w-full flex-1">
          <Label className={FILTER_LABEL}>Buscar</Label>
          <Search className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            placeholder="Concepto, persona o producto…"
            className="h-10 border-2 bg-card pl-9 text-sm font-bold sm:h-11"
            maxLength={80}
          />
        </div>

        <div className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-3 lg:w-[min(100%,36rem)] lg:shrink-0">
          <div className="min-w-0">
            <Label className={FILTER_LABEL}>Dirección</Label>
            <Select
              value={filters.flow}
              onValueChange={(v) => {
                if (v !== "all" && v !== "in" && v !== "out") return;
                setFilters((prev) => ({ ...prev, flow: v }));
              }}
            >
              <SelectTrigger className={cn(FILTER_TRIGGER)}>
                <span className="truncate font-bold">{FLOW_LABELS[filters.flow]}</span>
              </SelectTrigger>
              <SelectContent className="border-2 bg-card" alignItemWithTrigger={false}>
                {(Object.keys(FLOW_LABELS) as HistoryFlow[]).map((key) => (
                  <SelectItem key={key} value={key} className="font-bold">
                    {FLOW_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0">
            <Label className={FILTER_LABEL}>Tipo</Label>
            <Select
              value={filters.kind}
              onValueChange={(v) => {
                if (
                  v !== "all" &&
                  v !== "envio" &&
                  v !== "bazar" &&
                  v !== "bono" &&
                  v !== "minado" &&
                  v !== "pago_trabajo"
                ) {
                  return;
                }
                setFilters((prev) => ({ ...prev, kind: v }));
              }}
            >
              <SelectTrigger className={cn(FILTER_TRIGGER)}>
                <span className="truncate font-bold">{KIND_LABELS[filters.kind]}</span>
              </SelectTrigger>
              <SelectContent className="border-2 bg-card" alignItemWithTrigger={false}>
                {(Object.keys(KIND_LABELS) as HistoryKindFilter[]).map((key) => (
                  <SelectItem key={key} value={key} className="font-bold">
                    {KIND_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0">
            <Label className={FILTER_LABEL}>Período</Label>
            <Select
              value={filters.timeRange}
              onValueChange={(v) => {
                if (
                  v !== "7d" &&
                  v !== "30d" &&
                  v !== "90d" &&
                  v !== "1y" &&
                  v !== "all"
                ) {
                  return;
                }
                setFilters((prev) => ({ ...prev, timeRange: v }));
              }}
            >
              <SelectTrigger className={cn(FILTER_TRIGGER)}>
                <span className="truncate font-bold">{TIME_LABELS[filters.timeRange]}</span>
              </SelectTrigger>
              <SelectContent className="border-2 bg-card" alignItemWithTrigger={false}>
                {TIME_RANGE_OPTIONS.map((key) => (
                  <SelectItem key={key} value={key} className="font-bold">
                    {TIME_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <StaggerContainer className="flex flex-col gap-3">
        {query.isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : items.length > 0 ? (
          items.map((tx) => (
            <StaggerItem key={tx.id}>
              <TransactionCard transaction={tx} onSelect={setSelected} />
            </StaggerItem>
          ))
        ) : (
          <div className="neo-card border-2 border-dashed bg-muted/20 p-10 text-center text-sm font-bold uppercase tracking-widest text-muted-foreground shadow-none">
            {hasActiveFilters
              ? "No hay movimientos con estos filtros."
              : "No hay movimientos registrados."}
          </div>
        )}
      </StaggerContainer>

      {query.hasNextPage ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            className="h-10 border-2 px-6 text-xs font-black uppercase shadow-neo-sm sm:h-12 sm:px-8 sm:text-sm"
            onClick={() => query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
          >
            {query.isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando…
              </>
            ) : (
              "Cargar más"
            )}
          </Button>
        </div>
      ) : null}

      <TransactionDetailDialog
        transaction={selected}
        open={selected != null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
