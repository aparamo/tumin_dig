"use client";

import { useStore, type Screen } from "@/lib/store";
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
import { Button } from "@/components/ui/button";
import { Menu, X, Home, Send, ShoppingBag, Users, User, History, ShieldAlert, Settings, LogOut, PackageSearch, type LucideIcon, FolderOpen, ChevronDown, ShieldCheck } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { PageTransition } from "./ui/motion";
import { AnimatePresence, motion } from "motion/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Image from "next/image";
import { useState } from "react";

interface MenuItem {
  id: Screen;
  label: string;
  icon: LucideIcon;
  color?: string;
}

const NavItem = ({ item, isMobile = false, compact = false }: { item: MenuItem, isMobile?: boolean, compact?: boolean }) => {
  const { currentScreen, setCurrentScreen } = useStore();
  const isActive = currentScreen === item.id;
  
  if (isMobile) {
    return (
      <Button 
        variant="ghost" 
        className={cn(
          "flex flex-col gap-0.5 h-12 flex-1 rounded-xl transition-all",
          isActive ? "bg-primary text-primary-foreground border-2 border-border shadow-neo-sm" : "text-muted-foreground"
        )}
        onClick={() => setCurrentScreen(item.id)}
      >
        <item.icon className="w-5 h-5" />
        <span className="text-[8px] font-bold uppercase">{item.label}</span>
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={(props) => (
          <Button
            {...props}
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-xl transition-all border-2 border-transparent",
              compact ? "w-10 h-10" : "w-12 h-12",
              isActive
                ? "bg-primary text-primary-foreground border-border shadow-neo-sm scale-110"
                : "text-muted-foreground hover:bg-muted"
            )}
            onClick={() => setCurrentScreen(item.id)}
          >
            <item.icon className={cn(compact ? "w-5 h-5" : "w-6 h-6")} />
          </Button>
        )}
      />
      <TooltipContent
        side="right"
        className="neo-card bg-card border-2 font-black uppercase text-xs text-foreground"
      >
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
};

