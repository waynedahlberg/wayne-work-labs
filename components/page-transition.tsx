import { ViewTransition } from "react";

/** Directional slide for forward/back navigation. Put one in every page.tsx
 *  that takes part (not in layouts: layouts persist, so enter/exit never fire). */
export function PageTransition({ children }: { children: React.ReactNode }) {
  // Page-to-page navigations slide. Lab details are not pages: they open as an
  // overlay (see features/labs/components/lab-detail.tsx).
  const map = {
    "nav-forward": "nav-forward",
    "nav-back": "nav-back",
    default: "none",
  } as const;
  return (
    <ViewTransition enter={map} exit={map} default="none">
      {children}
    </ViewTransition>
  );
}
