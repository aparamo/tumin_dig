"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Users, Send, Clock, MapPin, Calendar } from "lucide-react";
import { useStore } from "@/lib/store";
import { useFeedback } from "@/components/FeedbackProvider";
import { parseErrorMessage } from "@/lib/parse-error";
import { cn } from "@/lib/utils";

const STATUS_BADGE = {
  PAGADO: { label: "Validada", className: "bg-green-100 text-green-700 border-green-200" },
  PENDIENTE: { label: "Pendiente", className: "bg-amber-100 text-amber-700 border-amber-200" },
  RECHAZADO: { label: "Denegada", className: "bg-red-100 text-red-700 border-red-200" },
} as const;

function truncate(str: string, max = 100) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

function relativeDate(d: Date) {
  const now = new Date();
  const diff = now.getTime() - new Date(d).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  if (hours < 24) return `hace ${hours} h`;
  if (days < 30) return `hace ${days} día${days > 1 ? "s" : ""}`;
  return new Date(d).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

export function Comunidad() {
  const { setCurrentScreen } = useStore();
  const { notifySuccess, notifyError } = useFeedback();
  const [description, setDescription] = useState("");
  const [minutes, setMinutes] = useState("");
  const [allRegions, setAllRegions] = useState(false);

  const requestJob = trpc.jobs.requestJob.useMutation({
    onSuccess: () => {
      notifySuccess("Solicitud enviada a los coordinadores locales.");
      setDescription("");
      setMinutes("");
      setCurrentScreen("inicio");
    },
    onError: (error) => {
      notifyError(parseErrorMessage(error));
    },
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    trpc.jobs.getJobsHistory.useInfiniteQuery(
      { allRegions, limit: 10 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      }
    );

  const allItems = data?.pages.flatMap((p) => p.items) ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !minutes) return;

    requestJob.mutate({
      description,
      minutes: parseInt(minutes),
    });
  };

  return (
    <div className="flex flex-col gap-8 p-4 max-w-2xl mx-auto w-full pb-10">
      <div className="space-y-1">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground">Comunidad</h1>
        <p className="text-base font-bold text-muted-foreground uppercase tracking-widest">
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
        <ul className="text-base text-slate-500 space-y-2 list-disc pl-4">
          <li>El pago es proporcional al tiempo dedicado (1 Ŧ por minuto).</li>
          <li>La labor debe beneficiar a la comunidad o a otros socios.</li>
          <li>Un coordinador de tu misma región debe validar la veracidad del trabajo.</li>
        </ul>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-tight">Últimas actividades</h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-muted-foreground">Toda la red</span>
            <Switch
              checked={allRegions}
              onCheckedChange={(v) => setAllRegions(v === true)}
              aria-label="Mostrar toda la red"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : allItems.length > 0 ? (
          <div className="flex flex-col gap-3">
            {allItems.map((item) => {
              const badge = STATUS_BADGE[item.status];
              return (
                <Card key={item.id} className="border-2 border-border shadow-neo-sm">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={cn("font-black uppercase text-[10px]", badge.className)}>
                            {badge.label}
                          </Badge>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {item.location || item.requesterRegion}
                          </span>
                        </div>
                        <p className="font-black text-sm uppercase tracking-tight mt-1 truncate">
                          {item.displayName}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-black text-primary tabular-nums">{item.amount} Ŧ</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-snug">
                      {truncate(item.description)}
                    </p>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDuration(item.minutes)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {relativeDate(item.createdAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {hasNextPage && (
              <Button
                variant="outline"
                className="w-full h-12 border-2 font-black uppercase"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? <Loader2 className="animate-spin mr-2" /> : "Cargar más"}
              </Button>
            )}
          </div>
        ) : (
          <Card className="bg-muted/20 border-dashed border-2 shadow-none p-8 text-center text-muted-foreground font-bold uppercase text-sm">
            Aún no hay actividades registradas.
          </Card>
        )}
      </div>
    </div>
  );
}
