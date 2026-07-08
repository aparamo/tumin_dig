"use client";

import { useStore } from "@/lib/store";
import { Inicio } from "./screens/Inicio";
import { Pagar } from "./screens/Pagar";
import { Bazar } from "./screens/Bazar";
import { Comunidad } from "./screens/Comunidad";
import { Perfil } from "./screens/Perfil";
import { Historial } from "./screens/Historial";
import { Coordinacion } from "./screens/Coordinacion";
import { Auditoria } from "./screens/Auditoria";
import { GestionRoles } from "./screens/GestionRoles";
import { GestionProductos } from "./screens/GestionProductos";
import { GestorMedios } from "./screens/GestorMedios";
import { PageTransition } from "./ui/motion";
import { AnimatePresence } from "motion/react";
import { DashboardShell } from "./DashboardShell";

export function Dashboard() {
  const { currentScreen, setCurrentScreen } = useStore();

  const renderScreen = () => {
    switch (currentScreen) {
      case "inicio": return <Inicio />;
      case "pagar": return <Pagar />;
      case "bazar": return <Bazar />;
      case "comunidad": return <Comunidad />;
      case "perfil": return <Perfil />;
      case "historial": return <Historial />;
      case "coordinacion": return <Coordinacion />;
      case "auditoria": return <Auditoria />;
      case "gestion-roles": return <GestionRoles />;
      case "gestion-productos": return <GestionProductos />;
      case "medios": return <GestorMedios />;
      default: return <div className="p-4">Pantalla en construcción: {currentScreen}</div>;
    }
  };

  return (
    <DashboardShell activeScreen={currentScreen} onNavigate={setCurrentScreen}>
      <AnimatePresence mode="wait">
        <PageTransition key={currentScreen}>{renderScreen()}</PageTransition>
      </AnimatePresence>
    </DashboardShell>
  );
}
