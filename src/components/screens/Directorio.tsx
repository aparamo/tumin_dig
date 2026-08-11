"use client";

import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc/react";
import { useStore } from "@/lib/store";
import { useDebounce } from "@/hooks/use-debounce";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

import { DirectoryFilters, type DirectoryFiltersState } from "@/components/directory/DirectoryFilters";
import { MemberCard } from "@/components/directory/MemberCard";
import { MemberListRow } from "@/components/directory/MemberListRow";
import { MemberDetailDialog } from "@/components/directory/MemberDetailDialog";
import { SavedContactsPanel } from "@/components/directory/SavedContactsPanel";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion";
import type {
  DirectoryMemberListItem,
  DirectoryPageSize,
  DirectorySortBy,
  DirectoryTab,
} from "@/lib/directory-types";
import type { SavedContactListItem } from "@/lib/directory-types";

function buildDefaults(): DirectoryFiltersState {
  return {
    search: "",
    region: "Todas",
    locationState: "Todas",
    category: "Todas",
    sortBy: "recientes",
    pageSize: 10,
    viewMode: "card",
  };
}

function contactToMember(c: SavedContactListItem): DirectoryMemberListItem {
  return {
    id: c.contactUserId,
    displayName: c.displayName,
    avatarUrl: c.avatarUrl,
    isVerified: c.isVerified,
    region: c.region || "—",
    location: c.location,
    locationCompact: c.locationCompact,
    categories: c.categories,
    starProducts: c.starProducts,
    isSavedContact: true,
  };
}

