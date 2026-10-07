"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, ShoppingCart, Info, Star } from "lucide-react";

import { ProductDetailDialog } from "@/components/bazar/ProductDetailDialog";
import { CommunicateButton } from "@/components/contact/CommunicateButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PublicContactMethod } from "@/lib/contact-links";

export interface ProfileProduct {
  id: string;
  name: string;
  description: string | null;
  priceMxn: number;
  priceTumin: number;
  imgUrls: string[];
  imageUrl: string | null;
  isStarred?: boolean;
}

export interface ProfileProductsSectionProps {
  products: ProfileProduct[];
  sellerId: string;
  sellerName: string;
  contactMethods: PublicContactMethod[];
}

export function ProfileProductsSection({
  products,
  sellerId,
  sellerName,
  contactMethods,
}: ProfileProductsSectionProps) {
  const router = useRouter();
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailProductId, setDetailProductId] = useState<string | null>(null);

  const handleBuyFromDialog = useCallback(() => {
    router.push("/login");
  }, [router]);

  const empty = useMemo(() => products.length === 0, [products.length]);

  if (empty) {
    return (
      <section>
        <h2 className="mb-4 text-xl font-black uppercase tracking-tight">Productos en el bazar</h2>
        <p className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-8 text-center text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Sin productos activos por ahora.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-3 text-lg font-black uppercase tracking-tight sm:mb-4 sm:text-xl">
        Productos en el bazar
      </h2>
      <div className="grid max-w-full grid-cols-1 gap-3 overflow-x-hidden sm:grid-cols-2 sm:gap-4">
        {products.map((p) => {
          const cover = p.imgUrls[0] ?? p.imageUrl;

          return (
            <Card key={p.id} className="min-w-0 overflow-hidden border-2 shadow-neo-sm">
              <div className="relative aspect-video bg-muted">
                {cover ? (
                  <Image src={cover} alt={p.name} fill sizes="(max-width:640px) 100vw, 50vw" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground/40">
                    <ShoppingBag className="h-12 w-12" />
                  </div>
                )}
                {p.isStarred && (
                  <span
                    aria-label="Producto estrella"
                    title="Producto estrella"
                    className="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-md border-2 border-border bg-secondary text-secondary-foreground shadow-neo-sm"
                  >
                    <Star className="h-3.5 w-3.5 fill-current" />
                  </span>
                )}
              </div>
              <CardContent className="min-w-0 space-y-3 p-3 sm:p-4">
                <h3 className="line-clamp-2 font-black uppercase leading-tight">{p.name}</h3>
                <p className="line-clamp-2 text-xs text-muted-foreground">{p.description || "—"}</p>
                <div className="flex flex-wrap gap-2 text-base font-black sm:text-lg">
                  <span className="text-primary">$ {p.priceMxn} MXN</span>
                  <span className="text-secondary">+ {p.priceTumin} Ŧ</span>
                </div>
                <div className="flex min-w-0 flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 min-w-0 flex-1 border-2 px-2 text-[10px] shadow-neo-sm sm:h-11 sm:min-w-32 sm:px-4 sm:text-xs"
                    onClick={() => {
                      setDetailProductId(p.id);
                      setDetailOpen(true);
                    }}
                  >
                    <Info className="mr-1.5 h-4 w-4 shrink-0 sm:mr-2" />
                    Ver detalles
                  </Button>
                  <CommunicateButton
                    target={{
                      userId: sellerId,
                      displayName: sellerName,
                      contactMethods,
                      messageText: `Hola ${sellerName}, me interesa: ${p.name}`,
                    }}
                    iconOnly
                    label="Comunicarse"
                    className="h-10 w-10 shrink-0 border-2 shadow-neo-sm sm:h-11 sm:w-11"
                  />
                  <Button
                    asChild
                    variant="default"
                    className="h-10 min-w-0 flex-1 px-2 text-[10px] shadow-neo-sm sm:h-11 sm:min-w-28 sm:px-4 sm:text-xs"
                  >
                    <Link href="/login">
                      <ShoppingCart className="mr-1.5 h-4 w-4 shrink-0 sm:mr-2" />
                      Comprar
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ProductDetailDialog
        productId={detailProductId}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setDetailProductId(null);
        }}
        onBuy={handleBuyFromDialog}
      />
    </section>
  );
}
