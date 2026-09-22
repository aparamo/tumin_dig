"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Loader2,
  Package,
  ShoppingBag,
  Star,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion";
import { CommunicateButton } from "@/components/contact/CommunicateButton";
import { trpc } from "@/lib/trpc/react";
import {
  rangeToDates,
  type SaleListItem,
  type SalesDayPoint,
  type SalesFiltersState,
  type SalesSummary,
  type SalesTimeRange,
  type TopProductStat,
} from "@/lib/types/sales";

function formatMoney(n: number): string {
  return new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: 2,
  }).format(n);
}

function StatsCards({ summary }: { summary: SalesSummary }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="neo-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-black uppercase text-muted-foreground">
            Total ventas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-black tracking-tight">{summary.totalSales}</p>
        </CardContent>
      </Card>
      <Card className="neo-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-black uppercase text-muted-foreground">
            Ingresos Túmin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-black tracking-tight text-secondary">
            {formatMoney(summary.totalRevenueTumin)} Ŧ
          </p>
        </CardContent>
      </Card>
      <Card className="neo-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-black uppercase text-muted-foreground">
            Ingresos MXN
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-black tracking-tight text-primary">
            $ {formatMoney(summary.totalRevenueMxn)}
          </p>
        </CardContent>
      </Card>
      <Card className="neo-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1.5 text-xs font-black uppercase text-muted-foreground">
            <Users className="h-3.5 w-3.5" aria-hidden />
            Compradores únicos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-black tracking-tight">{summary.uniqueBuyers}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function TopProductsCard({ products }: { products: TopProductStat[] }) {
  if (products.length === 0) return null;

  return (
    <Card className="neo-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-black uppercase">
          <Star className="h-5 w-5 text-secondary" aria-hidden />
          Productos más vendidos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {products.map((p, i) => (
            <div
              key={p.productId}
              className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 p-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-black">
                  {i + 1}
                </span>
                <p className="truncate text-sm font-black">{p.productName}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-bold text-muted-foreground">
                  {p.salesCount} venta{p.salesCount !== 1 ? "s" : ""}
                </p>
                <p className="text-sm font-black text-secondary">
                  {formatMoney(p.totalRevenue)} Ŧ
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SalesTrendChart({
  data,
  timeRange,
}: {
  data: SalesDayPoint[];
  timeRange: SalesTimeRange;
}) {
  if (data.length === 0) return null;

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const label =
    timeRange === "all"
      ? "Tendencia de ventas"
      : timeRange === "7d"
        ? "Tendencia (últimos 7 días)"
        : timeRange === "90d"
          ? "Tendencia (últimos 90 días)"
          : "Tendencia (últimos 30 días)";

  return (
    <Card className="neo-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-black uppercase">
          <TrendingUp className="h-5 w-5 text-primary" aria-hidden />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-48 items-end justify-between gap-0.5 sm:gap-1">
          {data.map((day) => {
            const heightPct = Math.max((day.revenue / maxRevenue) * 100, day.count > 0 ? 4 : 0);
            return (
              <div
                key={day.date}
                className="group relative flex min-w-0 flex-1 flex-col justify-end"
                style={{ height: "100%" }}
              >
                <div
                  className="w-full rounded-t bg-secondary/35 transition-colors group-hover:bg-secondary/55"
                  style={{ height: `${heightPct}%` }}
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border-2 border-border bg-background p-2 shadow-neo-sm group-hover:block">
                  <p className="text-[10px] font-black uppercase">
                    {new Date(day.date + "T12:00:00").toLocaleDateString("es-MX", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-xs font-black text-secondary">
                    {formatMoney(day.revenue)} Ŧ
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground">
                    {day.count} venta{day.count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[10px] font-bold text-muted-foreground">
          <span>
            {data[0]
              ? new Date(data[0].date + "T12:00:00").toLocaleDateString("es-MX", {
                  month: "short",
                  day: "numeric",
                })
              : ""}
          </span>
          <span>
            {data[data.length - 1]
              ? new Date(data[data.length - 1]!.date + "T12:00:00").toLocaleDateString(
                  "es-MX",
                  { month: "short", day: "numeric" }
                )
              : ""}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function SalesFiltersBar({
  filters,
  onFiltersChange,
  myProducts,
}: {
  filters: SalesFiltersState;
  onFiltersChange: (patch: Partial<SalesFiltersState>) => void;
  myProducts: Array<{ id: string; name: string }>;
}) {
  const hasActive =
    Boolean(filters.productId) ||
    filters.timeRange !== "all" ||
    filters.minAmount != null;

  return (
    <Card className="neo-card">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase">Producto</Label>
            <Select
              value={filters.productId ?? "all"}
              onValueChange={(v) =>
                onFiltersChange({ productId: !v || v === "all" ? undefined : v })
              }
            >
              <SelectTrigger className="h-10 border-2">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los productos</SelectItem>
                {myProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase">Período</Label>
            <Select
              value={filters.timeRange}
              onValueChange={(v) => {
                if (v !== "7d" && v !== "30d" && v !== "90d" && v !== "all") return;
                const range = v as SalesTimeRange;
                const dates = rangeToDates(range);
                onFiltersChange({
                  timeRange: range,
                  startDate: dates.startDate,
                  endDate: dates.endDate,
                });
              }}
            >
              <SelectTrigger className="h-10 border-2">
                <SelectValue placeholder="Todo el tiempo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el tiempo</SelectItem>
                <SelectItem value="7d">Últimos 7 días</SelectItem>
                <SelectItem value="30d">Últimos 30 días</SelectItem>
                <SelectItem value="90d">Últimos 90 días</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase">Monto mínimo (Ŧ)</Label>
            <Input
              type="number"
              min={0}
              step="any"
              placeholder="0"
              value={filters.minAmount ?? ""}
              onChange={(e) => {
                const raw = e.target.value;
                onFiltersChange({
                  minAmount: raw === "" ? undefined : Number.parseFloat(raw),
                });
              }}
              className="h-10 border-2"
            />
          </div>
        </div>

        {hasActive ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-4"
            onClick={() =>
              onFiltersChange({
                productId: undefined,
                timeRange: "all",
                startDate: undefined,
                endDate: undefined,
                minAmount: undefined,
              })
            }
          >
            <X className="mr-1 h-4 w-4" /> Limpiar filtros
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SalesList({ sales }: { sales: SaleListItem[] }) {
  return (
    <StaggerContainer className="flex flex-col gap-4">
      {sales.map((sale) => (
        <StaggerItem key={sale.id}>
          <Card>
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl border-2 border-border bg-muted sm:h-20 sm:w-20">
                {sale.imageUrl ? (
                  <Image
                    src={sale.imageUrl}
                    alt={sale.productName}
                    fill
                    sizes="(max-width: 640px) 100vw, 80px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                    <ShoppingBag className="h-8 w-8" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="truncate text-lg font-black uppercase tracking-tight">
                  {sale.productName}
                </h3>
                <p className="text-xs font-bold text-muted-foreground">
                  Comprador:{" "}
                  {sale.buyer.publicProfile ? (
                    <Link
                      href={`/u/${sale.buyer.id}`}
                      className="text-primary underline-offset-2 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {sale.buyer.displayName}
                    </Link>
                  ) : (
                    <span className="text-foreground">{sale.buyer.displayName}</span>
                  )}
                </p>
                <p className="text-sm font-black tracking-tight">
                  {sale.priceMxn != null && (
                    <>
                      <span className="text-primary">${formatMoney(sale.priceMxn)} MXN</span>
                      <span className="mx-1 text-muted-foreground">+</span>
                    </>
                  )}
                  <span className="text-secondary">{formatMoney(sale.priceTumin)} Ŧ</span>
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {new Intl.DateTimeFormat("es-MX", {
                    timeZone: "America/Mexico_City",
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(sale.createdAt))}
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                <CommunicateButton
                  target={{
                    userId: sale.buyer.id,
                    displayName: sale.buyer.displayName,
                    contactMethods: [],
                    messageText: `Hola ${sale.buyer.displayName}, sobre tu compra: ${sale.productName}`,
                  }}
                  className="h-11 w-full border-2 shadow-neo-sm sm:w-auto"
                  label="Contactar"
                />
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}

export function MisVentasContent({
  onGoToProducts,
}: {
  onGoToProducts: () => void;
}) {
  const [filters, setFilters] = useState<SalesFiltersState>({
    timeRange: "30d",
    ...rangeToDates("30d"),
  });

  const { data: myProducts } = trpc.bazar.getMyProducts.useQuery();

  const everSoldQuery = trpc.wallet.getMySales.useQuery(
    { limit: 1, cursor: 0 },
    { staleTime: 60_000 }
  );

  const statsQuery = trpc.wallet.getMySalesStats.useQuery(
    { timeRange: filters.timeRange },
    { staleTime: 30_000 }
  );

  const salesQuery = trpc.wallet.getMySales.useInfiniteQuery(
    {
      limit: 12,
      productId: filters.productId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      minAmount: filters.minAmount,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      initialCursor: 0,
    }
  );

  const sales = salesQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const isInitialLoading =
    everSoldQuery.isLoading || statsQuery.isLoading || salesQuery.isLoading;
  const everSold = (everSoldQuery.data?.stats.totalSales ?? 0) > 0;

  const patchFilters = (patch: Partial<SalesFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  if (isInitialLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!everSold) {
    return (
      <div className="neo-card border-2 border-dashed bg-muted/20 p-12 text-center shadow-none">
        <TrendingUp className="mx-auto mb-4 h-16 w-16 text-muted-foreground/40" />
        <h3 className="mb-2 text-xl font-black uppercase">Aún no tienes ventas</h3>
        <p className="mb-6 text-sm font-medium text-muted-foreground">
          Cuando alguien compre tus productos, verás el historial y estadísticas aquí.
        </p>
        <Button
          type="button"
          variant="secondary"
          className="h-12 border-2 font-black uppercase shadow-neo-sm"
          onClick={onGoToProducts}
        >
          <Package className="mr-2 h-5 w-5" /> Ver mis productos
        </Button>
      </div>
    );
  }

  const summary = statsQuery.data?.summary ?? {
    totalSales: 0,
    totalRevenueTumin: 0,
    totalRevenueMxn: 0,
    uniqueBuyers: 0,
    avgSaleAmount: 0,
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-black uppercase tracking-tighter md:text-3xl">Mis ventas</h2>
        <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Panel del vendedor · análisis de ingresos
        </p>
      </div>

      <StatsCards summary={summary} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TopProductsCard products={statsQuery.data?.topProducts ?? []} />
        <SalesTrendChart
          data={statsQuery.data?.salesByDay ?? []}
          timeRange={filters.timeRange}
        />
      </div>

      <SalesFiltersBar
        filters={filters}
        onFiltersChange={patchFilters}
        myProducts={(myProducts ?? []).map((p) => ({ id: p.id, name: p.name }))}
      />

      {sales.length > 0 ? (
        <SalesList sales={sales} />
      ) : (
        <div className="neo-card border-2 border-dashed bg-muted/20 p-10 text-center text-sm font-bold uppercase tracking-widest text-muted-foreground shadow-none">
          No hay ventas con estos filtros.
        </div>
      )}

      {salesQuery.hasNextPage ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            className="h-12 border-2 px-8 font-black uppercase shadow-neo-sm"
            onClick={() => salesQuery.fetchNextPage()}
            disabled={salesQuery.isFetchingNextPage}
          >
            {salesQuery.isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando…
              </>
            ) : (
              "Cargar más ventas"
            )}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
