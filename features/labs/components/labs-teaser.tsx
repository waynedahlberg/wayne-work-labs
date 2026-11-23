import Link from "next/link";
import { getFeaturedLabs, getLabAssets, getNewSlugs } from "../data";
import { LabCard } from "./lab-card";

/** Home-page lead-in: 3–6 featured labs and a link to the full gallery. */
export async function LabsTeaser({ limit = 6 }: { limit?: number }) {
  const labs = getFeaturedLabs(limit);
  const newSlugs = await getNewSlugs();
  const cards = labs.map((l) => ({
    slug: l.slug,
    title: l.title,
    interaction: l.interaction,
    isNew: newSlugs.has(l.slug),
    hasCursor: Boolean(l.cursor?.length),
    assets: getLabAssets(l.slug),
  }));

  return (
    <section aria-labelledby="labs-heading">
      <div className="mb-4 flex items-end justify-between px-1">
        <h2 id="labs-heading" className="text-title font-semibold tracking-tight">
          Labs
        </h2>
        <Link href="/labs" transitionTypes={["nav-forward"]} className="rounded-full px-3 py-1.5 text-body text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring)]">
          All labs
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((lab) => (
          <LabCard key={lab.slug} lab={lab} />
        ))}
      </div>
    </section>
  );
}
