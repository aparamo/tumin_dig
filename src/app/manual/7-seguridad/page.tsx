import React from "react";
import { Card } from "@/components/ui/card";
import { ShieldAlert, Fingerprint, Eye } from "lucide-react";

export default function SeguridadPage() {
  return (
    <article className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="space-y-4">
        <h1 className="text-4xl md:text-6xl font-black text-primary uppercase tracking-tighter leading-tight">
          7. Seguridad y Auditoría
        </h1>
        <div className="h-2 w-24 bg-primary rounded-full" />
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Validación Descentralizada
        </h2>
        <p className="text-base leading-relaxed text-foreground/80 font-medium">
          No dependemos de una entidad central. La seguridad se construye a través de una red de confianza donde todos nos cuidamos.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-4 p-4 border rounded-xl bg-background/50">
            <Fingerprint className="w-6 h-6 text-primary shrink-0" />
            <div className="space-y-1">
              <h4 className="font-black uppercase text-md tracking-widest">Identidad por Cercanía</h4>
              <p className="text-sm text-foreground/70">Tu Bantúmin valida que seas una persona real con un producto tangible.</p>
            </div>
          </div>
          <div className="flex gap-4 p-4 border rounded-xl bg-background/50">
            <Eye className="w-6 h-6 text-primary shrink-0" />
            <div className="space-y-1">
              <h4 className="font-black uppercase text-md tracking-widest">Ledger Transparente</h4>
              <p className="text-sm text-foreground/70">El flujo de la moneda es rastreable por los coordinadores para evitar inflación artificial.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Algoritmos de Protección
        </h2>
        <p className="text-base leading-relaxed text-foreground/80 font-medium">
          El sistema cuenta con algoritmos que vigilan la salud de la red las 24 horas.
        </p>
        <div className="space-y-4">
          <Card className="p-6 border-l-4 border-l-destructive">
            <h4 className="font-black uppercase text-md tracking-widest text-destructive mb-2">Transacciones Circulares</h4>
            <p className="text-sm text-foreground/70">Detección de bucles de pago para evitar el &quot;lavado de bonos&quot; sin intercambio real.</p>
          </Card>
          <Card className="p-6 border-l-4 border-l-destructive">
            <h4 className="font-black uppercase text-md tracking-widest text-destructive mb-2">Cuentas Espejo</h4>
            <p className="text-sm text-foreground/70">Previene que una misma persona cree múltiples cuentas para cobrar bonos de bienvenida.</p>
          </Card>
        </div>
      </section>

      <section className="space-y-6 pb-20">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Auditoría y Semáforo
        </h2>
        <div className="bg-destructive/5 border border-destructive/20 p-8 rounded-2xl space-y-6">
          <div className="flex gap-4 items-center">
            <ShieldAlert className="w-8 h-8 text-destructive" />
            <h3 className="text-xl font-black uppercase tracking-tight text-destructive">Protocolo de Cuenta Congelada</h3>
          </div>
          <p className="text-sm text-foreground/70 leading-relaxed">
            Si se detecta inactividad por más de 30 días o irregularidades, la cuenta entra en pausa. No pierdes tus Túmin, pero debes contactar a tu Bantúmin para reactivarla.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-green-500/20 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full">Activo</span>
            <span className="px-3 py-1 bg-orange-500/20 text-orange-600 text-[10px] font-black uppercase tracking-widest rounded-full">En Revisión</span>
            <span className="px-3 py-1 bg-destructive/20 text-destructive text-[10px] font-black uppercase tracking-widest rounded-full">Congelado</span>
          </div>
        </div>
      </section>
    </article>
  );
}
