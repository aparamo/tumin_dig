import React from "react";
import { Card } from "@/components/ui/card";
import { ShieldAlert, Fingerprint, Eye, Lock, KeyRound, SlidersHorizontal, RotateCcw } from "lucide-react";

export default function SeguridadPage() {
  return (
    <article className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="space-y-4">
        <h1 className="text-4xl md:text-6xl font-black text-primary uppercase tracking-tighter leading-tight">
          7. Seguridad y Privacidad
        </h1>
        <div className="h-2 w-24 bg-primary rounded-full" />
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Tu NIP: la llave de tu cuenta
        </h2>
        <p className="text-base leading-relaxed text-foreground/80 font-medium">
          El NIP es tu contraseña personal. Puede ser alfanumérico (letras y números) y debe tener entre <strong>4 y 6 caracteres</strong>. Puedes cambiarlo en cualquier momento desde la sección <strong>Perfil</strong>.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-4 p-4 border rounded-xl bg-background/50 items-start">
            <KeyRound className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-black uppercase text-sm tracking-widest">Formato seguro</h4>
              <p className="text-sm text-foreground/70">Combina letras y números para mayor seguridad. Ejemplo: <code className="bg-muted px-1 rounded text-xs font-mono">t3m4</code> o <code className="bg-muted px-1 rounded text-xs font-mono">rio25k</code>.</p>
            </div>
          </div>
          <div className="flex gap-4 p-4 border rounded-xl bg-background/50 items-start">
            <Lock className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-black uppercase text-sm tracking-widest">Encriptado</h4>
              <p className="text-sm text-foreground/70">Tu NIP nunca se guarda en texto plano — se almacena encriptado con <code className="bg-muted px-1 rounded text-xs font-mono">bcrypt</code>. Ni el sistema lo puede leer.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Protección contra accesos no autorizados
        </h2>
        <p className="text-base leading-relaxed text-foreground/80 font-medium">
          El sistema detecta automáticamente intentos de acceso repetidos y protege tu cuenta.
        </p>
        <div className="bg-destructive/5 border-2 border-destructive/20 p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-7 h-7 text-destructive" />
            <h3 className="text-lg font-black uppercase tracking-tight text-destructive">Bloqueo Automático</h3>
          </div>
          <p className="text-sm text-foreground/70 leading-relaxed">
            Tras <strong>5 intentos fallidos</strong> consecutivos de NIP, tu cuenta se bloquea automáticamente por <strong>15 minutos</strong>. La app te informa exactamente cuántos intentos te quedan y cuánto tiempo de espera resta.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="px-3 py-1 bg-green-500/20 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full">Intento 1–4: Aviso con intentos restantes</span>
            <span className="px-3 py-1 bg-destructive/20 text-destructive text-[10px] font-black uppercase tracking-widest rounded-full">Intento 5: Cuenta bloqueada 15 min</span>
          </div>
        </div>
        <p className="text-sm text-foreground/60 italic pl-2">
          Si no eres tú quien intentó entrar, contacta a tu Bantúmin de inmediato.
        </p>
      </section>

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
              <h4 className="font-black uppercase text-sm tracking-widest">Identidad por Cercanía</h4>
              <p className="text-sm text-foreground/70">Tu Bantúmin puede otorgarte el badge de Verificadx al conocerte en persona con un producto o servicio tangible.</p>
            </div>
          </div>
          <div className="flex gap-4 p-4 border rounded-xl bg-background/50">
            <Eye className="w-6 h-6 text-primary shrink-0" />
            <div className="space-y-1">
              <h4 className="font-black uppercase text-sm tracking-widest">Ledger Transparente</h4>
              <p className="text-sm text-foreground/70">El flujo de la moneda es rastreable por los coordinadores para evitar inflación artificial y detectar patrones anómalos.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Algoritmos de Protección de la Red
        </h2>
        <p className="text-base leading-relaxed text-foreground/80 font-medium">
          El sistema cuenta con mecanismos que vigilan la salud de la red las 24 horas.
        </p>
        <div className="space-y-4">
          <Card className="p-6 border-l-4 border-l-destructive">
            <h4 className="font-black uppercase text-sm tracking-widest text-destructive mb-2">Cuentas Parásitas</h4>
            <p className="text-sm text-foreground/70">Detecta cuentas que únicamente minan y transfieren el 90% o más de sus Túmin a otro usuario de inmediato, sin participar en el Bazar, lo que indica uso fraudulento de los bonos.</p>
          </Card>
          <Card className="p-6 border-l-4 border-l-destructive">
            <h4 className="font-black uppercase text-sm tracking-widest text-destructive mb-2">Cuentas Inactivas (Semáforo Rojo)</h4>
            <p className="text-sm text-foreground/70">Socios sin actividad por más de 30 días aparecen marcados para revisión manual del coordinador.</p>
          </Card>
          <Card className="p-6 border-l-4 border-l-destructive">
            <h4 className="font-black uppercase text-sm tracking-widest text-destructive mb-2">Integridad de Transacciones</h4>
            <p className="text-sm text-foreground/70">El sistema previene transacciones duplicadas a nivel de base de datos, incluso si se realizan múltiples clics simultáneos en la interfaz.</p>
          </Card>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Tu Privacidad Personal
        </h2>
        <p className="text-base leading-relaxed text-foreground/80 font-medium">
          Tienes control total sobre qué información tuya es visible para el resto de la comunidad. Todo se configura desde <strong>Perfil → Privacidad y Perfil Público</strong>.
        </p>
        <div className="flex gap-4 p-5 border-2 border-primary/20 rounded-xl items-start bg-primary/5">
          <SlidersHorizontal className="w-6 h-6 text-primary shrink-0 mt-0.5" />
          <div className="space-y-3 flex-1">
            <h4 className="font-black uppercase text-sm tracking-widest">Qué puedes controlar</h4>
            <ul className="space-y-2 text-sm text-foreground/70">
              <li className="flex gap-2"><span className="text-primary font-black">●</span> <span><strong>Perfil público:</strong> activa o desactiva tu página pública <code className="bg-muted px-1 rounded text-xs font-mono">/u/tu-id</code>.</span></li>
              <li className="flex gap-2"><span className="text-primary font-black">●</span> <span><strong>Nombre público y bio:</strong> cómo quieres presentarte (distinto a tu nombre de registro si lo deseas).</span></li>
              <li className="flex gap-2"><span className="text-primary font-black">●</span> <span><strong>Teléfono:</strong> si se muestra el botón de WhatsApp para que te contacten desde el Bazar.</span></li>
              <li className="flex gap-2"><span className="text-primary font-black">●</span> <span><strong>Correo electrónico:</strong> si es visible en tu perfil público.</span></li>
              <li className="flex gap-2"><span className="text-primary font-black">●</span> <span><strong>Región:</strong> si se muestra tu ubicación aproximada.</span></li>
            </ul>
            <p className="text-xs text-foreground/50 italic pt-1">
              Por default, el teléfono está habilitado para el botón de contacto. Si no lo deseas, desactívalo en esta sección.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-6 pb-20">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Protocolo de Cuenta Congelada
        </h2>
        <div className="bg-destructive/5 border border-destructive/20 p-8 rounded-2xl space-y-6">
          <div className="flex gap-4 items-center">
            <ShieldAlert className="w-8 h-8 text-destructive" />
            <h3 className="text-xl font-black uppercase tracking-tight text-destructive">¿Qué pasa si mi cuenta queda congelada?</h3>
          </div>
          <p className="text-sm text-foreground/70 leading-relaxed">
            Si se detecta inactividad por más de 30 días o irregularidades en tu cuenta, el sistema la pone en pausa. <strong>No pierdes tus Túmin</strong>, pero algunas funciones quedan suspendidas temporalmente.
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center font-black shrink-0 text-xs">1</span>
              <p className="text-foreground/70 pt-0.5">Recibirás un aviso en la app indicando el estado de tu cuenta.</p>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center font-black shrink-0 text-xs">2</span>
              <p className="text-foreground/70 pt-0.5">Contacta a tu Bantúmin regional y explícale la situación.</p>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center font-black shrink-0 text-xs">3</span>
              <p className="text-foreground/70 pt-0.5">El coordinador puede <strong>reactivar</strong> tu cuenta desde el Panel de Auditoría.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <RotateCcw className="w-5 h-5 text-green-600" />
            <p className="text-sm font-bold text-green-700 dark:text-green-400">Una vez reactivada, recuperas acceso completo y tus Túmin permanecen intactos.</p>
          </div>
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
