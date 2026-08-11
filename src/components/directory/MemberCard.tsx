"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MapPin, ShieldCheck, Star, User } from "lucide-react";
import type { DirectoryMemberListItem } from "@/lib/directory-types";

export interface MemberCardProps {
  member: DirectoryMemberListItem;
  onClick: () => void;
}

export function MemberCard({ member, onClick }: MemberCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-xl border-2 border-border bg-card text-left shadow-neo-sm",
        "transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      <div className="flex items-center gap-3 border-b-2 border-border bg-muted/30 p-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted">
          {member.avatarUrl ? (
            <Image src={member.avatarUrl} alt="" fill className="object-cover" sizes="56px" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <User className="h-6 w-6" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-sm font-black uppercase tracking-tight md:text-base">
            {member.displayName}
            {member.isVerified && <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-label="Verificado" />}
          </p>
          <p className="truncate text-sm font-bold text-muted-foreground md:text-base">
            {member.region}
          </p>
          {member.locationCompact && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-sm font-medium text-muted-foreground md:text-base">
              <MapPin className="h-4 w-4 shrink-0" /> {member.locationCompact}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {member.categories.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {member.categories.slice(0, 4).map((c) => (
              <Badge key={c} variant="secondary" className="max-w-40 truncate text-sm font-bold uppercase md:text-base">
                {c}
              </Badge>
            ))}
            {member.categories.length > 4 && (
              <Badge variant="outline" className="text-sm font-bold md:text-base">
                +{member.categories.length - 4}
              </Badge>
            )}
          </div>
        ) : (
          <p className="text-sm font-bold text-muted-foreground md:text-base">Sin categorías públicas</p>
        )}

        {member.starProducts.length > 0 && (
          <div className="space-y-1">
            <p className="flex items-center gap-1 text-sm font-black uppercase tracking-wide text-secondary md:text-base">
              <Star className="h-4 w-4 fill-current" /> Estrella
            </p>
            <ul className="space-y-0.5">
              {member.starProducts.map((p) => (
                <li key={p.id} className="truncate text-sm font-bold md:text-base">
                  {p.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </button>
  );
}
