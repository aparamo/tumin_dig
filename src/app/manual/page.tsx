import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, BookOpen, Shield, Users, Zap } from "lucide-react";

export default function ManualPage() {
  return (
    <div className="space-y-12">
      <section className="text-center space-y-4">
        <h1 className="text-5xl md:text-7xl font-black text-primary uppercase tracking-tighter leading-none">
          Guía del Socio
        </h1>
        <p className="text-lg md:text-xl text-foreground/70 font-bold uppercase tracking-widest max-w-2xl mx-auto">
          Todo lo que necesitas saber para navegar en la economía de la abundancia
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 border-primary/20 hover:border-primary transition-colors cursor-pointer group">
          <Link href="/manual/1-filosofia">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <BookOpen className="w-6 h-6" />
              </div>
              <CardTitle className="uppercase font-black tracking-tight">Comienza Aquí</CardTitle>
              <CardDescription className="font-bold text-xs uppercase tracking-widest">Capítulo 1: Filosofía</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/70 leading-relaxed">
                Descubre qué es el Túmin, su relación con la moneda física y cómo la economía solidaria transforma comunidades.
              </p>
              <Button variant="ghost" className="mt-4 p-0 font-black uppercase text-xs tracking-widest group-hover:translate-x-2 transition-transform">
                Leer más <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Link>
        </Card>

        <Card className="border-2 border-primary/20 hover:border-primary transition-colors cursor-pointer group">
          <Link href="/manual/2-reglas">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Shield className="w-6 h-6" />
              </div>
              <CardTitle className="uppercase font-black tracking-tight">Reglas de Oro</CardTitle>
              <CardDescription className="font-bold text-xs uppercase tracking-widest">Capítulo 2: Ética y Normas</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/70 leading-relaxed">
                Aprende sobre el respaldo real del Túmin, la regla del 10% y el compromiso de participación activa.
              </p>
              <Button variant="ghost" className="mt-4 p-0 font-black uppercase text-xs tracking-widest group-hover:translate-x-2 transition-transform">
                Leer más <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Link>
        </Card>

        <Card className="border-2 border-primary/20 hover:border-primary transition-colors cursor-pointer group">
          <Link href="/manual/4-motor-abundancia">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Zap className="w-6 h-6" />
              </div>
              <CardTitle className="uppercase font-black tracking-tight">Gana Túmin</CardTitle>
              <CardDescription className="font-bold text-xs uppercase tracking-widest">Capítulo 4: Minado y Bonos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/70 leading-relaxed">
                Entiende cómo generar Túmin diariamente mediante el minado, bonos de bienvenida y el duplicador de ventas.
              </p>
              <Button variant="ghost" className="mt-4 p-0 font-black uppercase text-xs tracking-widest group-hover:translate-x-2 transition-transform">
                Leer más <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Link>
        </Card>

        <Card className="border-2 border-primary/20 hover:border-primary transition-colors cursor-pointer group">
          <Link href="/manual/6-gobernanza">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <CardTitle className="uppercase font-black tracking-tight">Comunidad</CardTitle>
              <CardDescription className="font-bold text-xs uppercase tracking-widest">Capítulo 6: Gobernanza</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/70 leading-relaxed">
                Conoce la organización autónoma regional y el rol facilitador de los coordinadores o Bantúmin.
              </p>
              <Button variant="ghost" className="mt-4 p-0 font-black uppercase text-xs tracking-widest group-hover:translate-x-2 transition-transform">
                Leer más <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Link>
        </Card>
      </div>

      <section className="bg-primary/5 p-8 rounded-2xl border border-primary/10">
        <h2 className="text-2xl font-black uppercase tracking-tight mb-4">¿Necesitas ayuda rápida?</h2>
        <p className="text-sm text-foreground/70 mb-6 leading-relaxed">
          Si tienes dudas técnicas o quieres contactar a un coordinador, revisa la sección de Seguridad y Auditoría o contacta a tu Bantúmin local.
        </p>
        <Link href="/manual/7-seguridad">
          <Button variant="default" className="font-black uppercase tracking-widest">
            Ir a Seguridad
          </Button>
        </Link>
      </section>
    </div>
  );
}
