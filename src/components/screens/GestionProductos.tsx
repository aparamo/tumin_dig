"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Edit2, Trash2, X, Link as LinkIcon, ExternalLink } from "lucide-react";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion";

export function GestionProductos() {
  const utils = trpc.useUtils();
  const { data: myProducts, isLoading } = trpc.bazar.getMyProducts.useQuery();
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newUrl, setNewUrl] = useState("");

  const createMutation = trpc.bazar.createProduct.useMutation({
    onSuccess: () => {
      alert("Producto creado exitosamente");
      setIsModalOpen(false);
      utils.bazar.getMyProducts.invalidate();
    },
    onError: (e) => alert(e.message),
  });

  const updateMutation = trpc.bazar.updateProduct.useMutation({
    onSuccess: () => {
      alert("Producto actualizado");
      setIsModalOpen(false);
      utils.bazar.getMyProducts.invalidate();
    },
    onError: (e) => alert(e.message),
  });

  const deleteMutation = trpc.bazar.deleteProduct.useMutation({
    onSuccess: () => {
      alert("Producto eliminado");
      utils.bazar.getMyProducts.invalidate();
    },
    onError: (e) => alert(e.message),
  });

  const categories = [
    "Alimentos", "Bebidas", "Ropa", "Artesanías", "Salud y Bienestar", 
    "Servicios Profesionales", "Arte", "Hogar", "Cuidado Personal", "Educación", 
    "Talleres", "Cultura", "Entretenimiento", "Agroecología y Jardinería"
  ];

  const handleEdit = (product: any) => {
    setIsCreating(false);
    setEditingProduct({
      ...product,
      imgUrls: product.imgUrls || []
    });
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setEditingProduct({
      name: "",
      priceMxn: 0,
      priceTumin: 0,
      categories: [],
      imgUrls: [],
      status: "ACTIVO"
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) {
      createMutation.mutate(editingProduct);
    } else {
      updateMutation.mutate(editingProduct);
    }
  };

  const addUrl = () => {
    if (!newUrl) return;
    try {
      new URL(newUrl); // simple validation
      setEditingProduct({
        ...editingProduct,
        imgUrls: [...editingProduct.imgUrls, newUrl]
      });
      setNewUrl("");
    } catch (e) {
      alert("URL inválida. Debe empezar con http:// o https://");
    }
  };

  const removeUrl = (index: number) => {
    setEditingProduct({
      ...editingProduct,
      imgUrls: editingProduct.imgUrls.filter((_: any, i: number) => i !== index)
    });
  };

  const toggleCategory = (cat: string) => {
    const current = editingProduct.categories || [];
    setEditingProduct({
      ...editingProduct,
      categories: current.includes(cat)
        ? current.filter((c: string) => c !== cat)
        : [...current, cat]
    });
  };

  return (
    <div className="flex flex-col gap-8 p-4 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Mis Productos</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Gestiona lo que ofreces a la comunidad</p>
        </div>
        <Button onClick={handleCreateNew} variant="secondary" className="h-12 border-2 shadow-neo-sm font-black uppercase">
          <Plus className="w-5 h-5 mr-1" /> Nuevo
        </Button>
      </div>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center p-12"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>
        ) : myProducts && myProducts.length > 0 ? (
          myProducts.map((p) => (
            <StaggerItem key={p.id}>
              <Card className="neo-card overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-black text-xl uppercase tracking-tight">{p.name}</h3>
                    <div className="flex gap-2">
                      <Button size="icon" variant="outline" className="h-8 w-8 border-2" onClick={() => handleEdit(p)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="destructive" className="h-8 w-8 border-2" onClick={() => {
                        if(confirm("¿Eliminar este producto?")) deleteMutation.mutate({ id: p.id });
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-xl font-black text-primary">$ {p.priceMxn}</span>
                    <span className="text-xl font-black text-secondary">+ {p.priceTumin} Ŧ</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {p.categories.map(c => (
                      <span key={c} className="bg-muted px-2 py-0.5 rounded text-[10px] font-black uppercase border border-border">{c}</span>
                    ))}
                  </div>

                  {p.imgUrls && p.imgUrls.length > 0 && (
                    <div className="text-[10px] font-bold text-primary uppercase flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> {p.imgUrls.length} imágenes externas
                    </div>
                  )}
                </CardContent>
              </Card>
            </StaggerItem>
          ))
        ) : (
          <div className="col-span-full neo-card bg-muted/20 border-dashed border-2 p-12 text-center text-muted-foreground font-bold uppercase text-sm">
            Aún no has publicado productos.
          </div>
        )}
      </StaggerContainer>

      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-auto py-10">
          <Card className="w-full max-w-2xl shadow-2xl relative">
            <Button variant="ghost" size="icon" className="absolute right-4 top-4 neo-btn bg-background h-10 w-10" onClick={() => setIsModalOpen(false)}>
              <X className="w-6 h-6" />
            </Button>
            <CardHeader>
              <CardTitle className="text-2xl uppercase font-black">
                {isCreating ? "Nuevo Producto" : "Editar Producto"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-black uppercase text-xs">Nombre</Label>
                      <Input value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} required className="bg-background" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-black uppercase text-xs">Precio Pesos</Label>
                        <Input type="number" value={editingProduct.priceMxn} onChange={e => setEditingProduct({...editingProduct, priceMxn: parseFloat(e.target.value)})} required className="bg-background font-black" />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-black uppercase text-xs">Precio Túmin</Label>
                        <Input type="number" value={editingProduct.priceTumin} onChange={e => setEditingProduct({...editingProduct, priceTumin: parseFloat(e.target.value)})} required className="bg-background font-black" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black uppercase text-xs">Estado</Label>
                      <Select value={editingProduct.status} onValueChange={v => setEditingProduct({...editingProduct, status: v})}>
                        <SelectTrigger className="bg-background font-black uppercase text-xs h-10 border-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-2">
                          <SelectItem value="ACTIVO">ACTIVO</SelectItem>
                          <SelectItem value="INACTIVO">INACTIVO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="font-black uppercase text-xs">Categorías</Label>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-3 bg-muted/30 rounded-lg border-2 border-border">
                      {categories.map(c => (
                        <div key={c} className="flex items-center gap-3 py-1">
                          <Checkbox id={`edit-${c}`} checked={editingProduct.categories?.includes(c)} onCheckedChange={() => toggleCategory(c)} className="h-4 w-4 border-2" />
                          <label htmlFor={`edit-${c}`} className="text-[10px] font-black uppercase cursor-pointer">{c}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t-2 border-border">
                  <Label className="font-black uppercase text-xs">Imágenes Externas (URLs)</Label>
                  <div className="flex gap-2">
                    <Input placeholder="https://ejemplo.com/imagen.jpg" value={newUrl} onChange={e => setNewUrl(e.target.value)} className="bg-background flex-1" />
                    <Button type="button" onClick={addUrl} variant="secondary" className="border-2 shadow-neo-sm">
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {editingProduct.imgUrls.map((url: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded-lg border border-border overflow-hidden">
                        <LinkIcon className="w-4 h-4 shrink-0 text-muted-foreground" />
                        <span className="text-[10px] font-bold truncate flex-1">{url}</span>
                        <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeUrl(index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 text-lg uppercase font-black tracking-widest" disabled={updateMutation.isPending || createMutation.isPending}>
                  {updateMutation.isPending || createMutation.isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : isCreating ? (
                    "Publicar Producto"
                  ) : (
                    "Guardar Cambios"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
