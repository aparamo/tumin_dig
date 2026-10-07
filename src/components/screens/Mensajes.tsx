"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  MessagesSquare,
  Plus,
  Send,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { CommunicateDialog } from "@/components/contact/CommunicateButton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc/react";
import { useStore } from "@/lib/store";
import { AUTOMATED_MESSAGE_NOTE } from "@/lib/auto-messages";
import { cn } from "@/lib/utils";

export function Mensajes() {
  const pending = useStore((s) => s.pendingConversationPeer);
  const setPending = useStore((s) => s.setPendingConversationPeer);
  const [localId, setLocalId] = useState<string | null>(null);
  const utils = trpc.useUtils();

  // Prefer handoff from Comunicarse; otherwise the user's list selection.
  const activeId = pending?.conversationId ?? localId;

  function selectConversation(id: string | null) {
    if (pending) setPending(null);
    setLocalId(id);
    if (!id) {
      void utils.messaging.listConversations.invalidate();
      void utils.messaging.unreadCount.invalidate();
    }
  }

  const { data: conversations, isLoading } = trpc.messaging.listConversations.useQuery(
    undefined,
    { refetchInterval: 15_000 }
  );

  const showListOnMobile = !activeId;
  const showThreadOnMobile = !!activeId;

  return (
    <div className="flex h-full min-h-0 w-full max-w-full overflow-hidden">
      {/* Conversation list */}
      <aside
        className={cn(
          "flex min-h-0 w-full min-w-0 flex-col border-border md:w-80 md:shrink-0 md:border-r lg:w-96",
          showListOnMobile ? "flex" : "hidden md:flex"
        )}
      >
        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !conversations?.length ? (
            <p className="p-4 text-sm text-muted-foreground">
              Aún no tienes conversaciones. Usa <strong>Comunicarse → Mensaje directo</strong>{" "}
              desde el bazar o el directorio.
            </p>
          ) : (
            <ul className="divide-y">
              {conversations.map((c) => {
                const isActive = c.id === activeId;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      aria-current={isActive ? "true" : undefined}
                      className={cn(
                        "flex w-full min-w-0 items-center gap-2.5 px-3 py-3 text-left transition hover:bg-muted/50",
                        isActive && "bg-muted"
                      )}
                      onClick={() => selectConversation(c.id)}
                    >
                      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted">
                        {c.peer.avatarUrl ? (
                          <Image
                            src={c.peer.avatarUrl}
                            alt=""
                            fill
                            sizes="32px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <User className="h-4 w-4 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="min-w-0 truncate font-bold">
                            {c.peer.displayName}
                          </span>
                          {c.unreadCount > 0 ? (
                            <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-primary-foreground">
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
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Thread pane */}
      <section
        className={cn(
          "min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-hidden",
          showThreadOnMobile ? "flex" : "hidden md:flex"
        )}
      >
        {activeId ? (
          <ThreadView
            key={activeId}
            conversationId={activeId}
            onBack={() => selectConversation(null)}
          />
        ) : (
          <div className="hidden h-full flex-col items-center justify-center gap-2 p-8 text-center md:flex">
            <MessagesSquare className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-bold text-muted-foreground">Elige una conversación</p>
          </div>
        )}
      </section>
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
  const pending = useStore((s) => s.pendingConversationPeer);
  const setPending = useStore((s) => s.setPendingConversationPeer);
  const incomingDraft =
    pending?.conversationId === conversationId && pending.draftBody
      ? pending.draftBody
      : null;

  const [body, setBody] = useState(() => incomingDraft ?? "");
  const [seededDraft, setSeededDraft] = useState<string | null>(
    () => incomingDraft
  );
  const [communicateOpen, setCommunicateOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  // Apply a new handoff draft during render (React-approved prop→state adjust).
  if (incomingDraft !== null && incomingDraft !== seededDraft) {
    setSeededDraft(incomingDraft);
    setBody(incomingDraft);
  }

  const { data, isLoading } = trpc.messaging.getThread.useQuery(
    { conversationId, limit: 80 },
    { refetchInterval: 8_000 }
  );

  const peer = data?.peer;
  const contactMethods = peer?.contactMethods ?? [];

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

  // Consume draft from the Zustand handoff (external store only — no React setState).
  useEffect(() => {
    if (!incomingDraft) return;
    const current = useStore.getState().pendingConversationPeer;
    if (
      current?.conversationId === conversationId &&
      current.draftBody
    ) {
      setPending({
        peerUserId: current.peerUserId,
        conversationId: current.conversationId,
      });
    }
  }, [incomingDraft, conversationId, setPending]);

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
    <div className="flex h-full min-h-0 w-full max-w-full flex-col overflow-x-hidden">
      <div className="flex shrink-0 items-center gap-1.5 border-b px-2 py-2 sm:gap-2 sm:px-3">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onBack}
          className="shrink-0 md:hidden"
          aria-label="Volver a conversaciones"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted">
          {peer?.avatarUrl ? (
            <Image
              src={peer.avatarUrl}
              alt=""
              fill
              sizes="32px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <User className="h-4 w-4 text-muted-foreground/50" />
            </div>
          )}
        </div>
        <h2 className="min-w-0 flex-1 truncate text-sm font-black sm:text-base">
          {peer?.displayName ?? "…"}
        </h2>
        {peer?.publicProfile ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            asChild
            className="shrink-0 md:h-8 md:w-auto md:gap-1.5 md:px-2 md:text-[0.7rem]"
          >
            <Link
              href={`/u/${peer.id}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ver perfil"
            >
              <ExternalLink className="h-3.5 w-3.5 md:hidden" />
              <span className="hidden md:inline">Ver perfil</span>
            </Link>
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="h-8 w-auto shrink-0 gap-0.5 px-1.5"
          aria-label="Más formas de contacto"
          disabled={!peer}
          onClick={() => setCommunicateOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          <MessagesSquare className="h-3.5 w-3.5" />
        </Button>
      </div>

      {peer ? (
        <CommunicateDialog
          open={communicateOpen}
          onOpenChange={setCommunicateOpen}
          target={{
            userId: peer.id,
            displayName: peer.displayName,
            contactMethods,
            publicProfile: peer.publicProfile,
          }}
          emptyHint={contactMethods.length === 0}
          hideInAppMessage
        />
      ) : null}

      <div className="min-h-0 flex-1 space-y-2 overflow-x-hidden overflow-y-auto px-3 py-4">
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
                  "min-w-0 max-w-[85%] wrap-break-word rounded-xl px-3 py-2 text-sm",
                  mine ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                <p className="whitespace-pre-wrap wrap-break-word">
                  {m.body}
                </p>
                {m.isAutomated ? (
                  <p
                    className={cn(
                      "mt-1.5 text-[10px] leading-snug wrap-break-word",
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
        className="flex shrink-0 gap-2 border-t p-3"
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
          className="min-h-11 max-h-32 min-w-0 flex-1 resize-none"
          rows={1}
        />
        <Button
          type="submit"
          size="icon"
          className="shrink-0"
          disabled={send.isPending || !body.trim()}
        >
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
