import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getLab, getLabs } from "@/features/labs/data";
import { LabEmbed } from "@/features/labs/components/lab-embed";

export const metadata: Metadata = { robots: { index: false } };

export function generateStaticParams() {
  return getLabs().map((l) => ({ slug: l.slug }));
}

export default function EmbedPage({ params }: PageProps<"/labs/[slug]/embed">) {
  return (
    <Suspense>
      <Embed params={params} />
    </Suspense>
  );
}

async function Embed({ params }: Pick<PageProps<"/labs/[slug]/embed">, "params">) {
  const { slug } = await params;
  const lab = getLab(slug);
  if (!lab || lab.kind !== "react") notFound();
  return (
    <>
      {/* The embed is a bare stage: no site chrome. */}
      <style>{"[data-site-header]{display:none}body{background:var(--stage)}"}</style>
      <LabEmbed slug={lab.slug} controls={lab.controls ?? []} cursor={lab.cursor} />
    </>
  );
}
