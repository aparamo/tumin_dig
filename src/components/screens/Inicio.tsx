"use client";

import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Pickaxe, RefreshCw, ArrowUpRight, ArrowDownLeft, Send, ShoppingBag, BookOpen, ShieldCheck, ShieldAlert, UserCog, Search, AlertCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useFeedback } from "@/components/FeedbackProvider";
import { parseErrorMessage } from "@/lib/parse-error";

export function Inicio() {
  const { setCurrentScreen } = useStore();
  const router = useRouter();
  const { data: session } = useSession();
  const { notifySuccess, notifyError } = useFeedback();
  const utils = trpc.useUtils();

  const isCoordinator = session?.user?.role === "COORDINADOR" || session?.user?.role === "COORDINADOR_LOCAL" || session?.user?.role === "COORDINADOR_GENERAL";
  
  const { data: balanceData, isLoading: isLoadingBalance, refetch: refetchBalance } = trpc.wallet.getBalance.useQuery();
  const { data: historyData, isLoading: isLoadingHistory } = trpc.wallet.getHistory.useQuery();
  const { data: activeAds } = trpc.ads.getActiveAds.useQuery();
  const { data: rewardStatus } = trpc.audit.getAuditRewardStatus.useQuery(undefined, {
    enabled: isCoordinator,
  });

  const showAuditBanner =
    rewardStatus?.status === "NEEDS_ACTIVITY" ||
    rewardStatus?.status === "NEEDS_PEER_VALIDATION" ||
    rewardStatus?.status === "READY_TO_CLAIM";

  const auditBanner =
    rewardStatus?.status === "NEEDS_ACTIVITY"
      ? {
          title: "Auditoría mensual: registra actividad",
          body: "Realiza al menos una acción de coordinación este mes para poder reclamar tu recompensa.",
          href: "/coordinacion",
        }
      : rewardStatus?.status === "NEEDS_PEER_VALIDATION"
        ? {
            title: "Auditoría mensual: falta validación de un par",
            body: "Ya tienes actividad. Pide a otro coordinador que te valide en Coordinación → Pares.",
            href: "/coordinacion",
          }
        : {
            title: "Puedes reclamar tu recompensa de 30 Ŧ",
            body: "Un par ya validó tu trabajo. Finaliza la auditoría mensual en Auditoría.",
            href: "/auditoria",
          };

  const claimMining = trpc.mining.claimMining.useMutation({
    onSuccess: (data) => {
      notifySuccess(`¡Felicidades! Ganaste ${data.reward} Ŧ — Racha: ${data.streak} días.`);
      utils.wallet.getBalance.invalidate();
      utils.wallet.getHistory.invalidate();
    },
    onError: (error) => {
      notifyError(parseErrorMessage(error));
    },
  });

  const handleMining = () => {
    if (claimMining.isPending) return;
    claimMining.mutate();
  };

  return (
    <div className="grid md:grid-cols-12 gap-8 pb-10">
      {activeAds && activeAds.length > 0 && (
        <div className="md:col-span-12">
          <div className="relative w-full aspect-21/9 md:aspect-32/9 rounded-2xl overflow-hidden border-4 border-border shadow-neo-sm group">
            <Image 
              src={activeAds[0].imageUrl} 
              alt="Anuncio Comunitario" 
              fill 
              className="object-cover transition-transform group-hover:scale-105 duration-700" 
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent flex items-end p-6">
              <div className="text-white">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-80">Mes de anuncio gratis</div>
                <div className="text-xl font-black uppercase">¡Descubre algo nuevo hoy!</div>
              </div>
            </div>
            <Button 
              variant="secondary" 
              size="sm"
              className="absolute top-4 right-4 h-8 text-[10px] font-black uppercase shadow-neo-sm"
              onClick={() => setCurrentScreen("bazar")}
            >
              Ver Bazar
            </Button>
          </div>
        </div>
      )}

      {/* Left Column: Balance & Quick Actions */}
      <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-8">
        <Card className="bg-primary/10 border-primary shadow-neo">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-bold uppercase tracking-wider text-center border-none shadow-none bg-transparent p-0">Saldo Disponible</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="text-6xl font-black text-foreground mb-4 tabular-nums">
              {isLoadingBalance ? <Loader2 className="animate-spin inline" /> : `${balanceData?.balance ?? 0} Ŧ`}
            </div>
            <div className="mb-6">
              {session?.user?.isVerified && (
                <Badge className="bg-green-100 text-green-700 border-green-200 font-black uppercase text-[10px]">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Socio verificado
                </Badge>
              )}
            </div>
            <div className="flex flex-col gap-4 w-full">
              <Button 
                variant="outline" 
                onClick={() => refetchBalance()}
                className="w-full h-12"
              >
                <RefreshCw className="w-5 h-5 mr-2" /> Actualizar
              </Button>
              <Button 
                variant="secondary"
                className="w-full h-12"
                onClick={handleMining}
                disabled={claimMining.isPending}
              >
                <Pickaxe className="w-5 h-5 mr-2" /> {claimMining.isPending ? "Minando..." : "Minar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="default"
            onClick={() => setCurrentScreen("pagar")}
            className="bg-accent text-accent-foreground h-28 flex flex-col gap-2 shadow-neo"
          >
            <Send className="w-8 h-8" />
            <span className="uppercase text-xs font-black">Enviar</span>
          </Button>
          <Button 
            variant="secondary"
            onClick={() => setCurrentScreen("bazar")}
            className="h-28 flex flex-col gap-2 shadow-neo"
          >
            <ShoppingBag className="w-8 h-8" />
            <span className="uppercase text-xs font-black">Bazar</span>
          </Button>
        </div>

        {/* Estado e información importante */}
        <div className="flex flex-col gap-3">
          {!session?.user?.isVerified && (
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black uppercase text-amber-700">Identidad pendiente de validar</p>
                <p className="text-[10px] font-bold text-amber-600/80">Máx. transferencia: 100 Ŧ hasta ser verificado.</p>
              </div>
            </div>
          )}
          {isCoordinator && showAuditBanner && (
            <Link href={auditBanner.href} className="block">
              <div className="flex items-start gap-3 bg-orange-50 dark:bg-orange-950/20 border-2 border-orange-200 dark:border-orange-800 rounded-xl p-3 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
                <ShieldAlert className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-black uppercase text-orange-700">{auditBanner.title}</p>
                  <p className="text-[10px] font-bold text-orange-600/80">{auditBanner.body}</p>
                </div>
              </div>
            </Link>
          )}
        </div>

        <Link href="/manual" className="w-full">
          <Button variant="outline" className="w-full h-16 border-2 border-border shadow-neo-sm flex gap-3 uppercase font-black">
            <BookOpen className="w-6 h-6 text-primary" />
            Guía y Manual Digital
          </Button>
        </Link>

        {isCoordinator && (
          <div className="flex flex-col gap-4 mt-4">
            <h3 className="text-lg font-black uppercase tracking-tight px-2">Panel de Coordinación</h3>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => router.push("/coordinacion")}
                className="h-20 flex flex-col gap-1 border-2 border-primary/20 hover:border-primary shadow-neo-sm"
              >
                <ShieldCheck className="w-6 h-6 text-primary" />
                <span className="text-[10px] font-black uppercase">Validar</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/gestion-socios")}
                className="h-20 flex flex-col gap-1 border-2 border-purple-500/20 hover:border-purple-500 shadow-neo-sm"
              >
                <UserCog className="w-6 h-6 text-purple-500" />
                <span className="text-[10px] font-black uppercase">Roles</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/auditoria")}
                className="h-20 flex flex-col gap-1 border-2 border-red-500/20 hover:border-red-500 shadow-neo-sm"
              >
                <Search className="w-6 h-6 text-red-500" />
                <span className="text-[10px] font-black uppercase">Auditoría</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Transactions */}
      <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-2xl font-black uppercase tracking-tight">Últimos Movimientos</h2>
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
            historyData.slice(0, 6).map((item) => (
              <StaggerItem key={item.id}>
                <div className="neo-card bg-card p-4 flex justify-between items-center group hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-lg border-2 border-border flex items-center justify-center shadow-neo-sm",
                      !item.isIngreso ? "bg-red-100 dark:bg-red-900/30" : "bg-green-100 dark:bg-green-900/30"
                    )}>
                      {!item.isIngreso ? 
                        <ArrowUpRight className="w-6 h-6 text-red-600" /> : 
                        <ArrowDownLeft className="w-6 h-6 text-green-600" />
                      }
                    </div>
                    <div>
                      <div className="font-black text-foreground text-lg line-clamp-1 uppercase tracking-tight">
                        {item.concept}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                        {new Date(item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <div className={cn(
                    "font-black text-2xl tabular-nums tracking-tighter",
                    !item.isIngreso ? "text-red-500" : "text-primary"
                  )}>
                    {!item.isIngreso ? "-" : "+"}{item.amount} Ŧ
                  </div>
                </div>
              </StaggerItem>
            ))
          ) : (
            <Card className="bg-muted/20 border-dashed border-2 shadow-none p-12 text-center text-muted-foreground font-bold uppercase text-sm">
              Sin movimientos recientes
            </Card>
          )}
        </StaggerContainer>
      </div>
    </div>
  );
}
