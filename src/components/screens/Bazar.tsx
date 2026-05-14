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
  Utensils, Coffee, Shirt, Hammer, HeartPulse, Briefcase, 
  Palette, Home as HomeIcon, Sparkles, GraduationCap, 
  Presentation, Music, Ticket, Leaf,
  ShoppingBag, type LucideIcon
} from "lucide-react";
import { useStore } from "@/lib/store";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion";
import { ProductDetailDialog } from "@/components/bazar/ProductDetailDialog";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Alimentos": Utensils,
  "Bebidas": Coffee,
  "Ropa": Shirt,
  "Artesanías": Hammer,
  "Salud y Bienestar": HeartPulse,
  "Servicios Profesionales": Briefcase,
  "Arte": Palette,
  "Hogar": HomeIcon,
  "Cuidado Personal": Sparkles,
  "Educación": GraduationCap,
  "Talleres": Presentation,
  "Cultura": Music,
  "Entretenimiento": Ticket,
  "Agroecología y Jardinería": Leaf
};

function formatRegion(region: string) {
  if (region === "Estado de México") return "EdoMex";
  if (region === "Ciudad de México") return "CDMX";
  if (region === "Veracruz") return "Ver";
  if (region === "Oaxaca") return "Oax";
  if (region === "Chiapas") return "Chps";
  if (region === "Hidalgo") return "Hgo";
  if (region === "Morelos") return "Mor";
  return region;
}

export function Bazar() {
  const { setCurrentScreen, setOpenGestionProductCreate, setPendingPurchase } = useStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("Todas");
  const [region, setRegion] = useState("Todas");
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
    region: region === "Todas" ? undefined : region,
    sortBy,
    limit: 12,
  }, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialCursor: 0,
  });

  const allProducts = productsData?.pages.flatMap(page => page.items) || [];

  const categories = [
    "Alimentos", "Bebidas", "Ropa", "Artesanías", "Salud y Bienestar", 
    "Servicios Profesionales", "Arte", "Hogar", "Cuidado Personal", "Educación", 
    "Talleres", "Cultura", "Entretenimiento", "Agroecología y Jardinería"
  ];

  const regions = ["Todas", "Veracruz", "Chiapas", "Oaxaca", "Hidalgo", "Estado de México", "Morelos"];

  const handleAddNewProduct = () => {
    setOpenGestionProductCreate(true);
    setCurrentScreen("gestion-productos");
  };

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

      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full relative">
          <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1 mb-1 block">Buscar</Label>
          <Search className="absolute left-4 bottom-3 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Productos..." 
            className="pl-12 bg-card h-12 border-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-full md:w-48 space-y-1">
          <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1 block">Categoría</Label>
          <Select value={category} onValueChange={(val) => val && setCategory(val)}>
            <SelectTrigger className="h-12 bg-card border-2">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent className="bg-card border-2">
              <SelectItem value="Todas">Todas</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-48 space-y-1">
          <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1 block">Región</Label>
          <Select value={region} onValueChange={(val) => val && setRegion(val)}>
            <SelectTrigger className="h-12 bg-card border-2">
              <SelectValue placeholder="Región" />
            </SelectTrigger>
            <SelectContent className="bg-card border-2">
              {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-48 space-y-1">
          <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1 block">Ordenar Por</Label>
          <Select 
            value={sortBy} 
            onValueChange={(val) => {
              if (val === "recientes" || val === "menor_precio" || val === "mayor_precio") {
                setSortBy(val);
              }
            }}
          >
            <SelectTrigger className="h-12 bg-card border-2">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent className="bg-card border-2">
              <SelectItem value="recientes">Más Recientes</SelectItem>
              <SelectItem value="menor_precio">Menor Precio</SelectItem>
              <SelectItem value="mayor_precio">Mayor Precio</SelectItem>
            </SelectContent>
          </Select>
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
                    
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                      <Badge className="bg-secondary text-secondary-foreground border-2 border-border shadow-neo-sm font-black uppercase text-[10px]">
                        {formatRegion(item.product.region)}
                      </Badge>
                    </div>

                    <div className="absolute bottom-3 left-3 flex gap-1">
                      {item.product.categories.slice(0, 2).map(cat => {
                        const Icon = CATEGORY_ICONS[cat] || Sparkles;
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
                      <h3 className="font-black text-base text-foreground uppercase tracking-tight leading-tight line-clamp-2 min-h-[2.75rem] sm:text-lg">
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
                          className="max-w-[140px] truncate rounded border border-border bg-muted px-2 py-1 text-primary underline-offset-2 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {item.seller.displayName}
                        </Link>
                      ) : (
                        <div className="max-w-[140px] truncate rounded border border-border bg-muted px-2 py-1">
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
                            alert("Este socio no ha habilitado el contacto por WhatsApp.");
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
