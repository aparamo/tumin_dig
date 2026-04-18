"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Loader2, Save } from "lucide-react";

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
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-2xl font-bold text-slate-800">Mi Perfil</h1>

      <Card className="shadow-md border-blue-50 bg-blue-50/30">
        <CardHeader className="text-center">
          <CardTitle className="text-lg flex items-center justify-center gap-2 text-blue-800">
            🤝 Invitar a un conocido
          </CardTitle>
          <CardDescription className="text-blue-600">
            Solo con tu link pueden registrarse en la red.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={copyLink} className="w-full bg-blue-600 hover:bg-blue-700">
            <Copy className="w-4 h-4 mr-2" /> Copiar Link de Invitación
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-2 py-4 bg-white rounded-xl shadow-sm border">
        <div className="bg-white p-4 rounded-lg shadow-inner">
          <QRCodeSVG
            value={invitationLink}
            size={200}
            level={"H"}
            includeMargin={true}
          />
        </div>
        <p className="text-[10px] text-slate-400">Tu código para recibir cobros e invitaciones</p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="pt-6 space-y-4">
          <div className="flex justify-between border-b pb-2">
            <span className="text-sm text-slate-500">ID Usuario</span>
            <span className="text-sm font-bold">{session.user.id}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-sm text-slate-500">Nombre</span>
            <span className="text-sm font-bold">{session.user.name}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-sm text-slate-500">Región</span>
            <span className="text-sm font-bold">{session.user.region}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-500">Rol</span>
            <span className="text-sm font-bold text-orange-600">{session.user.role}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-md">Cambiar NIP</CardTitle>
          <CardDescription className="text-xs">Crea un nuevo NIP de seguridad de 4 números.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex gap-2" onSubmit={(e) => {
            e.preventDefault();
            if (newNip.length === 4) updateNip.mutate({ nip: newNip });
          }}>
            <Input 
              type="password" 
              maxLength={4} 
              placeholder="****" 
              className="text-center tracking-widest"
              value={newNip}
              onChange={(e) => setNewNip(e.target.value)}
              required
            />
            <Button disabled={updateNip.isPending || newNip.length !== 4}>
              {updateNip.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
