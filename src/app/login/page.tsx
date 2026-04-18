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
        setError(result.error === "CredentialsSignin" ? "Credenciales incorrectas" : result.error);
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
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-black text-primary uppercase tracking-tighter">Túmin</CardTitle>
          <CardDescription className="text-foreground/70 font-bold uppercase text-xs tracking-widest mt-2">Bienvenido a tu economía viva</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="font-black uppercase text-xs">Correo o Teléfono</Label>
              <Input 
                id="identifier" 
                placeholder="Ej. 9611234567" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="bg-background"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nip" className="font-black uppercase text-xs">NIP de Seguridad</Label>
              <Input 
                id="nip" 
                type="password" 
                placeholder="****" 
                maxLength={6} 
                className="text-center tracking-[0.5em] text-xl bg-background"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                required
              />
              <p className="text-[9px] text-muted-foreground font-bold uppercase text-center">4 a 6 caracteres alfanuméricos</p>
            </div>
            {error && <p className="text-sm text-destructive font-bold text-center uppercase text-xs">{error}</p>}
            <Button 
              type="submit" 
              variant="default"
              className="w-full h-14 text-lg"
              disabled={isLoading}
            >
              {isLoading ? "Verificando..." : "Entrar"}
            </Button>
          </form>
          <div className="mt-8 text-center text-sm font-medium">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-accent font-black hover:underline uppercase tracking-tight">
              Regístrate aquí
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
