"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Link from "next/link";

type Step = "request" | "confirm";

const RESEND_COOLDOWN_SEC = 60;

export default function RecuperarPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("request");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [newNip, setNewNip] = useState("");
  const [confirmNip, setConfirmNip] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const requestMutation = trpc.passwordReset.request.useMutation({
    onSuccess: (data) => {
      setInfoMessage(data.message);
      setError("");
      setStep("confirm");
      setCooldown(RESEND_COOLDOWN_SEC);
    },
    onError: () => {
      setError("No se pudo procesar la solicitud. Intenta de nuevo.");
    },
  });

  const confirmMutation = trpc.passwordReset.confirm.useMutation({
    onSuccess: () => {
      router.push("/login?reset=1");
    },
    onError: (e) => {
      setError(e.message || "Código inválido o expirado.");
    },
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    await requestMutation.mutateAsync({ identifier: identifier.trim() });
  };

  const handleResend = async () => {
    if (cooldown > 0 || requestMutation.isPending) return;
    setError("");
    await requestMutation.mutateAsync({ identifier: identifier.trim() });
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newNip !== confirmNip) {
      setError("Los NIPs no coinciden.");
      return;
    }
    if (newNip.length < 4 || newNip.length > 6) {
      setError("El NIP debe tener entre 4 y 6 caracteres.");
      return;
    }

    await confirmMutation.mutateAsync({
      identifier: identifier.trim(),
      code: code.trim(),
      newNip,
    });
  };

  const nipValid =
    newNip.length >= 4 &&
    newNip.length <= 6 &&
    newNip === confirmNip;

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-black text-primary uppercase tracking-tighter">
            Recuperar NIP
          </CardTitle>
          <CardDescription className="text-foreground/70 font-bold uppercase text-xs tracking-widest mt-2">
            {step === "request"
              ? "Ingresa tu teléfono o correo registrado"
              : "Ingresa el código y tu nuevo NIP"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "request" ? (
            <form onSubmit={handleRequest} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="font-black uppercase text-xs">
                  Correo o Teléfono
                </Label>
                <Input
                  id="identifier"
                  placeholder="Ej. 9611234567 o correo@ejemplo.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="bg-background"
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-destructive font-bold text-center uppercase">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                variant="default"
                className="w-full h-14 text-lg"
                disabled={requestMutation.isPending}
              >
                {requestMutation.isPending ? "Enviando..." : "Enviar código"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleConfirm} className="space-y-5">
              {infoMessage && (
                <p className="text-xs font-bold uppercase tracking-wide text-center text-muted-foreground bg-muted/40 p-3 rounded-lg border">
                  {infoMessage}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="code" className="font-black uppercase text-xs">
                  Código de verificación
                </Label>
                <Input
                  id="code"
                  placeholder="000000"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="bg-background text-center tracking-[0.5em] text-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newNip" className="font-black uppercase text-xs">
                  Nuevo NIP
                </Label>
                <Input
                  id="newNip"
                  type="password"
                  placeholder="****"
                  maxLength={6}
                  value={newNip}
                  onChange={(e) => setNewNip(e.target.value)}
                  className="bg-background text-center tracking-widest"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmNip" className="font-black uppercase text-xs">
                  Confirmar Nuevo NIP
                </Label>
                <Input
                  id="confirmNip"
                  type="password"
                  placeholder="****"
                  maxLength={6}
                  value={confirmNip}
                  onChange={(e) => setConfirmNip(e.target.value)}
                  className="bg-background text-center tracking-widest"
                  required
                />
                <p className="text-[9px] text-muted-foreground font-bold uppercase text-center">
                  4 a 6 caracteres alfanuméricos
                </p>
              </div>
              {error && (
                <p className="text-sm text-destructive font-bold text-center uppercase">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                variant="default"
                className="w-full h-14 text-lg"
                disabled={confirmMutation.isPending || !nipValid || code.length < 4}
              >
                {confirmMutation.isPending ? "Guardando..." : "Cambiar NIP"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 font-bold uppercase text-xs tracking-widest"
                disabled={cooldown > 0 || requestMutation.isPending}
                onClick={handleResend}
              >
                {cooldown > 0
                  ? `Reenviar código (${cooldown}s)`
                  : requestMutation.isPending
                    ? "Reenviando..."
                    : "Reenviar código"}
              </Button>
            </form>
          )}
          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="text-foreground/60 font-bold hover:text-foreground text-xs uppercase tracking-widest underline underline-offset-4"
            >
              Cancelar y volver
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
