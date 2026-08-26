"use client";

import { trpc } from "@/lib/trpc/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { formatEnrollmentDisplay, formatPublicLocation } from "@/lib/location";
import { cn } from "@/lib/utils";

interface VisibilityStatusDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Flag({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-xs font-black uppercase",
        ok ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "border-destructive/40 bg-destructive/10 text-destructive"
      )}
    >
      {ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
      {label}
    </div>
  );
}

export function VisibilityStatusDialog({
  userId,
  open,
  onOpenChange,
}: VisibilityStatusDialogProps) {
  const { data, isLoading, isError, error } = trpc.user.getVisibilityStatus.useQuery(
    { userId: userId ?? "" },
    { enabled: open && !!userId }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-2">
        <DialogHeader>
          <DialogTitle className="font-black uppercase tracking-tight flex items-center gap-2">
            <Eye className="h-5 w-5" /> Visibilidad
          </DialogTitle>
          <DialogDescription className="text-[10px] font-bold uppercase tracking-widest">
            Diagnóstico Bazar / Directorio
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <p className="text-sm font-bold text-destructive">{error.message}</p>
        ) : data ? (
          <div className="space-y-4">
            <div>
              <p className="text-lg font-black">{data.displayName}</p>
              <p className="text-[10px] font-bold uppercase text-muted-foreground">
                {data.userId}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Flag ok={data.apareceDirectorio} label="Directorio" />
              <Flag ok={data.apareceBazar} label="Bazar" />
            </div>

            <div className="space-y-2 rounded-xl border-2 border-border bg-muted/20 p-3 text-[11px] font-bold">
              <div className="flex flex-wrap gap-2">
                <Badge variant={data.publicProfile ? "default" : "destructive"} className="text-[9px] uppercase">
                  {data.publicProfile ? (
                    <><Eye className="mr-1 h-3 w-3" /> Perfil público</>
                  ) : (
                    <><EyeOff className="mr-1 h-3 w-3" /> Perfil privado</>
                  )}
                </Badge>
                <Badge variant="outline" className="text-[9px] uppercase">
                  {data.status}
                </Badge>
                <Badge variant="outline" className="text-[9px] uppercase">
                  {data.isVerified ? "Verificado" : "Sin verificar"}
                </Badge>
              </div>
              <p>
                Adscripción:{" "}
                <span className="text-foreground">
                  {formatEnrollmentDisplay(
                    data.region,
                    data.enrollmentMethod,
                    data.enrollmentMethodOther
                  )}
                </span>
              </p>
              <p>
                Vive en:{" "}
                <span className="text-foreground">
                  {formatPublicLocation({
                    residenceCountry: data.residenceCountry,
                    residenceState: data.residenceState,
                    residenceCity: data.residenceCity,
                    residencePostalCode: null,
                  }) ?? "—"}
                </span>
              </p>
              <p>
                Productos: {data.productsTotal} total · {data.productsActivos} activos ·{" "}
                {data.productsVisibles} visibles en bazar
              </p>
            </div>

            <ul className="space-y-2">
              {data.motivos.map((m) => (
                <li
                  key={m}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium leading-snug"
                >
                  {m}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
