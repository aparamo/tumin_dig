"use client";

import { useState, useEffect, useCallback, startTransition, useMemo } from "react";
import Image from "next/image";
import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Edit2, Trash2, X, ExternalLink } from "lucide-react";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion";
import { cn } from "@/lib/utils";
import { UploadButton, createUploadBeginHandlers, getUploadedFileUrl, UPLOAD_LIMIT_BYTES, UPLOAD_LIMITS } from "@/lib/uploadthing";
import type { InferSelectModel } from "drizzle-orm";
import { products } from "@/db/schema";
import { useStore } from "@/lib/store";
import { useFeedback } from "@/components/FeedbackProvider";
import { useConfirm } from "@/hooks/use-confirm";
import { parseErrorMessage } from "@/lib/parse-error";

type ProductRow = InferSelectModel<typeof products>;

type ProductForm = {
  id?: string;
  name: string;
  description: string;
  extraInfo: string;
  priceMxn: number;
  priceTumin: number;
  categories: string[];
  imgUrls: string[];
  status: "ACTIVO" | "INACTIVO";
  showInProfile: boolean;
};

export function GestionProductos() {
  const utils = trpc.useUtils();
  const { notifySuccess, notifyError } = useFeedback();
  const { confirm, ConfirmDialog } = useConfirm();
  const uploadHandlers = useMemo(
    () =>
      createUploadBeginHandlers(
        { notifyError, notifySuccess },
        {
          imageMaxBytes: UPLOAD_LIMIT_BYTES.userMediaImage,
          videoMaxBytes: UPLOAD_LIMIT_BYTES.userMediaVideo,
          label: "imágenes de producto",
        },
      ),
    [notifyError, notifySuccess],
  );
  const openGestionProductCreate = useStore((s) => s.openGestionProductCreate);
  const setOpenGestionProductCreate = useStore((s) => s.setOpenGestionProductCreate);
  const { data: myProducts, isLoading } = trpc.bazar.getMyProducts.useQuery();
  const { data: mediaList } = trpc.user.listMedia.useQuery();
  const [editingProduct, setEditingProduct] = useState<ProductForm | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newUrl, setNewUrl] = useState("");

  const createMutation = trpc.bazar.createProduct.useMutation({
    onSuccess: () => {
      notifySuccess("Producto creado exitosamente");
      setIsModalOpen(false);
      void utils.bazar.getMyProducts.invalidate();
      void utils.bazar.getProducts.invalidate();
      void utils.user.getGamificationState.invalidate();
    },
    onError: (e) => notifyError(parseErrorMessage(e)),
  });

  const updateMutation = trpc.bazar.updateProduct.useMutation({
    onSuccess: () => {
      notifySuccess("Producto actualizado");
      setIsModalOpen(false);
      void utils.bazar.getMyProducts.invalidate();
      void utils.bazar.getProducts.invalidate();
      void utils.user.getGamificationState.invalidate();
    },
    onError: (e) => notifyError(parseErrorMessage(e)),
  });

  const deleteMutation = trpc.bazar.deleteProduct.useMutation({
    onSuccess: () => {
      notifySuccess("Producto eliminado");
      utils.bazar.getMyProducts.invalidate();
      void utils.user.getGamificationState.invalidate();
    },
    onError: (e) => notifyError(parseErrorMessage(e)),
  });

  const toggleShowInProfileMutation = trpc.bazar.toggleShowInProfile.useMutation({
    onSuccess: () => {
      void utils.bazar.getMyProducts.invalidate();
      void utils.bazar.getProducts.invalidate();
    },
    onError: (e) => notifyError(parseErrorMessage(e)),
  });

  const categories = [
    "Alimentos", "Bebidas", "Ropa", "Artesanías", "Salud y Bienestar", 
    "Servicios Profesionales", "Arte", "Hogar", "Cuidado Personal", "Educación", 
    "Talleres", "Cultura", "Entretenimiento", "Agroecología y Jardinería"
  ];

  const handleEdit = (product: ProductRow) => {
    setIsCreating(false);
    setEditingProduct({
      id: product.id,
      name: product.name,
      description: product.description ?? "",
      extraInfo: product.extraInfo ?? "",
      priceMxn: product.priceMxn,
      priceTumin: product.priceTumin,
      categories: product.categories || [],
      imgUrls: product.imgUrls || [],
      status: product.status,
      showInProfile: product.showInProfile ?? true,
    });
    setIsModalOpen(true);
  };

  const handleCreateNew = useCallback(() => {
    setIsCreating(true);
    setEditingProduct({
      name: "",
      description: "",
      extraInfo: "",
      priceMxn: 0,
      priceTumin: 0,
      categories: [],
      imgUrls: [],
      status: "ACTIVO",
      showInProfile: true,
    });
    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    if (!openGestionProductCreate) return;
    startTransition(() => {
      setOpenGestionProductCreate(false);
      handleCreateNew();
    });
  }, [openGestionProductCreate, setOpenGestionProductCreate, handleCreateNew]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (createMutation.isPending || updateMutation.isPending || !editingProduct) return;

    if (!editingProduct.description.trim()) {
      notifyError("La descripción es obligatoria para publicar o guardar desde este formulario.");
      return;
    }

    const total = editingProduct.priceMxn + editingProduct.priceTumin;
    if (editingProduct.priceTumin < total * 0.1) {
      notifyError("El precio en Túmin debe ser al menos el 10% del total.");
      return;
    }

    if (isCreating) {
      createMutation.mutate({
        name: editingProduct.name,
        description: editingProduct.description.trim(),
        extraInfo: editingProduct.extraInfo.trim() || undefined,
        priceMxn: editingProduct.priceMxn,
        priceTumin: editingProduct.priceTumin,
        categories: editingProduct.categories,
        imgUrls: editingProduct.imgUrls,
        showInProfile: editingProduct.showInProfile,
      });
    } else {
      updateMutation.mutate({
        id: editingProduct.id!,
        name: editingProduct.name,
        description: editingProduct.description.trim(),
        extraInfo: editingProduct.extraInfo.trim() || undefined,
        priceMxn: editingProduct.priceMxn,
        priceTumin: editingProduct.priceTumin,
        categories: editingProduct.categories,
        imgUrls: editingProduct.imgUrls,
        status: editingProduct.status,
        showInProfile: editingProduct.showInProfile,
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
    } catch {
      notifyError("URL inválida. Debe empezar con http:// o https://");
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
      <ConfirmDialog />
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
                      <Button size="icon" variant="destructive" className="h-8 w-8 border-2" onClick={async () => {
                        const ok = await confirm({
                          title: "Eliminar producto",
                          description: `¿Eliminar "${p.name}" permanentemente?`,
                          confirmText: "Eliminar",
                          variant: "destructive",
                        });
                        if (ok) deleteMutation.mutate({ id: p.id });
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {p.description ? (
                    <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                  ) : null}

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-xl font-black text-primary">$ {p.priceMxn}</span>
                    <span className="text-xl font-black text-secondary">+ {p.priceTumin} Ŧ</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {p.categories.map(c => (
                      <span key={c} className="bg-muted px-2 py-0.5 rounded text-[10px] font-black uppercase border border-border">{c}</span>
                    ))}
                  </div>

                  <div
                    className="mb-4 flex items-center justify-between gap-3 rounded-lg border-2 border-border bg-muted/30 px-3 py-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="min-w-0">
                      <p className="text-base!important font-black uppercase tracking-wide text-foreground">Visible en bazar y perfil</p>
                      <p className="text-base!important font-medium text-muted-foreground">Si lo apagas, no aparece en el mercado ni en /u</p>
                    </div>
                    <Switch
                      checked={p.showInProfile ?? true}
                      disabled={toggleShowInProfileMutation.isPending}
                      onCheckedChange={(checked) => {
                        toggleShowInProfileMutation.mutate({ productId: p.id, showInProfile: checked === true });
                      }}
                      className="shrink-0"
                    />
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
        <div className="fixed inset-0 z-100verflow-y-auto bg-background/80 backdrop-blur-md">
          <div className="flex min-h-full justify-center p-4 py-8 sm:p-6 sm:py-12">
            <Card className="relative my-auto flex w-full max-w-2xl flex-col overflow-hidden border-2 shadow-2xl md:max-w-4xl lg:max-w-5xl max-h-[min(100dvh-2.5rem,920px)]">
            <Button variant="ghost" size="icon" className="absolute right-3 top-3 z-10 neo-btn bg-background h-10 w-10 sm:right-4 sm:top-4" onClick={() => setIsModalOpen(false)}>
              <X className="w-6 h-6" />
            </Button>
            <CardHeader className="shrink-0 pr-14 pt-2 sm:pr-16">
              <CardTitle className="text-2xl uppercase font-black">
                {isCreating ? "Nuevo Producto" : "Editar Producto"}
              </CardTitle>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 sm:px-6">
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-black uppercase text-base">Nombre</Label>
                      <Input value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} required className="bg-background" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-black uppercase text-base">Precio Pesos</Label>
                        <Input type="number" value={editingProduct.priceMxn} onChange={e => setEditingProduct({...editingProduct, priceMxn: parseFloat(e.target.value)})} required className="bg-background font-black" />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-black uppercase text-base">Precio Túmin</Label>
                        <Input type="number" value={editingProduct.priceTumin} onChange={e => setEditingProduct({...editingProduct, priceTumin: parseFloat(e.target.value)})} required className="bg-background font-black" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black uppercase text-base">Estado</Label>
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
                    <div className="flex items-start justify-between gap-3 rounded-lg border-2 border-border bg-muted/20 p-3">
                      <div className="min-w-0">
                        <Label htmlFor={`show-profile-${editingProduct.id ?? "new"}`} className="text-base font-black uppercase">
                          Visible en bazar y perfil
                        </Label>
                        <p className="mt-1 text-[9px] font-medium text-muted-foreground">
                          Apágalo para ocultarlo del mercado y de tu página pública.
                        </p>
                      </div>
                      <Switch
                        id={`show-profile-${editingProduct.id ?? "new"}`}
                        checked={editingProduct.showInProfile}
                        onCheckedChange={(checked) =>
                          setEditingProduct((prev) =>
                            prev ? { ...prev, showInProfile: checked === true } : null
                          )
                        }
                        className="shrink-0"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="font-black uppercase text-base">Categorías</Label>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-3 bg-muted/30 rounded-lg border-2 border-border">
                      {categories.map(c => (
                        <div key={c} className="flex items-center gap-3 py-1">
                          <Checkbox id={`edit-${c}`} checked={editingProduct.categories?.includes(c)} onCheckedChange={() => toggleCategory(c)} className="h-4 w-4 border-2" />
                          <label htmlFor={`edit-${c}`} className="text-sm font-black uppercase cursor-pointer">{c}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6 border-t-2 border-border pt-8 md:pt-10">
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-base">
                      Descripción <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-xs font-medium leading-relaxed text-muted-foreground sm:text-sm lg:text-base lg:leading-snug">
                      Escribe una descripción breve y clara de tu producto o servicio.
                    </p>
                    <Textarea
                      value={editingProduct.description}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      className="min-h-25 border-2 bg-background"
                      required
                      maxLength={8000}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-base text-muted-foreground">
                      Información adicional (opcional)
                    </Label>
                    <Textarea
                      value={editingProduct.extraInfo}
                      onChange={(e) => setEditingProduct({ ...editingProduct, extraInfo: e.target.value })}
                      className="min-h-18 border-2 bg-background"
                      maxLength={16000}
                    />
                  </div>
                </div>

                <div className="space-y-4 border-t-2 border-border pt-8 md:pt-10">
                  <div className="flex justify-between items-center mb-2">
                    <Label className="font-black uppercase text-base">Imágenes del Producto</Label>
                    <UploadButton
                      endpoint="userMedia"
                      onBeforeUploadBegin={uploadHandlers.onBeforeUploadBegin}
                      onClientUploadComplete={(res) => {
                        const newFiles = res
                          .map((r) => getUploadedFileUrl(r))
                          .filter(Boolean);
                        setEditingProduct({
                          ...editingProduct,
                          imgUrls: [...(editingProduct.imgUrls || []), ...newFiles]
                        });
                        utils.user.listMedia.invalidate();
                        utils.user.getMediaUsage.invalidate();
                      }}
                      onUploadError={uploadHandlers.onUploadError}
                      content={{
                        button: "Subir Imagen",
                        allowedContent: `Hasta ${UPLOAD_LIMITS.userMediaImage} (se optimiza si pesa de más)`,
                      }}
                      appearance={{
                        button:
                          "neo-btn bg-secondary text-stone-900 uppercase text-[10px] h-8 px-4 py-0 transition-all duration-200 hover:bg-secondary/90 hover:bg-muted/50 hover:text-black hover:-translate-y-0.5 active:translate-y-0 active:shadow-none",
                        allowedContent: "hidden",
                      }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {editingProduct.imgUrls && editingProduct.imgUrls.map((url: string, index: number) => (
                      <div key={index} className="relative group w-16 h-16 rounded-lg border-2 border-border overflow-hidden bg-muted">
                        <Image src={url} alt="producto" fill sizes="64px" className="object-cover" />
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
                      <p className="text-base text-muted-foreground uppercase font-bold w-full text-center py-4 border-2 border-dashed rounded-lg bg-muted/20">
                        Sin imágenes. Sube una o selecciona de tu galería.
                      </p>
                    )}
                  </div>

                  {/* Media Gallery Selector */}
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-md text-muted-foreground ml-1">Tu Galería (Clic para añadir)</Label>
                    <div className="flex gap-2 overflow-x-auto pb-2 min-h-16">
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
                            <Image src={m.url} alt={m.name} fill sizes="64px" className="object-cover" />
                          </div>
                        );
                      })}
                      {(!mediaList || mediaList.filter(m => m.type === "IMAGE").length === 0) && (
                        <div className="flex items-center justify-center w-full text-base font-bold text-muted-foreground uppercase opacity-50">
                          Tu galería está vacía
                        </div>
                      )}
                    </div>
                  </div>

                  {/* External Link (Fallback) */}
                  <div className="flex gap-2 mt-4">
                    <Input placeholder="O pega un link externo..." value={newUrl} onChange={e => setNewUrl(e.target.value)} className="bg-background flex-1 text-base" />
                    <Button type="button" onClick={addUrl} variant="secondary" className="border-2 shadow-neo-sm h-10 px-4">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-lg uppercase font-black tracking-widest"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
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
        </div>
      )}
    </div>
  );
}
