"use client";

import Link from "next/link";
import Image from "next/image";
import { trpc } from "@/lib/trpc/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle, ShieldCheck, Star, User, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { SaveContactButton } from "@/components/directory/SaveContactButton";

export interface MemberDetailDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MemberDetailDialog({ userId, open, onOpenChange }: MemberDetailDialogProps) {
  const { data, isLoading, isError, error } = trpc.directory.getMemberDetail.useQuery(
    { userId: userId ?? "" },
    { enabled: open && !!userId }
  );

  const waHref =
    data?.phone && data.showPhone
      ? (() => {
          const digits = data.phone.replace(/\D/g, "");
          const withCountry = digits.startsWith("52") ? digits : `52${digits}`;
          return `https://wa.me/${withCountry}?text=${encodeURIComponent(
            `Hola ${data.displayName}, te contacto desde Túmin digital.`
          )}`;
        })()
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "z-50 flex flex-col gap-0 overflow-hidden bg-background p-0 ring-0",
          "fixed inset-0 left-0 top-0 h-dvh w-full max-w-none translate-x-0 translate-y-0 rounded-none border-0 shadow-none",
          "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[90dvh] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border-2 sm:border-border sm:shadow-neo-sm"
        )}
      >
        {!userId || isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-black uppercase tracking-wide text-muted-foreground md:text-base">Cargando…</p>
          </div>
        ) : isError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
            <p className="text-center font-bold text-destructive">{error.message}</p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        ) : data ? (
          <>
            <DialogHeader className="shrink-0 space-y-3 border-b-2 border-border p-5 text-left">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted">
                  {data.avatarUrl ? (
                    <Image src={data.avatarUrl} alt="" fill className="object-cover" sizes="64px" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <User className="h-7 w-7" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <DialogTitle className="flex items-center gap-2 font-black uppercase tracking-tight">
                    <span className="truncate">{data.displayName}</span>
                    {data.isVerified && <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />}
                  </DialogTitle>
                  <DialogDescription className="text-sm font-bold text-muted-foreground md:text-base">
                    {data.region}
                    {data.location ? ` · ${data.location}` : ""}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {data.bio && (
                <p className="text-sm font-medium leading-relaxed text-foreground/90">{data.bio}</p>
              )}

              {data.categories.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-black uppercase tracking-wide text-muted-foreground md:text-base">
                    Categorías
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.categories.map((c) => (
                      <Badge key={c} variant="secondary" className="text-sm font-bold uppercase md:text-base">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {data.starProducts.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-1 text-sm font-black uppercase tracking-wide text-secondary md:text-base">
                    <Star className="h-4 w-4 fill-current" /> Productos estrella
                  </p>
                  <ul className="space-y-2">
                    {data.starProducts.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center gap-3 rounded-lg border-2 border-border bg-muted/20 p-2"
                      >
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                          {p.imageUrl ? (
                            <Image src={p.imageUrl} alt="" fill className="object-cover" sizes="40px" />
                          ) : null}
                        </div>
                        <span className="truncate text-sm font-bold">{p.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {data.otherProducts.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-black uppercase tracking-wide text-muted-foreground md:text-base">
                    Más productos
                  </p>
                  <ul className="space-y-1">
                    {data.otherProducts.map((p) => (
                      <li key={p.id} className="truncate text-sm font-medium text-foreground/80 md:text-base">
                        {p.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="shrink-0 space-y-2 border-t-2 border-border p-4">
              <div className="flex flex-wrap gap-2">
                {waHref ? (
                  <Button asChild className="flex-1 text-sm font-black uppercase shadow-neo-sm md:text-base">
                    <a href={waHref} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="mr-1.5 h-4 w-4" /> Contactar
                    </a>
                  </Button>
                ) : (
                  <Button disabled className="flex-1 text-sm font-black uppercase md:text-base" variant="outline">
                    <MessageCircle className="mr-1.5 h-4 w-4" /> Sin WhatsApp público
                  </Button>
                )}
                <SaveContactButton
                  contactUserId={data.id}
                  isSaved={data.isSavedContact}
                  className="flex-1"
                />
              </div>
              <Button asChild variant="ghost" className="w-full text-sm font-black uppercase tracking-wide md:text-base">
                <Link href={data.publicProfilePath} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1.5 h-4 w-4" /> Ver perfil público
                </Link>
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
