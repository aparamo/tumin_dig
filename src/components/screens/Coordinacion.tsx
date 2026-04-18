"use client";

import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, MapPin } from "lucide-react";

export function Coordinacion() {
  const { data: session } = useSession();
  const utils = trpc.useUtils();
  const { data: jobs, isLoading } = trpc.jobs.getPendingJobs.useQuery();

  const verifyMutation = trpc.jobs.verifyJob.useMutation({
    onSuccess: (data) => {
      alert(data.status === "PAGADO" ? "Pago autorizado con éxito." : "Trabajo rechazado.");
      utils.jobs.getPendingJobs.invalidate();
    },
    onError: (error) => alert(error.message),
  });

  if (!session?.user) return null;

  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-2xl font-bold text-slate-800">Panel de Coordinador</h1>
      <p className="text-sm text-slate-500">Validación de labores comunitarias en {session.user.region}</p>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
        ) : jobs && jobs.length > 0 ? (
          jobs.map((item) => (
            <Card key={item.job.id} className="border-l-4 border-l-blue-500 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {item.requester.region}
                  </Badge>
                  <span className="text-xs text-slate-400">{new Date(item.job.createdAt).toLocaleDateString()}</span>
                </div>
                <CardTitle className="text-md mt-2">{item.job.description}</CardTitle>
                <CardDescription className="font-bold text-slate-700">
                  Socio: {item.requester.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-orange-600 font-bold mb-4">
                  Recompensa: {item.job.amount} Ŧ
                </div>
                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700 font-bold"
                    onClick={() => verifyMutation.mutate({ jobId: item.job.id, status: "PAGADO" })}
                    disabled={verifyMutation.isPending}
                  >
                    <Check className="w-4 h-4 mr-2" /> Aprobar
                  </Button>
                  <Button 
                    variant="destructive"
                    className="flex-1 font-bold"
                    onClick={() => verifyMutation.mutate({ jobId: item.job.id, status: "RECHAZADO" })}
                    disabled={verifyMutation.isPending}
                  >
                    <X className="w-4 h-4 mr-2" /> Rechazar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-10 text-slate-400">No hay tareas pendientes de validación en tu región.</div>
        )}
      </div>
    </div>
  );
}
