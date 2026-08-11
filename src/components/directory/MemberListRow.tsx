"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MapPin, ShieldCheck, Star, User } from "lucide-react";
import type { DirectoryMemberListItem } from "@/lib/directory-types";

export interface MemberListRowProps {
  member: DirectoryMemberListItem;
  onClick: () => void;
}

export function MemberListRow({ member, onClick }: MemberListRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-stretch gap-3 rounded-xl border-2 border-border bg-card p-3 text-left shadow-neo-sm sm:gap-4 sm:p-4",
        "transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      <div className="relative h-11 w-11 shrink-0 self-center overflow-hidden rounded-full border-2 border-border bg-muted sm:h-12 sm:w-12">
        {member.avatarUrl ? (
          <Image src={member.avatarUrl} alt="" fill className="object-cover" sizes="48px" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <User className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 self-center">
        <p className="flex items-center gap-1.5 truncate text-sm font-black uppercase tracking-tight md:text-base">
          {member.displayName}
          {member.isVerified && <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />}
          {member.starProducts.length > 0 && (
            <Star className="h-4 w-4 shrink-0 fill-current text-secondary" aria-label="Tiene productos estrella" />
          )}
        </p>
        <p className="truncate text-sm font-bold text-muted-foreground md:text-base">
          {member.region}
        </p>
      </div>

      <div className="hidden min-w-0 flex-1 self-center sm:block">
        {member.categories.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {member.categories.slice(0, 4).map((c) => (
              <Badge key={c} variant="outline" className="max-w-36 truncate px-2 py-0.5 text-sm font-bold uppercase md:text-base">
                {c}
              </Badge>
            ))}
            {member.categories.length > 4 && (
              <Badge variant="outline" className="px-2 py-0.5 text-sm font-bold md:text-base">
                +{member.categories.length - 4}
              </Badge>
            )}
          </div>
        ) : (
          <p className="text-sm font-medium text-muted-foreground md:text-base">—</p>
        )}
      </div>

      <div className="hidden w-36 shrink-0 self-center text-right md:block md:w-44">
        {member.locationCompact || member.location ? (
          <p className="flex items-center justify-end gap-1.5 text-sm font-bold text-muted-foreground md:text-base">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{member.locationCompact ?? member.location}</span>
          </p>
        ) : (
          <p className="text-sm font-medium text-muted-foreground md:text-base">—</p>
        )}
      </div>
    </button>
  );
}
