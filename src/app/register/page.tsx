"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const registerMutation = trpc.user.register.useMutation();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    region: "Veracruz",
    nip: "",
    referrerId: "",
  });

  const [error, setError] = useState("");
  const [isReferralValid, setIsReferralValid] = useState(false);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setFormData((prev) => ({ ...prev, referrerId: ref }));
      setIsReferralValid(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isReferralValid) {
      setError("🚫 Esta es una red cerrada. Necesitas una invitación válida.");
      return;
    }

    try {
      await registerMutation.mutateAsync(formData);
      alert("¡Cuenta creada con éxito!");
      router.push("/login");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al registrarse";
      setError(message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-black text-primary uppercase tracking-tighter">Crear Cuenta</CardTitle>
          {isReferralValid ? (
            <div className="mt-4 flex items-center justify-center gap-2 bg-secondary text-secondary-foreground p-3 rounded-lg border-2 border-border font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              Invitación detectada
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-center gap-2 bg-destructive/10 text-destructive p-3 rounded-lg border-2 border-destructive/20 font-bold text-xs uppercase tracking-wider">
              <AlertCircle className="w-4 h-4" />
              Red cerrada: Necesitas invitación
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-black uppercase text-xs">Nombre Completo</Label>
              <Input 
                id="name" 
                placeholder="Tu nombre" 
                className="bg-background"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="font-black uppercase text-xs">Teléfono (WhatsApp)</Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="10 dígitos" 
                className="bg-background"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="font-black uppercase text-xs">Correo Electrónico (Opcional)</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="correo@ejemplo.com" 
                className="bg-background"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-black uppercase text-xs">Región</Label>
              <Select 
                value={formData.region} 
                onValueChange={(val) => val && setFormData({...formData, region: val})}
              >
                <SelectTrigger className="bg-background border-2 border-border h-10 font-medium">
                  <SelectValue placeholder="Selecciona una región" />
                </SelectTrigger>
                <SelectContent className="bg-card border-2 border-border">
                  <SelectItem value="Veracruz">Veracruz</SelectItem>
                  <SelectItem value="Chiapas">Chiapas</SelectItem>
                  <SelectItem value="Oaxaca">Oaxaca</SelectItem>
                  <SelectItem value="Hidalgo">Hidalgo</SelectItem>
                  <SelectItem value="Estado de México">Estado de México</SelectItem>
                  <SelectItem value="Morelos">Morelos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nip" className="font-black uppercase text-xs">Crea un NIP (4 números)</Label>
              <Input 
                id="nip" 
                type="password" 
                maxLength={4} 
                placeholder="****" 
                className="text-center tracking-widest bg-background"
                value={formData.nip}
                onChange={(e) => setFormData({...formData, nip: e.target.value})}
                required 
              />
            </div>
            
            {error && <p className="text-sm text-destructive font-bold text-center uppercase text-xs">{error}</p>}

            <Button 
              type="submit" 
              variant="default"
              className="w-full h-14 text-lg mt-4"
              disabled={registerMutation.isPending || !isReferralValid}
            >
              {registerMutation.isPending ? "Registrando..." : "Registrarme"}
            </Button>
          </form>
          <div className="mt-8 text-center">
            <Link href="/login" className="text-foreground/60 font-bold hover:text-foreground text-xs uppercase tracking-widest underline underline-offset-4">
              Cancelar y volver
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Cargando...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
