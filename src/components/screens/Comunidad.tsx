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
import {
  Loader2,
  Users,
  Send,
  Clock,
  MapPin,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  MessageSquareWarning,
  MessageSquare,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useFeedback } from "@/components/FeedbackProvider";
import { parseErrorMessage } from "@/lib/parse-error";
import { cn } from "@/lib/utils";
import { JobDisputeDialog } from "@/components/jobs/JobDisputeDialog";

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
  const utils = trpc.useUtils();
  const [description, setDescription] = useState("");
  const [minutes, setMinutes] = useState("");
  const [allRegions, setAllRegions] = useState(false);
  const [feedbackByJob, setFeedbackByJob] = useState<Record<string, string>>({});
  const [disputeJobId, setDisputeJobId] = useState<string | null>(null);

  const requestJob = trpc.jobs.requestJob.useMutation({
    onSuccess: () => {
      notifySuccess("Solicitud enviada a los coordinadores locales.");
      setDescription("");
      setMinutes("");
      utils.jobs.getProposedJobs.invalidate();
      setCurrentScreen("inicio");
    },
    onError: (error) => {
      notifyError(parseErrorMessage(error));
    },
  });

  const {
    data: proposedData,
    fetchNextPage: fetchMoreProposed,
    hasNextPage: hasMoreProposed,
    isFetchingNextPage: fetchingProposed,
    isLoading: loadingProposed,
  } = trpc.jobs.getProposedJobs.useInfiniteQuery(
    { limit: 10 },
    { getNextPageParam: (last) => last.nextCursor ?? undefined }
  );

  const proposedItems = proposedData?.pages.flatMap((p) => p.items) ?? [];

  const voteMutation = trpc.jobs.voteOnJob.useMutation({
    onSuccess: (_data, vars) => {
      notifySuccess(
        vars.message?.trim()
          ? "Voto y retroalimentación guardados."
          : "Tu voto quedó registrado."
      );
      utils.jobs.getProposedJobs.invalidate();
    },
    onError: (e) => notifyError(parseErrorMessage(e)),
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
      <JobDisputeDialog
        jobId={disputeJobId}
        open={Boolean(disputeJobId)}
        onOpenChange={(o) => {
          if (!o) setDisputeJobId(null);
        }}
      />

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
                className="min-h-25"
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
          <li>La labor debe beneficiar a la comunidad tumista.</li>
          <li>Un(a) coordinador(a) de tu misma región debe validar la veracidad del trabajo.</li>
          <li>La red puede votar de acuerdo o no; con mayoría en desacuerdo (mín. 3 votos) no se puede pagar.</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black uppercase tracking-tight">Labores propuestas</h2>
        <p className="text-xs text-muted-foreground font-medium">
          Labores aún sin validar. Puedes votar y dejar un mensaje de retroalimentación.
        </p>

        {loadingProposed ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : proposedItems.length > 0 ? (
          <div className="flex flex-col gap-3">
            {proposedItems.map((item) => (
              <Card key={item.id} className="border-2 border-border shadow-neo-sm border-l-4 border-l-amber-500">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-amber-100 text-amber-700 font-black uppercase text-[10px]">
                          Pendiente
                        </Badge>
                        {item.communityVeto && (
                          <Badge className="bg-red-100 text-red-700 font-black uppercase text-[10px]">
                            Veto comunitario
                          </Badge>
                        )}
                        {item.paymentBlocked && (
                          <Badge className="bg-orange-100 text-orange-800 font-black uppercase text-[10px]">
                            Controversia
                          </Badge>
                        )}
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
                    <span>
                      {item.tally.acuerdo} de acuerdo · {item.tally.desacuerdo} en desacuerdo
                    </span>
                  </div>

                  {item.comments.length > 0 && (
                    <ul className="space-y-2 rounded-lg border bg-muted/30 p-3">
                      {item.comments.map((c) => (
                        <li key={c.voterId} className="text-sm leading-snug">
                          <span className="text-[10px] font-black uppercase">
                            {c.displayName}
                            {c.stance === "ACUERDO" ? " · de acuerdo" : " · no de acuerdo"}
                          </span>
                          <p className="text-muted-foreground">{c.message}</p>
                        </li>
                      ))}
                    </ul>
                  )}

                  {item.isOwn ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">
                        Esta es tu labor — no puedes votarla.
                      </p>
                      {(item.disputeStatus || item.activeFlagCount > 0) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="font-black uppercase text-[10px]"
                          onClick={() => setDisputeJobId(item.id)}
                        >
                          <MessageSquareWarning className="w-4 h-4 mr-1" />
                          Ver controversia
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Mensaje de retroalimentación (opcional)"
                        className="min-h-15 text-sm"
                        maxLength={500}
                        value={feedbackByJob[item.id] ?? item.myMessage ?? ""}
                        onChange={(e) =>
                          setFeedbackByJob((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                      />
                      <div className="flex gap-2">
                        <Button
                          variant={item.myStance === "ACUERDO" ? "default" : "outline"}
                          className="flex-1 h-11 font-black uppercase text-[10px]"
                          disabled={voteMutation.isPending}
                          onClick={() =>
                            voteMutation.mutate({
                              jobId: item.id,
                              stance: "ACUERDO",
                              message: (feedbackByJob[item.id] ?? item.myMessage ?? "").trim() || undefined,
                            })
                          }
                        >
                          <ThumbsUp className="w-4 h-4 mr-1" /> De acuerdo
                        </Button>
                        <Button
                          variant={item.myStance === "DESACUERDO" ? "destructive" : "outline"}
                          className="flex-1 h-11 font-black uppercase text-[10px]"
                          disabled={voteMutation.isPending}
                          onClick={() =>
                            voteMutation.mutate({
                              jobId: item.id,
                              stance: "DESACUERDO",
                              message: (feedbackByJob[item.id] ?? item.myMessage ?? "").trim() || undefined,
                            })
                          }
                        >
                          <ThumbsDown className="w-4 h-4 mr-1" /> No de acuerdo
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full h-11 font-black uppercase text-[10px]"
                        disabled={voteMutation.isPending}
                        onClick={() => {
                          const message = (feedbackByJob[item.id] ?? item.myMessage ?? "").trim();
                          if (!item.myStance) {
                            notifyError("Primero elige De acuerdo o No de acuerdo. El mensaje se guarda junto con ese voto.");
                            return;
                          }
                          if (!message) {
                            notifyError("Escribe el mensaje de retroalimentación antes de guardarlo.");
                            return;
                          }
                          voteMutation.mutate({
                            jobId: item.id,
                            stance: item.myStance,
                            message,
                          });
                        }}
                      >
                        <MessageSquare className="w-4 h-4 mr-1" /> Guardar retroalimentación
                      </Button>
                      <p className="text-[10px] text-muted-foreground">
                        El voto se guarda al pulsar De acuerdo o No de acuerdo. Si ya votaste, usa Guardar retroalimentación para dejar o cambiar el mensaje.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {hasMoreProposed && (
              <Button
                variant="outline"
                className="w-full h-12 border-2 font-black uppercase"
                onClick={() => fetchMoreProposed()}
                disabled={fetchingProposed}
              >
                {fetchingProposed ? <Loader2 className="animate-spin mr-2" /> : "Cargar más"}
              </Button>
            )}
          </div>
        ) : (
          <Card className="bg-muted/20 border-dashed border-2 shadow-none p-8 text-center text-muted-foreground font-bold uppercase text-sm">
            No hay labores pendientes de validar.
          </Card>
        )}
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
