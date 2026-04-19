"use client";

import { useState } from "react";
import Image from "next/image";
import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Loader2, Plus, Search, Star, MessageCircle, ShoppingCart, X, 
  Utensils, Coffee, Shirt, Hammer, HeartPulse, Briefcase, 
  Palette, Home as HomeIcon, Sparkles, GraduationCap, 
  Presentation, Music, Ticket, Leaf, ChevronLeft, ChevronRight,
  ShoppingBag, Trash2, type LucideIcon
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { UploadButton } from "@/lib/uploadthing";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion";

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
  const { setCurrentScreen } = useStore();
  const utils = trpc.useUtils();
  const { data: mediaList } = trpc.user.listMedia.useQuery();
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("Todas");
  const [region, setRegion] = useState("Todas");
  const [sortBy, setSortBy] = useState<"recientes" | "menor_precio" | "mayor_precio">("recientes");
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    priceMxn: 0,
    priceTumin: 0,
    categories: [] as string[],
    imageUrl: "",
    imgUrls: [] as string[],
  });

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

  const createProduct = trpc.bazar.createProduct.useMutation({
    onSuccess: () => {
      alert("¡Producto publicado correctamente!");
      setIsFormOpen(false);
      utils.bazar.getProducts.invalidate();
      setFormData({ name: "", priceMxn: 0, priceTumin: 0, categories: [], imageUrl: "", imgUrls: [] });
    },
    onError: (error) => alert(error.message),
  });

  const categories = [
    "Alimentos", "Bebidas", "Ropa", "Artesanías", "Salud y Bienestar", 
    "Servicios Profesionales", "Arte", "Hogar", "Cuidado Personal", "Educación", 
    "Talleres", "Cultura", "Entretenimiento", "Agroecología y Jardinería"
  ];

  const regions = ["Todas", "Veracruz", "Chiapas", "Oaxaca", "Hidalgo", "Estado de México", "Morelos"];

  const handleCategoryToggle = (cat: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(cat) 
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat]
    }));
  };

  const removeUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imgUrls: prev.imgUrls.filter((_, i) => i !== index)
    }));
  };

  const addUrl = () => {
    const urlInput = document.getElementById("external-url-input") as HTMLInputElement;
    const val = urlInput.value;
    if (!val) return;
    try {
      new URL(val);
      setFormData(prev => ({ ...prev, imgUrls: [...prev.imgUrls, val] }));
      urlInput.value = "";
    } catch (e) {
      alert("URL inválida");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = formData.priceMxn + formData.priceTumin;
    if (formData.priceTumin < total * 0.1) {
      alert("El precio en Túmin debe ser al menos el 10% del total.");
      return;
    }
    createProduct.mutate(formData);
  };

  return (
    <div className="flex flex-col gap-8 p-4 pb-12">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Bazar</h1>
        <Button 
          onClick={() => setIsFormOpen(true)}
          variant="secondary"
          className="h-12 shadow-neo-sm"
        >
          <Plus className="w-5 h-5 mr-1" /> Vender
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
              <Card className="group overflow-hidden">
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
                    <div className="mb-3">
                      <h3 className="font-black text-lg text-foreground uppercase tracking-tight leading-tight line-clamp-2 min-h-[3rem]">{item.product.name}</h3>
                    </div>
                    
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-2xl font-black text-primary tracking-tighter">
                        $ {item.product.priceMxn} <span className="text-[10px] uppercase text-muted-foreground font-bold">MXN</span>
                      </span>
                      <span className="text-2xl font-black text-secondary tracking-tighter">
                        + {item.product.priceTumin} <span className="text-[10px] uppercase text-muted-foreground font-bold">Ŧ</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-6">
                      <div className="bg-muted px-2 py-1 rounded border-border border max-w-[100px] truncate">
                        {item.seller.name}
                      </div>
                      {item.avgRating > 0 && (
                        <span className="flex items-center text-accent font-black bg-accent/10 px-2 py-1 rounded border border-accent/20">
                          <Star className="w-3 h-3 fill-current mr-1" /> {item.avgRating.toFixed(1)}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        className="flex-1 h-12 border-2"
                        onClick={() => {
                          const sellerPhone = item.seller.phone;
                          if (!sellerPhone) {
                            alert("Este socio no tiene un teléfono registrado.");
                            return;
                          }
                          const phone = sellerPhone.replace(/\D/g, "");
                          window.open(`https://wa.me/${phone.startsWith("52") ? phone : "52" + phone}?text=Hola%20${encodeURIComponent(item.seller.name)},%20me%20interesa%20tu%20producto:%20${encodeURIComponent(item.product.name)}`, "_blank");
                        }}
                      >
                        <MessageCircle className="w-5 h-5 mr-2" /> WA
                      </Button>
                      <Button 
                        variant="default"
                        className="flex-2 h-12"
                        onClick={() => setCurrentScreen("pagar")}
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

      {isFormOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-100 flex items-center justify-center p-4 overflow-auto py-10">
          <Card className="w-full max-w-md shadow-2xl relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-4 top-4 neo-btn bg-background h-10 w-10" 
              onClick={() => setIsFormOpen(false)}
            >
              <X className="w-6 h-6" />
            </Button>
            <CardHeader>
              <CardTitle className="text-3xl">Vender</CardTitle>
              <CardDescription className="font-bold uppercase text-[10px]">Publica tu producto o servicio</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label className="font-black uppercase text-xs">Nombre del Producto</Label>
                  <Input 
                    placeholder="Ej. Jabón Artesanal" 
                    className="bg-background"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-xs">Precio Pesos ($)</Label>
                    <Input 
                      type="number" 
                      className="bg-background font-black"
                      value={formData.priceMxn}
                      onChange={(e) => setFormData({...formData, priceMxn: parseFloat(e.target.value)})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-xs">Precio Túmin (Ŧ)</Label>
                    <Input 
                      type="number" 
                      className="bg-background font-black"
                      value={formData.priceTumin}
                      onChange={(e) => setFormData({...formData, priceTumin: parseFloat(e.target.value)})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-black uppercase text-xs">Categoría</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 bg-muted/30 rounded-lg border-2 border-border scrollbar-hide">
                    {categories.map(c => (
                      <div key={c} className="flex items-center gap-3 py-1">
                        <Checkbox 
                          id={c} 
                          checked={formData.categories.includes(c)}
                          onCheckedChange={() => handleCategoryToggle(c)}
                          className="h-5 w-5 border-2"
                        />
                        <label htmlFor={c} className="text-[10px] font-black uppercase cursor-pointer">{c}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t-2 border-border">
                  <div className="flex justify-between items-center mb-2">
                    <Label className="font-black uppercase text-xs">Imágenes del Producto</Label>
                    <UploadButton
                      endpoint="userMedia"
                      onClientUploadComplete={(res) => {
                        const newFiles = res.map(r => r.url);
                        setFormData(prev => ({
                          ...prev,
                          imgUrls: [...prev.imgUrls, ...newFiles]
                        }));
                        utils.user.listMedia.invalidate();
                        utils.user.getMediaUsage.invalidate();
                      }}
                      onUploadError={(e) => alert(e.message)}
                      content={{
                        button: "Subir Imagen",
                        allowedContent: "Imágenes permitidas"
                      }}
                      appearance={{
                        button: "neo-btn bg-secondary text-secondary-foreground uppercase font-black text-[10px] h-8 px-4 py-0",
                        allowedContent: "hidden"
                      }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {formData.imgUrls.map((url, i) => (
                      <div key={i} className="relative group w-16 h-16 rounded-lg border-2 border-border overflow-hidden bg-muted">
                        <Image src={url} alt="producto" fill sizes="64px" className="object-cover" />
                        <button 
                          type="button" 
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeUrl(i)}
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ))}
                    {formData.imgUrls.length === 0 && (
                      <p className="text-[10px] text-muted-foreground uppercase font-bold w-full text-center py-4 border-2 border-dashed rounded-lg bg-muted/20">
                        Sin imágenes seleccionadas.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Tu Galería (Clic para añadir)</Label>
                    <div className="flex gap-2 overflow-x-auto pb-2 min-h-[4rem]">
                      {mediaList?.filter(m => m.type === "IMAGE").map((m) => {
                        const isSelected = formData.imgUrls.includes(m.url);
                        return (
                          <div 
                            key={m.id} 
                            className={cn(
                              "relative w-16 h-16 shrink-0 rounded-lg border-2 overflow-hidden cursor-pointer transition-all",
                              isSelected ? "border-primary opacity-50 cursor-not-allowed" : "border-border hover:border-primary"
                            )}
                            onClick={() => {
                              if (!isSelected) {
                                setFormData(prev => ({ ...prev, imgUrls: [...prev.imgUrls, m.url] }));
                              }
                            }}
                          >
                            <Image src={m.url} alt={m.name} fill sizes="64px" className="object-cover" />
                          </div>
                        );
                      })}
                      {(!mediaList || mediaList.filter(m => m.type === "IMAGE").length === 0) && (
                        <div className="flex items-center justify-center w-full text-[9px] font-bold text-muted-foreground uppercase opacity-50">
                          Tu galería está vacía
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Input id="external-url-input" placeholder="O pega un link externo..." className="bg-background flex-1 text-[10px]" />
                    <Button type="button" onClick={addUrl} variant="secondary" className="border-2 shadow-neo-sm h-10 px-4">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  variant="default"
                  className="w-full h-14 text-lg"
                  disabled={createProduct.isPending}
                >
                  {createProduct.isPending ? <Loader2 className="animate-spin mr-2" /> : <Plus className="w-6 h-6 mr-2" />}
                  Publicar
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
