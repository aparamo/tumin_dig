"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  TRANSACTION_KIND_LABELS,
  type HistoryTransaction,
} from "@/lib/transaction-presentation";
import { ArrowDownLeft, ArrowUpRight, ShoppingBag } from "lucide-react";

export interface TransactionDetailDialogProps {
  transaction: HistoryTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PartyLine({
  label,
  party,
}: {
  label: string;
  party: HistoryTransaction["from"];
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {party.publicProfile ? (
        <Link
          href={`/u/${party.id}`}
          className="text-sm font-bold text-primary underline-offset-2 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {party.displayName}
        </Link>
      ) : (
        <span className="text-sm font-bold">{party.displayName}</span>
      )}
    </div>
  );
}

export function TransactionDetailDialog({
  transaction,
  open,
  onOpenChange,
}: TransactionDetailDialogProps) {
  const tx = transaction;
  const isIngreso = tx?.isIngreso ?? false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "z-50 flex flex-col gap-0 overflow-hidden bg-background p-0 ring-0",
          "fixed inset-0 left-0 top-0 h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 rounded-none border-0 shadow-none overflow-x-hidden",
          "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[90dvh] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border-2 sm:border-border sm:shadow-neo-sm"
        )}
      >
        {!tx ? null : (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background p-4 pb-10 sm:p-6">
            <DialogHeader className="space-y-3 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-2 font-black uppercase">
                  {TRANSACTION_KIND_LABELS[tx.kind]}
                </Badge>
                <Badge
                  variant="secondary"
                  className={cn(
                    "border-2 text-[10px] font-black uppercase",
                    isIngreso
                      ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
                  )}
                >
                  {isIngreso ? "Recibido" : "Enviado"}
                </Badge>
              </div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                {tx.concept}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Detalle de la transacción {tx.concept}
              </DialogDescription>
              <div
                className={cn(
                  "flex items-center gap-2 text-3xl font-black tabular-nums tracking-tighter",
                  isIngreso ? "text-primary" : "text-destructive"
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg border-2 border-border shadow-neo-sm",
                    isIngreso
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30"
                  )}
                >
                  {isIngreso ? (
                    <ArrowDownLeft className="h-5 w-5" />
                  ) : (
                    <ArrowUpRight className="h-5 w-5" />
                  )}
                </span>
                {isIngreso ? "+" : "-"}
                {tx.amount} Ŧ
              </div>
            </DialogHeader>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <PartyLine label="Envía" party={tx.from} />
              <PartyLine label="Recibe" party={tx.to} />
            </div>

            <div className="mt-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Fecha
              </span>
              <p className="mt-0.5 text-sm font-bold">
                {new Intl.DateTimeFormat("es-MX", {
                  timeZone: "America/Mexico_City",
                  dateStyle: "full",
                  timeStyle: "short",
                }).format(new Date(tx.createdAt))}
              </p>
            </div>

            {tx.product ? (
              <div className="mt-6 rounded-xl border-2 border-border bg-muted/30 p-4">
                <h4 className="mb-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Producto o servicio
                </h4>
                <div className="flex gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 border-border bg-muted">
                    {tx.product.imageUrl ? (
                      <Image
                        src={tx.product.imageUrl}
                        alt={tx.product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                        <ShoppingBag className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black uppercase tracking-tight">
                      {tx.product.name}
                    </p>
                    <p className="mt-1 text-sm font-bold">
                      {tx.product.priceMxn != null && (
                        <>
                          <span className="text-primary">${tx.product.priceMxn} MXN</span>
                          <span className="mx-1 text-muted-foreground">+</span>
                        </>
                      )}
                      <span className="text-secondary">
                        {tx.product.priceTumin ?? tx.amount} Ŧ
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
