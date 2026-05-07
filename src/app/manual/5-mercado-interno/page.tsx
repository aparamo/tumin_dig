import React from "react";
import { Card } from "@/components/ui/card";
import { ShoppingBag, MessageSquare, Repeat } from "lucide-react";

export default function MercadoInternoPage() {
  return (
    <article className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="space-y-4">
        <h1 className="text-4xl md:text-6xl font-black text-primary uppercase tracking-tighter leading-tight">
          5. Mercado Interno
        </h1>
        <div className="h-2 w-24 bg-primary rounded-full" />
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Cómo vender en el Bazar
        </h2>
        <div className="space-y-4">
          <p className="text-sm text-foreground/80 leading-relaxed font-medium">
            El Bazar es el corazón de la app. Publicar es abrir tu negocio a toda la red.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 border-l-4 border-l-orange-500">
              <h4 className="font-black uppercase text-md tracking-widest mb-1">Paso 1: Precio Justo</h4>
              <p className="text-sm text-foreground/70">Calcula tu precio total y aplica al menos el 10% en Túmin.</p>
            </Card>
            <Card className="p-4 border-l-4 border-l-orange-500">
              <h4 className="font-black uppercase text-md tracking-widest mb-1">Paso 2: Formulario</h4>
              <p className="text-sm text-foreground/70">Usa el botón &quot;+ Vender &quot; en la parte superior derecha del Bazar. O en la sección de Productos.</p>
            </Card>
            <Card className="p-4 border-l-4 border-l-orange-500">
              <h4 className="font-black uppercase text-md tracking-widest mb-1">Paso 3: Detalles</h4>
              <p className="text-sm text-foreground/70">Pon nombres específicos, fotos reales y selecciona tu región.</p>
            </Card>
            <Card className="p-4 border-l-4 border-l-orange-500">
              <h4 className="font-black uppercase text-md tracking-widest mb-1">Paso 4: Publicar</h4>
              <p className="text-sm text-foreground/70">Activa tus bonos de bienvenida y visibilidad inmediata.</p>
            </Card>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Compras Mayores y Ahorro
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed font-medium">
          El Túmin no es sólo para el diario; es una herramienta poderosa para adquirir bienes y servicios de alto valor.
        </p>
        <div className="bg-primary/20 text-primary-foreground p-8 rounded-2xl space-y-6">
          <div className="flex gap-4 items-center">
            <ShoppingBag className="w-8 h-8" />
            <h3 className="text-xl font-black uppercase tracking-tight">Estrategia del Pago Mixto</h3>
          </div>
          <div className="space-y-4 text-md opacity-90 leading-relaxed">
            <p>1. Busca profesionales en la red (médicos, carpinteros, contadores).</p>
            <p>2. Paga una parte en pesos y otra en Túmin (mínimo 10%).</p>
            <p>3. <strong>Ahorra efectivo real</strong> para gastos que no aceptan Túmin fuera de la red.</p>
          </div>
        </div>
      </section>

      <section className="space-y-6 pb-20">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Responsabilidad y Ética
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h4 className="font-black uppercase text-md tracking-widest">Palabra Empeñada</h4>
            </div>
            <p className="text-sm text-foreground/70 leading-relaxed">Un acuerdo por WhatsApp tiene el valor de un contrato. Cumple siempre con lo pactado.</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Repeat className="w-5 h-5 text-primary" />
              <h4 className="font-black uppercase text-md tracking-widest">Intercambio Híbrido</h4>
            </div>
            <p className="text-sm text-foreground/70 leading-relaxed">La app facilita el pago digital, pero el encuentro físico fortalece el lazo comunitario.</p>
          </div>
        </div>
      </section>
    </article>
  );
}
