"use client";

import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  Home,
  Send,
  ShoppingBag,
  Users,
  User,
  History,
  ShieldAlert,
  Settings,
  LogOut,
  PackageSearch,
  FolderOpen,
  ShieldCheck,
  Megaphone,
  BookUser,
  type LucideIcon,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { AnimatePresence, motion } from "motion/react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { type Screen } from "@/lib/store";
import { useRouter } from "next/navigation";

interface MenuItem {
  id: Screen;
  label: string;
  icon: LucideIcon;
  color?: string;
  href?: string;
}

const NavItem = ({
  item,
  isMobile = false,
  compact = false,
  active,
  onClick,
}: {
  item: MenuItem;
  isMobile?: boolean;
  compact?: boolean;
  active: boolean;
  onClick?: () => void;
}) => {
  if (isMobile) {
    const content = (
      <>
        <item.icon className="w-5 h-5" />
        <span className="text-[8px] font-bold uppercase">{item.label}</span>
      </>
    );

    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "flex flex-col gap-0.5 h-8 w-8 flex-1 rounded-xl transition-all",
          active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
        )}
        onClick={onClick}
      >
        {content}
      </Button>
    );
  }

  const icon = <item.icon className={cn(compact ? "w-5 h-5" : "w-6 h-6")} />;

  return (
    <Tooltip>
      <TooltipTrigger
        render={(triggerProps) => (
          <Button
            {...triggerProps}
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-xl transition-all border-2 border-transparent",
              compact ? "w-10 h-10" : "w-12 h-12",
              active
                ? "bg-primary text-primary-foreground scale-110"
                : "text-muted-foreground hover:bg-muted"
            )}
            onClick={onClick}
          >
            {icon}
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

interface DashboardShellProps {
  activeScreen: Screen;
  children: React.ReactNode;
  hideBottomNav?: boolean;
  onNavigate?: (screen: Screen) => void;
}

export function DashboardShell({
  activeScreen,
  children,
  hideBottomNav,
  onNavigate,
}: DashboardShellProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isHeaderCoordOpen, setIsHeaderCoordOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const isCoordinator =
    session?.user?.role === "COORDINADOR" ||
    session?.user?.role === "COORDINADOR_LOCAL" ||
    session?.user?.role === "COORDINADOR_GENERAL";

  const menuItems: MenuItem[] = [
    { id: "inicio", label: "Inicio", icon: Home },
    { id: "pagar", label: "Pagar", icon: Send },
    { id: "bazar", label: "Bazar", icon: ShoppingBag },
    { id: "directorio", label: "Directorio", icon: BookUser },
    { id: "gestion-productos", label: "Mis Productos", icon: PackageSearch },
    { id: "medios", label: "Mis Archivos", icon: FolderOpen },
    { id: "anuncios", label: "Mis Anuncios", icon: Megaphone },
    { id: "comunidad", label: "Comunidad", icon: Users },
    { id: "perfil", label: "Mi Perfil", icon: User },
    { id: "historial", label: "Historial", icon: History },
  ];

  // Desktop sidebar: sin Comunidad/Perfil (van en header) pero con Anuncios
  const desktopMenuItems: MenuItem[] = [
    { id: "inicio", label: "Inicio", icon: Home },
    { id: "pagar", label: "Pagar", icon: Send },
    { id: "bazar", label: "Bazar", icon: ShoppingBag },
    { id: "directorio", label: "Directorio", icon: BookUser },
    { id: "gestion-productos", label: "Mis Productos", icon: PackageSearch },
    { id: "medios", label: "Mis Archivos", icon: FolderOpen },
    { id: "anuncios", label: "Mis Anuncios", icon: Megaphone },
    { id: "historial", label: "Historial", icon: History },
  ];

  const coordinatorItems: MenuItem[] = [
    { id: "coordinacion", label: "Validar", icon: Settings, color: "text-orange-500", href: "/coordinacion" },
    { id: "gestion-roles", label: "Roles", icon: Users, color: "text-purple-500", href: "/gestion-socios" },
    { id: "auditoria", label: "Auditoría", icon: ShieldAlert, color: "text-red-500", href: "/auditoria" },
  ];

  const activeLabel =
    menuItems.find((i) => i.id === activeScreen)?.label ||
    coordinatorItems.find((i) => i.id === activeScreen)?.label ||
    "Túmin";

  const handleNavItem = (item: MenuItem) => {
    if (item.href) {
      router.push(item.href);
      return;
    }
    if (onNavigate) {
      onNavigate(item.id);
    } else {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("tumin_pending_screen", item.id);
      }
      router.push("/");
    }
  };

  const handleSignOut = () => signOut();

  useEffect(() => {
    if (!isHeaderCoordOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-coord-dropdown]")) {
        setIsHeaderCoordOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isHeaderCoordOpen]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 bg-card border-r-4 border-border flex-col items-center py-4 z-50 overflow-hidden">
        <Link
          href="/"
          className="w-12 h-12 bg-emerald-700 border-2 border-border shadow-neo-sm rounded-full flex items-center justify-center font-black text-xl text-secondary-foreground mb-6 shrink-0"
        >
          <Image src="/logo_trans_sm.png" alt="Túmin Digital" width={32} height={32} />
        </Link>

        <nav
          ref={navRef}
          className="flex flex-col gap-3 overflow-y-auto w-full items-center px-2 py-2 flex-1 scrollbar-hide"
        >
          {desktopMenuItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              active={activeScreen === item.id}
              onClick={() => handleNavItem(item)}
            />
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-3 py-4 shrink-0">
          <ThemeToggle />
          <Tooltip>
            <TooltipTrigger
              render={(triggerProps) => (
                <Button
                  {...triggerProps}
                  variant="ghost"
                  size="icon"
                  className="w-12 h-12 rounded-xl text-destructive hover:bg-destructive/10 border-2 border-transparent"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-6 h-6" />
                </Button>
              )}
            />
            <TooltipContent
              side="right"
              className="neo-card bg-destructive text-destructive-foreground border-2 font-black uppercase text-xs"
            >
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
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden neo-btn bg-background"
            >
              <Menu className="w-6 h-6" />
            </Button>
            <h1 className="text-xl font-black tracking-tight text-foreground uppercase truncate">
              {activeLabel}
            </h1>
          </div>

          {/* Desktop header right */}
          <div className="hidden md:flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger
                render={(triggerProps) => (
                  <Button
                    {...triggerProps}
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-xl text-muted-foreground hover:bg-muted"
                    onClick={() => handleNavItem({ id: "comunidad", label: "Comunidad", icon: Users })}
                  >
                    <Users className="w-5 h-5" />
                  </Button>
                )}
              />
              <TooltipContent side="bottom" className="font-black uppercase text-xs">
                Comunidad — Convierte tu labor en Túmin
              </TooltipContent>
            </Tooltip>

            {isCoordinator && (
              <div className="relative" data-coord-dropdown>
                <Tooltip>
                  <TooltipTrigger
                    render={(triggerProps) => (
                      <Button
                        {...triggerProps}
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "w-10 h-10 rounded-xl",
                          isHeaderCoordOpen && "bg-primary/10"
                        )}
                        onClick={() => setIsHeaderCoordOpen(!isHeaderCoordOpen)}
                      >
                        <ShieldCheck className="w-5 h-5 text-primary" />
                      </Button>
                    )}
                  />
                  <TooltipContent side="bottom" className="font-black uppercase text-xs">
                    Coordinación
                  </TooltipContent>
                </Tooltip>

                <AnimatePresence>
                  {isHeaderCoordOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute right-0 top-12 bg-card border-2 border-border rounded-xl shadow-neo p-2 flex flex-col gap-1 min-w-40 z-50"
                    >
                      {coordinatorItems.map((item) => (
                        <Link
                          key={item.id}
                          href={item.href || "/"}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-sm font-black uppercase"
                          onClick={() => setIsHeaderCoordOpen(false)}
                        >
                          <item.icon className="w-4 h-4" />
                          {item.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <Tooltip>
              <TooltipTrigger
                render={(triggerProps) => (
                  <Button
                    {...triggerProps}
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-full overflow-hidden border-2 border-border"
                    onClick={() => handleNavItem({ id: "perfil", label: "Mi Perfil", icon: User })}
                  >
                    {session?.user?.avatarUrl ? (
                      <Image
                        src={session.user.avatarUrl}
                        alt="Perfil"
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    ) : (
                      <span className="font-black text-sm">
                        {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
                      </span>
                    )}
                  </Button>
                )}
              />
              <TooltipContent side="bottom" className="font-black uppercase text-xs">
                Mi Perfil
              </TooltipContent>
            </Tooltip>

            <ThemeToggle />
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
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Mobile Sidebar */}
        <aside
          className={cn(
            "md:hidden fixed top-0 left-0 bottom-0 w-72 bg-card border-r-2 border-border z-70 transition-transform duration-300 transform flex flex-col",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex justify-between items-center p-6 shrink-0">
            <h2 className="text-xl font-black uppercase">Menú</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(false)}
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
                  activeScreen === item.id && "bg-primary shadow-none translate-x-1 translate-y-1"
                )}
                onClick={() => {
                  setIsSidebarOpen(false);
                  handleNavItem(item);
                }}
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
                  className="justify-start gap-3 h-11 text-base neo-btn bg-muted/30 px-4"
                  onClick={() => {}}
                >
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>COORDINACIÓN</span>
                </Button>
                {coordinatorItems.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={cn(
                      "justify-start gap-3 h-10 text-sm neo-btn bg-background pl-8",
                      activeScreen === item.id && "bg-primary shadow-none translate-x-1 translate-y-1"
                    )}
                    onClick={() => setIsSidebarOpen(false)}
                    asChild
                  >
                    <Link href={item.href || "/"}>
                      <item.icon className="w-3.5 h-3.5" />
                      {item.label}
                    </Link>
                  </Button>
                ))}
              </div>
            )}

            <div className="h-0.5 bg-border my-4 shrink-0" />
            <Button
              variant="ghost"
              className="justify-start gap-3 h-11 text-base neo-btn bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 shrink-0"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="mt-16 mb-24 md:mb-0 flex-1 overflow-x-hidden p-4 md:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>

        {/* Mobile Bottom Nav */}
        {!hideBottomNav && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t-4 border-border flex justify-around items-center px-4 z-50">
            <NavItem isMobile item={menuItems[0]} active={activeScreen === "inicio"} onClick={() => handleNavItem(menuItems[0])} />
            <NavItem isMobile item={itemWithId(menuItems, "pagar")} active={activeScreen === "pagar"} onClick={() => handleNavItem(itemWithId(menuItems, "pagar"))} />
            <NavItem isMobile item={itemWithId(menuItems, "bazar")} active={activeScreen === "bazar"} onClick={() => handleNavItem(itemWithId(menuItems, "bazar"))} />
            <NavItem isMobile item={itemWithId(menuItems, "perfil")} active={activeScreen === "perfil"} onClick={() => handleNavItem(itemWithId(menuItems, "perfil"))} />
          </nav>
        )}
      </div>
    </div>
  );
}

function itemWithId(items: MenuItem[], id: Screen) {
  return items.find((i) => i.id === id) || items[0];
}
