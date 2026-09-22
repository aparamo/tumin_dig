"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CHANNEL_LABELS,
  CONTACT_GROUP_A,
  CONTACT_GROUP_B,
  channelPlaceholder,
  type ContactChannelId,
} from "@/lib/contact-links";
import { trpc } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";

interface ManageContactMethodsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageContactMethodsDialog({
  open,
  onOpenChange,
}: ManageContactMethodsDialogProps) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.contactMethods.listMine.useQuery(undefined, {
    enabled: open,
  });
  const [showMoreChannels, setShowMoreChannels] = useState(false);
  const [adding, setAdding] = useState<ContactChannelId | null>(null);
  const [draftValue, setDraftValue] = useState("");
  const [draftLabel, setDraftLabel] = useState("");

  const setShow = trpc.contactMethods.setShowContactMethods.useMutation({
    onSuccess: async () => {
      await utils.contactMethods.listMine.invalidate();
      await utils.user.fullMe.invalidate();
      toast.success("Privacidad actualizada");
    },
    onError: (e) => toast.error(e.message),
  });

  const upsert = trpc.contactMethods.upsert.useMutation({
    onSuccess: async () => {
      await utils.contactMethods.listMine.invalidate();
      await utils.user.fullMe.invalidate();
      setAdding(null);
      setDraftValue("");
      setDraftLabel("");
      toast.success("Guardado");
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = trpc.contactMethods.delete.useMutation({
    onSuccess: async () => {
      await utils.contactMethods.listMine.invalidate();
      await utils.user.fullMe.invalidate();
      toast.success("Eliminado");
    },
    onError: (e) => toast.error(e.message),
  });

  const setPublic = trpc.contactMethods.setMethodPublic.useMutation({
    onSuccess: async () => {
      await utils.contactMethods.listMine.invalidate();
      await utils.user.fullMe.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const usedChannels = useMemo(() => {
    const s = new Set(
      (data?.methods ?? [])
        .filter((m) => m.channel !== "other")
        .map((m) => m.channel as ContactChannelId)
    );
    return s;
  }, [data?.methods]);

  const addableA = CONTACT_GROUP_A.filter((c) => !usedChannels.has(c));
  const addableB = CONTACT_GROUP_B.filter(
    (c) => c === "other" || !usedChannels.has(c)
  );

  function startAdd(channel: ContactChannelId) {
    setAdding(channel);
    setDraftValue("");
    setDraftLabel("");
  }

  function submitAdd() {
    if (!adding) return;
    upsert.mutate({
      channel: adding,
      value: draftValue || (adding === "other" ? draftLabel : draftValue),
      label: adding === "other" ? draftLabel : null,
      isPublic: false,
      isEnabled: true,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "fixed inset-2 top-2 left-2 right-2 bottom-2 z-50 flex h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-xl p-0 sm:inset-4 sm:h-[calc(100dvh-2rem)] sm:w-[calc(100%-2rem)] sm:max-w-2xl sm:left-1/2 sm:-translate-x-1/2"
        )}
      >
        <DialogHeader className="shrink-0 border-b p-4 pr-12">
          <DialogTitle className="font-black uppercase tracking-wide">
            Formas de contacto
          </DialogTitle>
          <DialogDescription>
            Elige qué medios agregar y cuáles mostrar públicamente en el bazar y tu perfil.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-0 flex-1 px-4">
          <div className="flex flex-col gap-6 py-4 pb-8">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide">
                      Mostrar formas de contacto
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Gate global: si está apagado, nadie ve tus métodos aunque estén marcados como públicos.
                    </p>
                  </div>
                  <Switch
                    checked={data?.showContactMethods ?? false}
                    onCheckedChange={(v) => setShow.mutate({ showContactMethods: v })}
                    disabled={setShow.isPending}
                  />
                </div>

                <section className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Tus métodos
                  </h3>
                  {(data?.methods ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Ninguno aún. Agrega uno abajo.</p>
                  ) : (
                    <ul className="space-y-2">
                      {(data?.methods ?? []).map((m) => (
                        <li
                          key={m.id}
                          className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="font-bold">
                              {m.channel === "other" && m.label
                                ? m.label
                                : CHANNEL_LABELS[m.channel as ContactChannelId]}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">{m.value}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <label className="flex items-center gap-2 text-xs font-bold">
                              <Switch
                                checked={m.isPublic}
                                onCheckedChange={(v) =>
                                  setPublic.mutate({ id: m.id, isPublic: v })
                                }
                              />
                              Público
                            </label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => remove.mutate({ id: m.id })}
                              aria-label="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Agregar
                  </h3>
                  {adding ? (
                    <div className="space-y-3 rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-bold">
                          {CHANNEL_LABELS[adding]}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setAdding(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {adding === "other" ? (
                        <div className="space-y-2">
                          <Label>Nombre</Label>
                          <Input
                            value={draftLabel}
                            onChange={(e) => setDraftLabel(e.target.value)}
                            placeholder="Ej. Radio local"
                          />
                        </div>
                      ) : null}
                      <div className="space-y-2">
                        <Label>
                          {adding === "other" ? "URL (opcional)" : "Dato"}
                        </Label>
                        <Input
                          value={draftValue}
                          onChange={(e) => setDraftValue(e.target.value)}
                          placeholder={channelPlaceholder(adding)}
                        />
                      </div>
                      <Button
                        type="button"
                        disabled={upsert.isPending}
                        onClick={submitAdd}
                      >
                        {upsert.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="mr-2 h-4 w-4" />
                        )}
                        Guardar
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {addableA.map((c) => (
                          <Button
                            key={c}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => startAdd(c)}
                          >
                            <Plus className="mr-1 h-3.5 w-3.5" />
                            {CHANNEL_LABELS[c]}
                          </Button>
                        ))}
                      </div>
                      {showMoreChannels ? (
                        <div className="flex flex-wrap gap-2">
                          {addableB.map((c) => (
                            <Button
                              key={c}
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => startAdd(c)}
                            >
                              <Plus className="mr-1 h-3.5 w-3.5" />
                              {CHANNEL_LABELS[c]}
                            </Button>
                          ))}
                        </div>
                      ) : addableB.length > 0 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs font-black uppercase tracking-widest"
                          onClick={() => setShowMoreChannels(true)}
                        >
                          Otras formas…
                        </Button>
                      ) : null}
                    </>
                  )}
                </section>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
