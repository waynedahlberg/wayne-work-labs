import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getLab, getLabs } from "@/features/labs/data";
import { LabDetailServer } from "@/features/labs/components/lab-detail-server";

export function generateStaticParams() {
  return getLabs().map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: PageProps<"/labs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const lab = getLab(slug);
  if (!lab) return {};
  return {
    title: lab.title,
    description: lab.description,
    openGraph: { title: `${lab.title} · Labs`, description: lab.description, type: "article" },
    twitter: { card: "summary_large_image" },
  };
}

/** Direct loads (shared links, refresh, crawlers) get the detail view as a normal page. */
export default function LabPage({ params }: PageProps<"/labs/[slug]">) {
  return (
    <main>
      <Suspense fallback={<Skeleton className="h-[36rem] rounded-[2rem]" />}>
        <Detail params={params} />
      </Suspense>
    </main>
  );
}

async function Detail({ params }: Pick<PageProps<"/labs/[slug]">, "params">) {
  const { slug } = await params;
  if (!getLab(slug)) notFound();
  return <LabDetailServer slug={slug} mode="page" />;
}
