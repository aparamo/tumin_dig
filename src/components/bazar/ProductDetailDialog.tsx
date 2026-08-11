"use client";

import { useEffect, useState, startTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { trpc } from "@/lib/trpc/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle, ShoppingCart, ChevronLeft, ChevronRight, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductComments } from "@/components/bazar/ProductComments";
import { SaveContactButton } from "@/components/directory/SaveContactButton";
import type { PendingPurchase } from "@/lib/store";

export interface ProductDetailDialogProps {
  productId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBuy: (purchase: PendingPurchase) => void;
}

export function ProductDetailDialog({ productId, open, onOpenChange, onBuy }: ProductDetailDialogProps) {
  const [imgIndex, setImgIndex] = useState(0);
  const [showExtra, setShowExtra] = useState(false);

  const { data, isLoading, isError, error } = trpc.bazar.getProduct.useQuery(
    { id: productId ?? "" },
    { enabled: open && !!productId }
  );

  const sellerId = data?.seller?.id;
  const { data: savedContactsData } = trpc.directory.listSavedContacts.useQuery(
    { cursor: 0, pageSize: 100 },
    { enabled: open && !!sellerId && !!data?.seller?.publicProfile }
  );
  const isSellerSaved =
    !!sellerId &&
    (savedContactsData?.items.some((c) => c.contactUserId === sellerId) ?? false);

  useEffect(() => {
    if (!open) {
      startTransition(() => {
        setImgIndex(0);
        setShowExtra(false);
      });
    }
  }, [open, productId]);

  const images =
    data?.product.imgUrls && data.product.imgUrls.length > 0
      ? data.product.imgUrls
      : data?.product.imageUrl
        ? [data.product.imageUrl]
        : [];

  const seller = data?.seller;
  const product = data?.product;

  const waHref =
    seller?.phone && seller.showPhone
      ? (() => {
          const digits = seller.phone.replace(/\D/g, "");
          const withCountry = digits.startsWith("52") ? digits : `52${digits}`;
          const name = seller.displayName;
          const pname = product?.name ?? "";
          return `https://wa.me/${withCountry}?text=${encodeURIComponent(`Hola ${name}, me interesa: ${pname}`)}`;
        })()
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "z-50 flex flex-col gap-0 overflow-hidden bg-background p-0 ring-0",
          // Mobile: full-screen edge-to-edge
          "fixed inset-0 left-0 top-0 h-dvhh-[100dvh] w-full max-w-none translate-x-0 translate-y-0 rounded-none border-0 shadow-none",
          // sm+: centered modal, wide layout
          "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[90dvh] sm:w-full sm:max-w-3xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border-2 sm:border-border sm:shadow-neo"
        )}
      >
        {!productId || isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-background p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Cargando…</p>
          </div>
        ) : isError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
            <p className="text-center font-bold text-destructive">{error.message}</p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        ) : product && seller ? (
          <>
            <div className="relative shrink-0 border-b-2 border-border bg-muted">
              <div className="relative aspect-4/3 w-full max-h-[42vh] sm:max-h-[48vh]">
                {images.length > 0 ? (
                  <>
                    <Image
                      src={images[imgIndex]!}
                      alt={product.name}
                      fill
                      className="object-contain sm:object-cover"
                      sizes="100vw"
                      priority
                    />
                    {images.length > 1 && (
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="absolute left-2 top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full border-2 shadow-neo-sm"
                          onClick={() => setImgIndex((i) => (i - 1 + images.length) % images.length)}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="absolute right-2 top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full border-2 shadow-neo-sm"
                          onClick={() => setImgIndex((i) => (i + 1) % images.length)}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
                    <User className="h-20 w-20" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background p-4 pb-8 sm:p-6">
              <DialogHeader className="space-y-2 text-left">
                <div className="flex flex-wrap gap-2">
                  <Badge className="border-2 font-black uppercase">
                    {product.locationLabel ?? product.region}
                  </Badge>
                  {product.categories.slice(0, 4).map((cat) => (
                    <Badge key={cat} variant="secondary" className="border-2 text-[10px] font-black uppercase">
                      {cat}
                    </Badge>
                  ))}
                </div>
                <DialogTitle className="text-2xl font-black uppercase tracking-tight sm:text-3xl">{product.name}</DialogTitle>
                <div className="flex flex-wrap items-baseline gap-3 text-foreground">
                  <span className="text-2xl font-black text-primary">
                    $ {product.priceMxn} <span className="text-[10px] uppercase text-muted-foreground">MXN</span>
                  </span>
                  <span className="text-2xl font-black text-secondary">
                    + {product.priceTumin} <span className="text-[10px] uppercase text-muted-foreground">Ŧ</span>
                  </span>
                </div>
                <DialogDescription className="sr-only">
                  Precios en pesos mexicanos y Túmin para {product.name}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descripción</h4>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{product.description || "—"}</p>
              </div>

              {product.extraInfo && (
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="mb-2 h-10 border-2 font-black uppercase"
                    onClick={() => setShowExtra((v) => !v)}
                  >
                    {showExtra ? "Ocultar" : "Más información"}
                  </Button>
                  {showExtra && (
                    <div className="rounded-xl border-2 border-border bg-muted/30 p-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{product.extraInfo}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 flex items-center gap-4 rounded-xl border-2 border-border bg-card p-4">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted">
                  {seller.avatarUrl ? (
                    <Image src={seller.avatarUrl} alt="" fill sizes="56px" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <User className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vendedor</p>
                  <p className="truncate font-black uppercase">{seller.displayName}</p>
                  {seller.publicProfile ? (
                    <Link
                      href={`/u/${seller.id}`}
                      className="text-xs font-bold text-primary underline underline-offset-2"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver perfil público
                    </Link>
                  ) : (
                    <p className="text-xs font-bold text-muted-foreground">Perfil privado</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {waHref ? (
                  <Button asChild variant="outline" className="h-12 flex-1 border-2 shadow-neo-sm">
                    <a href={waHref} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="mr-2 h-5 w-5" /> WhatsApp
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" className="h-12 flex-1 border-2 opacity-60" disabled>
                    <MessageCircle className="mr-2 h-5 w-5" /> Contacto no disponible
                  </Button>
                )}
                <Button
                  type="button"
                  variant="default"
                  className="h-12 flex-1 shadow-neo-sm"
                  onClick={() => {
                    onBuy({
                      sellerId: seller.id,
                      sellerName: seller.displayName,
                      sellerPhone: seller.phone ?? null,
                      sellerEmail: seller.email ?? null,
                      productName: product.name,
                      priceTumin: product.priceTumin,
                    });
                    onOpenChange(false);
                  }}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" /> Comprar
                </Button>
                {seller.publicProfile && (
                  <SaveContactButton
                    contactUserId={seller.id}
                    isSaved={isSellerSaved}
                    className="h-12 flex-1"
                  />
                )}
              </div>

              <ProductComments productId={product.id} />
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
