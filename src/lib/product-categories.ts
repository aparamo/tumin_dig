import type { LucideIcon } from "lucide-react";
import {
  Apple,
  Briefcase,
  Coffee,
  Flower2,
  GraduationCap,
  Hammer,
  HeartPulse,
  Home,
  Landmark,
  LayoutGrid,
  Music,
  Paintbrush,
  Shirt,
  Sparkles,
  Sprout,
} from "lucide-react";

/** Canonical product/service categories used across Bazar, Mis productos, and Directorio */
export const PRODUCT_CATEGORIES = [
  "Alimentos",
  "Bebidas",
  "Ropa",
  "Artesanías",
  "Salud y Bienestar",
  "Servicios Profesionales",
  "Arte",
  "Hogar",
  "Cuidado Personal",
  "Educación",
  "Talleres",
  "Cultura",
  "Entretenimiento",
  "Agroecología y Jardinería",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

/** Max featured (“estrella”) products a seller may mark */
export const MAX_STARRED_PRODUCTS = 5;

/** Lucide icons for category picker / filters */
export const PRODUCT_CATEGORY_ICONS: Record<ProductCategory, LucideIcon> = {
  Alimentos: Apple,
  Bebidas: Coffee,
  Ropa: Shirt,
  Artesanías: Sparkles,
  "Salud y Bienestar": HeartPulse,
  "Servicios Profesionales": Briefcase,
  Arte: Paintbrush,
  Hogar: Home,
  "Cuidado Personal": Flower2,
  Educación: GraduationCap,
  Talleres: Hammer,
  Cultura: Landmark,
  Entretenimiento: Music,
  "Agroecología y Jardinería": Sprout,
};

export const ALL_CATEGORIES_ICON = LayoutGrid;

/** Soft pastel surface for badges / picker tiles (Tailwind classes) */
export interface CategoryPastel {
  bg: string;
  border: string;
  text: string;
  iconBg: string;
}

export const PRODUCT_CATEGORY_PASTELS: Record<ProductCategory, CategoryPastel> = {
  Alimentos: {
    bg: "bg-amber-100 dark:bg-amber-950/45",
    border: "border-amber-300/80 dark:border-amber-700/70",
    text: "text-amber-950 dark:text-amber-100",
    iconBg: "bg-amber-200/70 dark:bg-amber-900/60",
  },
  Bebidas: {
    bg: "bg-sky-100 dark:bg-sky-950/45",
    border: "border-sky-300/80 dark:border-sky-700/70",
    text: "text-sky-950 dark:text-sky-100",
    iconBg: "bg-sky-200/70 dark:bg-sky-900/60",
  },
  Ropa: {
    bg: "bg-rose-100 dark:bg-rose-950/45",
    border: "border-rose-300/80 dark:border-rose-700/70",
    text: "text-rose-950 dark:text-rose-100",
    iconBg: "bg-rose-200/70 dark:bg-rose-900/60",
  },
  Artesanías: {
    bg: "bg-orange-100 dark:bg-orange-950/45",
    border: "border-orange-300/80 dark:border-orange-700/70",
    text: "text-orange-950 dark:text-orange-100",
    iconBg: "bg-orange-200/70 dark:bg-orange-900/60",
  },
  "Salud y Bienestar": {
    bg: "bg-teal-100 dark:bg-teal-950/45",
    border: "border-teal-300/80 dark:border-teal-700/70",
    text: "text-teal-950 dark:text-teal-100",
    iconBg: "bg-teal-200/70 dark:bg-teal-900/60",
  },
  "Servicios Profesionales": {
    bg: "bg-slate-100 dark:bg-slate-900/55",
    border: "border-slate-300/80 dark:border-slate-600/70",
    text: "text-slate-900 dark:text-slate-100",
    iconBg: "bg-slate-200/70 dark:bg-slate-800/70",
  },
  Arte: {
    bg: "bg-fuchsia-100 dark:bg-fuchsia-950/45",
    border: "border-fuchsia-300/80 dark:border-fuchsia-700/70",
    text: "text-fuchsia-950 dark:text-fuchsia-100",
    iconBg: "bg-fuchsia-200/70 dark:bg-fuchsia-900/60",
  },
  Hogar: {
    bg: "bg-stone-100 dark:bg-stone-800/70",
    border: "border-stone-300/80 dark:border-stone-600/70",
    text: "text-stone-900 dark:text-stone-100",
    iconBg: "bg-stone-200/70 dark:bg-stone-700/70",
  },
  "Cuidado Personal": {
    bg: "bg-pink-100 dark:bg-pink-950/45",
    border: "border-pink-300/80 dark:border-pink-700/70",
    text: "text-pink-950 dark:text-pink-100",
    iconBg: "bg-pink-200/70 dark:bg-pink-900/60",
  },
  Educación: {
    bg: "bg-indigo-100 dark:bg-indigo-950/45",
    border: "border-indigo-300/80 dark:border-indigo-700/70",
    text: "text-indigo-950 dark:text-indigo-100",
    iconBg: "bg-indigo-200/70 dark:bg-indigo-900/60",
  },
  Talleres: {
    bg: "bg-yellow-100 dark:bg-yellow-950/45",
    border: "border-yellow-300/80 dark:border-yellow-700/70",
    text: "text-yellow-950 dark:text-yellow-100",
    iconBg: "bg-yellow-200/70 dark:bg-yellow-900/60",
  },
  Cultura: {
    bg: "bg-red-100 dark:bg-red-950/45",
    border: "border-red-300/70 dark:border-red-700/70",
    text: "text-red-950 dark:text-red-100",
    iconBg: "bg-red-200/70 dark:bg-red-900/60",
  },
  Entretenimiento: {
    bg: "bg-cyan-100 dark:bg-cyan-950/45",
    border: "border-cyan-300/80 dark:border-cyan-700/70",
    text: "text-cyan-950 dark:text-cyan-100",
    iconBg: "bg-cyan-200/70 dark:bg-cyan-900/60",
  },
  "Agroecología y Jardinería": {
    bg: "bg-lime-100 dark:bg-lime-950/45",
    border: "border-lime-300/80 dark:border-lime-700/70",
    text: "text-lime-950 dark:text-lime-100",
    iconBg: "bg-lime-200/70 dark:bg-lime-900/60",
  },
};

export const ALL_CATEGORIES_PASTEL: CategoryPastel = {
  bg: "bg-muted/60",
  border: "border-border",
  text: "text-foreground",
  iconBg: "bg-muted",
};

export function getCategoryPastel(category: string): CategoryPastel {
  if (category === "Todas") return ALL_CATEGORIES_PASTEL;
  if ((PRODUCT_CATEGORIES as readonly string[]).includes(category)) {
    return PRODUCT_CATEGORY_PASTELS[category as ProductCategory];
  }
  return ALL_CATEGORIES_PASTEL;
}

export function isProductCategory(value: string): value is ProductCategory {
  return (PRODUCT_CATEGORIES as readonly string[]).includes(value);
}
