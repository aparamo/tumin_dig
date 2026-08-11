"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  ALL_CATEGORIES_ICON,
  ALL_CATEGORIES_PASTEL,
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_ICONS,
  getCategoryPastel,
  type CategoryPastel,
  type ProductCategory,
} from "@/lib/product-categories";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CategoryFilterDialogProps {
  value: string;
  onChange: (category: string) => void;
  /** Wrapper class (e.g. Bazar column width) */
  className?: string;
  labelClassName?: string;
  triggerClassName?: string;
  /** Dialog helper text — defaults to directory wording */
  description?: string;
}

export function CategoryFilterDialog({
  value,
  onChange,
  className,
  labelClassName,
  triggerClassName,
  description = "Filtra por el tipo de producto o servicio.",
}: CategoryFilterDialogProps) {
  const [open, setOpen] = useState(false);

  const Icon =
    value !== "Todas" && value in PRODUCT_CATEGORY_ICONS
      ? PRODUCT_CATEGORY_ICONS[value as ProductCategory]
      : ALL_CATEGORIES_ICON;
  const triggerPastel = getCategoryPastel(value);
  const isAll = value === "Todas";

  const select = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div className={cn("min-w-0", className)}>
      <Label
        className={cn(
          "mb-1 ml-1 block text-sm font-black uppercase tracking-wide text-muted-foreground md:text-base",
          labelClassName
        )}
      >
        Categoría
      </Label>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        title={value}
        className={cn(
          "flex h-11 w-full min-w-0 items-center justify-between gap-1.5 rounded-lg border-2 px-2.5 text-left text-sm font-bold md:text-base",
          "shadow-none transition-colors outline-none select-none",
          "hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "normal-case tracking-normal",
          isAll
            ? "border-border bg-background text-foreground"
            : cn(triggerPastel.bg, triggerPastel.border, triggerPastel.text),
          triggerClassName
        )}
        onClick={() => setOpen(true)}
      >
        <span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
          <Icon
            className={cn("h-4 w-4 shrink-0 opacity-80", !isAll && triggerPastel.text)}
            aria-hidden
          />
          <span className={cn("truncate", !isAll && triggerPastel.text)}>{value}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground opacity-70" aria-hidden />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={cn(
            "max-h-[min(90vh,36rem)] w-full max-w-[calc(100%-1.5rem)] overflow-y-auto",
            "border-2 border-border bg-popover text-popover-foreground p-4 shadow-neo-sm",
            "sm:max-w-lg md:max-w-2xl",
          )}
          showCloseButton
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight md:text-2xl">
              Categoría
            </DialogTitle>
            <DialogDescription className="text-sm font-bold text-muted-foreground md:text-base">
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            <CategoryTile
              label="Todas"
              selected={value === "Todas"}
              Icon={ALL_CATEGORIES_ICON}
              pastel={ALL_CATEGORIES_PASTEL}
              onSelect={() => select("Todas")}
            />
            {PRODUCT_CATEGORIES.map((c) => (
              <CategoryTile
                key={c}
                label={c}
                selected={value === c}
                Icon={PRODUCT_CATEGORY_ICONS[c]}
                pastel={getCategoryPastel(c)}
                onSelect={() => select(c)}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryTile({
  label,
  selected,
  Icon,
  pastel,
  onSelect,
}: {
  label: string;
  selected: boolean;
  Icon: LucideIcon;
  pastel: CategoryPastel;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex min-h-16 items-center gap-3 rounded-xl border-2 px-3 py-3 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        pastel.bg,
        pastel.border,
        pastel.text,
        selected && "ring-2 ring-primary/50 shadow-neo-sm",
        !selected && "hover:brightness-[0.97] dark:hover:brightness-110"
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2",
          pastel.iconBg,
          pastel.border,
          pastel.text
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className={cn("min-w-0 flex-1 text-sm font-black leading-snug md:text-base", pastel.text)}>
        {label}
      </span>
    </button>
  );
}
