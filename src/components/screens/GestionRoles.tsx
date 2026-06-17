"use client";

import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Users, Search, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import {
  ENROLLMENT_REGION_FILTER_OPTIONS,
  formatEnrollmentDisplay,
  formatPublicLocation,
} from "@/lib/location";

type SortOption = "name_asc" | "name_desc" | "date_asc" | "date_desc";
type UserRole = "SOCIO" | "COORDINADOR_LOCAL" | "COORDINADOR" | "COORDINADOR_GENERAL";

export function GestionRoles() {
  const { data: session } = useSession();
  const utils = trpc.useUtils();
  
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [regionFilter, setRegionFilter] = useState("Todas");
  const [sortBy, setSortBy] = useState<SortOption>("date_desc");
  const [cursor, setCursor] = useState(0);
  const [limit, setLimit] = useState(10);

  const debouncedSearch = useDebounce(search, 500);

  const isGlobal = session?.user?.role === "COORDINADOR_GENERAL";

  const { data, isLoading } = trpc.user.getUsersAdvanced.useQuery({
    search: debouncedSearch,
    roleFilter,
    statusFilter,
    regionFilter: isGlobal ? regionFilter : session?.user?.region,
    sortBy,
    cursor,
    limit,
  });

  const updateRole = trpc.user.updateRole.useMutation({
    onSuccess: () => {
      alert("Rol actualizado con éxito.");
      utils.user.getUsersAdvanced.invalidate();
    },
    onError: (error) => alert(error.message),
  });

  const regions = [...ENROLLMENT_REGION_FILTER_OPTIONS];

  if (!session?.user) return null;

  return (
    <div className="flex flex-col gap-6 p-4 max-w-5xl mx-auto w-full pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-2">
            <Users className="w-8 h-8 text-purple-600" /> Gestión de Socios
          </h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Administración por región adscrita {isGlobal ? "(global)" : `en ${session.user.region}`}
          </p>
        </div>
      </div>

      <Card className="border-2 border-border shadow-neo-sm overflow-visible">
        <CardContent className="p-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre, tel o email..." 
                className="pl-9 h-11 border-2"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCursor(0); }}
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={(v: string | null) => { if (v) { setRoleFilter(v); setCursor(0); } }}>
                <SelectTrigger className="h-11 border-2 font-bold uppercase text-[10px]">
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos los roles</SelectItem>
                  <SelectItem value="SOCIO">Socio</SelectItem>
                  <SelectItem value="COORDINADOR_LOCAL">Coordinador Local</SelectItem>
                  <SelectItem value="COORDINADOR">Coordinador</SelectItem>
                  <SelectItem value="COORDINADOR_GENERAL">Coordinador General</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(v: string | null) => { if (v) { setStatusFilter(v); setCursor(0); } }}>
                <SelectTrigger className="h-11 border-2 font-bold uppercase text-[10px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos los estados</SelectItem>
                  <SelectItem value="ACTIVO">Activos</SelectItem>
                  <SelectItem value="CONGELADO">Congelados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              {isGlobal && (
                <Select value={regionFilter} onValueChange={(v: string | null) => { if (v) { setRegionFilter(v); setCursor(0); } }}>
                  <SelectTrigger className="h-11 border-2 font-bold uppercase text-[10px]">
                    <SelectValue placeholder="Región adscrita" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <Select value={sortBy} onValueChange={(v: SortOption | null) => { if (v) { setSortBy(v); setCursor(0); } }}>
                <SelectTrigger className="h-11 border-2 font-bold uppercase text-[10px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc">Más recientes</SelectItem>
                  <SelectItem value="date_asc">Más antiguos</SelectItem>
                  <SelectItem value="name_asc">Nombre A-Z</SelectItem>
                  <SelectItem value="name_desc">Nombre Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>
        ) : data && data.items.length > 0 ? (
          <>
            {data.items.map((user) => (
              <Card key={user.id} className="shadow-neo-sm border-2 border-border overflow-hidden group hover:border-purple-500 transition-colors">
                <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-lg uppercase tracking-tight">{user.name}</span>
                      <span className={cn(
                        "text-[8px] font-black uppercase px-2 py-0.5 rounded-full border",
                        user.status === "ACTIVO" ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"
                      )}>
                        {user.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-bold uppercase flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      <span>ID: <span className="text-foreground">{user.id}</span></span>
                      <span>Adscripción: <span className="text-foreground">
                        {formatEnrollmentDisplay(user.region, user.enrollmentMethod, user.enrollmentMethodOther)}
                      </span></span>
                      <span>Vive en: <span className="text-foreground">
                        {formatPublicLocation({
                          residenceCountry: user.residenceCountry,
                          residenceState: user.residenceState,
                          residenceCity: user.residenceCity,
                          residencePostalCode: null,
                        }) ?? "—"}
                      </span></span>
                      <span>Tel: <span className="text-foreground">{user.phone}</span></span>
                      {user.email && <span>Email: <span className="text-foreground">{user.email}</span></span>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <Select 
                      defaultValue={user.role} 
                      onValueChange={(val: UserRole | null) => {
                        if (val) updateRole.mutate({ userId: user.id, role: val });
                      }}
                      disabled={user.id === session.user.id}
                    >
                      <SelectTrigger className="w-full md:w-[180px] h-10 text-[10px] font-black uppercase border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SOCIO">Socio</SelectItem>
                        <SelectItem value="COORDINADOR_LOCAL">Coordinador Local</SelectItem>
                        <SelectItem value="COORDINADOR">Coordinador</SelectItem>
                        <SelectItem value="COORDINADOR_GENERAL">Coordinador General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t-2 border-border/10">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-muted-foreground">Mostrar:</span>
                <Select value={limit.toString()} onValueChange={(v) => { if (v) { setLimit(parseInt(v)); setCursor(0); } }}>
                  <SelectTrigger className="w-20 h-9 text-[10px] font-black border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-[10px] font-black uppercase text-muted-foreground">por página</span>
              </div>

              <div className="flex items-center gap-6">
                <Button 
                  variant="outline" 
                  className="border-2 font-black uppercase text-xs h-10 px-6 shadow-neo-sm"
                  disabled={cursor === 0}
                  onClick={() => setCursor(Math.max(0, cursor - limit))}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> Anterior
                </Button>
                <div className="text-[10px] font-black uppercase text-muted-foreground bg-muted px-4 py-2 rounded-lg border-2 border-border">
                  Página {Math.floor(cursor / limit) + 1}
                </div>
                <Button 
                  variant="outline" 
                  className="border-2 font-black uppercase text-xs h-10 px-6 shadow-neo-sm"
                  disabled={!data.nextCursor}
                  onClick={() => setCursor(data.nextCursor || 0)}
                >
                  Siguiente <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="neo-card bg-muted/20 border-dashed border-2 shadow-none p-16 text-center text-muted-foreground font-black uppercase text-sm tracking-widest">
            No se encontraron socios con estos filtros.
          </div>
        )}
      </div>
    </div>
  );
}
