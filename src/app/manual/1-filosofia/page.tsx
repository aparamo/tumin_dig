import React from "react";

export default function FilosofiaPage() {
  return (
    <article className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="space-y-4">
        <h1 className="text-4xl md:text-6xl font-black text-primary uppercase tracking-tighter leading-tight">
          1. Filosofía y Principios Básicos
        </h1>
        <div className="h-2 w-24 bg-primary rounded-full" />
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          ¿Qué es el Túmin Digital y su relación con la moneda física?
        </h2>
        <p className="text-base leading-relaxed text-foreground/80 font-medium">
          Para entender la versión digital, primero debemos recordar la esencia del proyecto. El Túmin es una moneda dual, lo que significa que existe tanto en papel como en formato digital, y fue creada para fortalecer una economía local, solidaria y autónoma.
        </p>
        <p className="text-base leading-relaxed text-foreground/80 font-medium">
          El proyecto nació en el año 2010 en Espinal, Veracruz, como una respuesta para empoderar a las comunidades locales y promover una economía justa.
        </p>

        <div className="bg-primary/5 p-8 rounded-2xl border border-primary/10 space-y-4">
          <h3 className="text-lg font-black uppercase tracking-widest text-primary">¿Qué pasa con los billetes de papel?</h3>
          <ul className="space-y-3">
            <li className="flex gap-3 text-sm font-bold uppercase tracking-tight text-foreground/70">
              <span className="text-primary">●</span>
              <span>No son competencia, son un equipo</span>
            </li>
            <li className="flex gap-3 text-sm font-bold uppercase tracking-tight text-foreground/70">
              <span className="text-primary">●</span>
              <span>Se complementan en el mismo sistema</span>
            </li>
            <li className="flex gap-3 text-sm font-bold uppercase tracking-tight text-foreground/70">
              <span className="text-primary">●</span>
              <span>Comparten el mismo valor respaldado por la comunidad</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          La Economía Solidaria: Abundancia vs Escasez
        </h2>
        <p className="text-base leading-relaxed text-foreground/80 font-medium">
          El capitalismo tradicional nos enseña que el dinero siempre falta (escasez). La Economía Solidaria nos propone ver la riqueza real: las manos de la panadera, el conocimiento del maestro y el tiempo que dedicamos a ayudarnos.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 border rounded-xl bg-background/50 space-y-2">
            <h4 className="font-black uppercase text-xs tracking-widest text-primary">Cooperación</h4>
            <p className="text-sm text-foreground/70 leading-relaxed">Dejamos de ser rivales para ser vecinos que se apoyan. Si a tu negocio le va bien, a toda la red le va bien.</p>
          </div>
          <div className="p-6 border rounded-xl bg-background/50 space-y-2">
            <h4 className="font-black uppercase text-xs tracking-widest text-primary">Sin Intereses</h4>
            <p className="text-sm text-foreground/70 leading-relaxed">El Túmin nace del valor de tu propio trabajo, no de deudas bancarias asfixiantes.</p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          El Modelo de Abundancia
        </h2>
        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black shrink-0">1</div>
            <div>
              <h4 className="font-black uppercase text-sm tracking-tight mb-1">Sin Deuda</h4>
              <p className="text-sm text-foreground/70">Nace de la riqueza real que ya existe en ti y en tu comunidad.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black shrink-0">2</div>
            <div>
              <h4 className="font-black uppercase text-sm tracking-tight mb-1">Sin Intereses</h4>
              <p className="text-sm text-foreground/70">1 Túmin hoy valdrá 1 Túmin en diez años. El dinero deja de ser un muro para ser un puente.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black shrink-0">3</div>
            <div>
              <h4 className="font-black uppercase text-sm tracking-tight mb-1">Sin Especulación</h4>
              <p className="text-sm text-foreground/70">No es una apuesta financiera; es estrictamente una herramienta de intercambio.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          El Valor del Túmin
        </h2>
        <div className="bg-primary/60 text-primary-foreground p-8 rounded-2xl space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-black uppercase tracking-tighter">1 Túmin = 1 Peso (o moneda local)</h3>
            <p className="text-sm opacity-80 leading-relaxed">Un puente práctico para facilitar el comercio diario sin matemáticas complicadas.</p>
          </div>
          <div className="h-px bg-background/20" />
          <div className="space-y-2">
            <h3 className="text-xl font-black uppercase tracking-tighter">1 Túmin = 1 Minuto de labor comunitaria</h3>
            <p className="text-sm opacity-80 leading-relaxed">Reconocemos que tu tiempo es sagrado. 60 minutos de cualquier labor digna equivalen a 60 Túmin.</p>
          </div>
        </div>
      </section>

      <section className="space-y-6 pb-20">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          De Clientes a Compañeros
        </h2>
        <p className="text-base leading-relaxed text-foreground/80 font-medium italic border-l-2 border-primary/20 pl-6">
          &quot;El Túmin es la certeza de saber que ya no estás solo para enfrentar los gastos del día a día; estás respaldado por una comunidad entera.&quot;
        </p>
      </section>
    </article>
  );
}
