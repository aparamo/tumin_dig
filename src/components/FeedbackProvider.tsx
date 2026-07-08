"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { Toaster, toast } from "sonner";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface FeedbackContextValue {
  notifySuccess: (message: string) => void;
  notifyError: (message: string) => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const notifySuccess = useCallback((message: string) => {
    toast.success(message);
  }, []);

  const notifyError = useCallback((message: string) => {
    setErrorMessage(message);
  }, []);

  const closeError = () => setErrorMessage(null);

  return (
    <FeedbackContext.Provider value={{ notifySuccess, notifyError }}>
      {children}
      <Toaster
        position="top-center"
        richColors
        closeButton
        theme={resolvedTheme as "light" | "dark" | "system" | undefined}
      />
      <Dialog open={!!errorMessage} onOpenChange={(open) => !open && closeError()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="uppercase font-black tracking-tight">Algo salió mal</DialogTitle>
            <DialogDescription className="font-bold uppercase text-xs tracking-wide">
              {errorMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={closeError} className="font-black uppercase">
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error("useFeedback must be used within FeedbackProvider");
  }
  return ctx;
}
