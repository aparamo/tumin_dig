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
}

export function SaveContactButton({
  contactUserId,
  isSaved,
  disabled,
  className,
  size = "default",
  variant = "outline",
}: SaveContactButtonProps) {
  const utils = trpc.useUtils();
  const { notifySuccess, notifyError } = useFeedback();

  const saveMutation = trpc.directory.saveContact.useMutation({
    onSuccess: () => {
      notifySuccess("Contacto guardado");
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

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={disabled || pending}
      className={cn("text-sm font-black uppercase shadow-neo-sm md:text-base", className)}
      onClick={() => {
        if (isSaved) {
          removeMutation.mutate({ contactUserId });
        } else {
          saveMutation.mutate({ contactUserId });
        }
      }}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isSaved ? (
        <>
          <BookmarkCheck className="h-4 w-4 mr-1.5" /> Quitar
        </>
      ) : (
        <>
          <BookmarkPlus className="h-4 w-4 mr-1.5" /> Guardar contacto
        </>
      )}
    </Button>
  );
}
