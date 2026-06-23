import React from "react";
import { Card } from "@/components/ui/card";

export default function ReglasPage() {
  return (
    <article className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="space-y-4">
        <h1 className="text-4xl md:text-6xl font-black text-primary uppercase tracking-tighter leading-tight">
          2. Reglas de Oro de la Comunidad
        </h1>
        <div className="h-2 w-24 bg-primary rounded-full" />
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          El Respaldo Real: Dinero con Pies en la Tierra
        </h2>
        <p className="text-base leading-relaxed text-foreground/80 font-medium">
          A diferencia del dinero tradicional respaldado por deuda, el Túmin está respaldado por la <strong>realidad tangible</strong> de los bienes y servicios que intercambiamos.
        </p>
        <div className="bg-primary/5 p-8 rounded-2xl border border-primary/10 space-y-4">
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <li className="space-y-2">
              <h4 className="font-black uppercase text-md tracking-widest text-primary">A prueba de crisis</h4>
              <p className="text-sm text-foreground/70">Mientras haya personas produciendo comida, ropa y servicios, el Túmin mantendrá su valor.</p>
            </li>
            <li className="space-y-2">
              <h4 className="font-black uppercase text-md tracking-widest text-primary">No se inventa</h4>
              <p className="text-sm text-foreground/70">Nadie puede imprimir &quot;tomates&quot; o &quot;clases de música&quot;. La moneda refleja el trabajo real de la comunidad.</p>
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          La Regla del 10%: El Piso de Aceptación
        </h2>
        <p className="text-base leading-relaxed text-foreground/80 font-medium">
          Es el engranaje principal que permite que el Túmin circule sin descapitalizar a los productores.
        </p>
        <div className="bg-primary/20 text-primary-foreground p-8 rounded-2xl space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left space-y-1">
              <span className="text-4xl font-black">90% PESOS</span>
              <p className="text-sm uppercase font-bold opacity-60 tracking-widest">Para insumos y gastos externos</p>
            </div>
            <span className="text-2xl font-black opacity-20">+</span>
            <div className="text-center md:text-left space-y-1 text-primary">
              <span className="text-4xl font-black">10% TÚMIN</span>
              <p className="text-sm uppercase font-bold opacity-60 tracking-widest">Aceptación mínima necesaria</p>
            </div>
          </div>
          <p className="text-sm opacity-70 text-center font-bold uppercase tracking-widest italic">
            &quot;El 10% es el piso, no el techo. Siempre puedes aceptar más si tu economía lo permite.&quot;
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Acuerdos Flexibles: Diálogo y Libertad
        </h2>
        <p className="text-base leading-relaxed text-foreground/80 font-medium">
          Como compañeras y compañeros, tenemos la libertad de negociar pagos de hasta el 100% en Túmin según nuestras necesidades.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-background/50">
            <h4 className="font-black uppercase text-md tracking-widest text-primary mb-2">Servicios</h4>
            <p className="text-sm text-foreground/70">Ideal para cobrar 100% Túmin ya que tu principal inversión es tu tiempo.</p>
          </Card>
          <Card className="p-4 bg-background/50">
            <h4 className="font-black uppercase text-md tracking-widest text-primary mb-2">Segunda Mano</h4>
            <p className="text-sm text-foreground/70">Artículos que ya no usas pueden capitalizarse totalmente en la red.</p>
          </Card>
          <Card className="p-4 bg-background/50">
            <h4 className="font-black uppercase text-md tracking-widest text-primary mb-2">Excedentes</h4>
            <p className="text-sm text-foreground/70">Fruta de temporada o excedentes de producción son perfectos para la red.</p>
          </Card>
        </div>
      </section>

      <section className="space-y-6 pb-20">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Participación Activa: El &quot;Prosumidor&quot;
        </h2>
        <p className="text-base leading-relaxed text-foreground/80 font-medium">
          En el Túmin no existen consumidores puros. Todos somos productores y consumidores a la vez.
        </p>
        <div className="bg-destructive/5 border border-destructive/20 p-6 rounded-xl">
          <h4 className="font-black uppercase text-sm tracking-tight text-destructive mb-2">Regla de Activación Digital</h4>
          <p className="text-sm text-foreground/70 leading-relaxed">
            No podrás minar Túmin diario, <strong>recibir transferencias de otros socios</strong> ni cobrar bonos de venta hasta que tengas al menos un producto o servicio con estado <strong>Activo</strong> en el Bazar. Esta regla protege la mesa compartida de nuestra comunidad: todos quienes participan en el intercambio deben ofrecer algo a la red.
          </p>
        </div>
      </section>
    </article>
  );
}
