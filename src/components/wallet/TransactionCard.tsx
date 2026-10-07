"use client";

import { cn } from "@/lib/utils";
import {
  TRANSACTION_KIND_LABELS,
  counterpartOf,
  type HistoryTransaction,
} from "@/lib/transaction-presentation";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

export interface TransactionCardProps {
  transaction: HistoryTransaction;
  onSelect: (tx: HistoryTransaction) => void;
  /** Compact list on home (slightly larger amount) */
  variant?: "default" | "home";
}

export function TransactionCard({
  transaction,
  onSelect,
  variant = "default",
}: TransactionCardProps) {
  const isIngreso = transaction.isIngreso;
  const counterpart = counterpartOf(transaction);
  const amountClass =
    variant === "home" ? "text-2xl tracking-tighter" : "text-xl";

  return (
    <button
      type="button"
      onClick={() => onSelect(transaction)}
      className={cn(
        "neo-card flex w-full items-center justify-between gap-3 bg-card p-4 text-left transition-colors",
        "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
    >
      <div className="flex min-w-0 items-center gap-4">
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg border-2 border-border shadow-neo-sm",
            variant === "home" ? "h-12 w-12" : "p-3",
            isIngreso
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
          )}
        >
          {isIngreso ? (
            <ArrowDownLeft className={variant === "home" ? "h-6 w-6" : "h-5 w-5"} />
          ) : (
            <ArrowUpRight className={variant === "home" ? "h-6 w-6" : "h-5 w-5"} />
          )}
        </div>
        <div className="min-w-0">
          <div className="line-clamp-1 text-lg font-black uppercase tracking-tight text-foreground">
            {transaction.concept}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {new Intl.DateTimeFormat("es-MX", {
              timeZone: "America/Mexico_City",
              ...(variant === "home"
                ? { day: "numeric" as const, month: "short" as const, year: "numeric" as const }
                : { dateStyle: "short" as const, timeStyle: "medium" as const }),
            }).format(new Date(transaction.createdAt))}
          </div>
          <div className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            {TRANSACTION_KIND_LABELS[transaction.kind]}
            {" · "}
            {isIngreso ? "De" : "Para"} {counterpart.displayName}
          </div>
        </div>
      </div>
      <div
        className={cn(
          "shrink-0 font-black tabular-nums",
          amountClass,
          isIngreso ? "text-primary" : "text-destructive"
        )}
      >
        {isIngreso ? "+" : "-"}
        {transaction.amount} Ŧ
      </div>
    </button>
  );
}
