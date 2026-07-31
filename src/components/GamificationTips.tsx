"use client";

import { Rocket, Zap, Users } from "lucide-react";
import { trpc } from "@/lib/trpc/react";
import { useStore } from "@/lib/store";
import { LIMITS } from "@/lib/limits";

export function GamificationTips() {
  const { setCurrentScreen } = useStore();
  const { data } = trpc.user.getGamificationState.useQuery();

  if (!data) return null;

  if (!data.productOk) {
    return (
      <button
        type="button"
        onClick={() => {
          setCurrentScreen("gestion-productos");
        }}
        className="flex items-start gap-3 w-full text-left bg-teal-50 dark:bg-teal-950/20 border-2 border-teal-200 dark:border-teal-800 rounded-xl p-3 hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors"
      >
        <Rocket className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-black uppercase text-teal-700 dark:text-teal-400">
            Tu siguiente paso
          </p>
          <p className="text-[10px] font-bold text-teal-600/80 dark:text-teal-500/80">
            Publica tu primer producto o servicio y gana{" "}
            <span className="font-black">{LIMITS.FIRST_PRODUCT_BONUS} Ŧ</span>. Activa minado y
            recibir pagos.
          </p>
        </div>
      </button>
    );
  }

  return (
    <>
      {data.duplicatorRemaining > 0 && (
        <div className="flex items-start gap-3 bg-orange-50/80 dark:bg-orange-950/15 border-2 border-orange-200/80 dark:border-orange-900/50 rounded-xl p-3">
          <Zap className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black uppercase text-orange-700 dark:text-orange-400">
              Bono Duplicador
            </p>
            <p className="text-[10px] font-bold text-orange-600/80 dark:text-orange-500/80">
              Tienes disponibles{" "}
              <span className="font-black">{data.duplicatorRemaining.toLocaleString("es-MX")} Ŧ</span>.
              El sistema te regala el 100% extra de tus próximas ventas.
            </p>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setCurrentScreen("mi-red")}
        className="flex items-start gap-3 w-full text-left bg-violet-50 dark:bg-violet-950/20 border-2 border-violet-200 dark:border-violet-800 rounded-xl p-3 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
      >
        <Users className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-black uppercase text-violet-700 dark:text-violet-400">
            ¿Sabías que…
          </p>
          <p className="text-[10px] font-bold text-violet-600/80 dark:text-violet-500/80">
            Si invitas a alguien, recibes el <span className="font-black">5%</span> de sus primeras 3
            ventas. ¡Haz crecer la red!
          </p>
        </div>
      </button>
    </>
  );
}
