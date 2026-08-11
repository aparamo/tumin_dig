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
    bg: "bg-amber-100",
    border: "border-amber-300/80",
    text: "text-amber-950",
    iconBg: "bg-amber-200/70",
  },
  Bebidas: {
    bg: "bg-sky-100",
    border: "border-sky-300/80",
    text: "text-sky-950",
    iconBg: "bg-sky-200/70",
  },
  Ropa: {
    bg: "bg-rose-100",
    border: "border-rose-300/80",
    text: "text-rose-950",
    iconBg: "bg-rose-200/70",
  },
  Artesanías: {
    bg: "bg-orange-100",
    border: "border-orange-300/80",
    text: "text-orange-950",
    iconBg: "bg-orange-200/70",
  },
  "Salud y Bienestar": {
    bg: "bg-teal-100",
    border: "border-teal-300/80",
    text: "text-teal-950",
    iconBg: "bg-teal-200/70",
  },
  "Servicios Profesionales": {
    bg: "bg-slate-100",
    border: "border-slate-300/80",
    text: "text-slate-900",
    iconBg: "bg-slate-200/70",
  },
  Arte: {
    bg: "bg-fuchsia-100",
    border: "border-fuchsia-300/80",
    text: "text-fuchsia-950",
    iconBg: "bg-fuchsia-200/70",
  },
  Hogar: {
    bg: "bg-stone-100",
    border: "border-stone-300/80",
    text: "text-stone-900",
    iconBg: "bg-stone-200/70",
  },
  "Cuidado Personal": {
    bg: "bg-pink-100",
    border: "border-pink-300/80",
    text: "text-pink-950",
    iconBg: "bg-pink-200/70",
  },
  Educación: {
    bg: "bg-indigo-100",
    border: "border-indigo-300/80",
    text: "text-indigo-950",
    iconBg: "bg-indigo-200/70",
  },
  Talleres: {
    bg: "bg-yellow-100",
    border: "border-yellow-300/80",
    text: "text-yellow-950",
    iconBg: "bg-yellow-200/70",
  },
  Cultura: {
    bg: "bg-red-100",
    border: "border-red-300/70",
    text: "text-red-950",
    iconBg: "bg-red-200/70",
  },
  Entretenimiento: {
    bg: "bg-cyan-100",
    border: "border-cyan-300/80",
    text: "text-cyan-950",
    iconBg: "bg-cyan-200/70",
  },
  "Agroecología y Jardinería": {
    bg: "bg-lime-100",
    border: "border-lime-300/80",
    text: "text-lime-950",
    iconBg: "bg-lime-200/70",
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
