"use client";

import { useMemo, useState } from "react";
import { MessagesSquare, ChevronDown, Copy, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CHANNEL_LABELS,
  buildContactLink,
  splitContactMethodsForUi,
  type ContactChannelId,
  type PublicContactMethod,
} from "@/lib/contact-links";
import { trpc } from "@/lib/trpc/react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export interface CommunicateTarget {
  userId: string;
  displayName: string;
  contactMethods: PublicContactMethod[];
  /** Prefill for WA/Telegram/SMS */
  messageText?: string;
}

interface CommunicateButtonProps {
  target: CommunicateTarget;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm";
  className?: string;
  label?: string;
  /** Solo ícono (p. ej. cards del Bazar) */
  iconOnly?: boolean;
  disabled?: boolean;
}

export function CommunicateButton({
  target,
  variant = "outline",
  size = "default",
  className,
  label = "Comunicarse",
  iconOnly = false,
  disabled = false,
}: CommunicateButtonProps) {
  const [open, setOpen] = useState(false);
  const hasMethods = target.contactMethods.length > 0;
  const resolvedSize = iconOnly && size === "default" ? "icon" : size;

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={resolvedSize}
        className={className}
        disabled={disabled}
        aria-label={iconOnly ? label : undefined}
        onClick={() => setOpen(true)}
      >
        <MessagesSquare className={cn("h-4 w-4", !iconOnly && "mr-2")} />
        {!iconOnly ? label : null}
      </Button>
      <CommunicateDialog
        open={open}
        onOpenChange={setOpen}
        target={target}
        emptyHint={!hasMethods}
      />
    </>
  );
}

interface CommunicateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: CommunicateTarget;
  emptyHint?: boolean;
}

export function CommunicateDialog({
  open,
  onOpenChange,
  target,
  emptyHint,
}: CommunicateDialogProps) {
  const [showMore, setShowMore] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const setCurrentScreen = useStore((s) => s.setCurrentScreen);
  const setPendingConversationPeer = useStore((s) => s.setPendingConversationPeer);
  const utils = trpc.useUtils();
  const startConv = trpc.messaging.startOrGetConversation.useMutation({
    onSuccess: (data) => {
      setPendingConversationPeer({
        peerUserId: target.userId,
        conversationId: data.conversationId,
      });
      onOpenChange(false);
      setCurrentScreen("mensajes");
      void utils.messaging.listConversations.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const { primary, secondary } = useMemo(
    () => splitContactMethodsForUi(target.contactMethods),
    [target.contactMethods]
  );

  const visibleSecondary = showMore ? secondary : [];
  const hasMore = secondary.length > 0;

  function activateMethod(m: PublicContactMethod) {
    const action = buildContactLink(
      m.channel as ContactChannelId,
      m.value,
      { text: target.messageText },
      m.label
    );
    if (action.kind === "open") {
      window.open(action.href, "_blank", "noopener,noreferrer");
    } else {
      void navigator.clipboard.writeText(action.text).then(
        () => toast.success("Copiado al portapapeles"),
        () => toast.error("No se pudo copiar")
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setShowMore(false);
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[min(90dvh,640px)] w-[calc(100%-1.5rem)] max-w-md overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-black uppercase tracking-wide">
            Comunicarse
          </DialogTitle>
          <DialogDescription>
            Con {target.displayName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {session?.user ? (
            <Button
              type="button"
              variant="default"
              className="justify-start font-bold"
              disabled={startConv.isPending || session.user.id === target.userId}
              onClick={() =>
                startConv.mutate({
                  peerUserId: target.userId,
                  initialMessage: target.messageText,
                })
              }
            >
              <Send className="mr-2 h-4 w-4" />
              Mensaje en Túmin
            </Button>
          ) : (
            <Button
              type="button"
              variant="default"
              className="justify-start font-bold"
              onClick={() => {
                onOpenChange(false);
                router.push("/login");
              }}
            >
              <Send className="mr-2 h-4 w-4" />
              Inicia sesión para mensajear
            </Button>
          )}

          {emptyHint && primary.length === 0 && secondary.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              Esta persona no publicó formas de contacto externas.
              {session?.user
                ? " Puedes escribirle a través de esta plataforma."
                : " Inicia sesión para enviarle un mensaje en la plataforma."}
            </p>
          ) : null}

          {[...primary, ...visibleSecondary].map((m) => (
            <Button
              key={m.id}
              type="button"
              variant="outline"
              className="justify-start font-bold"
              onClick={() => activateMethod(m)}
            >
              {m.channel === "other" && m.label ? (
                m.label
              ) : (
                CHANNEL_LABELS[m.channel as ContactChannelId]
              )}
              {buildContactLink(m.channel as ContactChannelId, m.value, {}, m.label).kind ===
              "copy" ? (
                <Copy className="ml-auto h-3.5 w-3.5 opacity-60" />
              ) : null}
            </Button>
          ))}

          {hasMore && !showMore ? (
            <Button
              type="button"
              variant="ghost"
              className="text-xs font-black uppercase tracking-widest"
              onClick={() => setShowMore(true)}
            >
              <ChevronDown className="mr-1 h-4 w-4" />
              Mostrar más opciones
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
