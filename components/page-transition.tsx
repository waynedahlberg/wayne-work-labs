import { ViewTransition } from "react";

/** Directional slide for forward/back navigation. Put one in every page.tsx
 *  that takes part (not in layouts: layouts persist, so enter/exit never fire). */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const map = { "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" } as const;
  return (
    <ViewTransition enter={map} exit={map} default="none">
      {children}
    </ViewTransition>
  );
}
