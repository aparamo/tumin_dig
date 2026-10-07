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
  MessagesSquare,
  Receipt,
  ChevronDown,
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
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { type Screen } from "@/lib/store";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/react";

interface MenuItem {
  id: Screen;
  label: string;
  icon: LucideIcon;
  color?: string;
  href?: string;
  badge?: number;
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
  const badge =
    item.badge && item.badge > 0 ? (
      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-black text-destructive-foreground">
        {item.badge > 99 ? "99+" : item.badge}
      </span>
    ) : null;

  if (isMobile) {
    const shortLabel =
      item.id === "perfil" ? "Perfil" : item.id === "inicio" ? "Inicio" : item.label;

    return (
      <Button
        type="button"
        variant="ghost"
        aria-label={item.label}
        className={cn(
          "h-14 min-w-0 flex-1 flex-col gap-0.5 overflow-hidden rounded-lg border-0 px-0.5 shadow-none whitespace-normal",
          active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
        )}
        onClick={onClick}
      >
        <span className="relative inline-flex shrink-0">
          <item.icon className="h-5 w-5" />
          {badge}
        </span>
        <span className="max-w-full truncate text-[9px] font-bold uppercase leading-none tracking-wide">
          {shortLabel}
        </span>
      </Button>
    );
  }

  const icon = (
    <span className="relative inline-flex">
      <item.icon className={cn(compact ? "w-5 h-5" : "w-6 h-6")} />
      {badge}
    </span>
  );

