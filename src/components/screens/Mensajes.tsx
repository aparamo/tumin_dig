"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc/react";
import { useStore } from "@/lib/store";
import { AUTOMATED_MESSAGE_NOTE } from "@/lib/auto-messages";
import { cn } from "@/lib/utils";

export function Mensajes() {
  const pending = useStore((s) => s.pendingConversationPeer);
  const setPending = useStore((s) => s.setPendingConversationPeer);
  const [activeId, setActiveId] = useState<string | null>(pending?.conversationId ?? null);
  const utils = trpc.useUtils();

  useEffect(() => {
    if (pending?.conversationId) {
      setActiveId(pending.conversationId);
      setPending(null);
    }
  }, [pending, setPending]);

  const { data: conversations, isLoading } = trpc.messaging.listConversations.useQuery(
    undefined,
    { refetchInterval: activeId ? false : 15_000 }
  );

  if (activeId) {
    return (
      <ThreadView
        conversationId={activeId}
        onBack={() => {
          setActiveId(null);
          void utils.messaging.listConversations.invalidate();
          void utils.messaging.unreadCount.invalidate();
        }}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 pb-24 md:pb-8">
      <h1 className="text-2xl font-black uppercase tracking-tight">Mensajes</h1>
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !conversations?.length ? (
        <p className="text-sm text-muted-foreground">
          Aún no tienes conversaciones. Usa <strong>Comunicarse → Mensaje en Túmin</strong> desde el
          bazar o el directorio.
        </p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-muted/50"
                onClick={() => setActiveId(c.id)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold truncate">{c.peer.displayName}</span>
                    {c.unreadCount > 0 ? (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-primary-foreground">
                        {c.unreadCount}
                      </span>
                    ) : null}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.lastMessage?.body ?? "Sin mensajes"}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ThreadView({
  conversationId,
  onBack,
}: {
  conversationId: string;
  onBack: () => void;
}) {
  const [body, setBody] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.messaging.getThread.useQuery(
    { conversationId, limit: 80 },
    { refetchInterval: 8_000 }
  );

  const markRead = trpc.messaging.markRead.useMutation({
    onSuccess: () => {
      void utils.messaging.unreadCount.invalidate();
      void utils.messaging.listConversations.invalidate();
    },
  });

  useEffect(() => {
    markRead.mutate({ conversationId });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mark once when opening thread
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages?.length]);

  const send = trpc.messaging.sendMessage.useMutation({
    onSuccess: async () => {
      setBody("");
      await utils.messaging.getThread.invalidate({ conversationId });
      await utils.messaging.listConversations.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="mx-auto flex h-[calc(100dvh-8rem)] w-full max-w-2xl flex-col md:h-[calc(100dvh-6rem)]">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Button type="button" variant="ghost" size="icon-sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="font-black truncate">{data?.peer.displayName ?? "…"}</h2>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          data?.messages.map((m) => {
            const mine = m.senderId !== data.peer.id;
            return (
              <div
                key={m.id}
                className={cn(
                  "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                  mine ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                <p className="whitespace-pre-wrap">{m.body}</p>
                {m.isAutomated ? (
                  <p
                    className={cn(
                      "mt-1.5 text-[10px] leading-snug",
                      mine ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}
                  >
                    {AUTOMATED_MESSAGE_NOTE}
                  </p>
                ) : null}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="flex gap-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = body.trim();
          if (!trimmed) return;
          send.mutate({ conversationId, body: trimmed });
        }}
      >
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Escribe un mensaje…"
          className="min-h-11 max-h-32 resize-none"
          rows={1}
        />
        <Button type="submit" size="icon" disabled={send.isPending || !body.trim()}>
          {send.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
