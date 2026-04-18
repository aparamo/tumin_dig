"use client";

import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, MapPin } from "lucide-react";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion";

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
    <div className="flex flex-col gap-6 p-4 max-w-4xl mx-auto w-full pb-10">
      <div className="space-y-1">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Coordinación</h1>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Validación de labores en {session.user.region}
        </p>
      </div>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center p-12">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : jobs && jobs.length > 0 ? (
          jobs.map((item) => (
            <StaggerItem key={item.job.id}>
              <Card className="h-full border-l-8 border-l-primary">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {item.requester.region}
                    </Badge>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                      {new Date(item.job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <CardTitle className="text-xl mt-4 leading-tight">{item.job.description}</CardTitle>
                  <CardDescription className="font-black text-foreground uppercase text-xs mt-1">
                    Socio: {item.requester.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-secondary mb-6 tracking-tighter">
                    {item.job.amount} Ŧ
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="default"
                      className="flex-1 h-12"
                      onClick={() => verifyMutation.mutate({ jobId: item.job.id, status: "PAGADO" })}
                      disabled={verifyMutation.isPending}
                    >
                      <Check className="w-5 h-5 mr-2" /> Aprobar
                    </Button>
                    <Button 
                      variant="destructive"
                      className="flex-1 h-12"
                      onClick={() => verifyMutation.mutate({ jobId: item.job.id, status: "RECHAZADO" })}
                      disabled={verifyMutation.isPending}
                    >
                      <X className="w-5 h-5 mr-2" /> Rechazar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))
        ) : (
          <div className="col-span-full neo-card bg-muted/20 border-dashed border-2 shadow-none p-12 text-center text-muted-foreground font-bold uppercase text-sm tracking-widest">
            No hay tareas pendientes de validación.
          </div>
        )}
      </StaggerContainer>
    </div>
  );
}
