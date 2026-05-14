"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Pencil, Trash2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProductCommentsProps {
  productId: string;
}

function formatCommentDate(d: Date) {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  } catch {
    return "";
  }
}

export function ProductComments({ productId }: ProductCommentsProps) {
  const { data: session, status: sessionStatus } = useSession();
  const utils = trpc.useUtils();
  const { data: comments, isLoading } = trpc.bazar.getComments.useQuery({ productId });

  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  const addMutation = trpc.bazar.addComment.useMutation({
    onSuccess: () => {
      setDraft("");
      void utils.bazar.getComments.invalidate({ productId });
    },
    onError: (e) => alert(e.message),
  });

  const editMutation = trpc.bazar.editComment.useMutation({
    onSuccess: () => {
      setEditingId(null);
      setEditBody("");
      void utils.bazar.getComments.invalidate({ productId });
    },
    onError: (e) => alert(e.message),
  });

  const deleteMutation = trpc.bazar.deleteComment.useMutation({
    onSuccess: () => void utils.bazar.getComments.invalidate({ productId }),
    onError: (e) => alert(e.message),
  });

  const currentUserId = session?.user?.id;

  const handleAdd = () => {
    const body = draft.trim();
    if (!body) return;
    addMutation.mutate({ productId, body });
  };

  return (
    <div className="space-y-4 border-t-2 border-border pt-6">
      <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Preguntas y comentarios</h3>

      {sessionStatus === "authenticated" && (
        <div className="space-y-2">
          <Textarea
            placeholder="Escribe una pregunta o comentario…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-[88px] border-2 bg-background text-sm"
            maxLength={4000}
          />
          <div className="flex justify-between gap-2">
            <span className="text-[10px] font-bold text-muted-foreground">{draft.length}/4000</span>
            <Button
              type="button"
              size="sm"
              className="font-black uppercase"
              disabled={!draft.trim() || addMutation.isPending}
              onClick={handleAdd}
            >
              {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
              Publicar
            </Button>
          </div>
        </div>
      )}

      {sessionStatus === "unauthenticated" && (
        <p className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-4 text-center text-xs font-bold uppercase text-muted-foreground">
          <Link href="/login" className="text-primary underline underline-offset-2">
            Inicia sesión
          </Link>{" "}
          para comentar.
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !comments?.length ? (
        <p className="text-center text-xs font-bold uppercase text-muted-foreground">Aún no hay comentarios.</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => {
            const isOwn = currentUserId === c.authorId;
            const isEditing = editingId === c.id;

            return (
              <li key={c.id} className="rounded-xl border-2 border-border bg-card/50 p-4">
                <div className="mb-2 flex items-start gap-3">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted">
                    {c.authorAvatarUrl ? (
                      <Image src={c.authorAvatarUrl} alt="" fill sizes="40px" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-black text-muted-foreground">
                        ?
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="truncate font-black uppercase text-xs">{c.authorDisplayName}</span>
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {formatCommentDate(new Date(c.createdAt))}
                        {new Date(c.updatedAt).getTime() !== new Date(c.createdAt).getTime() && " · editado"}
                      </span>
                    </div>

                    {isEditing ? (
                      <div className="mt-2 space-y-2">
                        <Textarea
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          className="min-h-[72px] border-2 bg-background text-sm"
                          maxLength={4000}
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="font-black uppercase"
                            disabled={editMutation.isPending}
                            onClick={() => {
                              setEditingId(null);
                              setEditBody("");
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="font-black uppercase"
                            disabled={!editBody.trim() || editMutation.isPending}
                            onClick={() =>
                              editMutation.mutate({ commentId: c.id, body: editBody })
                            }
                          >
                            {editMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{c.body}</p>
                    )}
                  </div>
                </div>

                {isOwn && !isEditing && (
                  <div className="mt-3 flex justify-end gap-2 border-t border-border/60 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={cn("h-8 font-black uppercase text-[10px]")}
                      onClick={() => {
                        setEditingId(c.id);
                        setEditBody(c.body);
                      }}
                    >
                      <Pencil className="mr-1 h-3 w-3" /> Editar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 font-black uppercase text-[10px] text-destructive hover:text-destructive"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (confirm("¿Eliminar este comentario?")) {
                          deleteMutation.mutate({ commentId: c.id });
                        }
                      }}
                    >
                      <Trash2 className="mr-1 h-3 w-3" /> Quitar
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
