import { create } from "zustand";

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
}

export const useStore = create<AppState>((set) => ({
  currentScreen: "inicio",
  setCurrentScreen: (screen) => set({ currentScreen: screen }),
  isSidebarOpen: false,
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  openGestionProductCreate: false,
  setOpenGestionProductCreate: (open) => set({ openGestionProductCreate: open }),
}));
