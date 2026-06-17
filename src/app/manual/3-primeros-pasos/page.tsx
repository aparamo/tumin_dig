import React from "react";
import { Card } from "@/components/ui/card";
import { Smartphone, Monitor, CheckCircle2, ShieldCheck, Eye, UserCheck } from "lucide-react";

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
          Activación de tu cuenta
        </h2>
        <p className="text-base leading-relaxed text-foreground/80 font-medium">
          Para que la moneda tenga valor, todos debemos ser <strong>prosumidores</strong>. Tu cuenta se activa oficialmente cuando publicas tu primer producto o servicio en el Bazar desde la sección <strong>Mis Productos</strong>.
        </p>
        <div className="bg-primary/20 text-primary-foreground p-8 rounded-2xl space-y-6">
          <div className="flex items-center gap-4">
            <CheckCircle2 className="w-10 h-10 shrink-0" />
            <h3 className="text-2xl font-black uppercase tracking-tighter">¡Activa tu Cuenta!</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            <div className="bg-background/10 p-4 rounded-lg">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Paso 1</span>
              <p className="text-sm font-bold mt-1">Regístrate</p>
            </div>
            <div className="bg-background/10 p-4 rounded-lg">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Paso 2</span>
              <p className="text-sm font-bold mt-1">Ve a <strong>Mis Productos</strong></p>
            </div>
            <div className="bg-background/10 p-4 rounded-lg">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Paso 3</span>
              <p className="text-sm font-bold mt-1">Publica tu primer producto</p>
            </div>
            <div className="bg-background/10 p-4 rounded-lg">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Paso 4</span>
              <p className="text-sm font-bold mt-1">Recibe <strong>30 Ŧ</strong> y desbloquea el minado</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Al registrarte
        </h2>
        <p className="text-base leading-relaxed text-foreground/80 font-medium">
          El formulario de registro tiene <strong>dos bloques</strong> que no deben confundirse:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5 space-y-2 border-2 border-primary/10">
            <h4 className="font-black uppercase text-sm tracking-widest text-primary">Inscripción comunitaria</h4>
            <p className="text-sm text-foreground/70 leading-relaxed">
              Indica en qué <strong>región comunitaria</strong> te inscribiste (Totonacapan, Tolteca, Chiapas, Oaxaca, Náhuatl, Huaxteca, Tenoxca) o describe tu proceso si eliges <strong>&quot;Otra región o proceso distinto&quot;</strong>. Esto ayuda a tu Bantúmin a verificarte. <strong>No tiene que coincidir con donde vives.</strong>
            </p>
          </Card>
          <Card className="p-5 space-y-2 border-2 border-primary/10">
            <h4 className="font-black uppercase text-sm tracking-widest text-primary">Dónde vives actualmente</h4>
            <p className="text-sm text-foreground/70 leading-relaxed">
              Puedes elegir <strong>cualquier estado de México</strong> o indicar si vives en otro país. Solo sirve para el Bazar y tu perfil público; <strong>no limita</strong> tu participación en la red.
            </p>
          </Card>
        </div>
        <p className="text-sm text-foreground/60 italic pl-2">
          Después del registro puedes actualizar tu ubicación en <strong>Perfil → Inscripción y ubicación</strong>. La región de inscripción queda fija para coordinación.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          El badge de Socix Verificadx
        </h2>
        <p className="text-base leading-relaxed text-foreground/80 font-medium">
          Tu Bantúmin local puede otorgarte el reconocimiento de <strong>Socix Verificadx</strong> una vez que confirme tu identidad y que eres una persona real de la comunidad.
        </p>
        <div className="flex gap-4 p-5 border-2 border-primary/20 rounded-xl items-start bg-primary/5">
          <UserCheck className="w-8 h-8 text-primary shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-black uppercase tracking-tight">¿Qué significa estar verificadx?</h4>
            <p className="text-sm text-foreground/70 leading-relaxed">
              Aparece un badge <strong>&quot;Verificadx&quot;</strong> <ShieldCheck className="inline w-4 h-4 text-primary" /> en tu perfil público. Es un sello de confianza visible para el resto de la comunidad, pero <strong>no es un requisito</strong> para usar la app, el Bazar ni ninguna funcionalidad — puedes empezar de inmediato.
            </p>
          </div>
        </div>
        <p className="text-sm text-foreground/60 italic pl-2">
          Si aún no estás verificadx, simplemente contacta a tu Bantúmin regional y cuéntale sobre tu participación en la red.
        </p>
      </section>

      <section className="space-y-6 pb-20">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Tu Perfil Público
        </h2>
        <p className="text-base leading-relaxed text-foreground/80 font-medium">
          Cada socix puede tener una página pública en la dirección <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">/u/tu-id</code> donde la comunidad puede ver tus productos y contactarte. <strong>Tú controlas qué información es visible.</strong>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-4 p-4 border rounded-xl bg-background/50">
            <Eye className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-black uppercase text-sm tracking-widest">Cómo activarlo</h4>
              <p className="text-sm text-foreground/70">Ve a <strong>Perfil → Privacidad y perfil público</strong> y activa el interruptor &quot;Perfil público&quot;.</p>
            </div>
          </div>
          <div className="flex gap-4 p-4 border rounded-xl bg-background/50">
            <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-black uppercase text-sm tracking-widest">Qué puedes controlar</h4>
              <p className="text-sm text-foreground/70">Nombre público, bio, si se muestra tu teléfono, correo o <strong>ubicación</strong> (dónde vives, no tu región de inscripción).</p>
            </div>
          </div>
        </div>
        <p className="text-sm text-foreground/60 italic pl-2">
          Si no activas el perfil público, tu página <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">/u/tu-id</code> no será visible para nadie.
        </p>
      </section>
    </article>
  );
}
