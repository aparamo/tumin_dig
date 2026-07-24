"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadButton, createUploadBeginHandlers, getUploadedFileUrl, UPLOAD_LIMIT_BYTES, UPLOAD_LIMITS } from "@/lib/uploadthing";
import { useFeedback } from "@/components/FeedbackProvider";
import { parseErrorMessage } from "@/lib/parse-error";
import { Loader2, Megaphone, ImageIcon, Info, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_BADGE = {
  PENDIENTE: { label: "Pendiente", className: "bg-amber-100 text-amber-700 border-amber-200" },
  ACTIVO: { label: "Activo", className: "bg-green-100 text-green-700 border-green-200" },
  INACTIVO: { label: "Inactivo", className: "bg-slate-100 text-slate-700 border-slate-200" },
} as const;

export function GestionAnuncios() {
  const utils = trpc.useUtils();
  const { notifySuccess, notifyError } = useFeedback();
  const uploadHandlers = useMemo(
    () =>
      createUploadBeginHandlers(
        { notifyError, notifySuccess },
        {
          imageMaxBytes: UPLOAD_LIMIT_BYTES.userMediaImage,
          videoMaxBytes: UPLOAD_LIMIT_BYTES.userMediaVideo,
          label: "la imagen del anuncio",
        },
      ),
    [notifyError, notifySuccess],
  );

  const { data: myAds, isLoading: isLoadingAds } = trpc.ads.getMyAds.useQuery();
  const { data: myProducts, isLoading: isLoadingProducts } = trpc.bazar.getMyProducts.useQuery();

  const [productId, setProductId] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [requestedUntil, setRequestedUntil] = useState<string>("");

  const selectedProduct = myProducts?.find((p) => p.id === productId);

  const createAd = trpc.ads.createAd.useMutation({
    onSuccess: () => {
      notifySuccess("Solicitud de anuncio enviada.");
      setProductId("");
      setImageUrl("");
      setDescription("");
      setRequestedUntil("");
      utils.ads.getMyAds.invalidate();
      utils.user.listMedia.invalidate();
      utils.user.getMediaUsage.invalidate();
    },
    onError: (e) => notifyError(parseErrorMessage(e)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      notifyError("Sube o selecciona una imagen para el anuncio.");
      return;
    }
    createAd.mutate({
      imageUrl,
      productId: productId || undefined,
      description: description.trim() || undefined,
      requestedUntil: requestedUntil ? new Date(requestedUntil) : undefined,
    });
  };

  const handleUseProductImage = () => {
    const firstImage = selectedProduct?.imgUrls?.[0] || selectedProduct?.imageUrl;
    if (firstImage) setImageUrl(firstImage);
  };

  return (
    <div className="flex flex-col gap-8 p-4 max-w-3xl mx-auto w-full pb-12">
      <div className="space-y-1">
        <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-2">
          <Megaphone className="w-8 h-8 text-primary" /> Mis Anuncios
        </h1>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Solicita un mes de anuncio comunitario gratis
        </p>
      </div>

      <Card className="border-2 border-border shadow-neo-sm">
        <CardHeader>
          <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" /> Nuevo Anuncio
          </CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase">
            Selecciona un producto (opcional), sube una imagen y escribe un mensaje corto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase">Producto (opcional)</Label>
              <Select value={productId} onValueChange={(v) => setProductId(v ?? "")}>
                <SelectTrigger className="h-12 border-2 bg-background text-xs font-bold">
                  <SelectValue placeholder="Sin producto específico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin producto específico</SelectItem>
                  {isLoadingProducts ? (
                    <SelectItem value="__loading__" disabled>Cargando...</SelectItem>
                  ) : (
                    myProducts?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedProduct && (
                <div className="flex items-center gap-3 rounded-xl border-2 border-border bg-muted/20 p-3">
                  {selectedProduct.imgUrls?.[0] || selectedProduct.imageUrl ? (
                    <div className="relative w-12 h-12 rounded-lg border-2 border-border overflow-hidden bg-muted shrink-0">
                      <Image
                        src={selectedProduct.imgUrls?.[0] || selectedProduct.imageUrl || ""}
                        alt={selectedProduct.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black uppercase truncate">{selectedProduct.name}</p>
                    <p className="text-[10px] font-bold text-muted-foreground">
                      ${selectedProduct.priceMxn} + {selectedProduct.priceTumin} Ŧ
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-[10px] font-black uppercase"
                    onClick={handleUseProductImage}
                  >
                    Usar imagen
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase">Imagen del anuncio</Label>
              <div className="border-2 border-dashed border-border rounded-xl p-4 bg-muted/20 flex flex-col items-center justify-center text-center gap-3">
                {imageUrl ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-border bg-muted">
                    <Image src={imageUrl} alt="Vista previa" fill className="object-cover" />
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2 justify-center">
                  <UploadButton
                    endpoint="userMedia"
                    onBeforeUploadBegin={uploadHandlers.onBeforeUploadBegin}
                    onClientUploadComplete={(res) => {
                      const url = getUploadedFileUrl(res[0] ?? {});
                      if (url) setImageUrl(url);
                      utils.user.listMedia.invalidate();
                      utils.user.getMediaUsage.invalidate();
                    }}
                    onUploadError={uploadHandlers.onUploadError}
                    content={{
                      button: imageUrl ? "Cambiar imagen" : "Subir imagen",
                      allowedContent: `Hasta ${UPLOAD_LIMITS.userMediaImage} (se optimiza si pesa de más)`,
                    }}
                    appearance={{
                      button: "neo-btn bg-primary text-primary-foreground font-black uppercase text-xs h-10 px-4",
                      allowedContent: "text-[9px] font-bold uppercase text-muted-foreground mt-1",
                    }}
                  />
                  {imageUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 text-[10px] font-black uppercase"
                      onClick={() => setImageUrl("")}
                    >
                      Quitar
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-[10px] font-black uppercase">Mensaje del anuncio</Label>
                <span className="text-[10px] font-bold text-muted-foreground">{description.length}/120</span>
              </div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 120))}
                placeholder="Ej. Taller de tés medicinales este sábado"
                className="min-h-20 border-2 bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase flex items-center gap-1">
                <Calendar className="w-3 h-3" /> ¿Hasta cuándo lo quieres activo? (opcional)
              </Label>
              <Input
                type="date"
                value={requestedUntil}
                onChange={(e) => setRequestedUntil(e.target.value)}
                className="h-12 border-2 bg-background"
              />
            </div>

            <Button
              type="submit"
              className="w-full md:w-auto h-12 font-black uppercase"
              disabled={createAd.isPending || !imageUrl}
            >
              {createAd.isPending ? <Loader2 className="animate-spin mr-2" /> : <Megaphone className="w-4 h-4 mr-2" />}
              Enviar Solicitud
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="bg-secondary/10 border-2 border-secondary border-dashed rounded-xl p-4 space-y-2">
        <h4 className="font-black uppercase text-xs flex items-center gap-2">
          <Info className="w-4 h-4" /> ¿Cómo funciona?
        </h4>
        <ul className="text-xs text-muted-foreground font-medium space-y-1 list-disc pl-4">
          <li>Tu solicitud es revisada por un coordinador de tu región.</li>
          <li>Si se aprueba, tu anuncio aparece en la pantalla de inicio por 1 mes.</li>
          <li>Es completamente gratis para los socios.</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black uppercase tracking-tight">Mis solicitudes</h2>
        {isLoadingAds ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : myAds && myAds.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myAds.map((ad) => {
              const badge = STATUS_BADGE[ad.status];
              return (
                <Card key={ad.id} className="border-2 border-border shadow-neo-sm overflow-hidden">
                  <div className="relative aspect-video w-full bg-muted">
                    <Image src={ad.imageUrl} alt="Anuncio" fill className="object-cover" />
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <Badge className={cn("font-black uppercase text-[10px]", badge.className)}>
                        {badge.label}
                      </Badge>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">
                        {new Date(ad.createdAt).toLocaleDateString("es-MX")}
                      </span>
                    </div>
                    {ad.productName && (
                      <p className="text-xs font-black uppercase text-primary truncate">
                        {ad.productName}
                      </p>
                    )}
                    {ad.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{ad.description}</p>
                    )}
                    {ad.expiresAt && (
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">
                        Activo hasta: {new Date(ad.expiresAt).toLocaleDateString("es-MX")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-muted/20 border-dashed border-2 shadow-none p-8 text-center text-muted-foreground font-bold uppercase text-sm">
            Aún no has solicitado anuncios.
          </Card>
        )}
      </div>
    </div>
  );
}
