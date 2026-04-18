"use client";

import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ShieldAlert, UserMinus, Trash2, CheckCircle, Flame, Bug, Star } from "lucide-react";

export function Auditoria() {
  const utils = trpc.useUtils();
  const { data: report, isLoading } = trpc.audit.getAuditReport.useQuery();

  const freezeMutation = trpc.audit.freezeUser.useMutation({
    onSuccess: () => {
      alert("Usuario congelado correctamente.");
      utils.audit.getAuditReport.invalidate();
    },
  });

  const claimReward = trpc.audit.claimAuditReward.useMutation({
    onSuccess: () => {
      alert("¡Felicidades! Has recibido 30 Ŧ por tu labor de auditoría.");
      utils.wallet.getBalance.invalidate();
    },
    onError: (error) => alert(error.message),
  });

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary w-12 h-12" /></div>;

  return (
    <div className="flex flex-col gap-8 p-4 pb-20 max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <div className="bg-destructive p-3 rounded-xl border-2 border-border shadow-neo-sm">
          <ShieldAlert className="w-8 h-8 text-destructive-foreground" />
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tighter">Auditoría Regional</h1>
      </div>

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
                        onClick={() => freezeMutation.mutate({ userId: u.id, status: "CONGELADO" })}
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
            <Bug className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-black uppercase tracking-tight">Anomalías Detectadas</h2>
          </div>
          <div className="flex flex-col gap-4">
            {report?.parasites.map((p: any) => (
              <Card key={p.id} className="border-l-8 border-l-accent shadow-neo-sm">
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="space-y-1">
                    <div className="font-black uppercase text-sm">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground font-bold">
                      Minado: <span className="text-accent">{p.total_mined} Ŧ</span> → Receptor: {p.primary_receiver_name}
                    </div>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => freezeMutation.mutate({ userId: p.id, status: "CONGELADO" })} className="font-black uppercase text-[10px] h-8 shadow-neo-sm">
                    Congelar
                  </Button>
                </CardContent>
              </Card>
            ))}
            {report?.parasites.length === 0 && (
              <div className="neo-card bg-muted/20 border-dashed border-2 shadow-none p-12 text-center text-muted-foreground font-bold uppercase text-xs tracking-widest">
                No se detectan anomalías graves.
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
                    <Button variant="ghost" size="icon" className="text-muted-foreground">
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
          onClick={() => claimReward.mutate()}
          disabled={claimReward.isPending}
        >
          {claimReward.isPending ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-3 w-6 h-6" />}
          Finalizar Auditoría Mensual (+30 Ŧ)
        </Button>
        <p className="text-[10px] text-muted-foreground text-center mt-3 font-bold uppercase tracking-widest">
          Al validar, confirmas la revisión manual de los indicadores regionales.
        </p>
      </div>
    </div>
  );
}
