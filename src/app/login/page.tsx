"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [nip, setNip] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        identifier,
        nip,
        redirect: false,
      });

      if (result?.error) {
        setError("Credenciales incorrectas");
      } else {
        router.push("/");
      }
    } catch (err) {
      setError("Ocurrió un error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-orange-100">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-orange-500">Túmin</CardTitle>
          <CardDescription>Bienvenido a tu economía viva</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Correo o Teléfono</Label>
              <Input 
                id="identifier" 
                placeholder="Ej. 9611234567 o correo@..." 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nip">NIP de Seguridad</Label>
              <Input 
                id="nip" 
                type="password" 
                placeholder="****" 
                maxLength={4} 
                className="text-center tracking-[1em] text-xl"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12"
              disabled={isLoading}
            >
              {isLoading ? "Verificando..." : "Entrar"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-slate-500">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-blue-500 font-bold hover:underline">
              Regístrate aquí
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
