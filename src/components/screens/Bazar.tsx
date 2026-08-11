"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Plus, Search, Star, MessageCircle, ShoppingCart, 
  ShoppingBag, Sparkles, MapPin, ArrowUpDown
} from "lucide-react";
import { useStore } from "@/lib/store";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion";
import { ProductDetailDialog } from "@/components/bazar/ProductDetailDialog";
import { CategoryFilterDialog } from "@/components/directory/CategoryFilterDialog";
import { MEXICO_STATES } from "@/lib/location";
import { PRODUCT_CATEGORY_ICONS, isProductCategory } from "@/lib/product-categories";
import { useFeedback } from "@/components/FeedbackProvider";
import { cn } from "@/lib/utils";

const FILTER_LABEL =
  "mb-1 ml-1 block text-[10px] font-black uppercase tracking-widest text-muted-foreground";

const FILTER_TRIGGER =
  "h-12 w-full min-w-0 justify-between gap-1.5 border-2 border-border bg-card px-2.5 text-sm font-bold shadow-none data-[size=default]:h-12";

export function Bazar() {
  const { setCurrentScreen, setOpenGestionProductCreate, setPendingPurchase } = useStore();
  const { notifyError } = useFeedback();
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("Todas");
  const [locationState, setLocationState] = useState("Todas");
  const [sortBy, setSortBy] = useState<"recientes" | "menor_precio" | "mayor_precio">("recientes");
  const [detailProductId, setDetailProductId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { 
    data: productsData, 
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = trpc.bazar.getProducts.useInfiniteQuery({
    name: searchTerm || undefined,
    category: category === "Todas" ? undefined : category,
    locationState: locationState === "Todas" ? undefined : locationState,
    sortBy,
    limit: 12,
  }, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialCursor: 0,
  });

  const allProducts = productsData?.pages.flatMap(page => page.items) || [];

  const locationStates = ["Todas", ...MEXICO_STATES];

  const handleAddNewProduct = () => {
    setOpenGestionProductCreate(true);
    setCurrentScreen("gestion-productos");
  };

  const sortLabel =
    sortBy === "menor_precio"
      ? "Menor precio"
      : sortBy === "mayor_precio"
        ? "Mayor precio"
        : "Más recientes";

  return (
    <div className="flex flex-col gap-8 p-4 pb-12">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Bazar</h1>
        <Button 
          onClick={handleAddNewProduct}
          variant="secondary"
          className="h-12 shadow-neo-sm font-black uppercase text-xs sm:text-sm"
        >
          <Plus className="w-5 h-5 mr-1 shrink-0" /> Agregar nuevo
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-3">
        <div className="relative min-w-0 w-full flex-1">
          <Label className={FILTER_LABEL}>Buscar</Label>
          <Search className="pointer-events-none absolute bottom-3.5 left-3.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Productos..." 
            className="h-12 border-2 bg-card pl-10 text-sm font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 lg:w-[min(100%,42rem)] lg:shrink-0">
          <CategoryFilterDialog
            className="w-full"
            value={category}
            onChange={setCategory}
            labelClassName={cn(FILTER_LABEL, "md:text-[10px]")}
            triggerClassName="h-12 border-border bg-card text-sm font-bold md:text-sm data-[size=default]:h-12"
            description="Filtra productos y servicios del Bazar por categoría."
          />

          <div className="min-w-0">
            <Label className={FILTER_LABEL}>Ubicación</Label>
            <Select value={locationState} onValueChange={(val) => val && setLocationState(val)}>
              <SelectTrigger className={FILTER_TRIGGER}>
                <span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                  <MapPin className="size-4 shrink-0 opacity-80" aria-hidden />
                  <SelectValue placeholder="Estado" className="truncate font-bold" />
                </span>
              </SelectTrigger>
              <SelectContent className="border-2 bg-card max-h-64">
                {locationStates.map((r) => (
                  <SelectItem key={r} value={r} className="font-bold">
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0">
            <Label className={FILTER_LABEL}>Ordenar por</Label>
            <Select 
              value={sortBy} 
              onValueChange={(val) => {
                if (val === "recientes" || val === "menor_precio" || val === "mayor_precio") {
                  setSortBy(val);
                }
              }}
            >
              <SelectTrigger className={FILTER_TRIGGER}>
                <span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                  <ArrowUpDown className="size-4 shrink-0 opacity-80" aria-hidden />
                  <span className="truncate font-bold">{sortLabel}</span>
                </span>
              </SelectTrigger>
              <SelectContent className="border-2 bg-card">
                <SelectItem value="recientes" className="font-bold">Más recientes</SelectItem>
                <SelectItem value="menor_precio" className="font-bold">Menor precio</SelectItem>
                <SelectItem value="mayor_precio" className="font-bold">Mayor precio</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="flex justify-center p-12 col-span-full"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>
        ) : allProducts.length > 0 ? (
          allProducts.map((item) => (
            <StaggerItem key={item.product.id}>
              <Card
                className="group cursor-pointer overflow-hidden"
                onClick={() => {
                  setDetailProductId(item.product.id);
                  setDetailOpen(true);
                }}
              >
                <CardContent className="p-0">
                  {/* Image Container */}
                  <div className="aspect-square bg-muted relative overflow-hidden border-b-2 border-border">
                    {item.product.imgUrls && item.product.imgUrls.length > 0 ? (
                      <Image 
                        src={item.product.imgUrls[0]} 
                        alt={item.product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : item.product.imageUrl ? (
                      <Image 
                        src={item.product.imageUrl} 
                        alt={item.product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                        <ShoppingBag className="w-16 h-16" />
                      </div>
                    )}
                    
                    <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                      {item.product.isStarred && (
                        <Badge className="bg-secondary text-secondary-foreground border-2 border-border shadow-neo-sm font-black uppercase text-[10px]">
                          <Star className="mr-1 h-3 w-3 fill-current" /> Estrella
                        </Badge>
                      )}
                      <Badge className="bg-secondary text-secondary-foreground border-2 border-border shadow-neo-sm font-black uppercase text-[10px]">
                        {item.product.locationLabel ?? item.seller.locationCompact ?? "—"}
                      </Badge>
                    </div>

                    <div className="absolute bottom-3 left-3 flex gap-1">
                      {item.product.categories.slice(0, 2).map(cat => {
                        const Icon = isProductCategory(cat)
                          ? PRODUCT_CATEGORY_ICONS[cat]
                          : Sparkles;
                        return (
                          <div key={cat} className="bg-background/90 backdrop-blur-sm p-1.5 rounded-lg border border-border shadow-sm" title={cat}>
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="mb-2">
                      <h3 className="font-black text-base text-foreground uppercase tracking-tight leading-tight line-clamp-2 min-h-11 sm:text-lg">
                        {item.product.name}
                      </h3>
                    </div>
                    {item.product.description ? (
                      <p className="mb-3 line-clamp-2 text-[11px] font-medium leading-snug text-muted-foreground">
                        {item.product.description}
                      </p>
                    ) : null}
                    
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-2xl font-black text-primary tracking-tighter">
                        $ {item.product.priceMxn} <span className="text-[10px] uppercase text-muted-foreground font-bold">MXN</span>
                      </span>
                      <span className="text-2xl font-black text-secondary tracking-tighter">
                        + {item.product.priceTumin} <span className="text-[10px] uppercase text-muted-foreground font-bold">Ŧ</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-6">
                      {item.seller.publicProfile ? (
                        <Link
                          href={`/u/${item.seller.id}`}
                          className="max-w-35 truncate rounded border border-border bg-muted px-2 py-1 text-primary underline-offset-2 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {item.seller.displayName}
                        </Link>
                      ) : (
                        <div className="max-w-35 truncate rounded border border-border bg-muted px-2 py-1">
                          {item.seller.displayName}
                        </div>
                      )}
                      {item.avgRating > 0 && (
                        <span className="flex items-center text-accent font-black bg-accent/10 px-2 py-1 rounded border border-accent/20">
                          <Star className="w-3 h-3 fill-current mr-1" /> {item.avgRating.toFixed(1)}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="outline" 
                        className="flex-1 h-12 border shadow-neo-sm"
                        onClick={() => {
                          const sellerPhone = item.seller.phone;
                          if (!sellerPhone) {
                            notifyError("Este socio no ha habilitado el contacto por WhatsApp.");
                            return;
                          }
                          const phone = sellerPhone.replace(/\D/g, "");
                          window.open(`https://wa.me/${phone.startsWith("52") ? phone : "52" + phone}?text=Hola%20${encodeURIComponent(item.seller.displayName)},%20me%20interesa%20tu%20producto:%20${encodeURIComponent(item.product.name)}`, "_blank");
                        }}
                      >
                        <MessageCircle className="w-5 h-5 mr-2" /> WA
                      </Button>
                      <Button 
                        variant="default"
                        className="flex-2 h-12 shadow-neo-sm"
                        onClick={() => {
                          setPendingPurchase({
                            sellerId: item.seller.id,
                            sellerName: item.seller.displayName,
                            sellerPhone: item.seller.phone ?? null,
                            sellerEmail: null,
                            productName: item.product.name,
                            priceTumin: item.product.priceTumin,
                          });
                          setCurrentScreen("pagar");
                        }}
                      >
                        <ShoppingCart className="w-5 h-5 mr-2" /> Comprar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))
        ) : (
          <div className="neo-card bg-muted/20 border-dashed border-2 shadow-none p-12 text-center text-muted-foreground font-bold uppercase text-sm tracking-widest col-span-full">
            No hay productos disponibles.
          </div>
        )}
      </StaggerContainer>

      {hasNextPage && (
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            className="border-2 shadow-neo-sm font-black uppercase h-12 px-8"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="animate-spin mr-2 w-5 h-5" /> Cargando...
              </>
            ) : (
              "Cargar más productos"
            )}
          </Button>
        </div>
      )}

      <ProductDetailDialog
        productId={detailProductId}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setDetailProductId(null);
        }}
        onBuy={(purchase) => {
          setPendingPurchase(purchase);
          setCurrentScreen("pagar");
        }}
      />
    </div>
  );
}
