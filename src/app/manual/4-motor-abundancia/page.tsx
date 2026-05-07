import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Zap, Gift, Coins, TrendingUp } from "lucide-react";

export default function MotorAbundanciaPage() {
  return (
    <article className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="space-y-4">
        <h1 className="text-4xl md:text-6xl font-black text-primary uppercase tracking-tighter leading-tight">
          4. Motor de Abundancia
        </h1>
        <div className="h-2 w-24 bg-primary rounded-full" />
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          El Minado Diario
        </h2>
        <p className="text-base leading-relaxed text-foreground/80 font-medium">
          En el Túmin Digital, el dinero nuevo lo generas <strong>tú</strong> confirmando tu presencia diaria. Es un premio a la lealtad y constancia.
        </p>

        <div className="bg-background border rounded-2xl overflow-hidden">
          <Table>
            <TableHeader className="bg-primary/10">
              <TableRow>
                <TableHead className="font-black uppercase text-xs tracking-widest py-4">Racha de Días</TableHead>
                <TableHead className="font-black uppercase text-xs tracking-widest py-4 text-right">Premio Diario</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-sm font-bold">Día 1 al 3</TableCell>
                <TableCell className="text-sm font-black text-primary text-right">1 Ŧ</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-sm font-bold">Día 4 al 6</TableCell>
                <TableCell className="text-sm font-black text-primary text-right">3 Ŧ</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-sm font-bold">Día 7 al 14</TableCell>
                <TableCell className="text-sm font-black text-primary text-right">5 Ŧ</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-sm font-bold">Día 15 al 29</TableCell>
                <TableCell className="text-sm font-black text-primary text-right">7 Ŧ</TableCell>
              </TableRow>
              <TableRow className="bg-primary/5">
                <TableCell className="text-sm font-black uppercase tracking-tight">Día 30 en adelante</TableCell>
                <TableCell className="text-xl font-black text-primary text-right">10 Ŧ</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <p className="text-md text-destructive font-bold uppercase tracking-widest text-center italic">
          ⚠️ Si olvidas minar un solo día, la racha vuelve a 1.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Bonificaciones de Bienvenida
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 border rounded-xl space-y-3">
            <Gift className="w-6 h-6 text-primary" />
            <h4 className="font-black uppercase text-md tracking-widest">Bono de Activación</h4>
            <p className="text-sm text-foreground/70 leading-relaxed">Recibe <strong>25 Ŧ</strong> automáticamente al publicar tu primer producto en el Bazar.</p>
          </div>
          <div className="p-6 border rounded-xl space-y-3">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h4 className="font-black uppercase text-md tracking-widest">Anuncio Gratis</h4>
            <p className="text-sm text-foreground/70 leading-relaxed">Derecho a <strong>1 mes de anuncio GRATIS</strong> en el banner principal para darte a conocer.</p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          El Duplicador de Ventas
        </h2>
        <div className="bg-primary/20 text-primary-foreground p-8 rounded-2xl space-y-4">
          <div className="flex items-center gap-4">
            <Zap className="w-10 h-10 text-primary shrink-0" />
            <h3 className="text-3xl font-black uppercase tracking-tighter">¡Tus ventas valen el doble!</h3>
          </div>
          <p className="text-sm opacity-80 leading-relaxed">
            Durante tu etapa de crecimiento, el sistema te regala un Túmin adicional por cada Túmin que cobres.
          </p>
          <div className="bg-background/10 p-4 rounded-lg flex justify-between items-center">
            <span className="text-xs font-bold uppercase">Límite del Bono</span>
            <span className="text-xl font-black text-primary tracking-tighter">10,000 Ŧ</span>
          </div>
        </div>
      </section>

      <section className="space-y-6 pb-20">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Suscripciones Uno a Uno
        </h2>
        <div className="bg-primary/5 p-8 rounded-2xl border border-primary/10 space-y-4">
          <div className="flex items-center gap-4">
            <Coins className="w-8 h-8 text-primary" />
            <h3 className="text-xl font-black uppercase tracking-tight">Gana el 5% por Recomendación</h3>
          </div>
          <p className="text-sm text-foreground/70 leading-relaxed">
            Invita a otros a la red y recibe el <strong>5% de sus primeras 3 ventas</strong>. El sistema genera este premio adicional sin quitarle nada a tu invitado.
          </p>
          <p className="text-md font-black uppercase tracking-widest text-primary italic">
            &quot;Hagamos que la abundancia sea contagiosa.&quot;
          </p>
        </div>
      </section>
    </article>
  );
}
