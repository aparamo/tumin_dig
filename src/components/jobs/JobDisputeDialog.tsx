"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send } from "lucide-react";
import { useFeedback } from "@/components/FeedbackProvider";
import { parseErrorMessage } from "@/lib/parse-error";
import { useSession } from "next-auth/react";

interface JobDisputeDialogProps {
  jobId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JobDisputeDialog({ jobId, open, onOpenChange }: JobDisputeDialogProps) {
  const { data: session } = useSession();
  const { notifySuccess, notifyError } = useFeedback();
  const utils = trpc.useUtils();
  const [body, setBody] = useState("");
  const [resolveNote, setResolveNote] = useState("");

  const { data, isLoading } = trpc.jobs.getJobDispute.useQuery(
    { jobId: jobId! },
    { enabled: open && Boolean(jobId) }
  );

  const postMessage = trpc.jobs.postJobDisputeMessage.useMutation({
    onSuccess: () => {
      setBody("");
      utils.jobs.getJobDispute.invalidate({ jobId: jobId! });
    },
    onError: (e) => notifyError(parseErrorMessage(e)),
  });

  const resolve = trpc.jobs.resolveJobDispute.useMutation({
    onSuccess: () => {
      notifySuccess("Controversia marcada como resuelta.");
      setResolveNote("");
      utils.jobs.getJobDispute.invalidate({ jobId: jobId! });
      utils.jobs.getPendingJobs.invalidate();
      utils.jobs.getProposedJobs.invalidate();
    },
    onError: (e) => notifyError(parseErrorMessage(e)),
  });

  const isGeneral = session?.user?.role === "COORDINADOR_GENERAL";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle className="uppercase font-black tracking-tight">
            Controversia
          </DialogTitle>
          <DialogDescription className="text-xs">
            {data?.job?.description
              ? data.job.description.slice(0, 120)
              : "Hilo de resolución entre quien pidió la labor y coordinación."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !data?.dispute ? (
          <p className="text-sm text-muted-foreground font-medium text-center py-6">
            Aún no hay controversia abierta para esta labor.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 items-center">
              <Badge
                className={
                  data.dispute.status === "ABIERTA"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-green-100 text-green-800"
                }
              >
                {data.dispute.status === "ABIERTA" ? "Abierta" : "Resuelta"}
              </Badge>
              <span className="text-[10px] font-bold uppercase text-muted-foreground">
                {data.activeFlagCount} señalamiento{data.activeFlagCount === 1 ? "" : "s"}
                {data.paymentBlocked ? " · pago bloqueado" : ""}
              </span>
            </div>

            {data.flags.filter((f) => !f.withdrawnAt).length > 0 && (
              <div className="space-y-2 max-h-28 overflow-y-auto rounded-lg border p-3 text-xs">
                {data.flags
                  .filter((f) => !f.withdrawnAt)
                  .map((f) => (
                    <div key={`${f.coordinatorId}-${f.createdAt}`}>
                      <p className="font-black uppercase">{f.displayName}</p>
                      <p className="text-muted-foreground">{f.reason}</p>
                    </div>
                  ))}
              </div>
            )}

            <div className="flex-1 min-h-40 max-h-70 overflow-y-auto space-y-3 rounded-lg border p-3 bg-muted/20">
              {data.messages.map((m) => (
                <div key={m.id} className="space-y-0.5">
                  <div className="flex justify-between gap-2">
                    <span className="text-[10px] font-black uppercase">{m.displayName}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(m.createdAt).toLocaleString("es-MX", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm leading-snug whitespace-pre-wrap">{m.body}</p>
                </div>
              ))}
            </div>

            {data.dispute.status === "ABIERTA" && (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!jobId || !body.trim()) return;
                  postMessage.mutate({ jobId, body: body.trim() });
                }}
              >
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Escribe un mensaje…"
                  className="min-h-11 max-h-28"
                  maxLength={2000}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="shrink-0 h-11 w-11"
                  disabled={postMessage.isPending || !body.trim()}
                >
                  {postMessage.isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
            )}

            {isGeneral && data.dispute.status === "ABIERTA" && (
              <div className="space-y-2 border-t pt-3">
                <p className="text-[10px] font-black uppercase text-muted-foreground">
                  Resolver controversia (coordinador general)
                </p>
                <Textarea
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value)}
                  placeholder="Nota de resolución (mín. 10 caracteres)"
                  className="min-h-15"
                  maxLength={1000}
                />
                <Button
                  className="w-full font-black uppercase"
                  disabled={resolve.isPending || resolveNote.trim().length < 10 || !jobId}
                  onClick={() => {
                    if (!jobId) return;
                    resolve.mutate({ jobId, note: resolveNote.trim() });
                  }}
                >
                  {resolve.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
                  Marcar resuelta
                </Button>
              </div>
            )}

            {data.dispute.status === "RESUELTA" && data.dispute.resolutionNote && (
              <p className="text-xs text-muted-foreground border-t pt-2">
                <span className="font-black uppercase">Resolución: </span>
                {data.dispute.resolutionNote}
              </p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
