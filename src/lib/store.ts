import { create } from "zustand";
import type { DirectoryTab } from "@/lib/directory-types";

/** Snapshot when user taps Comprar in Bazar → prefills Enviar Túmin */
export interface PendingPurchase {
  sellerPhone: string | null;
  sellerEmail: string | null;
  sellerId: string;
  sellerName: string;
  productId: string;
  productName: string;
  priceTumin: number;
  priceMxn: number;
  imageUrl?: string | null;
}

export type Screen =
  | "inicio"
  | "pagar"
  | "bazar"
  | "directorio"
  | "comunidad"
  | "coordinacion"
  | "perfil"
  | "historial"
  | "mis-compras"
  | "auditoria"
  | "gestion-roles"
  | "gestion-productos"
  | "medios"
  | "anuncios"
  | "mi-red"
  | "mensajes";

export interface PendingConversationPeer {
  peerUserId: string;
  conversationId: string;
}

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
  directoryTab: DirectoryTab;
  setDirectoryTab: (tab: DirectoryTab) => void;
  pendingConversationPeer: PendingConversationPeer | null;
  setPendingConversationPeer: (p: PendingConversationPeer | null) => void;
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
  directoryTab: "miembros",
  setDirectoryTab: (tab) => set({ directoryTab: tab }),
  pendingConversationPeer: null,
  setPendingConversationPeer: (p) => set({ pendingConversationPeer: p }),
}));
