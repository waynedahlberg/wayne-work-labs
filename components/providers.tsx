"use client";

import { ThemeProvider } from "next-themes";
import { FluidRoot } from "@/components/fluid-root";
import { LabHostProvider } from "@/features/labs/live/host";
import type { Control } from "@/features/labs/types";

export function Providers({ children, labs }: { children: React.ReactNode; labs: { slug: string; controls: Control[] }[] }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <FluidRoot>
        <LabHostProvider labs={labs}>{children}</LabHostProvider>
      </FluidRoot>
    </ThemeProvider>
  );
}
