"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Search, Star, MessageCircle, ShoppingCart, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { UploadButton } from "@/lib/uploadthing";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion";

export function Bazar() {
  const { setCurrentScreen } = useStore();
  const utils = trpc.useUtils();
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("Todas");
  const [region, setRegion] = useState("Todas");
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    priceMxn: 0,
    priceTumin: 0,
    categories: [] as string[],
    imageUrl: "",
  });

  const { data: productsData, isLoading } = trpc.bazar.getProducts.useQuery({
    name: searchTerm || undefined,
    category: category === "Todas" ? undefined : category,
    region: region === "Todas" ? undefined : region,
  });

  const createProduct = trpc.bazar.createProduct.useMutation({
    onSuccess: () => {
      alert("¡Producto publicado correctamente!");
      setIsFormOpen(false);
      utils.bazar.getProducts.invalidate();
      setFormData({ name: "", priceMxn: 0, priceTumin: 0, categories: [], imageUrl: "" });
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
      </div>

      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>
        ) : productsData && productsData.length > 0 ? (
          productsData.map((item) => (
            <StaggerItem key={item.product.id}>
              <Card className="group overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-black text-2xl text-foreground uppercase tracking-tight leading-none">{item.product.name}</h3>
                      <Badge className="bg-secondary text-secondary-foreground border-2 border-border shadow-neo-sm font-black uppercase text-[10px]">
                        {item.product.region}
                      </Badge>
                    </div>
                    
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-3xl font-black text-primary tracking-tighter">
                        $ {item.product.priceMxn} <span className="text-sm uppercase text-muted-foreground font-bold">MXN</span>
                      </span>
                      <span className="text-3xl font-black text-secondary tracking-tighter">
                        + {item.product.priceTumin} <span className="text-sm uppercase text-muted-foreground font-bold">Ŧ</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">
                      <div className="bg-muted px-2 py-1 rounded border-border border">
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
          <div className="neo-card bg-muted/20 border-dashed border-2 shadow-none p-12 text-center text-muted-foreground font-bold uppercase text-sm tracking-widest">
            No hay productos disponibles.
          </div>
        )}
      </StaggerContainer>

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

                <div className="space-y-2">
                  <Label className="font-black uppercase text-xs ml-1">Imagen</Label>
                  <div className="neo-card bg-background p-4 border-dashed border-2 flex justify-center">
                    <UploadButton
                      endpoint="productImage"
                      onClientUploadComplete={(res) => {
                        setFormData({...formData, imageUrl: res[0].url});
                        alert("Imagen subida con éxito");
                      }}
                      onUploadError={(error: Error) => {
                        alert(`ERROR! ${error.message}`);
                      }}
                      appearance={{
                        button: "neo-btn bg-primary text-primary-foreground uppercase font-black text-xs px-6 h-10 shadow-neo-sm active:shadow-none translate-y-0 active:translate-y-0.5 active:translate-x-0.5",
                        allowedContent: "text-[10px] font-bold uppercase mt-2 text-muted-foreground"
                      }}
                    />
                  </div>
                  {formData.imageUrl && <p className="text-[10px] text-primary font-black uppercase text-center mt-2">✅ Imagen cargada correctamente</p>}
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
