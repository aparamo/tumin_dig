import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Zap, Gift, Coins, TrendingUp, Users, Megaphone } from "lucide-react";

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
          En el Túmin Digital, el dinero nuevo lo generas <strong>tú</strong> confirmando tu presencia diaria. Es un premio a la lealtad y constancia de quienes participan activamente en la red.
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
        <p className="text-base leading-relaxed text-foreground/80 font-medium">
          Al publicar tu primer producto en el Bazar, el sistema activa automáticamente dos recompensas de bienvenida que suman <strong>30 Ŧ</strong>.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 border-2 border-primary/20 rounded-xl space-y-3 bg-primary/5">
            <Gift className="w-6 h-6 text-primary" />
            <h4 className="font-black uppercase text-md tracking-widest">Bono de Activación</h4>
            <p className="text-sm text-foreground/70 leading-relaxed">
              <strong>25 Ŧ</strong> al activar tu cuenta publicando tu primer producto.
            </p>
          </div>
          <div className="p-6 border-2 border-primary/20 rounded-xl space-y-3 bg-primary/5">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h4 className="font-black uppercase text-md tracking-widest">Bono de Publicación</h4>
            <p className="text-sm text-foreground/70 leading-relaxed">
              <strong>5 Ŧ</strong> adicionales por publicar ese primer artículo. En total: <strong>30 Ŧ</strong> de bienvenida.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          El Duplicador de Ventas
        </h2>
        <div className="bg-primary/20 text-primary-foreground p-8 rounded-2xl space-y-4">
          <div className="flex items-center gap-4">
            <Zap className="w-10 h-10 shrink-0" />
            <h3 className="text-3xl font-black uppercase tracking-tighter">¡Tus ventas valen el doble!</h3>
          </div>
          <p className="text-sm opacity-80 leading-relaxed">
            Durante tu etapa de crecimiento, el sistema te regala un Túmin adicional por cada Túmin que cobres en una venta.
          </p>
          <div className="bg-background/10 p-4 rounded-lg flex justify-between items-center">
            <span className="text-xs font-bold uppercase">Límite del Bono Duplicador</span>
            <span className="text-xl font-black tracking-tighter">10,000 Ŧ acumulados</span>
          </div>
          <p className="text-xs opacity-60 italic">
            Una vez alcanzado el límite, tus ventas siguen generando Túmin normalmente; simplemente dejas de recibir el duplicado extra.
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Bono de Referido: Invita y Gana
        </h2>
        <div className="bg-primary/5 p-8 rounded-2xl border border-primary/10 space-y-4">
          <div className="flex items-center gap-4">
            <Users className="w-8 h-8 text-primary" />
            <h3 className="text-xl font-black uppercase tracking-tight">5% de las primeras 3 ventas</h3>
          </div>
          <p className="text-sm text-foreground/70 leading-relaxed">
            Cuando invitas a alguien a la red y realiza sus primeras ventas, recibes el <strong>5% de cada una de sus primeras 3 ventas</strong>. El sistema genera este premio adicional sin quitarle nada a tu invitadx — la abundancia se multiplica.
          </p>
          <div className="bg-background border rounded-xl overflow-hidden mt-2">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-black uppercase text-xs tracking-widest py-3">Venta de tu referidx</TableHead>
                  <TableHead className="font-black uppercase text-xs tracking-widest py-3 text-right">Tu bono (5%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-sm font-bold">1ª venta — 100 Ŧ</TableCell>
                  <TableCell className="text-sm font-black text-primary text-right">+ 5 Ŧ</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm font-bold">2ª venta — 50 Ŧ</TableCell>
                  <TableCell className="text-sm font-black text-primary text-right">+ 2.5 Ŧ</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm font-bold">3ª venta — 200 Ŧ</TableCell>
                  <TableCell className="text-sm font-black text-primary text-right">+ 10 Ŧ</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-foreground/50 italic">
            Copia tu enlace de referido desde la sección <strong>Perfil → Invita a un amigx</strong>.
          </p>
          <p className="text-md font-black uppercase tracking-widest text-primary italic">
            &quot;Hagamos que la abundancia sea contagiosa.&quot;
          </p>
        </div>
      </section>

      <section className="space-y-6 pb-20">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Anuncio Gratis en el Banner
        </h2>
        <div className="bg-background border-2 border-border rounded-2xl p-8 space-y-5">
          <div className="flex items-center gap-4">
            <Megaphone className="w-8 h-8 text-primary" />
            <h3 className="text-xl font-black uppercase tracking-tight">1 mes de visibilidad en el Dashboard</h3>
          </div>
          <p className="text-sm text-foreground/70 leading-relaxed">
            Al publicar tu primer producto, obtienes derecho a solicitar <strong>1 mes de anuncio gratuito</strong> en el banner superior del Dashboard que todos los socios ven al entrar. Es una forma de darte a conocer en la red.
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black shrink-0 text-xs">1</span>
              <p className="text-foreground/70 pt-0.5">Prepara la imagen de tu anuncio y súbela desde <strong>Mis Archivos</strong>.</p>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black shrink-0 text-xs">2</span>
              <p className="text-foreground/70 pt-0.5">Envíala a revisión — tu Bantúmin la aprueba o rechaza desde el Panel de Coordinación.</p>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black shrink-0 text-xs">3</span>
              <p className="text-foreground/70 pt-0.5">Aprobado, tu anuncio aparece en el banner rotativo durante 30 días.</p>
            </div>
          </div>
          <div className="bg-muted/40 border border-border rounded-lg p-4 mt-2">
            <p className="text-xs text-foreground/60 leading-relaxed">
              <strong>Nota:</strong> La publicidad en la plataforma está en una etapa de propuesta consensuada. Los detalles — formas, frecuencia e integración — se definen en conjunto con la comunidad para que sea lo menos molesta y lo más útil posible. Esta funcionalidad puede evolucionar con base en esas decisiones colectivas.
            </p>
          </div>
        </div>
      </section>
    </article>
  );
}
