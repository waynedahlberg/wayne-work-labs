import { Suspense } from "react";
import { getLabs } from "@/features/labs/data";
import { LabDetailServer } from "@/features/labs/components/lab-detail-server";

/**
 * Soft navigations to /labs/[slug] (from the gallery or the home teaser) land
 * here: the detail view opens as an overlay on top of the page that is still
 * mounted underneath. Direct loads use app/labs/[slug]/page.tsx instead.
 */
export function generateStaticParams() {
  return getLabs().map((l) => ({ slug: l.slug }));
}

export default function InterceptedLab({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={null}>
      <Overlay params={params} />
    </Suspense>
  );
}

async function Overlay({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <LabDetailServer slug={slug} mode="overlay" />;
}
