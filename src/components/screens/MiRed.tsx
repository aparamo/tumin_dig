"use client";

import { trpc } from "@/lib/trpc/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Network, ShieldCheck } from "lucide-react";
import { formatPublicLocation, formatEnrollmentDisplay } from "@/lib/location";

function relativeDate(d: Date) {
  const now = new Date();
  const diff = now.getTime() - new Date(d).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) return "hoy";
  if (days < 30) return `hace ${days} día${days > 1 ? "s" : ""}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `hace ${months} mes${months > 1 ? "es" : ""}`;
  return `hace ${Math.floor(months / 12)} año${Math.floor(months / 12) > 1 ? "s" : ""}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function MiRed() {
  const { data: network, isLoading } = trpc.user.getMyNetwork.useQuery();

  return (
    <div className="flex flex-col gap-8 p-4 max-w-3xl mx-auto w-full pb-12">
      <div className="space-y-1">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground flex items-center gap-3">
          <Network className="w-10 h-10 text-primary" /> Mi Red
        </h1>
        <p className="text-base font-bold text-muted-foreground uppercase tracking-widest">
          Socios que se unieron con tu invitación
        </p>
      </div>

      <Card className="bg-primary/10 border-primary shadow-neo">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-2xl">
            {isLoading ? <Loader2 className="animate-spin" /> : network?.length ?? 0}
          </div>
          <div>
            <p className="text-2xl font-black uppercase tracking-tight">
              {isLoading ? "Cargando..." : `${network?.length ?? 0} referido${(network?.length ?? 0) === 1 ? "" : "s"}`}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">
              Total de socios invitados
            </p>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : network && network.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {network.map((member) => {
            const displayName = member.publicName?.trim() || member.name;
            const location = formatPublicLocation({
              residenceCountry: member.residenceCountry,
              residenceState: member.residenceState,
              residenceCity: member.residenceCity,
              residencePostalCode: null,
            });
            return (
              <Card key={member.id} className="border-2 border-border shadow-neo-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted border-2 border-border flex items-center justify-center font-black text-sm text-muted-foreground shrink-0">
                      {initials(displayName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-sm uppercase tracking-tight truncate">
                          {displayName}
                        </p>
                        {member.isVerified ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200 font-black uppercase text-[9px]">
                            <ShieldCheck className="w-3 h-3 mr-1" /> Verificado
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="font-black uppercase text-[9px]">
                            Pendiente
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
                        {formatEnrollmentDisplay(member.region, "REGION", null)}
                      </p>
                      {location && (
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">
                          {location}
                        </p>
                      )}
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
                        Se unió {relativeDate(member.createdAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-muted/20 border-dashed border-2 shadow-none p-12 text-center text-muted-foreground font-bold uppercase text-sm">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
          Aún no tienes referidos.
          <p className="text-[10px] font-medium normal-case mt-2">
            Comparte tu link de invitación desde tu perfil para empezar a construir tu red.
          </p>
        </Card>
      )}
    </div>
  );
}