export function Directorio() {
  const directoryTab = useStore((s) => s.directoryTab);
  const setDirectoryTab = useStore((s) => s.setDirectoryTab);
  const setCurrentScreen = useStore((s) => s.setCurrentScreen);

  const goToPrivacySettings = () => {
    setCurrentScreen("perfil");
    window.setTimeout(() => {
      document.getElementById("privacidad")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const [filters, setFilters] = useState<DirectoryFiltersState>(buildDefaults);
  const [cursor, setCursor] = useState(0);
  const [contactsCursor, setContactsCursor] = useState(0);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const debouncedSearch = useDebounce(filters.search, 300);

  const listQuery = trpc.directory.listMembers.useQuery(
    {
      cursor,
      pageSize: filters.pageSize,
      region: filters.region === "Todas" ? undefined : filters.region,
      locationState: filters.locationState === "Todas" ? undefined : filters.locationState,
      category: filters.category === "Todas" ? undefined : filters.category,
      sortBy: filters.sortBy,
      search: debouncedSearch.trim() || undefined,
    },
    { enabled: directoryTab === "miembros" }
  );

  const contactsQuery = trpc.directory.listSavedContacts.useQuery(
    { cursor: contactsCursor, pageSize: filters.pageSize },
    { enabled: directoryTab === "contactos" }
  );

  const patchFilters = (patch: Partial<DirectoryFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setCursor(0);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      region: "Todas",
      locationState: "Todas",
      category: "Todas",
      sortBy: "recientes" as DirectorySortBy,
      pageSize: filters.pageSize as DirectoryPageSize,
      viewMode: filters.viewMode,
    });
    setCursor(0);
  };

  const openMember = (userId: string) => {
    setDetailUserId(userId);
    setDetailOpen(true);
  };

  const contactMembers = useMemo(
    () => (contactsQuery.data?.items ?? []).filter((c) => c.available).map(contactToMember),
    [contactsQuery.data?.items]
  );

  const unavailableCount = (contactsQuery.data?.items ?? []).filter((c) => !c.available).length;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 pb-12">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tighter md:text-4xl">Directorio</h1>
        <p className="mt-1 text-sm font-bold uppercase tracking-wide text-muted-foreground md:text-base">
          Socios con perfil público
        </p>
      </div>

      <Tabs
        value={directoryTab}
        onValueChange={(v) => {
          if (v === "miembros" || v === "contactos") setDirectoryTab(v as DirectoryTab);
        }}
        className="w-full"
      >
        <TabsList className="h-11 w-full max-w-md border-2 border-border bg-muted/40 p-1">
          <TabsTrigger value="miembros" className="flex-1 text-sm font-black uppercase data-active:shadow-neo-sm md:text-base">
            Miembros
          </TabsTrigger>
          <TabsTrigger value="contactos" className="flex-1 text-sm font-black uppercase data-active:shadow-neo-sm md:text-base">
            Mis contactos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="miembros" className="mt-6 space-y-6">
          <DirectoryFilters filters={filters} onChange={patchFilters} onClear={clearFilters} />

          {listQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : listQuery.isError ? (
            <p className="rounded-xl border-2 border-destructive/40 bg-destructive/5 p-6 text-center font-bold text-destructive">
              {listQuery.error.message}
            </p>
          ) : (listQuery.data?.items.length ?? 0) === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-10 text-center">
              <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground md:text-base">
                Nadie con perfil público coincide con estos filtros.
              </p>
              <Button type="button" variant="outline" className="mt-4 text-sm font-black uppercase shadow-neo-sm md:text-base" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            </div>
          ) : filters.viewMode === "list" ? (
            <div className="flex flex-col gap-2">
              {listQuery.data!.items.map((m) => (
                <MemberListRow key={m.id} member={m} onClick={() => openMember(m.id)} />
              ))}
            </div>
          ) : (
            <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listQuery.data!.items.map((m) => (
                <StaggerItem key={m.id}>
                  <MemberCard member={m} onClick={() => openMember(m.id)} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}

          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              className="text-sm font-black uppercase shadow-neo-sm md:text-base"
              disabled={cursor === 0 || listQuery.isFetching}
              onClick={() => setCursor((c) => Math.max(0, c - filters.pageSize))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
            </Button>
            <span className="text-sm font-black uppercase tracking-wide text-muted-foreground md:text-base">
              Desde {cursor + 1}
            </span>
            <Button
              type="button"
              variant="outline"
              className="text-sm font-black uppercase shadow-neo-sm md:text-base"
              disabled={!listQuery.data?.nextCursor || listQuery.isFetching}
              onClick={() => {
                if (listQuery.data?.nextCursor != null) setCursor(listQuery.data.nextCursor);
              }}
            >
              Siguiente <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="contactos" className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground md:text-base">
              Contactos guardados
            </p>
            <div className="flex rounded-lg border-2 border-border p-0.5">
              <button
                type="button"
                className={`rounded-md px-3 py-1.5 text-sm font-black uppercase md:text-base ${filters.viewMode === "card" ? "bg-primary text-primary-foreground" : ""}`}
                onClick={() => patchFilters({ viewMode: "card" })}
              >
                Tarjetas
              </button>
              <button
                type="button"
                className={`rounded-md px-3 py-1.5 text-sm font-black uppercase md:text-base ${filters.viewMode === "list" ? "bg-primary text-primary-foreground" : ""}`}
                onClick={() => patchFilters({ viewMode: "list" })}
              >
                Lista
              </button>
            </div>
          </div>

          {contactsQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <SavedContactsPanel
                items={contactMembers}
                viewMode={filters.viewMode}
                onSelect={openMember}
              />
              {unavailableCount > 0 && (
                <p className="text-center text-sm font-bold text-muted-foreground md:text-base">
                  {unavailableCount} contacto(s) ya no tienen perfil público — quítalos desde el detalle si quieres.
                </p>
              )}
              {(contactsQuery.data?.items ?? [])
                .filter((c) => !c.available)
                .map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-border bg-muted/10 px-4 py-3"
                  >
                    <span className="text-sm font-bold text-muted-foreground md:text-base">{c.displayName}</span>
                    <UnavailableRemove contactUserId={c.contactUserId} />
                  </div>
                ))}
            </>
          )}

          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              className="text-sm font-black uppercase shadow-neo-sm md:text-base"
              disabled={contactsCursor === 0 || contactsQuery.isFetching}
              onClick={() => setContactsCursor((c) => Math.max(0, c - filters.pageSize))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-sm font-black uppercase shadow-neo-sm md:text-base"
              disabled={!contactsQuery.data?.nextCursor || contactsQuery.isFetching}
              onClick={() => {
                if (contactsQuery.data?.nextCursor != null) setContactsCursor(contactsQuery.data.nextCursor);
              }}
            >
              Siguiente <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <MemberDetailDialog
        userId={detailUserId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted-foreground md:text-base">
        El directorio muestra miembros con perfil público. Puedes configurar la visibilidad en{" "}
        <button
          type="button"
          onClick={goToPrivacySettings}
          className="font-black uppercase text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Mi perfil (privacidad)
        </button>
        .
      </p>
    </div>
  );
}

function UnavailableRemove({ contactUserId }: { contactUserId: string }) {
  const utils = trpc.useUtils();
  const remove = trpc.directory.removeContact.useMutation({
    onSuccess: () => void utils.directory.invalidate(),
  });
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-sm font-black uppercase md:text-base"
      disabled={remove.isPending}
      onClick={() => remove.mutate({ contactUserId })}
    >
      Quitar
    </Button>
  );
}
