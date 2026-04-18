"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Plus, Trash2, Link as LinkIcon, Image as ImageIcon, 
  Video, FileText, ExternalLink, HardDrive, ShieldCheck 
} from "lucide-react";
import { UploadButton } from "@/lib/uploadthing";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion";
import { cn } from "@/lib/utils";

const TIER_CONFIG = {
  NORMAL: { limit: 30 * 1024 * 1024, label: "Gratuito", color: "bg-slate-500" },
  PAGO: { limit: 120 * 1024 * 1024, label: "Socio de Pago", color: "bg-blue-500" },
  PATROCINADOR: { limit: 350 * 1024 * 1024, label: "Patrocinador", color: "bg-purple-500" },
  FINANCIADOR: { limit: 500 * 1024 * 1024, label: "Financiador", color: "bg-amber-500" },
};

export function GestorMedios() {
  const utils = trpc.useUtils();
  const { data: usage, isLoading: loadingUsage } = trpc.user.getMediaUsage.useQuery();
  const { data: mediaList, isLoading: loadingMedia } = trpc.user.listMedia.useQuery();
  const deleteMutation = trpc.user.deleteMedia.useMutation({
    onSuccess: () => {
      utils.user.listMedia.invalidate();
      utils.user.getMediaUsage.invalidate();
    }
  });
  const addLinkMutation = trpc.user.addExternalLink.useMutation({
    onSuccess: () => {
      utils.user.listMedia.invalidate();
      setLinkData({ url: "", name: "" });
    }
  });

  const [linkData, setLinkData] = useState({ url: "", name: "" });

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const currentTier = (usage?.tier as keyof typeof TIER_CONFIG) || "NORMAL";
  const limit = TIER_CONFIG[currentTier].limit;
  const used = usage?.usedBytes || 0;
  const percent = Math.min((used / limit) * 100, 100);

  const getDrivePreview = (url: string) => {
    if (url.includes("drive.google.com")) {
      return url.replace("/view", "/preview").replace("usp=sharing", "");
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-8 p-4 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-2">
            <HardDrive className="w-8 h-8 text-primary" /> Mis Archivos
          </h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Gestiona tu espacio y enlaces multimedia</p>
        </div>
        <Badge className={cn("text-xs font-black uppercase py-1 px-3", TIER_CONFIG[currentTier].color)}>
          Nivel: {TIER_CONFIG[currentTier].label}
        </Badge>
      </div>

      {/* Storage Bar */}
      <Card className="neo-card bg-card border-2">
        <CardContent className="pt-6">
          <div className="flex justify-between items-end mb-2">
            <Label className="text-xs font-black uppercase">Almacenamiento Utilizado</Label>
            <span className="text-xs font-black uppercase text-primary">
              {formatSize(used)} / {formatSize(limit)}
            </span>
          </div>
          <Progress value={percent} className="h-4 border-2 border-border bg-muted" />
          <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase">
            {percent >= 90 ? "⚠️ ¡Casi sin espacio!" : `Te quedan ${formatSize(limit - used)} disponibles.`}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload & Links Form */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="neo-card border-2">
            <CardHeader>
              <CardTitle className="text-lg uppercase font-black">Subir Nuevo</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase">Imágenes o Videos (según tu plan)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-border rounded-xl p-6 bg-muted/20 flex flex-col items-center justify-center text-center">
                <UploadButton
                  endpoint="userMedia"
                  onClientUploadComplete={() => {
                    alert("Archivo subido con éxito");
                    utils.user.listMedia.invalidate();
                    utils.user.getMediaUsage.invalidate();
                  }}
                  onUploadError={(e) => alert(e.message)}
                  appearance={{
                    button: "neo-btn bg-primary text-primary-foreground font-black uppercase text-xs h-12 px-6",
                    allowedContent: "text-[9px] font-bold uppercase text-muted-foreground mt-2"
                  }}
                />
              </div>

              <div className="pt-4 border-t-2 border-border">
                <Label className="text-xs font-black uppercase mb-3 block">Agregar Enlace Externo</Label>
                <div className="space-y-3">
                  <Input 
                    placeholder="Nombre del archivo/enlace" 
                    className="bg-background border-2"
                    value={linkData.name}
                    onChange={(e) => setLinkData({...linkData, name: e.target.value})}
                  />
                  <Input 
                    placeholder="https://drive.google.com/..." 
                    className="bg-background border-2"
                    value={linkData.url}
                    onChange={(e) => setLinkData({...linkData, url: e.target.value})}
                  />
                  <Button 
                    className="w-full h-10 font-black uppercase text-xs" 
                    variant="secondary"
                    disabled={!linkData.url || !linkData.name || addLinkMutation.isPending}
                    onClick={() => addLinkMutation.mutate(linkData)}
                  >
                    {addLinkMutation.isPending ? <Loader2 className="animate-spin" /> : <LinkIcon className="w-4 h-4 mr-2" />}
                    Guardar Enlace
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gallery */}
        <div className="lg:col-span-2">
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadingMedia ? (
              <div className="col-span-full flex justify-center py-12"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>
            ) : mediaList && mediaList.length > 0 ? (
              mediaList.map((m) => (
                <StaggerItem key={m.id}>
                  <Card className="neo-card border-2 overflow-hidden h-full flex flex-col">
                    <div className="aspect-video bg-muted relative group">
                      {m.type === "IMAGE" ? (
                        <img src={m.url} alt={m.name} className="w-full h-full object-cover" />
                      ) : m.type === "VIDEO" ? (
                        <div className="w-full h-full flex items-center justify-center bg-black">
                          <Video className="w-12 h-12 text-white/50" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4">
                          {getDrivePreview(m.url) ? (
                            <iframe src={getDrivePreview(m.url)!} className="w-full h-full border-0 pointer-events-none" />
                          ) : (
                            <ExternalLink className="w-12 h-12 text-muted-foreground/30" />
                          )}
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <Button size="icon" variant="secondary" className="h-10 w-10" onClick={() => window.open(m.url, "_blank")}>
                          <ExternalLink className="w-5 h-5" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="destructive" 
                          className="h-10 w-10" 
                          onClick={() => { if(confirm("¿Eliminar este archivo?")) deleteMutation.mutate({ id: m.id }) }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[11px] font-black uppercase truncate" title={m.name}>{m.name}</h4>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">
                            {m.type === "LINK" ? "Enlace Externo" : formatSize(m.sizeBytes)} • {new Date(m.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {m.type === "IMAGE" && <ImageIcon className="w-4 h-4 text-primary shrink-0" />}
                        {m.type === "VIDEO" && <Video className="w-4 h-4 text-blue-500 shrink-0" />}
                        {m.type === "LINK" && <LinkIcon className="w-4 h-4 text-purple-500 shrink-0" />}
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))
            ) : (
              <div className="col-span-full border-2 border-dashed rounded-2xl p-12 text-center text-muted-foreground font-black uppercase text-xs">
                No tienes archivos guardados.
              </div>
            )}
          </StaggerContainer>
        </div>
      </div>
    </div>
  );
}
