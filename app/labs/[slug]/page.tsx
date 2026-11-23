import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageTransition } from "@/components/page-transition";
import { Skeleton } from "@/components/ui/skeleton";
import { getCodePanel, getLab, getLabs } from "@/features/labs/data";
import { LabStage } from "@/features/labs/components/lab-stage";

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

export default function LabPage({ params }: PageProps<"/labs/[slug]">) {
  return (
    <PageTransition>
      <main className="mx-auto w-full max-w-[1200px] px-4 pb-24 sm:px-6">
        <Suspense fallback={<Skeleton className="h-[35rem] rounded-[2rem]" />}>
          <LabDetail params={params} />
        </Suspense>
      </main>
    </PageTransition>
  );
}

async function LabDetail({ params }: Pick<PageProps<"/labs/[slug]">, "params">) {
  const { slug } = await params;
  const lab = getLab(slug);
  if (!lab) notFound();

  const code = await getCodePanel(lab.slug);
  const labs = getLabs();
  const i = labs.findIndex((l) => l.slug === slug);
  const prev = labs[(i - 1 + labs.length) % labs.length];
  const next = labs[(i + 1) % labs.length];

  return (
    <>
      <LabStage
        slug={lab.slug}
        title={lab.title}
        kind={lab.kind}
        controls={lab.controls ?? []}
        cursor={lab.cursor}
        video={lab.video}
        code={code}
      />

      <section className="mt-3 rounded-[2rem] bg-stage p-3">
        <div className="rounded-[1.5rem] bg-inset p-6 sm:p-8">
          <h1 className="text-title font-semibold tracking-tight">{lab.title}</h1>
          <p className="mt-2 max-w-2xl text-body text-muted-foreground">{lab.description}</p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-inset-2 px-3 py-1 text-caption">{lab.interaction}</span>
            {lab.tags.map((t) => (
              <span key={t} className="rounded-full bg-inset-2 px-3 py-1 text-caption text-muted-foreground">
                {t}
              </span>
            ))}
            <span className="ml-auto text-caption text-muted-foreground">Updated {lab.updatedAt}</span>
          </div>
          {lab.link && (
            <a
              href={lab.link.href}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex h-9 items-center rounded-full bg-foreground px-4 text-body text-background outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring)]"
            >
              {lab.link.label} ↗
            </a>
          )}
        </div>
      </section>

      {labs.length > 1 && (
        <nav aria-label="More labs" className="mt-3 grid grid-cols-2 gap-3">
          <Link href={`/labs/${prev.slug}`} transitionTypes={["nav-back"]} className="rounded-full bg-stage px-5 py-3 text-body outline-none transition-colors hover:bg-inset-2 focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring)]">
            <span className="text-muted-foreground">← </span>
            {prev.title}
          </Link>
          <Link href={`/labs/${next.slug}`} transitionTypes={["nav-forward"]} className="rounded-full bg-stage px-5 py-3 text-right text-body outline-none transition-colors hover:bg-inset-2 focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring)]">
            {next.title}
            <span className="text-muted-foreground"> →</span>
          </Link>
        </nav>
      )}
    </>
  );
}
