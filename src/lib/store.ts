import { create } from "zustand";

/** Snapshot when user taps Comprar in Bazar → prefills Enviar Túmin */
export interface PendingPurchase {
  sellerPhone: string | null;
  sellerEmail: string | null;
  sellerId: string;
  sellerName: string;
  productName: string;
  priceTumin: number;
}

export type Screen = 
  | "inicio" 
  | "pagar" 
  | "bazar" 
  | "comunidad" 
  | "coordinacion" 
  | "perfil" 
  | "historial"
  | "auditoria"
  | "gestion-roles"
  | "gestion-productos"
  | "medios";

interface AppState {
  currentScreen: Screen;
  setCurrentScreen: (screen: Screen) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  /** Al ir a Mis productos desde Bazar, abre el modal de alta una vez */
  openGestionProductCreate: boolean;
  setOpenGestionProductCreate: (open: boolean) => void;
  pendingPurchase: PendingPurchase | null;
  setPendingPurchase: (p: PendingPurchase | null) => void;
}

export const useStore = create<AppState>((set) => ({
  currentScreen: "inicio",
  setCurrentScreen: (screen) =>
    set(() => ({
      currentScreen: screen,
      ...(screen !== "pagar" ? { pendingPurchase: null } : {}),
    })),
  isSidebarOpen: false,
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  openGestionProductCreate: false,
  setOpenGestionProductCreate: (open) => set({ openGestionProductCreate: open }),
  pendingPurchase: null,
  setPendingPurchase: (p) => set({ pendingPurchase: p }),
}));
