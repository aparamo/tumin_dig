import React from "react";
import { Card } from "@/components/ui/card";
import { Smartphone, Monitor, CheckCircle2 } from "lucide-react";

export default function PrimerosPasosPage() {
  return (
    <article className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="space-y-4">
        <h1 className="text-4xl md:text-6xl font-black text-primary uppercase tracking-tighter leading-tight">
          3. Primeros Pasos
        </h1>
        <div className="h-2 w-24 bg-primary rounded-full" />
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Cómo acceder a la plataforma
        </h2>
        <p className="text-base leading-relaxed text-foreground/80 font-medium">
          El Túmin Digital es una <strong>Aplicación Web Progresiva (PWA)</strong>. No necesitas buscarla en la Play Store o App Store; funciona directamente desde tu navegador.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-4 border-2 border-primary/10">
            <Smartphone className="w-8 h-8 text-primary" />
            <h3 className="font-black uppercase text-sm tracking-tight">Android</h3>
            <ol className="text-sm space-y-2 text-foreground/70 list-decimal pl-4">
              <li>Abre el enlace en Chrome.</li>
              <li>Toca los tres puntos (⋮).</li>
              <li>Selecciona &quot;Agregar a pantalla principal&quot;.</li>
            </ol>
          </Card>
          <Card className="p-6 space-y-4 border-2 border-primary/10">
            <Smartphone className="w-8 h-8 text-primary" />
            <h3 className="font-black uppercase text-sm tracking-tight">iPhone</h3>
            <ol className="text-sm space-y-2 text-foreground/70 list-decimal pl-4">
              <li>Abre el enlace en <strong>Safari</strong>.</li>
              <li>Toca el botón &quot;Compartir&quot; (⎋).</li>
              <li>Selecciona &quot;Agregar al inicio&quot;.</li>
            </ol>
          </Card>
          <Card className="p-6 space-y-4 border-2 border-primary/10">
            <Monitor className="w-8 h-8 text-primary" />
            <h3 className="font-black uppercase text-sm tracking-tight">Computadora</h3>
            <p className="text-sm text-foreground/70">Simplemente guarda la dirección en tus &quot;Favoritos&quot; o &quot;Marcadores&quot; para acceso rápido.</p>
          </Card>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Interfaz y Niveles
        </h2>
        <p className="text-base leading-relaxed text-foreground/80 font-medium">
          Diseñada bajo el principio de <strong>&quot;Abundancia Progresiva&quot;</strong>, la app te guía paso a paso conforme te integras a la comunidad.
        </p>
        <div className="space-y-4">
          <div className="flex gap-4 p-4 border rounded-xl bg-orange-500/5 border-orange-500/20">
            <div className="w-2 h-full bg-orange-500 rounded-full" />
            <div>
              <h4 className="font-black uppercase text-md tracking-widest text-orange-600 mb-1">Color Naranja</h4>
              <p className="text-sm text-foreground/70">Energía del comercio y el Bazar.</p>
            </div>
          </div>
          <div className="flex gap-4 p-4 border rounded-xl bg-green-500/5 border-green-500/20">
            <div className="w-2 h-full bg-green-500 rounded-full" />
            <div>
              <h4 className="font-black uppercase text-md tracking-widest text-green-600 mb-1">Color Verde</h4>
              <p className="text-sm text-foreground/70">Fluidez de los pagos y crecimiento de tu saldo.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6 pb-20">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Suscripción de Primera Venta
        </h2>
        <div className="bg-primary/20 text-primary-foreground p-8 rounded-2xl space-y-6">
          <div className="flex items-center gap-4">
            <CheckCircle2 className="w-10 h-10 shrink-0" />
            <h3 className="text-2xl font-black uppercase tracking-tighter">¡Activa tu Cuenta!</h3>
          </div>
          <p className="text-sm opacity-90 leading-relaxed font-medium">
            Para que la moneda tenga valor, todos debemos ser <strong>prosumidores</strong>. Tu cuenta se activará oficialmente cuando publiques tu primer producto o servicio en el Bazar.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="bg-background/10 p-4 rounded-lg">
              <span className="text-md font-black uppercase tracking-widest opacity-60">Paso 1</span>
              <p className="text-base font-bold mt-1">Publicar Producto</p>
            </div>
            <div className="bg-background/10 p-4 rounded-lg">
              <span className="text-md font-black uppercase tracking-widest opacity-60">Paso 2</span>
              <p className="text-base font-bold mt-1">Recibir Bono <strong>25 Ŧ</strong></p>
            </div>
            <div className="bg-background/10 p-4 rounded-lg">
              <span className="text-md font-black uppercase tracking-widest opacity-60">Paso 3</span>
              <p className="text-base font-bold mt-1">Desbloquear Minado</p>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
