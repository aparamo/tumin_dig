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
import { Button } from "@/components/ui/button";
import { Menu, X, Home, Send, ShoppingBag, Users, User, History, ShieldAlert, Settings, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { PageTransition } from "./ui/motion";
import { AnimatePresence, motion } from "motion/react";

export function Dashboard() {
  const { currentScreen, setCurrentScreen, isSidebarOpen, setSidebarOpen } = useStore();
  const { data: session } = useSession();

  const isCoordinator = session?.user?.role === "COORDINADOR" || session?.user?.role === "COORDINADOR_LOCAL";

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
      default: return <div className="p-4">Pantalla en construcción: {currentScreen}</div>;
    }
  };

  const menuItems = [
    { id: "inicio", label: "Inicio", icon: Home },
    { id: "pagar", label: "Pagar", icon: Send },
    { id: "bazar", label: "Bazar", icon: ShoppingBag },
    { id: "comunidad", label: "Comunidad", icon: Users },
    { id: "perfil", label: "Mi Perfil", icon: User },
    { id: "historial", label: "Historial", icon: History },
  ];

  const coordinatorItems = [
    { id: "coordinacion", label: "Validar Trabajos", icon: Settings, color: "text-orange-500" },
    { id: "gestion-roles", label: "Gestionar Roles", icon: Users, color: "text-purple-500" },
    { id: "auditoria", label: "Panel de Auditoría", icon: ShieldAlert, color: "text-red-500" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-card border-b-4 border-border flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(true)}
            className="neo-btn bg-background"
          >
            <Menu className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-black tracking-tight text-foreground uppercase">Túmin</h1>
        </div>
        <ThemeToggle />
      </header>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" 
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 bottom-0 w-72 bg-card border-r-4 border-border z-[70] transition-transform duration-300 transform p-6",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-xl font-black uppercase">Menú</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(false)}
            className="neo-btn bg-background"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="flex flex-col gap-3">
          {menuItems.map((item) => (
            <Button 
              key={item.id}
              variant="ghost" 
              className={cn(
                "justify-start gap-3 h-12 text-lg neo-btn bg-background hover:bg-accent",
                currentScreen === item.id && "bg-primary shadow-none translate-x-1 translate-y-1"
              )}
              onClick={() => { setCurrentScreen(item.id as any); setSidebarOpen(false); }}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Button>
          ))}

          {isCoordinator && (
            <>
              <div className="h-1 bg-border my-4" />
              {coordinatorItems.map((item) => (
                <Button 
                  key={item.id}
                  variant="ghost" 
                  className={cn(
                    "justify-start gap-3 h-12 text-lg neo-btn bg-background hover:bg-accent",
                    currentScreen === item.id && "bg-primary shadow-none translate-x-1 translate-y-1"
                  )}
                  onClick={() => { setCurrentScreen(item.id as any); setSidebarOpen(false); }}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Button>
              ))}
            </>
          )}

          <div className="h-1 bg-border my-4" />
          <Button 
            variant="ghost" 
            className="justify-start gap-3 h-12 text-lg neo-btn bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => signOut()}
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </Button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="mt-16 mb-24 flex-1 overflow-x-hidden p-4">
        <AnimatePresence mode="wait">
          <PageTransition key={currentScreen}>
            {renderScreen()}
          </PageTransition>
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-card border-t-4 border-border flex justify-around items-center px-4 z-50">
        <Button 
          variant="ghost" 
          className={cn(
            "flex flex-col gap-1 h-14 flex-1 rounded-xl transition-all",
            currentScreen === "inicio" ? "bg-primary text-primary-foreground border-2 border-border shadow-neo-sm" : "text-muted-foreground"
          )}
          onClick={() => setCurrentScreen("inicio")}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs font-bold uppercase">Inicio</span>
        </Button>
        <Button 
          variant="ghost" 
          className={cn(
            "flex flex-col gap-1 h-14 flex-1 rounded-xl transition-all",
            currentScreen === "pagar" ? "bg-secondary text-secondary-foreground border-2 border-border shadow-neo-sm" : "text-muted-foreground"
          )}
          onClick={() => setCurrentScreen("pagar")}
        >
          <Send className="w-6 h-6" />
          <span className="text-xs font-bold uppercase">Pagar</span>
        </Button>
        <Button 
          variant="ghost" 
          className={cn(
            "flex flex-col gap-1 h-14 flex-1 rounded-xl transition-all",
            currentScreen === "historial" ? "bg-accent text-accent-foreground border-2 border-border shadow-neo-sm" : "text-muted-foreground"
          )}
          onClick={() => setCurrentScreen("historial")}
        >
          <History className="w-6 h-6" />
          <span className="text-xs font-bold uppercase">Historial</span>
        </Button>
        <Button 
          variant="ghost" 
          className={cn(
            "flex flex-col gap-1 h-14 flex-1 rounded-xl transition-all",
            currentScreen === "perfil" ? "bg-muted text-foreground border-2 border-border shadow-neo-sm" : "text-muted-foreground"
          )}
          onClick={() => setCurrentScreen("perfil")}
        >
          <User className="w-6 h-6" />
          <span className="text-xs font-bold uppercase">Perfil</span>
        </Button>
      </nav>
    </div>
  );
}