  return (
    <Tooltip>
      <TooltipTrigger
        render={(triggerProps) => (
          <Button
            {...triggerProps}
            variant="ghost"
            size="icon"
            aria-label={item.label}
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

/** Shell chrome for SPA screens, plus route-only labels (e.g. public `/u/[id]`). */
export type ShellScreen = Screen | "perfil-publico";

interface DashboardShellProps {
  activeScreen: ShellScreen;
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
  const [canScrollNavDown, setCanScrollNavDown] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const { data: unreadData } = trpc.messaging.unreadCount.useQuery(undefined, {
    refetchInterval: 30_000,
    enabled: !!session?.user,
  });
  const unreadCount = unreadData?.count ?? 0;

  const updateNavScrollHint = useCallback(() => {
    const el = navRef.current;
    if (!el) {
      setCanScrollNavDown(false);
      return;
    }
    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
    setCanScrollNavDown(remaining > 8);
  }, []);

  const scrollNavDown = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    el.scrollBy({ top: Math.max(el.clientHeight * 0.55, 72), behavior: "smooth" });
  }, []);

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
    { id: "mis-compras", label: "Mis Compras", icon: Receipt },
  ];

  // Desktop sidebar: sin Comunidad/Perfil/Mensajes (van en header)
  const desktopMenuItems: MenuItem[] = [
    { id: "inicio", label: "Inicio", icon: Home },
    { id: "pagar", label: "Pagar", icon: Send },
    { id: "bazar", label: "Bazar", icon: ShoppingBag },
    { id: "directorio", label: "Directorio", icon: BookUser },
    { id: "gestion-productos", label: "Mis Productos", icon: PackageSearch },
    { id: "medios", label: "Mis Archivos", icon: FolderOpen },
    { id: "anuncios", label: "Mis Anuncios", icon: Megaphone },
    { id: "historial", label: "Historial", icon: History },
    { id: "mis-compras", label: "Mis Compras", icon: Receipt },
  ];

  const messagesItem: MenuItem = {
    id: "mensajes",
    label: "Mensajes",
    icon: MessagesSquare,
    badge: unreadCount || undefined,
  };

  const coordinatorItems: MenuItem[] = [
    { id: "coordinacion", label: "Validar", icon: Settings, color: "text-orange-500", href: "/coordinacion" },
    { id: "gestion-roles", label: "Roles", icon: Users, color: "text-purple-500", href: "/gestion-socios" },
    { id: "auditoria", label: "Auditoría", icon: ShieldAlert, color: "text-red-500", href: "/auditoria" },
  ];

  const activeLabel =
    activeScreen === "perfil-publico"
      ? "Perfil público"
      : activeScreen === "mensajes"
        ? messagesItem.label
        : menuItems.find((i) => i.id === activeScreen)?.label ||
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
    const el = navRef.current;
    if (!el) return;
    updateNavScrollHint();
    el.addEventListener("scroll", updateNavScrollHint, { passive: true });
    const ro = new ResizeObserver(updateNavScrollHint);
    ro.observe(el);
    window.addEventListener("resize", updateNavScrollHint);
    return () => {
      el.removeEventListener("scroll", updateNavScrollHint);
      ro.disconnect();
      window.removeEventListener("resize", updateNavScrollHint);
    };
  }, [updateNavScrollHint, desktopMenuItems.length]);

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
    <div className="flex min-h-dvh max-w-[100vw] overflow-x-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 bg-card border-r-4 border-border flex-col items-center py-4 z-50 overflow-hidden">
        <Link
          href="/"
          className="w-12 h-12 bg-emerald-700 border-2 border-border shadow-neo-sm rounded-full flex items-center justify-center font-black text-xl text-secondary-foreground mb-4 shrink-0"
        >
          <Image src="/logo_trans_sm.png" alt="Túmin Digital" width={32} height={32} />
        </Link>

        <div className="relative flex min-h-0 w-full flex-1 flex-col">
          <nav
            ref={navRef}
            className="flex min-h-0 flex-1 flex-col items-center gap-3 overflow-y-auto px-2 py-2 scrollbar-hide w-full"
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

          <AnimatePresence>
            {canScrollNavDown ? (
              <motion.button
                type="button"
                key="sidebar-scroll-down"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                onClick={scrollNavDown}
                aria-label="Ver más del menú"
                className="absolute bottom-1 right-0 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border/40 bg-card/90 text-muted-foreground shadow-[1px_1px_0_0_color-mix(in_oklab,var(--border)_40%,transparent)] backdrop-blur-sm hover:bg-muted hover:text-foreground"
              >
                <motion.span
                  animate={{ y: [0, 3, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-flex"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </motion.span>
              </motion.button>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="mt-2 flex shrink-0 flex-col gap-3 py-2">
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

      <div className="flex min-w-0 flex-1 flex-col md:ml-20">
        {/* Header */}
        <header className="fixed top-0 right-0 left-0 z-40 flex h-14 max-w-[100vw] items-center gap-2 border-b-4 border-border bg-card px-2 sm:h-16 sm:px-4 md:left-20">
          <div className="flex min-w-0 flex-1 items-center gap-3.5 sm:gap-4">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsSidebarOpen(true)}
              className="h-8 w-8 shrink-0 rounded-md border border-border bg-background shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none md:hidden sm:h-9 sm:w-9 sm:rounded-lg"
              aria-label="Abrir menú"
            >
              <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <h1 className="min-w-0 truncate pl-2 text-base font-black tracking-tight text-foreground uppercase sm:pl-0.5 sm:text-xl">
              {activeLabel}
            </h1>
          </div>

          {/* Desktop header right — Mensajes primero desde la izquierda */}
          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <Tooltip>
              <TooltipTrigger
                render={(triggerProps) => (
                  <Button
                    {...triggerProps}
                    variant="ghost"
                    size="icon"
                    aria-label="Mensajes"
                    className={cn(
                      "relative w-10 h-10 rounded-xl text-muted-foreground hover:bg-muted",
                      activeScreen === "mensajes" && "bg-primary text-primary-foreground hover:bg-primary"
                    )}
                    onClick={() => handleNavItem(messagesItem)}
                  >
                    <MessagesSquare className="w-5 h-5" />
                    {unreadCount > 0 ? (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-black text-destructive-foreground">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    ) : null}
                  </Button>
                )}
              />
              <TooltipContent side="bottom" className="font-black uppercase text-xs">
                Mensajes
              </TooltipContent>
            </Tooltip>

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
                      className="absolute right-0 top-12 z-50 flex min-w-40 flex-col gap-1 rounded-xl border-2 border-border bg-card p-2 shadow-neo-sm"
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

          <div className="flex shrink-0 items-center gap-1 md:hidden">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Mensajes"
              className={cn(
                "relative h-8 w-8 shrink-0 rounded-md text-muted-foreground sm:h-9 sm:w-9 sm:rounded-lg",
                activeScreen === "mensajes" && "bg-primary text-primary-foreground"
              )}
              onClick={() => handleNavItem(messagesItem)}
            >
              <MessagesSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {unreadCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-black text-destructive-foreground">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </Button>
            <ThemeToggle compact />
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
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-black text-destructive-foreground">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                ) : null}
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

        {/* Main Content — Mensajes fills viewport for split pane; other screens keep padding */}
        <main
          className={cn(
            "mt-14 flex-1 overflow-x-hidden sm:mt-16",
            activeScreen === "mensajes"
              ? "mb-16 h-[calc(100dvh-7.5rem)] p-0 sm:h-[calc(100dvh-8rem)] md:mb-0 md:h-[calc(100dvh-4rem)]"
              : "mb-24 p-4 md:mb-0 md:p-8"
          )}
        >
          {activeScreen === "mensajes" ? (
            <div className="h-full min-h-0">{children}</div>
          ) : (
            <div className="mx-auto max-w-7xl">{children}</div>
          )}
        </main>

        {/* Mobile Bottom Nav */}
        {!hideBottomNav && (
          <nav className="fixed right-0 bottom-0 left-0 z-50 flex h-16 max-w-[100vw] items-stretch gap-0.5 border-t-4 border-border bg-card px-1 md:hidden">
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
