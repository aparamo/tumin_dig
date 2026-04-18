"use client";

import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowUpRight, ArrowDownLeft } from "lucide-react";

export function Historial() {
  const { data: session } = useSession();
  const { data: history, isLoading } = trpc.wallet.getHistory.useQuery();

  if (!session?.user) return null;

  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-2xl font-bold text-slate-800">Historial Completo</h1>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
        ) : history && history.length > 0 ? (
          history.map((tx) => {
            const isIngreso = tx.toId === session.user.id;
            return (
              <Card key={tx.id} className="shadow-sm border-slate-100">
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isIngreso ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {isIngreso ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{tx.concept}</div>
                      <div className="text-[10px] text-slate-400">{new Date(tx.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className={`font-bold text-lg ${isIngreso ? "text-green-600" : "text-red-500"}`}>
                    {isIngreso ? "+" : "-"}{tx.amount} Ŧ
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-10 text-slate-400">No hay movimientos registrados.</div>
        )}
      </div>
    </div>
  );
}
