"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { trpc } from "@/lib/trpc/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Loader2 } from "lucide-react";
import { useFeedback } from "@/components/FeedbackProvider";
import { parseErrorMessage } from "@/lib/parse-error";
import { cn } from "@/lib/utils";

export interface InviteShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface InviteLinkState {
  url: string;
  expiresAt: Date;
}

function buildInviteUrl(token: string): string {
  return `${window.location.origin}/register?token=${token}`;
}

export function InviteShareDialog({ open, onOpenChange }: InviteShareDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "z-50 flex flex-col gap-0 overflow-hidden bg-background p-0 ring-0",
          "fixed inset-0 left-0 top-0 h-dvh w-full max-w-none translate-x-0 translate-y-0 rounded-none border-0 shadow-none",
          "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[90dvh] sm:w-full sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border-2 sm:border-border sm:shadow-neo-sm",
        )}
      >
        <DialogHeader className="shrink-0 space-y-2 border-b-2 border-border p-5 text-left">
          <DialogTitle className="text-xl font-black uppercase tracking-tight">
            Invitar a la red
          </DialogTitle>
          <DialogDescription className="text-sm font-bold text-muted-foreground">
            Comparte el QR o copia tu link de referencia. Se renueva cada semana.
          </DialogDescription>
        </DialogHeader>

        {open ? <InviteShareDialogBody /> : null}
      </DialogContent>
    </Dialog>
  );
}

function InviteShareDialogBody() {
  const { notifySuccess, notifyError } = useFeedback();
  const [invite, setInvite] = useState<InviteLinkState | null>(null);
  const [failed, setFailed] = useState(false);

  const { mutate, isPending } = trpc.user.getOrCreateInviteToken.useMutation({
    onSuccess: (data) => {
      setFailed(false);
      setInvite({
        url: buildInviteUrl(data.token),
        expiresAt: new Date(data.expiresAt),
      });
    },
    onError: (e) => {
      setFailed(true);
      notifyError(parseErrorMessage(e));
    },
  });

  useEffect(() => {
    mutate();
  }, [mutate]);

  const handleCopy = async () => {
    if (!invite) return;
    try {
      await navigator.clipboard.writeText(invite.url);
      const expiry = invite.expiresAt.toLocaleDateString();
      notifySuccess(`¡Link de invitación copiado! Vence el ${expiry}`);
    } catch {
      notifyError("No se pudo copiar el link. Intenta de nuevo.");
    }
  };

  const isLoading = isPending || (!invite && !failed);

  return (
    <div className="flex flex-col items-center gap-5 p-5">
      {isLoading ? (
        <div className="flex h-48 w-full items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : invite ? (
        <>
          <div className="rounded-2xl border-2 border-border bg-white p-4 shadow-neo-sm">
            <QRCodeSVG value={invite.url} size={150} title="Código QR de invitación" />
          </div>
          <p className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Vence el {invite.expiresAt.toLocaleDateString()}
          </p>
          <Button
            variant="secondary"
            className="h-12 w-full border-2 font-black uppercase text-xs shadow-neo-sm"
            onClick={() => void handleCopy()}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copiar link
          </Button>
        </>
      ) : (
        <div className="space-y-4 py-6 text-center">
          <p className="text-sm font-bold text-muted-foreground">
            No se pudo generar el link de invitación.
          </p>
          <Button
            variant="outline"
            className="h-10 border-2 font-black uppercase text-xs"
            onClick={() => {
              setFailed(false);
              mutate();
            }}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Reintentar
          </Button>
        </div>
      )}
    </div>
  );
}
