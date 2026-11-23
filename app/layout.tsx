import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import "allo-font";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import { getLabs } from "@/features/labs/data";

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "wayne.work", template: "%s · wayne.work" },
  description: "Wayne's portfolio: projects, and a lab of interface experiments.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children, modal }: LayoutProps<"/">) {
  const labs = getLabs().map((l) => ({ slug: l.slug, controls: l.controls ?? [] }));
  return (
    <html lang="en" suppressHydrationWarning className={`${mono.variable} antialiased`}>
      <body className="min-h-dvh bg-background text-foreground">
        <Providers labs={labs}>
          <SiteHeader />
          {children}
          {modal}
        </Providers>
      </body>
    </html>
  );
}
