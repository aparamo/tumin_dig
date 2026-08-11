"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getCategoryPastel } from "@/lib/product-categories";

export interface CategoryBadgesProps {
  categories: string[];
  /** Max labels before +N (default 3) */
  max?: number;
  className?: string;
}

/**
 * Category chips that wrap fully — avoids mid-word clipping from
 * Badge's default whitespace-nowrap + fixed height + card overflow.
 * Each known category gets a soft pastel surface.
 */
export function CategoryBadges({
  categories,
  max = 3,
  className,
}: CategoryBadgesProps) {
  if (categories.length === 0) return null;

  const shown = categories.slice(0, max);
  const rest = categories.length - shown.length;

  return (
    <div className={cn("flex min-w-0 flex-wrap gap-1.5", className)}>
      {shown.map((c) => {
        const pastel = getCategoryPastel(c);
        return (
          <Badge
            key={c}
            variant="outline"
            className={cn(
              "h-auto max-w-full shrink whitespace-normal break-words rounded-lg border px-2 py-1",
              "text-left text-sm font-bold leading-snug md:text-base",
              "overflow-visible",
              pastel.bg,
              pastel.border,
              pastel.text
            )}
          >
            {c}
          </Badge>
        );
      })}
      {rest > 0 && (
        <Badge
          variant="outline"
          className="h-auto shrink-0 border-border bg-muted/50 px-2 py-1 text-sm font-bold text-muted-foreground md:text-base"
        >
          +{rest}
        </Badge>
      )}
    </div>
  );
}
