"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Megaphone, Trash2, ExternalLink, ImageIcon } from "lucide-react";
import { useFeedback } from "@/components/FeedbackProvider";
import { useConfirm } from "@/hooks/use-confirm";
import { ENROLLMENT_REGIONS, MEXICO_STATES } from "@/lib/location";
import Image from "next/image";

const EMPTY_REGION = "__global__";
const EMPTY_STATE = "__global__";

export function SmartAdsPanel() {
  const utils = trpc.useUtils();
  const { notifySuccess, notifyError } = useFeedback();
  const { confirm, ConfirmDialog } = useConfirm();

  const [form, setForm] = useState({
    title: "",
    body: "",
    imageUrl: "",
    linkUrl: "",
    targetRegion: EMPTY_REGION,
    targetState: EMPTY_STATE,
    activeUntil: "",
  });

  const { data: ads, isLoading } = trpc.smartAds.list.useQuery();

  const createMutation = trpc.smartAds.create.useMutation({
    onSuccess: () => {
      notifySuccess("Aviso inteligente creado.");
      setForm({
        title: "",
        body: "",
        imageUrl: "",
        linkUrl: "",
        targetRegion: EMPTY_REGION,
        targetState: EMPTY_STATE,
        activeUntil: "",
      });
      utils.smartAds.list.invalidate();
    },
    onError: (e) => notifyError(e.message),
  });

  const deleteMutation = trpc.smartAds.delete.useMutation({
    onSuccess: () => {
      notifySuccess("Aviso eliminado.");
      utils.smartAds.list.invalidate();
    },
    onError: (e) => notifyError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    createMutation.mutate({
      title: form.title.trim(),
      body: form.body.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      linkUrl: form.linkUrl.trim() || undefined,
      targetRegion: form.targetRegion === EMPTY_REGION ? undefined : form.targetRegion,
      targetState: form.targetState === EMPTY_STATE ? undefined : form.targetState,
      activeUntil: form.activeUntil ? new Date(form.activeUntil) : undefined,
    });
  };

  const handleDelete = async (id: string, title: string) => {
    const ok = await confirm({
      title: "Eliminar aviso",
      description: `¿Seguro que quieres eliminar "${title}"?`,
      confirmText: "Eliminar",
      variant: "destructive",
    });
    if (ok) deleteMutation.mutate({ id });
  };

  return (
    <div className="space-y-6">
      <ConfirmDialog />
      <Card className="border-2 border-border shadow-neo-sm">
        <CardHeader>
          <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" /> Nuevo Aviso Inteligente
          </CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase">
            Dirige avisos por región de inscripción o estado de residencia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase">Título</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ej. Convocatoria mensual"
                className="border-2 h-12"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase">Mensaje</Label>
              <Textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Cuerpo del aviso..."
                className="border-2 min-h-[80px]"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" /> URL de imagen
                </Label>
                <Input
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://..."
                  className="border-2 h-12"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> Link
                </Label>
                <Input
                  value={form.linkUrl}
                  onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                  placeholder="https://..."
                  className="border-2 h-12"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Región objetivo</Label>
                <Select
                  value={form.targetRegion}
                  onValueChange={(v) => setForm((f) => ({ ...f, targetRegion: v ?? EMPTY_REGION }))}
                >
                  <SelectTrigger className="border-2 h-12 text-xs font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EMPTY_REGION}>Global</SelectItem>
                    {ENROLLMENT_REGIONS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Estado objetivo</Label>
                <Select
                  value={form.targetState}
                  onValueChange={(v) => setForm((f) => ({ ...f, targetState: v ?? EMPTY_STATE }))}
                >
                  <SelectTrigger className="border-2 h-12 text-xs font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EMPTY_STATE}>Global</SelectItem>
                    {MEXICO_STATES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Activo hasta</Label>
                <Input
                  type="date"
                  value={form.activeUntil}
                  onChange={(e) => setForm((f) => ({ ...f, activeUntil: e.target.value }))}
                  className="border-2 h-12"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full md:w-auto h-12 font-black uppercase"
              disabled={createMutation.isPending || !form.title.trim()}
            >
              {createMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <Megaphone className="w-4 h-4 mr-2" />}
              Publicar Aviso
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Avisos publicados</h3>
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>
        ) : ads && ads.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ads.map(({ ad, creator }) => (
              <Card key={ad.id} className="border-2 border-border shadow-neo-sm overflow-hidden">
                {ad.imageUrl && (
                  <div className="relative aspect-video w-full bg-muted">
                    <Image src={ad.imageUrl} alt={ad.title} fill className="object-cover" />
                  </div>
                )}
                <CardContent className="p-4 space-y-2">
                  <div className="font-black uppercase tracking-tight">{ad.title}</div>
                  {ad.body && <div className="text-xs text-muted-foreground font-medium line-clamp-2">{ad.body}</div>}
                  <div className="text-[10px] text-muted-foreground font-bold uppercase flex flex-wrap gap-x-3">
                    <span>Por: {creator.name}</span>
                    {ad.targetRegion && <span>Región: {ad.targetRegion}</span>}
                    {ad.targetState && <span>Edo: {ad.targetState}</span>}
                    {ad.activeUntil && (
                      <span>Hasta: {new Date(ad.activeUntil).toLocaleDateString()}</span>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    {ad.linkUrl && (
                      <Button asChild variant="outline" size="sm" className="font-black uppercase text-[10px] flex-1">
                        <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer">Ver link</a>
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="font-black uppercase text-[10px]"
                      onClick={() => handleDelete(ad.id, ad.title)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="neo-card bg-muted/20 border-dashed border-2 shadow-none p-12 text-center text-muted-foreground font-bold uppercase text-xs tracking-widest">
            No hay avisos publicados.
          </div>
        )}
      </div>
    </div>
  );
}
