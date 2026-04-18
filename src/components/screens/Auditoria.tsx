"use client";

import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ShieldAlert, UserMinus, Trash2, CheckCircle } from "lucide-react";

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

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-slate-400" /></div>;

  return (
    <div className="flex flex-col gap-8 p-4 pb-12">
      <h1 className="text-2xl font-bold text-red-700 flex items-center gap-2">
        <ShieldAlert className="w-6 h-6" /> Auditoría Regional
      </h1>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-orange-600">🔥 Top 10 Bonos Duplicadores</h2>
        <Card className="shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Socio</TableHead>
                <TableHead className="text-right">Acumulado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report?.topDuplicators.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium text-xs">{u.name}<br/><span className="text-[10px] text-slate-400">{u.id}</span></TableCell>
                  <TableCell className="text-right font-bold text-orange-500">{u.duplicatorBonus} Ŧ</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => freezeMutation.mutate({ userId: u.id, status: "CONGELADO" })}>
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-purple-600">🦠 Cuentas de Solo Minado</h2>
        <div className="space-y-3">
          {report?.parasites.map((p: any) => (
            <Card key={p.id} className="border-l-4 border-l-purple-400">
              <CardContent className="p-4 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold">{p.name} ({p.id})</div>
                  <div className="text-purple-600">Minado: {p.total_mined} Ŧ → Envía todo a: {p.primary_receiver_name}</div>
                </div>
                <Button variant="destructive" size="sm" onClick={() => freezeMutation.mutate({ userId: p.id, status: "CONGELADO" })}>
                  Congelar
                </Button>
              </CardContent>
            </Card>
          ))}
          {report?.parasites.length === 0 && <p className="text-sm text-slate-400 text-center py-4 italic">No se detectan anomalías.</p>}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-blue-600">🛍️ Control de Calidad Bazar</h2>
        <Card className="shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">⭐</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report?.productQuality.map((p) => (
                <TableRow key={p.productId}>
                  <TableCell className="text-xs">
                    <div className="font-bold">{p.productName}</div>
                    <div className="text-[10px] text-slate-400">Socio: {p.sellerName}</div>
                  </TableCell>
                  <TableCell className="text-right text-yellow-500 font-bold">
                    {p.avgRating ? p.avgRating.toFixed(1) : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-slate-400">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>

      <div className="pt-6 border-t">
        <Button 
          className="w-full h-14 bg-green-600 hover:bg-green-700 text-lg font-bold shadow-lg"
          onClick={() => claimReward.mutate()}
          disabled={claimReward.isPending}
        >
          {claimReward.isPending ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2 w-5 h-5" />}
          Validar Auditoría (Cobrar 30 Ŧ)
        </Button>
        <p className="text-[10px] text-slate-400 text-center mt-2 italic">
          Confirmo que he revisado las anomalías de este mes en mi región.
        </p>
      </div>
    </div>
  );
}
