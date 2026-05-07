import React from "react";
import { Card } from "@/components/ui/card";
import { Users, Home, MapPin, UserPlus } from "lucide-react";

export default function GobernanzaPage() {
  return (
    <article className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="space-y-4">
        <h1 className="text-4xl md:text-6xl font-black text-primary uppercase tracking-tighter leading-tight">
          6. Gobernanza y Rol del Coordinador
        </h1>
        <div className="h-2 w-24 bg-primary rounded-full" />
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Organización Autónoma Regional
        </h2>
        <p className="text-base leading-relaxed text-foreground/80 font-medium">
          En el Túmin Digital no existen jerarquías autoritarias. Somos una <strong>red de nodos autónomos</strong> donde cada comunidad se gestiona a sí misma.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 bg-background/50 border-2 border-primary/10">
            <h4 className="font-black uppercase text-md tracking-widest text-primary mb-2">Sin Jefes</h4>
            <p className="text-sm text-foreground/70">Las decisiones se toman por consenso entre vecinos y compañeros.</p>
          </Card>
          <Card className="p-6 bg-background/50 border-2 border-primary/10">
            <h4 className="font-black uppercase text-md tracking-widest text-primary mb-2">Autonomía</h4>
            <p className="text-sm text-foreground/70">Tu comunidad decide cómo organizar sus propios bazares y ferias.</p>
          </Card>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          ¿Qué es un Bantúmin?
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed font-medium">
          El <strong>Bantúmin</strong> es un coordinador de servicio, no un gerente. Su labor es facilitar la abundancia para todos.
        </p>
        <div className="bg-primary/5 p-8 rounded-2xl border border-primary/10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 text-center">
              <UserPlus className="w-8 h-8 text-primary mx-auto" />
              <h5 className="font-black uppercase text-sm tracking-widest">Activación</h5>
              <p className="text-sm text-foreground/60 leading-relaxed">Valida a nuevos socios reales y honestos.</p>
            </div>
            <div className="space-y-2 text-center">
              <MapPin className="w-8 h-8 text-primary mx-auto" />
              <h5 className="font-black uppercase text-sm tracking-widest">Soporte Regional</h5>
              <p className="text-sm text-foreground/60 leading-relaxed">Ayuda con dudas técnicas y gestión del Bazar.</p>
            </div>
            <div className="space-y-2 text-center">
              <Users className="w-8 h-8 text-primary mx-auto" />
              <h5 className="font-black uppercase text-sm tracking-widest">Mediación</h5>
              <p className="text-sm text-foreground/60 leading-relaxed">Resuelve malentendidos basados en la ética de la red.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6 pb-20">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Las Casas del Túmin
        </h2>
        <div className="bg-primary text-primary-foreground p-8 rounded-2xl space-y-6">
          <div className="flex gap-4 items-center">
            <Home className="w-8 h-8 text-primary" />
            <h3 className="text-2xl font-black uppercase tracking-tighter">Puntos de Encuentro</h3>
          </div>
          <p className="text-sm opacity-80 leading-relaxed font-medium">
            Son espacios físicos (negocios de socios) donde lo digital se vuelve abrazo y comercio real.
          </p>
          <ul className="space-y-2 text-sm font-bold uppercase tracking-widest opacity-70">
            <li>● Centros de formación y talleres</li>
            <li>● Puntos de entrega y bazar permanente</li>
            <li>● Sede operativa del Bantúmin regional</li>
          </ul>
        </div>
      </section>
    </article>
  );
}
