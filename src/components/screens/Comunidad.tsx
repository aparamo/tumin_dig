"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Users, Send } from "lucide-react";
import { useStore } from "@/lib/store";

export function Comunidad() {
  const { setCurrentScreen } = useStore();
  const [description, setDescription] = useState("");
  const [minutes, setMinutes] = useState("");

  const requestJob = trpc.jobs.requestJob.useMutation({
    onSuccess: () => {
      alert("Solicitud enviada a los coordinadores locales.");
      setDescription("");
      setMinutes("");
      setCurrentScreen("inicio");
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !minutes) return;

    requestJob.mutate({
      description,
      minutes: parseInt(minutes),
      amount: parseInt(minutes), // 1 minute = 1 Tumin
    });
  };

  return (
    <div className="flex flex-col gap-8 p-4 max-w-2xl mx-auto w-full pb-10">
      <div className="space-y-1">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground">Comunidad</h1>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Convierte tu labor comunitaria en Túmin
        </p>
      </div>

      <Card className="shadow-md border-purple-100">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" /> Nueva Solicitud
          </CardTitle>
          <CardDescription>
            Tu solicitud será revisada por un Coordinador Local de tu región para autorizar el pago.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">¿Qué labor realizaste?</Label>
              <Textarea 
                id="description"
                placeholder="Ej. Taller de elaboración de tés medicinales" 
                className="min-h-[100px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minutes">Tiempo de labor (Minutos)</Label>
              <Input 
                id="minutes"
                type="number" 
                placeholder="60 min = 60 Ŧ" 
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700 h-12 font-bold"
              disabled={requestJob.isPending}
            >
              {requestJob.isPending ? <Loader2 className="animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Enviar a Coordinación
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <div className="bg-slate-100 p-4 rounded-lg border border-slate-200">
        <h4 className="font-bold text-sm text-slate-700 mb-2">Reglas de la labor comunitaria</h4>
        <ul className="text-xs text-slate-500 space-y-2 list-disc pl-4">
          <li>El pago es proporcional al tiempo dedicado (1 Ŧ por minuto).</li>
          <li>La labor debe beneficiar a la comunidad o a otros socios.</li>
          <li>Un coordinador de tu misma región debe validar la veracidad del trabajo.</li>
        </ul>
      </div>
    </div>
  );
}
