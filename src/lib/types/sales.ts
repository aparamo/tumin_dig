/** Shared types for seller sales panel (Mis Ventas) */

export type SalesTimeRange = "7d" | "30d" | "90d" | "all";

export interface SalesFiltersState {
  productId?: string;
  timeRange: SalesTimeRange;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
}

export interface SaleListItem {
  id: string;
  amount: number;
  concept: string;
  productId: string;
  productName: string;
  priceMxn: number | null;
  priceTumin: number;
  imageUrl: string | null;
  productStillActive: boolean;
  createdAt: Date | string;
  buyer: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    publicProfile: boolean;
  };
}

export interface SalesSummary {
  totalSales: number;
  totalRevenueTumin: number;
  totalRevenueMxn: number;
  uniqueBuyers: number;
  avgSaleAmount: number;
}

export interface TopProductStat {
  productId: string;
  productName: string;
  salesCount: number;
  totalRevenue: number;
}

export interface SalesDayPoint {
  date: string;
  count: number;
  revenue: number;
}

export function rangeToDates(range: SalesTimeRange): {
  startDate?: Date;
  endDate?: Date;
} {
  if (range === "all") return {};
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const endDate = new Date();
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return { startDate, endDate };
}
