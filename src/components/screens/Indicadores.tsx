"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Loader2,
  Activity,
  ArrowLeftRight,
  Coins,
  Users,
  Briefcase,
  TrendingDown,
  TrendingUp,
  Gift,
  Pickaxe,
} from "lucide-react";
import type { StatsPeriod } from "@/lib/stats-periods";
import { MEXICO_COUNTRY, MEXICO_STATES } from "@/lib/location";
import type {
  ExchangedBreakdown,
  GeneratedBreakdown,
  TransactionBreakdown,
} from "@/lib/stats-breakdown";
import { isCoordinator } from "@/lib/trpc/authorization";
import type { UserRole } from "@/lib/trpc/authorization";

const PERIODS: { value: StatsPeriod; label: string }[] = [
  { value: "day", label: "Hoy" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "year", label: "Año" },
  { value: "all", label: "Todo" },
];

function formatAmount(n: number) {
  return n.toLocaleString("es-MX", { maximumFractionDigits: 2 });
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: typeof Activity;
}) {
  return (
    <Card className="border-2 border-border shadow-neo-sm">
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
          <Icon className="w-4 h-4 text-primary" />
          {title}
        </CardDescription>
        <CardTitle className="text-3xl font-black tabular-nums tracking-tighter">{value}</CardTitle>
      </CardHeader>
      {subtitle ? (
        <CardContent>
          <p className="text-xs text-muted-foreground font-medium">{subtitle}</p>
        </CardContent>
      ) : null}
    </Card>
  );
}

function BreakdownColHeaders() {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/80">
      <span>Tipo</span>
      <span className="tabular-nums">
        <span className="inline-block w-10 text-right">#</span>
        <span className="mx-1 opacity-40">·</span>
        <span className="inline-block min-w-14 text-right">Monto</span>
      </span>
    </div>
  );
}

function BreakdownRow({
  label,
  count,
  amount,
}: {
  label: string;
  count: number;
  amount: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm border-b border-border/60 py-2 last:border-0">
      <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wide">
        {label}
      </span>
      <span className="tabular-nums font-black text-right">
        <span className="inline-block w-10 text-right text-muted-foreground">{count}</span>
        <span className="mx-1 text-muted-foreground/50">·</span>
        <span className="inline-block min-w-14 text-right">
          {formatAmount(amount)} Ŧ
        </span>
      </span>
    </div>
  );
}

