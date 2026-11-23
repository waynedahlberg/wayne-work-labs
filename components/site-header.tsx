import Link from "next/link";
import { ViewTransition } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <ViewTransition name="site-header" share="none" default="none">
      <header data-site-header className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="rounded-full px-3 py-1.5 text-body font-semibold tracking-tight outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring)]"
        >
          wayne.work
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/labs"
            className="rounded-full px-3 py-1.5 text-body text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring)]"
          >
            Labs
          </Link>
          <ThemeToggle />
        </nav>
      </header>
    </ViewTransition>
  );
}
