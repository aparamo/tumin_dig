"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ENROLLMENT_REGION_FILTER_OPTIONS, MEXICO_STATES } from "@/lib/location";
import { PRODUCT_CATEGORIES } from "@/lib/product-categories";
import type { DirectoryPageSize, DirectorySortBy, DirectoryViewMode } from "@/lib/directory-types";
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

export function DirectoryFilters({ filters, onChange, onClear }: DirectoryFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="relative flex-1">
          <Label className="mb-1 ml-1 block text-sm font-black uppercase tracking-wide text-muted-foreground md:text-base">
            Buscar
          </Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(e) => onChange({ search: e.target.value })}
              placeholder="Nombre…"
              className="h-11 border-2 pl-9 text-sm font-bold md:text-base"
            />
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <Label className="mb-1 ml-1 block text-sm font-black uppercase tracking-wide text-muted-foreground md:text-base">
              Región
            </Label>
            <Select
              value={filters.region}
              onValueChange={(v) => {
                if (v) onChange({ region: v });
              }}
            >
              <SelectTrigger className="h-11 border-2 text-sm font-bold md:text-base">
                <SelectValue placeholder="Región" />
              </SelectTrigger>
              <SelectContent>
                {ENROLLMENT_REGION_FILTER_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r} className="text-sm md:text-base">
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1 ml-1 block text-sm font-black uppercase tracking-wide text-muted-foreground md:text-base">
              Ubicación
            </Label>
            <Select
              value={filters.locationState}
              onValueChange={(v) => {
                if (v) onChange({ locationState: v });
              }}
            >
              <SelectTrigger className="h-11 border-2 text-sm font-bold md:text-base">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas" className="text-sm md:text-base">
                  Todas
                </SelectItem>
                {MEXICO_STATES.map((s) => (
                  <SelectItem key={s} value={s} className="text-sm md:text-base">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1 ml-1 block text-sm font-black uppercase tracking-wide text-muted-foreground md:text-base">
              Categoría
            </Label>
            <Select
              value={filters.category}
              onValueChange={(v) => {
                if (v) onChange({ category: v });
              }}
            >
              <SelectTrigger className="h-11 border-2 text-sm font-bold md:text-base">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas" className="text-sm md:text-base">
                  Todas
                </SelectItem>
                {PRODUCT_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="text-sm md:text-base">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1 ml-1 block text-sm font-black uppercase tracking-wide text-muted-foreground md:text-base">
              Orden
            </Label>
            <Select
              value={filters.sortBy}
              onValueChange={(v) => {
                if (v) onChange({ sortBy: v as DirectorySortBy });
              }}
            >
              <SelectTrigger className="h-11 border-2 text-sm font-bold md:text-base">
                <SelectValue placeholder="Orden" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cercania" className="text-sm md:text-base">
                  Cercanía
                </SelectItem>
                <SelectItem value="nombre_asc" className="text-sm md:text-base">
                  Nombre A–Z
                </SelectItem>
                <SelectItem value="nombre_desc" className="text-sm md:text-base">
                  Nombre Z–A
                </SelectItem>
                <SelectItem value="recientes" className="text-sm md:text-base">
                  Más recientes
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-black uppercase tracking-wide text-muted-foreground md:text-base">
            Por página
          </Label>
          <Select
            value={String(filters.pageSize)}
            onValueChange={(v) => {
              if (v) onChange({ pageSize: Number(v) as DirectoryPageSize });
            }}
          >
            <SelectTrigger className="h-10 w-20 border-2 text-sm font-bold md:text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)} className="text-sm md:text-base">
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

        <Button type="button" variant="ghost" size="sm" className="text-sm font-black uppercase md:text-base" onClick={onClear}>
          <X className="mr-1 h-4 w-4" /> Limpiar filtros
        </Button>
      </div>
    </div>
  );
}