function FlowBreakdown({
  transactions,
  generated,
  exchanged,
}: {
  transactions: TransactionBreakdown;
  generated: GeneratedBreakdown;
  exchanged: ExchangedBreakdown;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-2 border-border shadow-neo-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black uppercase tracking-tight">
            Transacciones
          </CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase">
            Cantidad de movimientos y suma en Ŧ
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-0">
          <BreakdownColHeaders />
          <BreakdownRow label="Transferencias" {...transactions.transferencia} />
          <BreakdownRow label="— Compra bazar" {...transactions.bazar} />
          <BreakdownRow label="— Envío libre" {...transactions.envioLibre} />
          <BreakdownRow label="Bono" {...transactions.bono} />
          <BreakdownRow label="Minado" {...transactions.minado} />
          <BreakdownRow label="Pago labor" {...transactions.pagoTrabajo} />
          <BreakdownRow label="Total" {...transactions.total} />
        </CardContent>
      </Card>
      <Card className="border-2 border-border shadow-neo-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black uppercase tracking-tight">Generado</CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase">
            Emisión del sistema (cantidad y Ŧ)
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-0">
          <BreakdownColHeaders />
          <BreakdownRow label="Bono" {...generated.bono} />
          <BreakdownRow label="Minado" {...generated.minado} />
          <BreakdownRow label="Pago labor" {...generated.pagoTrabajo} />
          <BreakdownRow label="Total" {...generated.total} />
        </CardContent>
      </Card>
      <Card className="border-2 border-border shadow-neo-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black uppercase tracking-tight">
            Intercambiado
          </CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase">
            Entre personas (cantidad y Ŧ)
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-0">
          <BreakdownColHeaders />
          <BreakdownRow label="Compra bazar" {...exchanged.bazar} />
          <BreakdownRow label="Envío libre" {...exchanged.envioLibre} />
          <BreakdownRow label="Total" {...exchanged.total} />
        </CardContent>
      </Card>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  display,
  onChange,
  options,
}: {
  label: string;
  value: string;
  display: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-[10px] font-black uppercase text-muted-foreground">{label}</span>
      <Select
        value={value}
        onValueChange={(v) => {
          if (typeof v === "string") onChange(v);
        }}
      >
        <SelectTrigger className="w-[min(100%,220px)] font-bold uppercase text-xs">
          <span className="truncate font-bold">{display}</span>
        </SelectTrigger>
        <SelectContent className="border-2 bg-card max-h-64" alignItemWithTrigger={false}>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="uppercase text-xs font-bold">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function Indicadores() {
  const { data: session } = useSession();
  const role = (session?.user?.role ?? "SOCIO") as UserRole;
  const canSeeRegion = isCoordinator(role);

  const [period, setPeriod] = useState<StatsPeriod>("month");
  const [region, setRegion] = useState<string>("Todas");
  const [country, setCountry] = useState<string>("Todas");
  const [regionState, setRegionState] = useState<string>("Todas");
  const [mexicoState, setMexicoState] = useState<string>("Todas");
  const [activeTab, setActiveTab] = useState("sistema");

  const systemQuery = trpc.stats.getSystemStats.useQuery(
    { period },
    { enabled: activeTab === "sistema" }
  );
  const myQuery = trpc.stats.getMyStats.useQuery(
    { period },
    { enabled: activeTab === "mios" }
  );
  const stateQuery = trpc.stats.getStateStats.useQuery(
    {
      period,
      state: mexicoState === "Todas" ? undefined : mexicoState,
    },
    { enabled: activeTab === "estado" }
  );
  const regionQuery = trpc.stats.getRegionStats.useQuery(
    {
      period,
      region: region === "Todas" ? undefined : region,
      country: country === "Todas" ? undefined : country,
      state: regionState === "Todas" ? undefined : regionState,
    },
    { enabled: canSeeRegion && activeTab === "region" }
  );

  const showStateFilter = country === MEXICO_COUNTRY || country === "México";
  const tabCols = canSeeRegion ? "grid-cols-4" : "grid-cols-3";

  return (
    <div className="flex flex-col gap-6 p-4 max-w-5xl mx-auto w-full pb-20">
      <div className="space-y-1">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Indicadores</h1>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Red Túmin y tu actividad · zona horaria México
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <FilterSelect
          label="Periodo"
          value={period}
          display={PERIODS.find((p) => p.value === period)?.label ?? period}
          onChange={(v) => setPeriod(v as StatsPeriod)}
          options={PERIODS.map((p) => ({ value: p.value, label: p.label }))}
        />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          if (typeof v === "string") setActiveTab(v);
        }}
        className="w-full"
      >
        <TabsList
          className={`grid w-full ${tabCols} h-12 bg-muted/50 p-1 rounded-xl border-2 border-border shadow-neo-sm`}
        >
          <TabsTrigger value="sistema" className="rounded-lg font-black uppercase text-xs">
            Sistema
          </TabsTrigger>
          <TabsTrigger value="mios" className="rounded-lg font-black uppercase text-xs">
            Mis indicadores
          </TabsTrigger>
          <TabsTrigger value="estado" className="rounded-lg font-black uppercase text-xs">
            Estado
          </TabsTrigger>
          {canSeeRegion ? (
            <TabsTrigger value="region" className="rounded-lg font-black uppercase text-xs">
              Región
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="sistema" className="mt-6 space-y-6">
          {systemQuery.isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : systemQuery.data ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                  title="Transacciones"
                  value={String(systemQuery.data.transactions.count)}
                  subtitle={`Periodo: ${systemQuery.data.label}`}
                  icon={Activity}
                />
                <StatCard
                  title="Generado"
                  value={`${formatAmount(systemQuery.data.generated.amount)} Ŧ`}
                  subtitle={`${systemQuery.data.generated.count} emisiones (bono, minado, labores)`}
                  icon={Coins}
                />
                <StatCard
                  title="Intercambiado"
                  value={`${formatAmount(systemQuery.data.exchanged.amount)} Ŧ`}
                  subtitle={`${systemQuery.data.exchanged.count} transferencias entre personas`}
                  icon={ArrowLeftRight}
                />
              </div>
              <div className="space-y-2">
                <h2 className="text-sm font-black uppercase tracking-tight">Detalle de flujos</h2>
                <FlowBreakdown {...systemQuery.data.breakdown} />
              </div>
            </>
          ) : (
            <p className="text-sm text-destructive">{systemQuery.error?.message}</p>
          )}
        </TabsContent>

        <TabsContent value="mios" className="mt-6 space-y-6">
          {myQuery.isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : myQuery.data ? (
            <>
              <p className="text-xs font-bold uppercase text-muted-foreground">
                Tu actividad · {myQuery.data.label}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                  title="Intercambiado"
                  value={`${formatAmount(myQuery.data.exchanged.total.amount)} Ŧ`}
                  subtitle={`${myQuery.data.exchanged.total.count} transferencias (bazar y envíos)`}
                  icon={ArrowLeftRight}
                />
                <StatCard
                  title="Ganado"
                  value={`${formatAmount(myQuery.data.earned.amount)} Ŧ`}
                  subtitle={`${myQuery.data.earned.count} transferencias recibidas`}
                  icon={TrendingUp}
                />
                <StatCard
                  title="Gastado"
                  value={`${formatAmount(myQuery.data.spent.amount)} Ŧ`}
                  subtitle={`${myQuery.data.spent.count} transferencias enviadas`}
                  icon={TrendingDown}
                />
                <StatCard
                  title="Bonos"
                  value={`${formatAmount(myQuery.data.bonuses.amount)} Ŧ`}
                  subtitle={`${myQuery.data.bonuses.count} bonos recibidos`}
                  icon={Gift}
                />
                <StatCard
                  title="Minado"
                  value={`${formatAmount(myQuery.data.mining.amount)} Ŧ`}
                  subtitle={`${myQuery.data.mining.count} claims`}
                  icon={Pickaxe}
                />
                <StatCard
                  title="Pago labor"
                  value={`${formatAmount(myQuery.data.laborPay.amount)} Ŧ`}
                  subtitle={`${myQuery.data.laborPay.count} pagos de trabajo`}
                  icon={Briefcase}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-2 border-border shadow-neo-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-black uppercase tracking-tight">
                      Intercambio
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase">
                      Con otras personas (cantidad y Ŧ)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <BreakdownColHeaders />
                    <BreakdownRow label="Compra bazar" {...myQuery.data.exchanged.bazar} />
                    <BreakdownRow label="Envío libre" {...myQuery.data.exchanged.envioLibre} />
                    <BreakdownRow label="Total" {...myQuery.data.exchanged.total} />
                  </CardContent>
                </Card>
                <Card className="border-2 border-border shadow-neo-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-black uppercase tracking-tight">
                      Recibido del sistema
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase">
                      Emisión a tu cuenta (cantidad y Ŧ)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <BreakdownColHeaders />
                    <BreakdownRow label="Bono" {...myQuery.data.receivedFromSystem.bono} />
                    <BreakdownRow label="Minado" {...myQuery.data.receivedFromSystem.minado} />
                    <BreakdownRow
                      label="Pago labor"
                      {...myQuery.data.receivedFromSystem.pagoTrabajo}
                    />
                    <BreakdownRow label="Total" {...myQuery.data.receivedFromSystem.total} />
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <p className="text-sm text-destructive">{myQuery.error?.message}</p>
          )}
        </TabsContent>

        <TabsContent value="estado" className="mt-6 space-y-6">
          <FilterSelect
            label="Estado"
            value={mexicoState}
            display={mexicoState === "Todas" ? "Todos los estados (México)" : mexicoState}
            onChange={setMexicoState}
            options={[
              { value: "Todas", label: "Todos los estados (México)" },
              ...MEXICO_STATES.map((s) => ({ value: s, label: s })),
            ]}
          />

          {stateQuery.isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : stateQuery.data ? (
            <>
              <p className="text-xs font-bold uppercase text-muted-foreground">
                Residencia en México
                {stateQuery.data.state !== "Todas" ? ` · ${stateQuery.data.state}` : " · todos los estados"}
                {" · "}
                {stateQuery.data.label}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                  title="Socios activos"
                  value={String(stateQuery.data.members.activos)}
                  subtitle={`${stateQuery.data.members.sinVerificar} sin verificar · ${stateQuery.data.members.congelados} congelados`}
                  icon={Users}
                />
                <StatCard
                  title="Labores pendientes"
                  value={String(stateQuery.data.jobs.pendientes)}
                  subtitle={`${stateQuery.data.jobs.pagadas} pagadas · ${stateQuery.data.jobs.rechazadas} rechazadas (periodo)`}
                  icon={Briefcase}
                />
                <StatCard
                  title="Generado (recibido)"
                  value={`${formatAmount(stateQuery.data.generated.amount)} Ŧ`}
                  subtitle={`${stateQuery.data.generated.count} emisiones en el filtro`}
                  icon={Coins}
                />
                <StatCard
                  title="Intercambiado"
                  value={`${formatAmount(stateQuery.data.exchanged.amount)} Ŧ`}
                  subtitle={`${stateQuery.data.exchanged.count} transferencias con al menos un extremo en el estado`}
                  icon={ArrowLeftRight}
                />
              </div>
              <div className="space-y-2">
                <h2 className="text-sm font-black uppercase tracking-tight">Detalle de flujos</h2>
                <FlowBreakdown {...stateQuery.data.breakdown} />
              </div>
            </>
          ) : (
            <p className="text-sm text-destructive">{stateQuery.error?.message}</p>
          )}
        </TabsContent>

        {canSeeRegion ? (
          <TabsContent value="region" className="mt-6 space-y-6">
            <div className="flex flex-wrap gap-4">
              {regionQuery.data?.canSelectRegion && (
                <FilterSelect
                  label="Adscripción"
                  value={region}
                  display={region === "Todas" ? "Toda la red" : region}
                  onChange={setRegion}
                  options={[
                    { value: "Todas", label: "Toda la red" },
                    ...(regionQuery.data?.regions ?? []).map((r) => ({ value: r, label: r })),
                  ]}
                />
              )}
              <FilterSelect
                label="País"
                value={country}
                display={country === "Todas" ? "Todos los países" : country}
                onChange={(v) => {
                  setCountry(v);
                  if (v !== MEXICO_COUNTRY && v !== "México") setRegionState("Todas");
                }}
                options={[
                  { value: "Todas", label: "Todos los países" },
                  ...(regionQuery.data?.countries ?? [MEXICO_COUNTRY]).map((c) => ({
                    value: c,
                    label: c,
                  })),
                ]}
              />
              {showStateFilter && (
                <FilterSelect
                  label="Estado"
                  value={regionState}
                  display={regionState === "Todas" ? "Todos los estados" : regionState}
                  onChange={setRegionState}
                  options={[
                    { value: "Todas", label: "Todos los estados" },
                    ...(regionQuery.data?.states ?? []).map((s) => ({ value: s, label: s })),
                  ]}
                />
              )}
            </div>

            {regionQuery.isLoading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              </div>
            ) : regionQuery.data ? (
              <>
                <p className="text-xs font-bold uppercase text-muted-foreground">
                  Vista: {regionQuery.data.region}
                  {regionQuery.data.country !== "Todas" ? ` · ${regionQuery.data.country}` : ""}
                  {regionQuery.data.state !== "Todas" ? ` · ${regionQuery.data.state}` : ""}
                  {" · "}
                  {regionQuery.data.label}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <StatCard
                    title="Socios activos"
                    value={String(regionQuery.data.members.activos)}
                    subtitle={`${regionQuery.data.members.sinVerificar} sin verificar · ${regionQuery.data.members.congelados} congelados`}
                    icon={Users}
                  />
                  <StatCard
                    title="Labores pendientes"
                    value={String(regionQuery.data.jobs.pendientes)}
                    subtitle={`${regionQuery.data.jobs.pagadas} pagadas · ${regionQuery.data.jobs.rechazadas} rechazadas (periodo)`}
                    icon={Briefcase}
                  />
                  <StatCard
                    title="Generado (recibido)"
                    value={`${formatAmount(regionQuery.data.generated.amount)} Ŧ`}
                    subtitle={`${regionQuery.data.generated.count} emisiones al nodo`}
                    icon={Coins}
                  />
                  <StatCard
                    title="Intercambiado"
                    value={`${formatAmount(regionQuery.data.exchanged.amount)} Ŧ`}
                    subtitle={`${regionQuery.data.exchanged.count} transferencias con al menos un extremo en el filtro`}
                    icon={ArrowLeftRight}
                  />
                </div>
                <div className="space-y-2">
                  <h2 className="text-sm font-black uppercase tracking-tight">Detalle de flujos</h2>
                  <FlowBreakdown {...regionQuery.data.breakdown} />
                </div>
              </>
            ) : (
              <p className="text-sm text-destructive">{regionQuery.error?.message}</p>
            )}
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}
