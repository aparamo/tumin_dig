"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Loader2, Save, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Perfil() {
  const { data: session } = useSession();
  const [newNip, setNewNip] = useState("");
  
  const updateNip = trpc.user.updateNip.useMutation({
    onSuccess: () => {
      alert("NIP actualizado correctamente.");
      setNewNip("");
    },
    onError: (error) => alert(error.message),
  });

  const invitationLink = typeof window !== "undefined" 
    ? `${window.location.origin}/register?ref=${session?.user?.id}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(invitationLink);
    alert("¡Link copiado con éxito!");
  };

  if (!session?.user) return null;

  return (
    <div className="flex flex-col gap-6 p-4 max-w-2xl mx-auto w-full pb-10">
      <h1 className="text-3xl font-black uppercase tracking-tighter">Mi Perfil</h1>

      <Card className="bg-secondary/10 border-secondary border-dashed">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-secondary">
            🤝 Invitar Amigos
          </CardTitle>
          <CardDescription className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest mt-1">
            Solo con tu link pueden registrarse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={copyLink} variant="secondary" className="w-full h-12">
            <Copy className="w-4 h-4 mr-2" /> Copiar Link
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-4 py-8 bg-card rounded-xl border-2 border-border shadow-neo">
        <div className="bg-white p-4 rounded-lg border-2 border-border shadow-neo-sm">
          <QRCodeSVG
            value={invitationLink}
            size={180}
            level={"H"}
            includeMargin={true}
          />
        </div>
        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Escanea para cobrar o invitar</p>
      </div>

      <Card>
        <CardContent className="pt-8 space-y-6">
          <div className="flex justify-between items-center border-b-2 border-muted pb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">ID Usuario</span>
            <span className="text-sm font-black tracking-tight">{session.user.id}</span>
          </div>
          <div className="flex justify-between items-center border-b-2 border-muted pb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre</span>
            <span className="text-sm font-black tracking-tight">{session.user.name}</span>
          </div>
          <div className="flex justify-between items-center border-b-2 border-muted pb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Región</span>
            <span className="text-sm font-black tracking-tight">{session.user.region}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rol</span>
            <span className="text-sm font-black text-primary uppercase">{session.user.role}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Seguridad</CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase">Cambia tu NIP de 4 números</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex gap-3" onSubmit={(e) => {
            e.preventDefault();
            if (newNip.length === 4) updateNip.mutate({ nip: newNip });
          }}>
            <Input 
              type="password" 
              maxLength={4} 
              placeholder="****" 
              className="text-center tracking-widest bg-background text-xl font-black flex-1"
              value={newNip}
              onChange={(e) => setNewNip(e.target.value)}
              required
            />
            <Button disabled={updateNip.isPending || newNip.length !== 4} className="h-12 w-12 p-0">
              {updateNip.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
