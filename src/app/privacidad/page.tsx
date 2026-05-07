import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 max-w-2xl mx-auto text-center space-y-8">
      <h1 className="text-4xl font-black text-primary uppercase tracking-tighter">Aviso de Privacidad</h1>
      <p className="text-foreground/70 leading-relaxed font-medium">
        En el ecosistema Túmin, la privacidad y la transparencia son pilares fundamentales. Tus datos están protegidos y sólo se utilizan para facilitar los intercambios dentro de la red comunitaria.
      </p>
      <div className="bg-primary/5 p-6 rounded-xl border border-primary/10 text-left space-y-4">
        <p className="text-sm">1. Recopilamos información básica para validar tu identidad como socio.</p>
        <p className="text-sm">2. Tus transacciones son analizadas por el sistema para validar que no existan fraudes o manipulaciones, y pueden ser revisadas por los coordinadores regionales para asegurar la transparencia del sistema.</p>
        <p className="text-sm">3. No compartimos ni vendemos tu información a terceros externos a la red Túmin.</p>
      </div>
      <Link href="/login">
        <Button variant="outline" className="font-bold uppercase tracking-widest">
          Volver al Inicio
        </Button>
      </Link>
    </div>
  );
}
