import type { Metadata } from "next";
import { PageTransition } from "@/components/page-transition";
import { getLabAssets, getLabs, getNewSlugs } from "@/features/labs/data";
import { LabGallery } from "@/features/labs/components/lab-gallery";
import { INTERACTIONS } from "@/features/labs/types";

export const metadata: Metadata = {
  title: "Labs",
  description: "Small interface experiments: interactions, components and prototypes.",
};

export default async function LabsPage() {
  const newSlugs = await getNewSlugs();
  const labs = getLabs().map((l) => ({
    slug: l.slug,
    title: l.title,
    interaction: l.interaction,
    tags: l.tags,
    isNew: newSlugs.has(l.slug),
    hasCursor: Boolean(l.cursor?.length),
    assets: getLabAssets(l.slug),
  }));

  return (
    <PageTransition>
      <main className="mx-auto w-full max-w-[1200px] px-4 pb-24 sm:px-6">
        <header className="py-10 sm:py-14">
          <h1 className="text-display font-semibold tracking-tight">Labs</h1>
          <p className="mt-2 max-w-xl text-subtitle text-muted-foreground">
            Small interface experiments. Open one to see it run, tweak it, and read the code.
          </p>
        </header>
        <LabGallery labs={labs} interactions={INTERACTIONS} />
      </main>
    </PageTransition>
  );
}
