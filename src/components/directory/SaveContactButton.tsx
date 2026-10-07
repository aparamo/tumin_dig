"use client";

import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { BookmarkPlus, BookmarkCheck, Loader2 } from "lucide-react";
import { useFeedback } from "@/components/FeedbackProvider";
import { parseErrorMessage } from "@/lib/parse-error";
import { cn } from "@/lib/utils";

export interface SaveContactButtonProps {
  contactUserId: string;
  isSaved: boolean;
  disabled?: boolean;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "xs";
  variant?: "default" | "outline" | "secondary" | "ghost";
  /** Compact ghost style for dialogs (Comunicarse, etc.) */
  subtle?: boolean;
}

export function SaveContactButton({
  contactUserId,
  isSaved,
  disabled,
  className,
  size = "default",
  variant = "outline",
  subtle = false,
}: SaveContactButtonProps) {
  const utils = trpc.useUtils();
  const { notifySuccess, notifyError } = useFeedback();

  const saveMutation = trpc.directory.saveContact.useMutation({
    onSuccess: () => {
      notifySuccess("Contacto guardado en Mis contactos");
      void utils.directory.invalidate();
    },
    onError: (e) => notifyError(parseErrorMessage(e)),
  });

  const removeMutation = trpc.directory.removeContact.useMutation({
    onSuccess: () => {
      notifySuccess("Contacto eliminado");
      void utils.directory.invalidate();
    },
    onError: (e) => notifyError(parseErrorMessage(e)),
  });

  const pending = saveMutation.isPending || removeMutation.isPending;
  const resolvedVariant = subtle ? "ghost" : variant;
  const resolvedSize = subtle ? "sm" : size;

  return (
    <Button
      type="button"
      variant={resolvedVariant}
      size={resolvedSize}
      disabled={disabled || pending}
      title={isSaved ? "Quitar de Mis contactos" : "Guardar en Mis contactos"}
      className={cn(
        "min-w-0 font-black uppercase",
        subtle
          ? "h-8 gap-1.5 px-2 text-[10px] tracking-wide text-muted-foreground hover:text-foreground shadow-none"
          : "text-xs shadow-neo-sm sm:text-sm md:text-base",
        className
      )}
      onClick={() => {
        if (isSaved) {
          removeMutation.mutate({ contactUserId });
        } else {
          saveMutation.mutate({ contactUserId });
        }
      }}
    >
      {pending ? (
        <Loader2 className={cn("animate-spin", subtle ? "h-3.5 w-3.5" : "h-4 w-4")} />
      ) : isSaved ? (
        <>
          <BookmarkCheck className={cn(subtle ? "h-3.5 w-3.5" : "h-4 w-4 mr-1.5")} />
          {subtle ? "En contactos" : "Quitar"}
        </>
      ) : (
        <>
          <BookmarkPlus className={cn(subtle ? "h-3.5 w-3.5" : "h-4 w-4 mr-1.5")} />
          {subtle ? "Guardar contacto" : "Guardar contacto"}
        </>
      )}
    </Button>
  );
}
