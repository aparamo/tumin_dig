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
