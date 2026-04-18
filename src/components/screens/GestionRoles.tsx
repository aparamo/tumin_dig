"use client";

import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Users } from "lucide-react";

export function GestionRoles() {
  const { data: session } = useSession();
  const utils = trpc.useUtils();
  const { data: usersList, isLoading } = trpc.user.getUsersByRegion.useQuery();

  const updateRole = trpc.user.updateRole.useMutation({
    onSuccess: () => {
      alert("Rol actualizado con éxito.");
      utils.user.getUsersByRegion.invalidate();
    },
    onError: (error) => alert(error.message),
  });

  if (!session?.user) return null;

  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <Users className="w-6 h-6 text-purple-600" /> Gestión de Socios
      </h1>
      <p className="text-sm text-slate-500">Administración de usuarios en {session.user.region}</p>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
        ) : usersList && usersList.length > 0 ? (
          usersList.filter(u => u.id !== session.user.id).map((user) => (
            <Card key={user.id} className="shadow-sm border-slate-100">
              <CardContent className="p-4 flex justify-between items-center">
                <div className="flex-1">
                  <div className="font-bold text-slate-800">{user.name}</div>
                  <div className="text-[10px] text-slate-400">ID: {user.id}</div>
                </div>
                
                <Select 
                  defaultValue={user.role} 
                  onValueChange={(val: any) => updateRole.mutate({ userId: user.id, role: val })}
                >
                  <SelectTrigger className="w-[140px] h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOCIO">Socio</SelectItem>
                    <SelectItem value="COORDINADOR_LOCAL">Coordinador L.</SelectItem>
                    {session.user.role === "COORDINADOR" && <SelectItem value="COORDINADOR">Coordinador</SelectItem>}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-10 text-slate-400">No hay otros socios registrados en tu región.</div>
        )}
      </div>
    </div>
  );
}
