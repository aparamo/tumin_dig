"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  className,
  compact = false,
}: {
  className?: string;
  /** Smaller control + lighter neo shadow (mobile header) */
  compact?: boolean;
}) {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size={compact ? "icon-sm" : "icon"}
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={cn(
        "relative shrink-0 rounded-full bg-background",
        compact
          ? "h-8 w-8 border border-border shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none sm:h-9 sm:w-9"
          : "neo-btn",
        className
      )}
      aria-label="Cambiar tema"
    >
      <Sun
        className={cn(
          "rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0",
          compact ? "h-3.5 w-3.5 sm:h-4 sm:w-4" : "h-[1.2rem] w-[1.2rem]"
        )}
      />
      <Moon
        className={cn(
          "absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100",
          compact ? "h-3.5 w-3.5 sm:h-4 sm:w-4" : "h-[1.2rem] w-[1.2rem]"
        )}
      />
      <span className="sr-only">Cambiar tema</span>
    </Button>
  );
}
