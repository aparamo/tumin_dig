"use client";

import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, MapPin, UserCheck, ImageIcon, Briefcase, ThumbsUp, ThumbsDown, Megaphone, ShieldCheck } from "lucide-react";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { formatEnrollmentDisplay, formatPublicLocation } from "@/lib/location";
import { useFeedback } from "@/components/FeedbackProvider";
import { useConfirm } from "@/hooks/use-confirm";
import { parseErrorMessage } from "@/lib/parse-error";
import { SmartAdsPanel } from "@/components/SmartAdsPanel";

export function Coordinacion() {
  const { data: session } = useSession();
  const utils = trpc.useUtils();
  const { notifySuccess, notifyError } = useFeedback();
  const { confirm, ConfirmDialog } = useConfirm();

  const { data: jobs, isLoading: isLoadingJobs } = trpc.jobs.getPendingJobs.useQuery();
  const { data: unverifiedUsers, isLoading: isLoadingUsers } = trpc.user.getUnverifiedUsers.useQuery();
  const { data: pendingAds, isLoading: isLoadingAds } = trpc.ads.getPendingAds.useQuery();
  const { data: pendingValidations, isLoading: isLoadingValidations } = trpc.audit.getPendingAuditorValidations.useQuery();

  const validateAuditorMutation = trpc.audit.validateAuditor.useMutation({
    onSuccess: () => {
      notifySuccess("Auditoría de par validada correctamente.");
      utils.audit.getPendingAuditorValidations.invalidate();
      utils.audit.getAuditRewardStatus.invalidate();
    },
    onError: (error) => notifyError(parseErrorMessage(error)),
  });

  const verifyJobMutation = trpc.jobs.verifyJob.useMutation({
    onSuccess: (data) => {
      notifySuccess(data.status === "PAGADO" ? "Pago autorizado con éxito." : "Trabajo rechazado.");
      utils.jobs.getPendingJobs.invalidate();
    },
    onError: (error) => notifyError(parseErrorMessage(error)),
  });

  const verifyUserMutation = trpc.user.verifyUserIdentity.useMutation({
    onSuccess: () => {
      notifySuccess("Identidad de socio verificada.");
      utils.user.getUnverifiedUsers.invalidate();
    },
    onError: (error) => notifyError(parseErrorMessage(error)),
  });

  const adMutation = trpc.ads.approveAd.useMutation({
    onSuccess: () => {
      notifySuccess("Anuncio aprobado.");
      utils.ads.getPendingAds.invalidate();
    },
    onError: (e) => notifyError(parseErrorMessage(e)),
  });

  const rejectAdMutation = trpc.ads.rejectAd.useMutation({
    onSuccess: () => {
      notifySuccess("Anuncio rechazado.");
      utils.ads.getPendingAds.invalidate();
    },
    onError: (e) => notifyError(parseErrorMessage(e)),
  });

  const handleVerifyJob = (jobId: string, status: "PAGADO" | "RECHAZADO") => async () => {
    if (status === "RECHAZADO") {
      const ok = await confirm({
        title: "Rechazar labor",
        description: "El solicitante no recibirá pago. ¿Continuar?",
        confirmText: "Rechazar",
        variant: "destructive",
      });
      if (!ok) return;
    }
    verifyJobMutation.mutate({ jobId, status });
  };

  const handleRejectAd = async (adId: string) => {
    const ok = await confirm({
      title: "Rechazar anuncio",
      description: "El anuncio pasará a inactivo. ¿Continuar?",
      confirmText: "Rechazar",
      variant: "destructive",
    });
    if (ok) rejectAdMutation.mutate({ adId });
  };

  if (!session?.user) return null;

  return (
    <div className="flex flex-col gap-6 p-4 max-w-5xl mx-auto w-full pb-20">
      <ConfirmDialog />
      <div className="space-y-1">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Panel de Coordinación</h1>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Gestión por región adscrita: {session.user.region}
        </p>
      </div>

      <Tabs defaultValue="labores" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-14 bg-muted/50 p-1 rounded-xl border-2 border-border shadow-neo-sm">
          <TabsTrigger value="labores" className="rounded-lg font-black uppercase text-[10px] gap-1 md:gap-2">
            <Briefcase className="w-4 h-4" /> Labores
          </TabsTrigger>
          <TabsTrigger value="socios" className="rounded-lg font-black uppercase text-[10px] gap-1 md:gap-2">
            <UserCheck className="w-4 h-4" /> Socios
          </TabsTrigger>
          <TabsTrigger value="publicidad" className="rounded-lg font-black uppercase text-[10px] gap-1 md:gap-2">
            <ImageIcon className="w-4 h-4" /> Publicidad
          </TabsTrigger>
          <TabsTrigger value="avisos" className="rounded-lg font-black uppercase text-[10px] gap-1 md:gap-2">
            <Megaphone className="w-4 h-4" /> Avisos
          </TabsTrigger>
          <TabsTrigger value="auditorias" className="rounded-lg font-black uppercase text-[10px] gap-1 md:gap-2">
            <ShieldCheck className="w-4 h-4" /> Pares
          </TabsTrigger>
        </TabsList>

        <TabsContent value="labores" className="mt-6">
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoadingJobs ? (
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
                          <MapPin className="w-3 h-3" /> Adscripción: {item.requester.region}
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
                          className="flex-1 h-12 shadow-neo-sm"
                          onClick={handleVerifyJob(item.job.id, "PAGADO")}
                          disabled={verifyJobMutation.isPending}
                        >
                          <Check className="w-5 h-5 mr-2" /> Aprobar
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1 h-12 shadow-neo-sm"
                          onClick={handleVerifyJob(item.job.id, "RECHAZADO")}
                          disabled={verifyJobMutation.isPending}
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
                No hay labores pendientes.
              </div>
            )}
          </StaggerContainer>
        </TabsContent>

        <TabsContent value="socios" className="mt-6">
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoadingUsers ? (
              <div className="col-span-full flex justify-center p-12"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
            ) : unverifiedUsers && unverifiedUsers.length > 0 ? (
              unverifiedUsers.map((u) => (
                <StaggerItem key={u.id}>
                  <Card className="border-l-8 border-l-purple-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl uppercase font-black">{u.name}</CardTitle>
                      <CardDescription className="font-mono text-[10px]">{u.id}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground uppercase font-bold shrink-0">Inscripción:</span>
                          <span className="font-black text-right">
                            {formatEnrollmentDisplay(u.region, u.enrollmentMethod, u.enrollmentMethodOther)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground uppercase font-bold shrink-0">Vive en:</span>
                          <span className="font-black text-right">
                            {formatPublicLocation({
                              residenceCountry: u.residenceCountry,
                              residenceState: u.residenceState,
                              residenceCity: u.residenceCity,
                              residencePostalCode: u.residencePostalCode,
                            }) ?? "Sin registrar"}
                          </span>
                        </div>
                        <div className="flex justify-between"><span className="text-muted-foreground uppercase font-bold">Tel:</span> <span className="font-black">{u.phone}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground uppercase font-bold">Email:</span> <span className="font-black">{u.email || "N/A"}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground uppercase font-bold">Registro:</span> <span className="font-black">{new Date(u.createdAt).toLocaleDateString()}</span></div>
                      </div>
                      <Button
                        className="w-full h-12 bg-purple-600 hover:bg-purple-700 shadow-neo-sm uppercase font-black"
                        onClick={() => verifyUserMutation.mutate({ userId: u.id, verified: true })}
                        disabled={verifyUserMutation.isPending}
                      >
                        <UserCheck className="w-5 h-5 mr-2" /> Validar Socio
                      </Button>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))
            ) : (
              <div className="col-span-full neo-card bg-muted/20 border-dashed border-2 shadow-none p-12 text-center text-muted-foreground font-bold uppercase text-sm tracking-widest">
                No hay nuevos socios por validar.
              </div>
            )}
          </StaggerContainer>
        </TabsContent>

        <TabsContent value="publicidad" className="mt-6">
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoadingAds ? (
              <div className="col-span-full flex justify-center p-12"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
            ) : pendingAds && pendingAds.length > 0 ? (
              pendingAds.map((ad) => (
                <StaggerItem key={ad.id}>
                  <Card className="overflow-hidden border-2 border-border shadow-neo">
                    <div className="relative aspect-video w-full bg-muted">
                       <Image src={ad.imageUrl} alt="Ad content" fill className="object-cover" />
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-black uppercase truncate">{ad.userName}</CardTitle>
                        <Badge variant="secondary" className="text-[10px] font-black uppercase shrink-0">
                          {ad.targetRegion === "GENERAL" ? "Toda la red" : ad.targetRegion}
                        </Badge>
                      </div>
                      <CardDescription className="text-[10px] font-bold uppercase">Mes de anuncio gratis</CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                      <Button
                        variant="default"
                        className="flex-1 h-10 uppercase font-black text-xs"
                        onClick={() => adMutation.mutate({ adId: ad.id })}
                        disabled={adMutation.isPending}
                      >
                        <ThumbsUp className="w-4 h-4 mr-2" /> Aprobar
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1 h-10 uppercase font-black text-xs"
                        onClick={() => handleRejectAd(ad.id)}
                        disabled={rejectAdMutation.isPending}
                      >
                        <ThumbsDown className="w-4 h-4 mr-2" /> Rechazar
                      </Button>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))
            ) : (
              <div className="col-span-full neo-card bg-muted/20 border-dashed border-2 shadow-none p-12 text-center text-muted-foreground font-bold uppercase text-sm tracking-widest">
                No hay anuncios pendientes.
              </div>
            )}
          </StaggerContainer>
        </TabsContent>

        <TabsContent value="avisos" className="mt-6">
          <SmartAdsPanel />
        </TabsContent>

        <TabsContent value="auditorias" className="mt-6">
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoadingValidations ? (
              <div className="col-span-full flex justify-center p-12">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              </div>
            ) : pendingValidations && pendingValidations.length > 0 ? (
              pendingValidations.map((v) => (
                <StaggerItem key={v.id}>
                  <Card className="h-full border-l-8 border-l-emerald-500">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {v.region}
                        </Badge>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                          {new Date(v.lastActivityAt).toLocaleDateString()}
                        </span>
                      </div>
                      <CardTitle className="text-xl mt-4 leading-tight">{v.name}</CardTitle>
                      <CardDescription className="font-mono text-[10px]">{v.id}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground font-bold uppercase mb-4">
                        Tiene actividad de coordinación este mes y espera validación de un par.
                      </p>
                      <Button
                        variant="default"
                        className="w-full h-12 shadow-neo-sm"
                        onClick={async () => {
                          const ok = await confirm({
                            title: "Validar auditoría de par",
                            description: `¿Confirmas que ${v.name} realizó trabajo de coordinación este mes?`,
                            confirmText: "Validar",
                          });
                          if (ok) validateAuditorMutation.mutate({ targetUserId: v.id });
                        }}
                        disabled={validateAuditorMutation.isPending}
                      >
                        <ShieldCheck className="w-5 h-5 mr-2" /> Validar Auditoría
                      </Button>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))
            ) : (
              <div className="col-span-full neo-card bg-muted/20 border-dashed border-2 shadow-none p-12 text-center text-muted-foreground font-bold uppercase text-sm tracking-widest">
                No hay coordinadores con actividad pendiente de validar.
              </div>
            )}
          </StaggerContainer>
        </TabsContent>
      </Tabs>
    </div>
  );
}
