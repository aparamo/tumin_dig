"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export function useConfirm() {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({ ...options, resolve });
    });
  }, []);

  const handleClose = useCallback((result: boolean) => {
    if (!confirmState) return;
    confirmState.resolve(result);
    setConfirmState(null);
  }, [confirmState]);

  const ConfirmDialog = useCallback(() => {
    if (!confirmState) return null;
    return (
      <Dialog open onOpenChange={() => handleClose(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="uppercase font-black tracking-tight">
              {confirmState.title}
            </DialogTitle>
            {confirmState.description && (
              <DialogDescription className="font-bold uppercase text-xs tracking-wide">
                {confirmState.description}
              </DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => handleClose(false)}
              className="font-black uppercase"
            >
              {confirmState.cancelText || "Cancelar"}
            </Button>
            <Button
              variant={confirmState.variant === "destructive" ? "destructive" : "default"}
              onClick={() => handleClose(true)}
              className="font-black uppercase"
            >
              {confirmState.confirmText || "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }, [confirmState, handleClose]);

  return { confirm, ConfirmDialog };
}
