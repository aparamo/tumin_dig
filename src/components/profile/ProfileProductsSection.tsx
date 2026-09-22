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
      <h2 className="mb-4 text-xl font-black uppercase tracking-tight">Productos en el bazar</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {products.map((p) => {
          const cover = p.imgUrls[0] ?? p.imageUrl;

          return (
            <Card key={p.id} className="overflow-hidden border-2">
              <div className="relative aspect-video bg-muted">
                {cover ? (
                  <Image src={cover} alt={p.name} fill sizes="(max-width:640px) 100vw, 50vw" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground/40">
                    <ShoppingBag className="h-12 w-12" />
                  </div>
                )}
                {p.isStarred && (
                  <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border-2 border-border bg-secondary px-2 py-0.5 text-[9px] font-black uppercase text-secondary-foreground shadow-neo-sm">
                    <Star className="h-3 w-3 fill-current" /> Estrella
                  </span>
                )}
              </div>
              <CardContent className="space-y-3 p-4">
                <h3 className="line-clamp-2 font-black uppercase leading-tight">{p.name}</h3>
                <p className="line-clamp-2 text-xs text-muted-foreground">{p.description || "—"}</p>
                <div className="flex flex-wrap gap-2 text-lg font-black">
                  <span className="text-primary">$ {p.priceMxn} MXN</span>
                  <span className="text-secondary">+ {p.priceTumin} Ŧ</span>
                </div>
                <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 flex-1 border-2 shadow-neo-sm sm:min-w-32"
                    onClick={() => {
                      setDetailProductId(p.id);
                      setDetailOpen(true);
                    }}
                  >
                    <Info className="mr-2 h-4 w-4 shrink-0" />
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
                    className="h-11 w-11 shrink-0 border-2 shadow-neo-sm"
                  />
                  <Button asChild variant="default" className="h-11 min-w-0 flex-1 shadow-neo-sm sm:min-w-28">
                    <Link href="/login">
                      <ShoppingCart className="mr-2 h-4 w-4 shrink-0" />
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
