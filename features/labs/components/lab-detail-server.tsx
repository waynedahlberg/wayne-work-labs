import { getCodePanel, getLab, getLabAssets, getLabs } from "../data";
import { LabDetail } from "./lab-detail";

/** Builds the detail view for a slug. Used by the full page and by the intercepted overlay. */
export async function LabDetailServer({ slug, mode }: { slug: string; mode: "overlay" | "page" }) {
  const lab = getLab(slug);
  if (!lab) return null;

  const code = await getCodePanel(lab.slug);
  const labs = getLabs();
  const i = labs.findIndex((l) => l.slug === slug);
  const pick = (l?: { slug: string; title: string }) => (l && l.slug !== slug ? { slug: l.slug, title: l.title } : null);

  return (
    <LabDetail
      key={lab.slug}
      mode={mode}
      code={code}
      lab={{
        slug: lab.slug,
        title: lab.title,
        description: lab.description,
        kind: lab.kind,
        interaction: lab.interaction,
        tags: lab.tags,
        updatedAt: lab.updatedAt,
        controls: lab.controls ?? [],
        cursor: lab.cursor,
        video: lab.video,
        link: lab.link,
        poster: getLabAssets(lab.slug).thumb,
        prev: pick(labs[(i - 1 + labs.length) % labs.length]),
        next: pick(labs[(i + 1) % labs.length]),
      }}
    />
  );
}
