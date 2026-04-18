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
    } catch (err: any) {
      setError(err.message || "Error al registrarse");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-blue-100">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-600">Crear Cuenta</CardTitle>
          {isReferralValid ? (
            <div className="mt-2 flex items-center justify-center gap-2 bg-blue-50 text-blue-700 p-2 rounded-md text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Invitación detectada
            </div>
          ) : (
            <div className="mt-2 flex items-center justify-center gap-2 bg-red-50 text-red-700 p-2 rounded-md text-sm">
              <AlertCircle className="w-4 h-4" />
              Red cerrada: Necesitas invitación
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input 
                id="name" 
                placeholder="Tu nombre" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono (WhatsApp)</Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="10 dígitos" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico (Opcional)</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="correo@ejemplo.com" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Región</Label>
              <Select 
                value={formData.region} 
                onValueChange={(val) => val && setFormData({...formData, region: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una región" />
                </SelectTrigger>
                <SelectContent>
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
              <Label htmlFor="nip">Crea un NIP (4 números)</Label>
              <Input 
                id="nip" 
                type="password" 
                maxLength={4} 
                placeholder="****" 
                className="text-center tracking-widest"
                value={formData.nip}
                onChange={(e) => setFormData({...formData, nip: e.target.value})}
                required 
              />
            </div>
            
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12"
              disabled={registerMutation.isPending || !isReferralValid}
            >
              {registerMutation.isPending ? "Registrando..." : "Registrarme"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Link href="/login" className="text-slate-500 hover:text-slate-700 text-sm underline">
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
