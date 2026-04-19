"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Edit2, Trash2, X, Link as LinkIcon, ExternalLink, ImageIcon } from "lucide-react";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion";
import { cn } from "@/lib/utils";
import { UploadButton } from "@/lib/uploadthing";

type ProductForm = {
  id?: string;
  name: string;
  priceMxn: number;
  priceTumin: number;
  categories: string[];
  imgUrls: string[];
  status: "ACTIVO" | "INACTIVO";
};

export function GestionProductos() {
  const utils = trpc.useUtils();
  const { data: myProducts, isLoading } = trpc.bazar.getMyProducts.useQuery();
  const { data: mediaList } = trpc.user.listMedia.useQuery();
  const [editingProduct, setEditingProduct] = useState<ProductForm | null>(null);
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

  const handleEdit = (product: ProductForm) => {
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
    if (!editingProduct) return;
    if (isCreating) {
      createMutation.mutate(editingProduct);
    } else {
      updateMutation.mutate({
        ...editingProduct,
        id: editingProduct.id!
      });
    }
  };

  const addUrl = () => {
    if (!newUrl || !editingProduct) return;
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
    if (!editingProduct) return;
    setEditingProduct({
      ...editingProduct,
      imgUrls: editingProduct.imgUrls.filter((_, i) => i !== index)
    });
  };

  const toggleCategory = (cat: string) => {
    if (!editingProduct) return;
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
                      <ExternalLink className="w-3 h-3" /> {p.imgUrls.length} imágenes
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
                      <Select 
                        value={editingProduct.status} 
                        onValueChange={(v) => {
                          if (v === "ACTIVO" || v === "INACTIVO") {
                            setEditingProduct(prev => prev ? { ...prev, status: v } : null);
                          }
                        }}
                      >
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
                  <div className="flex justify-between items-center mb-2">
                    <Label className="font-black uppercase text-xs">Imágenes del Producto</Label>
                    <UploadButton
                      endpoint="userMedia"
                      onClientUploadComplete={(res) => {
                        const newFiles = res.map(r => r.url);
                        setEditingProduct({
                          ...editingProduct,
                          imgUrls: [...(editingProduct.imgUrls || []), ...newFiles]
                        });
                        utils.user.listMedia.invalidate();
                        utils.user.getMediaUsage.invalidate();
                      }}
                      onUploadError={(e) => alert(e.message)}
                      appearance={{
                        button: "neo-btn bg-secondary text-secondary-foreground uppercase font-black text-[10px] h-8 px-4 py-0",
                        allowedContent: "hidden"
                      }}
                      content={{ button: "Subir Imagen" }}
                    />
                  </div>

                  {/* Selected Images */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {editingProduct.imgUrls && editingProduct.imgUrls.map((url: string, index: number) => (
                      <div key={index} className="relative group w-16 h-16 rounded-lg border-2 border-border overflow-hidden bg-muted">
                        <img src={url} alt="producto" className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeUrl(index)}
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ))}
                    {(!editingProduct.imgUrls || editingProduct.imgUrls.length === 0) && (
                      <p className="text-[10px] text-muted-foreground uppercase font-bold w-full text-center py-4 border-2 border-dashed rounded-lg bg-muted/20">
                        Sin imágenes. Sube una o selecciona de tu galería.
                      </p>
                    )}
                  </div>

                  {/* Media Gallery Selector */}
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Tu Galería (Clic para añadir)</Label>
                    <div className="flex gap-2 overflow-x-auto pb-2 min-h-[4rem]">
                      {mediaList?.filter(m => m.type === "IMAGE").map((m) => {
                        const isSelected = editingProduct.imgUrls?.includes(m.url);
                        return (
                          <div 
                            key={m.id} 
                            className={cn(
                              "relative w-16 h-16 shrink-0 rounded-lg border-2 overflow-hidden cursor-pointer transition-all",
                              isSelected ? "border-primary opacity-50 cursor-not-allowed" : "border-border hover:border-primary"
                            )}
                            onClick={() => {
                              if (!isSelected) {
                                setEditingProduct({
                                  ...editingProduct,
                                  imgUrls: [...(editingProduct.imgUrls || []), m.url]
                                });
                              }
                            }}
                          >
                            <img src={m.url} alt={m.name} className="w-full h-full object-cover" />
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

                  {/* External Link (Fallback) */}
                  <div className="flex gap-2 mt-4">
                    <Input placeholder="O pega un link externo..." value={newUrl} onChange={e => setNewUrl(e.target.value)} className="bg-background flex-1 text-[10px]" />
                    <Button type="button" onClick={addUrl} variant="secondary" className="border-2 shadow-neo-sm h-10 px-4">
                      <Plus className="w-4 h-4" />
                    </Button>
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