export function Dashboard() {
  const { currentScreen, setCurrentScreen, setSidebarOpen, isSidebarOpen } = useStore();
  const { data: session } = useSession();
  const [isCoordMenuOpen, setIsCoordMenuOpen] = useState(false);

  const isCoordinator = session?.user?.role === "COORDINADOR" || session?.user?.role === "COORDINADOR_LOCAL" || session?.user?.role === "COORDINADOR_GENERAL";

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

  const menuItems: MenuItem[] = [
    { id: "inicio", label: "Inicio", icon: Home },
    { id: "pagar", label: "Pagar", icon: Send },
    { id: "bazar", label: "Bazar", icon: ShoppingBag },
    { id: "gestion-productos", label: "Mis Productos", icon: PackageSearch },
    { id: "medios", label: "Mis Archivos", icon: FolderOpen },
    { id: "comunidad", label: "Comunidad", icon: Users },
    { id: "perfil", label: "Mi Perfil", icon: User },
    { id: "historial", label: "Historial", icon: History },
  ];

  const coordinatorItems: MenuItem[] = [
    { id: "coordinacion", label: "Validar", icon: Settings, color: "text-orange-500" },
    { id: "gestion-roles", label: "Roles", icon: Users, color: "text-purple-500" },
    { id: "auditoria", label: "Auditoría", icon: ShieldAlert, color: "text-red-500" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar (Permanent Mini) */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 bg-card border-r-4 border-border flex-col items-center py-4 z-50 overflow-hidden">
        <div className="w-12 h-12 bg-emerald-700 border-2 border-border shadow-neo-sm rounded-full flex items-center justify-center font-black text-xl text-secondary-foreground mb-6 shrink-0">
          <Image src="/logo_trans_sm.png" alt="Túmin Digital" width={32} height={32} />
        </div>
        
        <nav className="flex flex-col gap-3 overflow-y-auto w-full items-center px-2 py-2 flex-1 scrollbar-hide">
          {menuItems.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
          
          {isCoordinator && (
            <div className="flex flex-col items-center gap-3 w-full">
              <div className="h-0.5 w-8 bg-border my-1 shrink-0" />
              <Tooltip>
                <TooltipTrigger
                  render={(props) => (
                    <Button
                      {...props}
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "w-12 h-12 rounded-xl transition-all border-2 border-transparent bg-muted/30",
                        isCoordMenuOpen && "bg-primary/10 border-primary/20"
                      )}
                      onClick={() => setIsCoordMenuOpen(!isCoordMenuOpen)}
                    >
                      <ShieldCheck className={cn("w-6 h-6 transition-transform", isCoordMenuOpen ? "text-primary rotate-180" : "text-muted-foreground")} />
                    </Button>
                  )}
                />
                <TooltipContent side="right" className="neo-card bg-card border-2 font-black text-primary uppercase text-xs">
                  Coordinación
                </TooltipContent>
              </Tooltip>

              <AnimatePresence>
                {isCoordMenuOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex flex-col gap-3 overflow-hidden"
                  >
                    {coordinatorItems.map((item) => (
                      <NavItem key={item.id} item={item} compact />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </nav>

        <div className="mt-auto flex flex-col gap-3 py-4 shrink-0">
          <ThemeToggle />
          <Tooltip>
            <TooltipTrigger
              render={(props) => (
                <Button
                  {...props}
                  variant="ghost"
                  size="icon"
                  className="w-12 h-12 rounded-xl text-destructive hover:bg-destructive/10 border-2 border-transparent"
                  onClick={() => signOut()}
                >
                  <LogOut className="w-6 h-6" />
                </Button>
              )}
            />
            <TooltipContent side="right" className="neo-card bg-destructive text-destructive-foreground border-2 font-black uppercase text-xs">
              Salir
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>

      <div className="flex flex-col flex-1 md:ml-20">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 md:left-20 h-16 bg-card border-b-4 border-border flex items-center justify-between px-4 z-40">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarOpen(true)}
              className="md:hidden neo-btn bg-background"
            >
              <Menu className="w-6 h-6" />
            </Button>
            <h1 className="text-xl font-black tracking-tight text-foreground uppercase truncate">
              {menuItems.find(i => i.id === currentScreen)?.label || coordinatorItems.find(i => i.id === currentScreen)?.label || "Túmin"}
            </h1>
          </div>
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-60" 
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Mobile Sidebar (Slide-out) */}
        <aside className={cn(
          "md:hidden fixed top-0 left-0 bottom-0 w-72 bg-card border-r-2 border-border z-70 transition-transform duration-300 transform flex flex-col",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex justify-between items-center p-6 shrink-0">
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

          <nav className="flex flex-col gap-2 p-6 pt-0 flex-1 overflow-y-auto scrollbar-hide">
            {menuItems.map((item) => (
              <Button 
                key={item.id}
                variant="ghost" 
                className={cn(
                  "justify-start gap-3 h-11 text-base neo-btn bg-background shadow-neo-sm/40 px-4",
                  currentScreen === item.id && "bg-primary shadow-none translate-x-1 translate-y-1"
                )}
                onClick={() => { setCurrentScreen(item.id); setSidebarOpen(false); }}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Button>
            ))}

            {isCoordinator && (
              <div className="flex flex-col gap-2">
                <div className="h-0.5 bg-border my-2 shrink-0" />
                <Button 
                  variant="ghost" 
                  className={cn(
                    "justify-between h-11 text-base neo-btn bg-muted/30 px-4",
                    isCoordMenuOpen && "bg-primary/5"
                  )}
                  onClick={() => setIsCoordMenuOpen(!isCoordMenuOpen)}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span>COORDINACIÓN</span>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 transition-transform", isCoordMenuOpen && "rotate-180")} />
                </Button>

                <AnimatePresence>
                  {isCoordMenuOpen && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="flex flex-col gap-2 overflow-hidden pl-4"
                    >
                      {coordinatorItems.map((item) => (
                        <Button 
                          key={item.id}
                          variant="ghost" 
                          className={cn(
                            "justify-start gap-3 h-10 text-sm neo-btn bg-background",
                            currentScreen === item.id && "bg-primary shadow-none translate-x-1 translate-y-1"
                          )}
                          onClick={() => { setCurrentScreen(item.id); setSidebarOpen(false); }}
                        >
                          <item.icon className="w-3.5 h-3.5" />
                          {item.label}
                        </Button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            
            <div className="h-0.5 bg-border my-4 shrink-0" />
            <Button 
              variant="ghost" 
              className="justify-start gap-3 h-11 text-base neo-btn bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 shrink-0"
              onClick={() => signOut()}
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="mt-16 mb-24 md:mb-0 flex-1 overflow-x-hidden p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <PageTransition key={currentScreen}>
                {renderScreen()}
              </PageTransition>
            </AnimatePresence>
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t-4 border-border flex justify-around items-center px-4 z-50">
          <NavItem isMobile item={menuItems[0]} /> {/* Inicio */}
          <NavItem isMobile item={itemWithId(menuItems, "pagar")} />
          <NavItem isMobile item={itemWithId(menuItems, "bazar")} />
          <NavItem isMobile item={itemWithId(menuItems, "perfil")} />
        </nav>
      </div>
    </div>
  );
}

function itemWithId(items: MenuItem[], id: Screen) {
  return items.find(i => i.id === id) || items[0];
}
