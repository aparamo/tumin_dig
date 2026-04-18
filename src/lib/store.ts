import { create } from "zustand";

type Screen = 
  | "inicio" 
  | "pagar" 
  | "bazar" 
  | "comunidad" 
  | "coordinacion" 
  | "perfil" 
  | "historial"
  | "auditoria"
  | "gestion-roles";

interface AppState {
  currentScreen: Screen;
  setCurrentScreen: (screen: Screen) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  currentScreen: "inicio",
  setCurrentScreen: (screen) => set({ currentScreen: screen }),
  isSidebarOpen: false,
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
}));
