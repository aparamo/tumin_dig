import React from "react";
import { Card } from "@/components/ui/card";
import { Users, Home, MapPin, UserPlus, Briefcase, UserCheck, Megaphone, Globe } from "lucide-react";

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
          El <strong>Bantúmin</strong> es un coordinador de servicio, no un gerente. Su labor es facilitar la abundancia para todos en su región.
        </p>
        <div className="bg-primary/5 p-8 rounded-2xl border border-primary/10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 text-center">
              <UserPlus className="w-8 h-8 text-primary mx-auto" />
              <h5 className="font-black uppercase text-sm tracking-widest">Reconocimiento</h5>
              <p className="text-sm text-foreground/60 leading-relaxed">Otorga el badge &quot;Verificadx&quot; a socios reales que conoce en la comunidad.</p>
            </div>
            <div className="space-y-2 text-center">
              <MapPin className="w-8 h-8 text-primary mx-auto" />
              <h5 className="font-black uppercase text-sm tracking-widest">Soporte Regional</h5>
              <p className="text-sm text-foreground/60 leading-relaxed">Ayuda con dudas técnicas y gestión del Bazar en su región.</p>
            </div>
            <div className="space-y-2 text-center">
              <Users className="w-8 h-8 text-primary mx-auto" />
              <h5 className="font-black uppercase text-sm tracking-widest">Mediación</h5>
              <p className="text-sm text-foreground/60 leading-relaxed">Resuelve malentendidos basados en la ética de la red.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Roles en la Plataforma
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed font-medium">
          Existen tres niveles de acceso, cada uno con responsabilidades distintas y sin privilegios abusivos:
        </p>
        <div className="space-y-4">
          <div className="flex gap-4 p-5 border-2 border-primary/10 rounded-xl items-start bg-primary/5">
            <Users className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="font-black uppercase text-sm tracking-widest mb-1">Socix</h4>
              <p className="text-sm text-foreground/70">El rol base. Puede minar, comprar, vender, transferir Túmin y participar en la red.</p>
            </div>
          </div>
          <div className="flex gap-4 p-5 border-2 border-primary/10 rounded-xl items-start bg-primary/5">
            <UserCheck className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="font-black uppercase text-sm tracking-widest mb-1">Coordinador Local (Bantúmin)</h4>
              <p className="text-sm text-foreground/70">Gestiona su región: valida labores comunitarias, otorga badges de verificación a socios de su región, y aprueba o rechaza anuncios.</p>
            </div>
          </div>
          <div className="flex gap-4 p-5 border-2 border-primary/10 rounded-xl items-start bg-primary/5">
            <Globe className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="font-black uppercase text-sm tracking-widest mb-1">Coordinador General</h4>
              <p className="text-sm text-foreground/70">Alcance global: puede gestionar todas las regiones. Realiza auditorías del sistema, supervisa la salud de la red y tiene acceso a las herramientas de análisis avanzado.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Panel de Coordinación
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed font-medium">
          Los coordinadores acceden a un panel con tres pestañas de trabajo:
        </p>
        <div className="space-y-4">
          <div className="flex gap-4 p-5 border rounded-xl items-start bg-background/50">
            <Briefcase className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="font-black uppercase text-sm tracking-widest mb-1">Labores</h4>
              <p className="text-sm text-foreground/70">Revisa las solicitudes de trabajo comunitario pendientes de su región. Puede <strong>Aprobar</strong> (el sistema emite los Túmin correspondientes) o <strong>Rechazar</strong> cada labor registrada.</p>
            </div>
          </div>
          <div className="flex gap-4 p-5 border rounded-xl items-start bg-background/50">
            <UserCheck className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="font-black uppercase text-sm tracking-widest mb-1">Socios</h4>
              <p className="text-sm text-foreground/70">
                Lista de socios de la región que aún no tienen el badge de verificación. Al pulsar <strong>&quot;Validar Socio&quot;</strong> se otorga el badge <strong>&quot;Verificadx&quot;</strong> visible en su perfil público.
              </p>
              <p className="text-xs text-foreground/50 mt-1 italic">
                Este badge es un reconocimiento de confianza — no bloquea ni desbloquea funcionalidades de la app.
              </p>
            </div>
          </div>
          <div className="flex gap-4 p-5 border rounded-xl items-start bg-background/50">
            <Megaphone className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="font-black uppercase text-sm tracking-widest mb-1">Publicidad</h4>
              <p className="text-sm text-foreground/70">
                Revisa las solicitudes de anuncio gratuito enviadas por socios de su región. Puede aprobar o rechazar cada imagen antes de que aparezca en el banner del Dashboard.
              </p>
              <p className="text-xs text-foreground/50 mt-1 italic">
                La política general de publicidad — qué formas, frecuencia e integración se permiten — se sigue definiendo de forma consensuada con la comunidad.
              </p>
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
            <Home className="w-8 h-8" />
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
