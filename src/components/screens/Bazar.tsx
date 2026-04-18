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
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-2xl font-bold text-slate-800">Bazar Comunitario</h1>
      
      <Button 
        onClick={() => setIsFormOpen(true)}
        className="bg-blue-500 hover:bg-blue-600 font-bold"
      >
        <Plus className="w-4 h-4 mr-2" /> Vender algo nuevo
      </Button>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Buscar productos o servicios..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
<div className="flex gap-2">
  <div className="flex-1">
    <Label className="text-[10px] uppercase text-slate-400 font-bold mb-1 block">Categoría</Label>
    <Select value={category} onValueChange={(val) => val && setCategory(val)}>
      <SelectTrigger className="text-xs h-9">
        <SelectValue placeholder="Categoría" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Todas">Todas</SelectItem>
        {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
      </SelectContent>
    </Select>
  </div>
  <div className="flex-1">
    <Label className="text-[10px] uppercase text-slate-400 font-bold mb-1 block">Región</Label>
    <Select value={region} onValueChange={(val) => val && setRegion(val)}>
      <SelectTrigger className="text-xs h-9">
...
                <SelectValue placeholder="Región" />
              </SelectTrigger>
              <SelectContent>
                {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : productsData && productsData.length > 0 ? (
          productsData.map((item) => (
            <Card key={item.product.id} className="overflow-hidden border-slate-100 shadow-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-slate-800">{item.product.name}</h3>
                  <Badge variant="secondary" className="bg-slate-100 text-[10px]">
                    {item.product.region}
                  </Badge>
                </div>
                
                <div className="text-orange-500 font-bold text-xl mb-1">
                  $ {item.product.priceMxn} MXN + {item.product.priceTumin} Ŧ
                </div>
                <div className="text-[10px] text-slate-400 mb-3">
                  (Total: $ {(item.product.priceMxn + item.product.priceTumin).toFixed(2)})
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                  <span className="font-bold">Socio: {item.seller.name}</span>
                  {item.avgRating > 0 && (
                    <span className="flex items-center text-yellow-500 font-bold">
                      <Star className="w-3 h-3 fill-current mr-0.5" /> {item.avgRating.toFixed(1)}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-green-50 text-green-700 border-green-200 hover:bg-green-100 h-10">
                    <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-[1.5] bg-orange-500 hover:bg-orange-600 h-10 font-bold"
                    onClick={() => setCurrentScreen("pagar")}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" /> Comprar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center text-slate-400 py-8">No hay productos que coincidan.</div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 overflow-auto py-10">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Publicar Producto</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsFormOpen(false)}><X/></Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre del Producto/Servicio</Label>
                  <Input 
                    placeholder="Ej. Jabón Artesanal de Miel" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Precio Pesos ($)</Label>
                    <Input 
                      type="number" 
                      value={formData.priceMxn}
                      onChange={(e) => setFormData({...formData, priceMxn: parseFloat(e.target.value)})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Precio Túmin (Ŧ)</Label>
                    <Input 
                      type="number" 
                      value={formData.priceTumin}
                      onChange={(e) => setFormData({...formData, priceTumin: parseFloat(e.target.value)})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Categorías</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-md border text-[10px]">
                    {categories.map(c => (
                      <div key={c} className="flex items-center gap-2">
                        <Checkbox 
                          id={c} 
                          checked={formData.categories.includes(c)}
                          onCheckedChange={() => handleCategoryToggle(c)}
                        />
                        <label htmlFor={c}>{c}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Imagen (Opcional)</Label>
                  <UploadButton
                    endpoint="productImage"
                    onClientUploadComplete={(res) => {
                      setFormData({...formData, imageUrl: res[0].url});
                      alert("Imagen subida con éxito");
                    }}
                    onUploadError={(error: Error) => {
                      alert(`ERROR! ${error.message}`);
                    }}
                  />
                  {formData.imageUrl && <p className="text-[10px] text-green-600">✅ Imagen cargada</p>}
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 h-12 font-bold"
                  disabled={createProduct.isPending}
                >
                  {createProduct.isPending ? <Loader2 className="animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Publicar en el Bazar
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
