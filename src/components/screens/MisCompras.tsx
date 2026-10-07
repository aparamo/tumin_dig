"use client";

import Image from "next/image";
import Link from "next/link";
import { Loader2, ShoppingBag, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion";
import { CommunicateButton } from "@/components/contact/CommunicateButton";
import { trpc } from "@/lib/trpc/react";
import { useStore } from "@/lib/store";

export function MisCompras() {
  const setCurrentScreen = useStore((s) => s.setCurrentScreen);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.wallet.getMyPurchases.useInfiniteQuery(
    { limit: 12 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      initialCursor: 0,
    }
  );

  const purchases = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Mis compras</h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Historial de productos pagados con Túmin
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-11 border-2 font-black uppercase text-xs shadow-neo-sm"
          onClick={() => setCurrentScreen("bazar")}
        >
          <Store className="mr-2 h-4 w-4" /> Ir al Bazar
        </Button>
      </div>

      <StaggerContainer className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : purchases.length > 0 ? (
          purchases.map((item) => (
            <StaggerItem key={item.id}>
              <Card>
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl border-2 border-border bg-muted sm:h-20 sm:w-20">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        sizes="(max-width: 640px) 100vw, 80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                        <ShoppingBag className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <h2 className="truncate text-lg font-black uppercase tracking-tight">
                      {item.productName}
                    </h2>
                    <p className="text-xs font-bold text-muted-foreground">
                      Vendedor:{" "}
                      {item.seller.publicProfile ? (
                        <Link
                          href={`/u/${item.seller.id}`}
                          className="text-primary underline-offset-2 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {item.seller.displayName}
                        </Link>
                      ) : (
                        <span>{item.seller.displayName}</span>
                      )}
                    </p>
                    <p className="text-sm font-black tracking-tight">
                      {item.priceMxn != null && (
                        <>
                          <span className="text-primary">${item.priceMxn} MXN</span>
                          <span className="mx-1 text-muted-foreground">+</span>
                        </>
                      )}
                      <span className="text-secondary">{item.priceTumin} Ŧ</span>
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {new Intl.DateTimeFormat("es-MX", {
                        timeZone: "America/Mexico_City",
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(item.createdAt))}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                    <CommunicateButton
                      target={{
                        userId: item.seller.id,
                        displayName: item.seller.displayName,
                        contactMethods: [],
                        messageText: `Hola ${item.seller.displayName}, sobre mi compra: ${item.productName}`,
                      }}
                      className="h-11 w-full border-2 shadow-neo-sm sm:w-auto"
                      label="Contactar"
                    />
                    {item.productStillActive && (
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">
                        Producto aún activo en Bazar
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))
        ) : (
          <div className="neo-card border-2 border-dashed bg-muted/20 p-12 text-center text-sm font-bold uppercase tracking-widest text-muted-foreground shadow-none">
            Aún no has comprado productos con Túmin.
          </div>
        )}
      </StaggerContainer>

      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            className="h-10 border-2 px-6 text-xs font-black uppercase shadow-neo-sm sm:h-12 sm:px-8 sm:text-sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando…
              </>
            ) : (
              "Cargar más compras"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
