"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, User, Phone, Mail, MapPin, Key, Save, 
  Camera, ShieldCheck, Star, Zap, FolderOpen, LogOut, Copy
} from "lucide-react";
import { signOut } from "next-auth/react";
import { QRCodeSVG } from "qrcode.react";
import { useStore } from "@/lib/store";
import { UploadButton } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";

const TIER_BADGES = {
  NORMAL: { label: "Socio Gratuito", color: "bg-slate-500", icon: User },
  PAGO: { label: "Socio de Pago", color: "bg-blue-600", icon: Zap },
  PATROCINADOR: { label: "Patrocinador", color: "bg-purple-600", icon: Star },
  FINANCIADOR: { label: "Financiador", color: "bg-amber-600", icon: ShieldCheck },
};

export function Perfil() {
  const { setCurrentScreen } = useStore();
  const utils = trpc.useUtils();
  const { data: user, isLoading } = trpc.user.fullMe.useQuery();
  
  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      alert("Perfil actualizado correctamente");
      utils.user.fullMe.invalidate();
    },
    onError: (e) => alert(e.message)
  });

  const updateNip = trpc.user.updateNip.useMutation({
    onSuccess: () => {
      alert("NIP actualizado");
      setNipData({ current: "", new: "", confirm: "" });
    },
    onError: (e) => alert(e.message)
  });

  const [editData, setEditData] = useState({ name: "", email: "", phone: "" });
  const [nipData, setNipData] = useState({ current: "", new: "", confirm: "" });

  useEffect(() => {
    if (user) {
      setEditData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || ""
      });
    }
  }, [user]);

  const copyLink = () => {
    if (!user) return;
    const link = `${window.location.origin}/register?ref=${user.id}`;
    navigator.clipboard.writeText(link);
    alert("¡Link de invitación copiado!");
  };

  if (isLoading || !user) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;

  const tier = (user.accountTier as keyof typeof TIER_BADGES) || "NORMAL";
  const TierIcon = TIER_BADGES[tier].icon;

  return (
    <div className="flex flex-col gap-8 p-4 pb-12">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Left Col: Avatar & ID */}
        <div className="w-full md:w-80 flex flex-col gap-6">
          <Card className="neo-card border-2 overflow-hidden">
            <div className="aspect-square bg-muted relative group">
              {user.avatarUrl ? (
                <Image src={user.avatarUrl} alt={user.name} fill sizes="(max-width: 768px) 100vw, 320px" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <User className="w-24 h-24 text-primary/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <UploadButton
                  endpoint="avatar"
                  onClientUploadComplete={() => {
                    alert("Foto de perfil actualizada");
                    utils.user.fullMe.invalidate();
                  }}
                  content={{
                    button: "Cambiar Foto"
                  }}
                  appearance={{
                    button: "neo-btn bg-white text-black font-black uppercase text-[10px] h-8 px-4",
                    allowedContent: "hidden"
                  }}
                />
              </div>
            </div>
            <CardContent className="pt-4 text-center">
              <h2 className="text-xl font-black uppercase truncate">{user.name}</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">{user.id}</p>
              <Badge className={cn("font-black uppercase py-1 px-4 mb-4", TIER_BADGES[tier].color)}>
                <TierIcon className="w-3 h-3 mr-2" /> {TIER_BADGES[tier].label}
              </Badge>
              <div className="flex justify-center bg-white p-4 rounded-2xl border-2 border-border mb-4 shadow-neo-sm">
                <QRCodeSVG value={user.id} size={150} />
              </div>
              <Button 
                variant="outline" 
                className="w-full h-10 border-2 font-black uppercase text-xs mb-2"
                onClick={() => setCurrentScreen("medios")}
              >
                <FolderOpen className="w-4 h-4 mr-2" /> Mis Archivos
              </Button>
            </CardContent>
          </Card>

          {/* Invitation Card */}
          <Card className="neo-card bg-secondary/10 border-secondary border-dashed border-2">
            <CardHeader className="text-center pb-2">
              <CardTitle className="flex items-center justify-center gap-2 text-secondary text-lg font-black uppercase">
                🤝 Invitar
              </CardTitle>
              <CardDescription className="text-muted-foreground font-bold uppercase text-[9px] tracking-widest">
                Solo con tu link pueden registrarse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={copyLink} variant="secondary" className="w-full h-10 font-black uppercase text-xs border-2 shadow-neo-sm">
                <Copy className="w-4 h-4 mr-2" /> Copiar Link
              </Button>
            </CardContent>
          </Card>

          <Button 
            variant="destructive" 
            className="w-full h-12 shadow-neo-sm font-black uppercase"
            onClick={() => signOut()}
          >
            <LogOut className="w-5 h-5 mr-2" /> Cerrar Sesión
          </Button>
        </div>

        {/* Right Col: Forms */}
        <div className="flex-1 w-full space-y-8">
          {/* Basic Info */}
          <Card className="neo-card border-2">
            <CardHeader>
              <CardTitle className="text-2xl font-black uppercase tracking-tight">Información de Perfil</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase">Actualiza tus datos de contacto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Nombre Completo</Label>
                  <Input 
                    value={editData.name} 
                    onChange={e => setEditData({...editData, name: e.target.value})}
                    className="bg-background border-2 h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Región</Label>
                  <Input value={user.region} disabled className="bg-muted border-2 h-12 font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Teléfono</Label>
                  <Input 
                    value={editData.phone} 
                    onChange={e => setEditData({...editData, phone: e.target.value})}
                    className="bg-background border-2 h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Correo Electrónico</Label>
                  <Input 
                    type="email"
                    value={editData.email} 
                    onChange={e => setEditData({...editData, email: e.target.value})}
                    className="bg-background border-2 h-12"
                  />
                </div>
              </div>
              <Button 
                className="w-full md:w-auto px-8 h-12 font-black uppercase"
                disabled={updateProfile.isPending}
                onClick={() => updateProfile.mutate(editData)}
              >
                {updateProfile.isPending ? <Loader2 className="animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                Guardar Cambios
              </Button>
            </CardContent>
          </Card>

          {/* Security / NIP */}
          <Card className="neo-card border-2">
            <CardHeader>
              <CardTitle className="text-2xl font-black uppercase tracking-tight">Seguridad</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase">Actualiza tu NIP (4 a 6 caracteres alfanuméricos)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Nuevo NIP</Label>
                  <Input 
                    type="password"
                    placeholder="****"
                    value={nipData.new} 
                    onChange={e => setNipData({...nipData, new: e.target.value})}
                    className="bg-background border-2 h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Confirmar Nuevo NIP</Label>
                  <Input 
                    type="password"
                    placeholder="****"
                    value={nipData.confirm} 
                    onChange={e => setNipData({...nipData, confirm: e.target.value})}
                    className="bg-background border-2 h-12"
                  />
                </div>
              </div>
              <Button 
                variant="secondary"
                className="w-full md:w-auto px-8 h-12 font-black uppercase border-2 shadow-neo-sm"
                disabled={!nipData.new || nipData.new !== nipData.confirm || nipData.new.length < 4 || updateNip.isPending}
                onClick={() => updateNip.mutate({ nip: nipData.new })}
              >
                {updateNip.isPending ? <Loader2 className="animate-spin mr-2" /> : <Key className="w-5 h-5 mr-2" />}
                Actualizar NIP
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
