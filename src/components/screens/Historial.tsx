"use client";

import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion";
import { cn } from "@/lib/utils";

export function Historial() {
  const { data: session } = useSession();
  const { data: history, isLoading } = trpc.wallet.getHistory.useQuery();

  if (!session?.user) return null;

  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-3xl font-black uppercase tracking-tighter">Historial</h1>

      <StaggerContainer>
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
        ) : history && history.length > 0 ? (
          history.map((tx) => {
            const isIngreso = tx.toId === session.user.id;
            return (
              <StaggerItem key={tx.id}>
                <Card>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-3 rounded-lg border-2 border-border shadow-neo-sm",
                        isIngreso ? "bg-secondary text-secondary-foreground" : "bg-destructive/10 text-destructive"
                      )}>
                        {isIngreso ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="font-black text-foreground text-lg uppercase tracking-tight line-clamp-1">{tx.concept}</div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                          {new Date(tx.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className={cn(
                      "font-black text-xl tabular-nums",
                      isIngreso ? "text-primary" : "text-destructive"
                    )}>
                      {isIngreso ? "+" : "-"}{tx.amount} Ŧ
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            );
          })
        ) : (
          <div className="neo-card bg-muted/20 border-dashed border-2 shadow-none p-12 text-center text-muted-foreground font-bold uppercase text-sm tracking-widest">
            No hay movimientos registrados.
          </div>
        )}
      </StaggerContainer>
    </div>
  );
}
