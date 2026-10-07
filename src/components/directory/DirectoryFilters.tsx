"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ENROLLMENT_REGION_FILTER_OPTIONS, MEXICO_STATES } from "@/lib/location";
import type { DirectoryPageSize, DirectorySortBy, DirectoryViewMode } from "@/lib/directory-types";
import { CategoryFilterDialog } from "@/components/directory/CategoryFilterDialog";
import { LayoutGrid, List, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DirectoryFiltersState {
  search: string;
  region: string;
  locationState: string;
  category: string;
  sortBy: DirectorySortBy;
  pageSize: DirectoryPageSize;
  viewMode: DirectoryViewMode;
}

export interface DirectoryFiltersProps {
  filters: DirectoryFiltersState;
  onChange: (patch: Partial<DirectoryFiltersState>) => void;
  onClear: () => void;
}

const FILTER_LABEL =
  "mb-1.5 block text-[10px] font-black uppercase tracking-widest text-muted-foreground";

const FILTER_TRIGGER =
  "h-11 w-full min-w-0 max-w-full border-2 text-sm font-bold whitespace-normal [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:truncate";

const SORT_LABELS: Record<DirectorySortBy, string> = {
  recientes: "Más recientes",
  nombre_asc: "Nombre A–Z",
  nombre_desc: "Nombre Z–A",
};

export function DirectoryFilters({ filters, onChange, onClear }: DirectoryFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full">
        <Label className={FILTER_LABEL}>Buscar</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Nombre…"
            className="h-11 border-2 pl-9 text-sm font-bold"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="min-w-0">
          <Label className={FILTER_LABEL}>Región</Label>
          <Select
            value={filters.region}
            onValueChange={(v) => {
              if (v) onChange({ region: v });
            }}
          >
            <SelectTrigger className={FILTER_TRIGGER} title={filters.region}>
              <SelectValue placeholder="Región" />
            </SelectTrigger>
            <SelectContent className="border-2 bg-card max-h-64" alignItemWithTrigger={false}>
              {ENROLLMENT_REGION_FILTER_OPTIONS.map((r) => (
                <SelectItem key={r} value={r} className="text-sm font-bold">
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-0">
          <Label className={FILTER_LABEL}>Ubicación</Label>
          <Select
            value={filters.locationState}
            onValueChange={(v) => {
              if (v) onChange({ locationState: v });
            }}
          >
            <SelectTrigger className={FILTER_TRIGGER} title={filters.locationState}>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent className="border-2 bg-card max-h-64" alignItemWithTrigger={false}>
              <SelectItem value="Todas" className="text-sm font-bold">
                Todas
              </SelectItem>
              {MEXICO_STATES.map((s) => (
                <SelectItem key={s} value={s} className="text-sm font-bold">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <CategoryFilterDialog
          className="min-w-0"
          value={filters.category}
          onChange={(category) => onChange({ category })}
          labelClassName={FILTER_LABEL}
          triggerClassName="h-11 border-border bg-background text-sm font-bold"
          description="Filtra socios por el tipo de producto o servicio que ofrecen."
        />

        <div className="min-w-0">
          <Label className={FILTER_LABEL}>Orden</Label>
          <Select
            value={filters.sortBy}
            onValueChange={(v) => {
              if (v) onChange({ sortBy: v as DirectorySortBy });
            }}
          >
            <SelectTrigger className={FILTER_TRIGGER} title={SORT_LABELS[filters.sortBy]}>
              <span className="min-w-0 flex-1 truncate text-left font-bold">
                {SORT_LABELS[filters.sortBy]}
              </span>
            </SelectTrigger>
            <SelectContent className="border-2 bg-card" alignItemWithTrigger={false}>
              <SelectItem value="recientes" className="text-sm font-bold">
                Más recientes
              </SelectItem>
              <SelectItem value="nombre_asc" className="text-sm font-bold">
                Nombre A–Z
              </SelectItem>
              <SelectItem value="nombre_desc" className="text-sm font-bold">
                Nombre Z–A
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Por página
          </Label>
          <Select
            value={String(filters.pageSize)}
            onValueChange={(v) => {
              if (v) onChange({ pageSize: Number(v) as DirectoryPageSize });
            }}
          >
            <SelectTrigger className="h-10 w-20 border-2 text-sm font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-2 bg-card">
              {[10, 25, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)} className="text-sm font-bold">
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="ml-1 flex rounded-lg border-2 border-border p-0.5">
            <button
              type="button"
              aria-label="Vista tarjetas"
              className={cn(
                "rounded-md p-2",
                filters.viewMode === "card" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
              onClick={() => onChange({ viewMode: "card" })}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Vista lista"
              className={cn(
                "rounded-md p-2",
                filters.viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
              onClick={() => onChange({ viewMode: "list" })}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs font-black uppercase"
          onClick={onClear}
        >
          <X className="mr-1 h-4 w-4" /> Limpiar filtros
        </Button>
      </div>
    </div>
  );
}
