"use client";

import { ThemeProvider } from "next-themes";
import { FluidRoot } from "@/components/fluid-root";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <FluidRoot>{children}</FluidRoot>
    </ThemeProvider>
  );
}
