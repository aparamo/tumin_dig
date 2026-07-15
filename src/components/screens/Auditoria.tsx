"use client";

import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ShieldAlert, UserMinus, Trash2, CheckCircle, Flame, Star, AlertTriangle, UserCheck, Users, Bot, TrendingDown } from "lucide-react";
import { useFeedback } from "@/components/FeedbackProvider";
import { useConfirm } from "@/hooks/use-confirm";
import { parseErrorMessage } from "@/lib/parse-error";

interface ConcentrationPatternRow {
  id: string;
  name: string;
  total_mined: number;
  grand_total_sent: number;
  primary_receiver_id: string;
  primary_receiver_name: string;
  last_activity: Date | null;
}

interface NonSellerRow {
  id: string;
  name: string;
  product_count: number;
  total_mined: number | null;
}

interface PossibleBotRow {
  id: string;
  name: string;
  mining_count: number;
  total_mined: number | null;
}

export function Auditoria() {
  const utils = trpc.useUtils();
  const { notifySuccess, notifyError } = useFeedback();
  const { confirm, ConfirmDialog } = useConfirm();
  const { data: report, isLoading } = trpc.audit.getAuditReport.useQuery();

  const { data: rewardStatus } = trpc.audit.getAuditRewardStatus.useQuery();

  const freezeMutation = trpc.audit.freezeUser.useMutation({
    onSuccess: (data) => {
      notifySuccess(`Usuario ${data.status === "ACTIVO" ? "reactivado" : "congelado"} correctamente.`);
      utils.audit.getAuditReport.invalidate();
      utils.audit.getAuditRewardStatus.invalidate();
    },
    onError: (e) => notifyError(parseErrorMessage(e)),
  });

  const deactivateProductMutation = trpc.bazar.deactivateProduct.useMutation({
    onSuccess: () => {
      notifySuccess("Producto desactivado.");
      utils.audit.getAuditReport.invalidate();
    },
    onError: (e) => notifyError(parseErrorMessage(e)),
  });

  const claimReward = trpc.audit.claimAuditReward.useMutation({
    onSuccess: () => {
      notifySuccess("Has recibido 30 Ŧ por tu labor de auditoría.");
      utils.wallet.getBalance.invalidate();
      utils.audit.getAuditRewardStatus.invalidate();
      utils.audit.getPendingAuditorValidations.invalidate();
    },
    onError: (error) => notifyError(parseErrorMessage(error)),
  });

  const handleFreeze = async (userId: string, status: "ACTIVO" | "CONGELADO") => {
    const isFreeze = status === "CONGELADO";
    const ok = await confirm({
      title: isFreeze ? "Congelar cuenta" : "Reactivar cuenta",
      description: isFreeze
        ? "El socio no podrá iniciar sesión ni operar hasta ser reactivado."
        : "El socio podrá volver a operar normalmente.",
      confirmText: isFreeze ? "Congelar" : "Reactivar",
      variant: isFreeze ? "destructive" : "default",
    });
    if (ok) freezeMutation.mutate({ userId, status });
  };

  const handleDeactivateProduct = async (productId: string, productName: string) => {
    const ok = await confirm({
      title: "Desactivar producto",
      description: `¿Seguro que quieres desactivar "${productName}" del bazar?`,
      confirmText: "Desactivar",
      variant: "destructive",
    });
    if (ok) deactivateProductMutation.mutate({ productId });
  };

  const handleClaimReward = () => {
    if (claimReward.isPending) return;
    claimReward.mutate();
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary w-12 h-12" /></div>;

  return (
    <div className="flex flex-col gap-8 p-4 pb-20 max-w-5xl mx-auto w-full">
      <ConfirmDialog />
      <div className="flex items-center gap-3">
        <div className="bg-destructive p-3 rounded-xl border-2 border-border shadow-neo-sm">
          <ShieldAlert className="w-8 h-8 text-destructive-foreground" />
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tighter">Auditoría Regional</h1>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h2 className="text-xl font-black uppercase tracking-tight">Semáforo Rojo (Inactividad {'>'}30 días)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {report?.inactiveUsers.map((u) => (
            <Card key={u.id} className="border-l-8 border-l-red-500 shadow-neo-sm">
              <CardContent className="p-4 flex justify-between items-center">
                <div className="space-y-1">
                  <div className="font-black uppercase text-sm">{u.name}</div>
                  <div className="text-[10px] text-muted-foreground font-bold uppercase">Inactivo</div>
                </div>
                <Button
                   variant="destructive"
                   size="sm"
                   onClick={() => handleFreeze(u.id, "CONGELADO")}
                   className="h-8 text-[10px] font-black uppercase"
                >
                  Congelar
                </Button>
              </CardContent>
            </Card>
          ))}
          {report?.inactiveUsers.length === 0 && (
             <div className="col-span-full neo-card bg-muted/20 border-dashed border-2 shadow-none p-8 text-center text-muted-foreground font-bold uppercase text-xs">
                Todos los socios están activos.
             </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <UserCheck className="w-5 h-5 text-blue-500" />
          <h2 className="text-xl font-black uppercase tracking-tight">Cuentas Congeladas</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {report?.frozenUsers.map((u) => (
            <Card key={u.id} className="border-l-8 border-l-blue-500 shadow-neo-sm">
              <CardContent className="p-4 flex justify-between items-center">
                <div className="space-y-1">
                  <div className="font-black uppercase text-sm">{u.name}</div>
                  <div className="text-[10px] text-muted-foreground font-bold uppercase">Congelado</div>
                </div>
                <Button
                   variant="secondary"
                   size="sm"
                   onClick={() => handleFreeze(u.id, "ACTIVO")}
                   className="h-8 text-[10px] font-black uppercase bg-blue-100 text-blue-700 hover:bg-blue-200"
                >
                  Reactivar
                </Button>
              </CardContent>
            </Card>
          ))}
          {report?.frozenUsers.length === 0 && (
             <div className="col-span-full neo-card bg-muted/20 border-dashed border-2 shadow-none p-8 text-center text-muted-foreground font-bold uppercase text-xs">
                No hay cuentas congeladas.
             </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Flame className="w-5 h-5 text-secondary" />
            <h2 className="text-xl font-black uppercase tracking-tight">Top Duplicadores</h2>
          </div>
          <Card className="overflow-hidden border-2 border-border shadow-neo">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-b-2 border-border">
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Socio</TableHead>
                  <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Acumulado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report?.topDuplicators.map((u) => (
                  <TableRow key={u.id} className="border-b-2 border-border/10">
                    <TableCell className="font-bold py-4">
                      <div className="text-sm uppercase tracking-tight">{u.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{u.id}</div>
                    </TableCell>
                    <TableCell className="text-right font-black text-secondary text-lg tabular-nums">
                      {u.duplicatorBonus} Ŧ
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleFreeze(u.id, "CONGELADO")}
                      >
                        <UserMinus className="w-5 h-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <TrendingDown className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-black uppercase tracking-tight">Patrones de Concentración</h2>
          </div>
          <p className="text-xs text-muted-foreground font-bold uppercase px-2">
            Socios que minan y envían casi todo su saldo a un único receptor. Requiere revisión humana.
          </p>
          <div className="flex flex-col gap-4">
            {report?.concentrationPatterns.map((p: ConcentrationPatternRow) => (
              <Card key={p.id} className="border-l-8 border-l-accent shadow-neo-sm">
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="space-y-1">
                    <div className="font-black uppercase text-sm">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground font-bold">
                      Minado: <span className="text-accent">{Number(p.total_mined).toFixed(2)} Ŧ</span> → {" "}
                      {p.primary_receiver_name}
                    </div>
                    {p.last_activity && (
                      <div className="text-[10px] text-muted-foreground">
                        Última actividad: {new Date(p.last_activity).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => handleFreeze(p.id, "CONGELADO")} className="font-black uppercase text-[10px] h-8 shadow-neo-sm">
                    Congelar
                  </Button>
                </CardContent>
              </Card>
            ))}
            {report?.concentrationPatterns.length === 0 && (
              <div className="neo-card bg-muted/20 border-dashed border-2 shadow-none p-12 text-center text-muted-foreground font-bold uppercase text-xs tracking-widest">
                No se detectan patrones de concentración graves.
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Users className="w-5 h-5 text-purple-500" />
            <h2 className="text-xl font-black uppercase tracking-tight">Cuentas que no Venden</h2>
          </div>
          <p className="text-xs text-muted-foreground font-bold uppercase px-2">
            Tienen productos activos pero nunca han recibido un pago en Túmin.
          </p>
          <div className="flex flex-col gap-4">
            {report?.nonSellers.map((u: NonSellerRow) => (
              <Card key={u.id} className="border-l-8 border-l-purple-500 shadow-neo-sm">
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="space-y-1">
                    <div className="font-black uppercase text-sm">{u.name}</div>
                    <div className="text-[10px] text-muted-foreground font-bold">
                      {u.product_count} producto(s) · Minado: {Number(u.total_mined || 0).toFixed(2)} Ŧ
                    </div>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => handleFreeze(u.id, "CONGELADO")} className="font-black uppercase text-[10px] h-8 shadow-neo-sm">
                    Congelar
                  </Button>
                </CardContent>
              </Card>
            ))}
            {report?.nonSellers.length === 0 && (
              <div className="neo-card bg-muted/20 border-dashed border-2 shadow-none p-12 text-center text-muted-foreground font-bold uppercase text-xs tracking-widest">
                Todos los socios con productos han recibido pagos.
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Bot className="w-5 h-5 text-slate-500" />
            <h2 className="text-xl font-black uppercase tracking-tight">Posibles Bots</h2>
          </div>
          <p className="text-xs text-muted-foreground font-bold uppercase px-2">
            Muchos minados consecutivos sin interacción social (calificaciones ni comentarios).
          </p>
          <div className="flex flex-col gap-4">
            {report?.possibleBots.map((b: PossibleBotRow) => (
              <Card key={b.id} className="border-l-8 border-l-slate-500 shadow-neo-sm">
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="space-y-1">
                    <div className="font-black uppercase text-sm">{b.name}</div>
                    <div className="text-[10px] text-muted-foreground font-bold">
                      {b.mining_count} minados · Total: {Number(b.total_mined || 0).toFixed(2)} Ŧ
                    </div>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => handleFreeze(b.id, "CONGELADO")} className="font-black uppercase text-[10px] h-8 shadow-neo-sm">
                    Congelar
                  </Button>
                </CardContent>
              </Card>
            ))}
            {report?.possibleBots.length === 0 && (
              <div className="neo-card bg-muted/20 border-dashed border-2 shadow-none p-12 text-center text-muted-foreground font-bold uppercase text-xs tracking-widest">
                No se detectan patrones de bot.
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <Star className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-black uppercase tracking-tight">Calidad del Bazar</h2>
        </div>
        <Card className="overflow-hidden border-2 border-border shadow-neo">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b-2 border-border">
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Producto</TableHead>
                <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Socio</TableHead>
                <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Rating</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report?.productQuality.map((p) => (
                <TableRow key={p.productId} className="border-b-2 border-border/10">
                  <TableCell className="font-bold py-4">
                    <div className="text-sm uppercase tracking-tight">{p.productName}</div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-xs uppercase text-muted-foreground">
                    {p.sellerName}
                  </TableCell>
                  <TableCell className="text-right text-primary font-black text-lg">
                    {p.avgRating ? p.avgRating.toFixed(1) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeactivateProduct(p.productId, p.productName)}
                      disabled={deactivateProductMutation.isPending}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>

      <div className="pt-10">
        <Button
          variant="default"
          className="w-full h-16 text-xl"
          onClick={handleClaimReward}
          disabled={claimReward.isPending || rewardStatus?.status !== "READY_TO_CLAIM"}
        >
          {claimReward.isPending ? (
            <Loader2 className="animate-spin mr-2" />
          ) : (
            <CheckCircle className="mr-3 w-6 h-6" />
          )}
          {rewardStatus?.status === "CLAIMED"
            ? "Recompensa reclamada"
            : "Finalizar Auditoría Mensual (+30 Ŧ)"}
        </Button>
        <p className="text-[10px] text-muted-foreground text-center mt-3 font-bold uppercase tracking-widest">
          {rewardStatus?.status === "NEEDS_ACTIVITY" &&
            "Registra al menos una acción de coordinación este mes (congelar, verificar, aprobar anuncios, validar un par, etc.)."}
          {rewardStatus?.status === "NEEDS_PEER_VALIDATION" &&
            "Ya tienes actividad. Pide a otro coordinador que te valide en Coordinación → Pares."}
          {rewardStatus?.status === "READY_TO_CLAIM" &&
            "Listo: un par ya validó tu trabajo. Puedes reclamar 30 Ŧ."}
          {rewardStatus?.status === "CLAIMED" &&
            "Ya reclamaste la recompensa de este mes."}
          {!rewardStatus &&
            "Al validar, confirmas la revisión manual de los indicadores regionales."}
        </p>
      </div>
    </div>
  );
}
