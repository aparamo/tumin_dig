"use client";

import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Pickaxe, RefreshCw, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useStore } from "@/lib/store";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion";

export function Inicio() {
  const { setCurrentScreen } = useStore();
  const utils = trpc.useUtils();
  
  const { data: balanceData, isLoading: isLoadingBalance, refetch: refetchBalance } = trpc.wallet.getBalance.useQuery();
  const { data: historyData, isLoading: isLoadingHistory } = trpc.wallet.getHistory.useQuery();
  
  const claimMining = trpc.mining.claimMining.useMutation({
    onSuccess: (data) => {
      alert(`¡Felicidades! Ganaste ${data.reward} Ŧ\nRacha: ${data.streak} días.`);
      utils.wallet.getBalance.invalidate();
      utils.wallet.getHistory.invalidate();
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  return (
    <div className="flex flex-col gap-8 pb-4">
      <Card className="bg-primary/10 border-primary shadow-neo">
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm font-bold uppercase tracking-wider text-center border-none shadow-none bg-transparent p-0">Saldo Disponible</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="text-6xl font-black text-foreground mb-8 tabular-nums">
            {isLoadingBalance ? <Loader2 className="animate-spin inline" /> : `${balanceData?.balance ?? 0} Ŧ`}
          </div>
          <div className="flex justify-center gap-4 w-full">
            <Button 
              variant="outline" 
              onClick={() => refetchBalance()}
              className="flex-1 h-12"
            >
              <RefreshCw className="w-5 h-5 mr-2" /> Actualizar
            </Button>
            <Button 
              variant="secondary"
              className="flex-1 h-12"
              onClick={() => claimMining.mutate()}
              disabled={claimMining.isPending}
            >
              <Pickaxe className="w-5 h-5 mr-2" /> {claimMining.isPending ? "Minando..." : "Minar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-black uppercase tracking-tight">Últimos Movimientos</h2>
          <Button 
            variant="link" 
            className="text-primary font-bold p-0 h-auto uppercase text-xs" 
            onClick={() => setCurrentScreen("historial")}
          >
            Ver todos
          </Button>
        </div>
        
        <StaggerContainer>
          {isLoadingHistory ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin text-primary w-8 h-8" />
            </div>
          ) : historyData && historyData.length > 0 ? (
            historyData.slice(0, 3).map((item, idx) => (
              <StaggerItem key={item.id}>
                <div className="neo-card bg-card p-4 flex justify-between items-center group hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-lg border-2 border-border flex items-center justify-center shadow-neo-sm",
                      item.type === "TRANSFERENCIA" ? "bg-red-100 dark:bg-red-900/30" : "bg-green-100 dark:bg-green-900/30"
                    )}>
                      {item.type === "TRANSFERENCIA" ? 
                        <ArrowUpRight className="w-6 h-6 text-red-600" /> : 
                        <ArrowDownLeft className="w-6 h-6 text-green-600" />
                      }
                    </div>
                    <div>
                      <div className="font-bold text-foreground text-lg line-clamp-1">
                        {item.concept}
                      </div>
                      <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                        {new Date(item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  </div>
                  <div className={cn(
                    "font-black text-xl tabular-nums",
                    item.type === "TRANSFERENCIA" ? "text-red-500" : "text-green-600"
                  )}>
                    {item.type === "TRANSFERENCIA" ? "-" : "+"}{item.amount} Ŧ
                  </div>
                </div>
              </StaggerItem>
            ))
          ) : (
            <Card className="bg-muted/20 border-dashed border-2 shadow-none p-10 text-center text-muted-foreground font-bold uppercase text-sm">
              Sin movimientos recientes
            </Card>
          )}
        </StaggerContainer>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Button 
          variant="default"
          onClick={() => setCurrentScreen("pagar")}
          className="bg-accent text-accent-foreground h-24 flex flex-col gap-2"
        >
          <Send className="w-8 h-8" />
          <span className="uppercase text-xs font-black">Enviar Túmin</span>
        </Button>
        <Button 
          variant="secondary"
          onClick={() => setCurrentScreen("bazar")}
          className="h-24 flex flex-col gap-2"
        >
          <ShoppingBag className="w-8 h-8" />
          <span className="uppercase text-xs font-black">Bazar Túmin</span>
        </Button>
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";
import { Send, ShoppingBag } from "lucide-react";
