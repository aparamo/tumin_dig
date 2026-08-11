"use client";

import { MemberCard } from "@/components/directory/MemberCard";
import { MemberListRow } from "@/components/directory/MemberListRow";
import type { DirectoryMemberListItem, DirectoryViewMode } from "@/lib/directory-types";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion";

export interface SavedContactsPanelProps {
  items: DirectoryMemberListItem[];
  viewMode: DirectoryViewMode;
  onSelect: (userId: string) => void;
  emptyMessage?: string;
}

export function SavedContactsPanel({
  items,
  viewMode,
  onSelect,
  emptyMessage = "Aún no guardas contactos.",
}: SavedContactsPanelProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-10 text-center text-sm font-bold uppercase tracking-widest text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="flex flex-col gap-2">
        {items.map((m) => (
          <MemberListRow key={m.id} member={m} onClick={() => onSelect(m.id)} />
        ))}
      </div>
    );
  }

  return (
    <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((m) => (
        <StaggerItem key={m.id}>
          <MemberCard member={m} onClick={() => onSelect(m.id)} />
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
