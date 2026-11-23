"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { useIcons } from "@/lib/icon-context";

/** Flips light/dark. Both glyphs render and CSS picks one, so there is no
 *  hydration mismatch and no flash. */
export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const { sun: Sun, moon: Moon } = useIcons();
  return (
    <Tooltip content="Toggle theme">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Toggle theme"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      >
        <Sun className="hidden dark:block" />
        <Moon className="dark:hidden" />
      </Button>
    </Tooltip>
  );
}
