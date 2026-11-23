"use client";

import { useMemo, useState } from "react";
import { LabCard, type LabCardData } from "./lab-card";
import { Button } from "@/components/ui/button";

export interface GalleryLab extends LabCardData {
  tags: string[];
}

/** Interaction + domain chips on top, grid of cards below. */
export function LabGallery({ labs, interactions }: { labs: GalleryLab[]; interactions: readonly string[] }) {
  const [filter, setFilter] = useState<string | null>(null);

  const { interactionChips, tagChips } = useMemo(() => {
    const present = new Set(labs.map((l) => l.interaction));
    const tags = [...new Set(labs.flatMap((l) => l.tags))].sort();
    return { interactionChips: interactions.filter((i) => present.has(i)), tagChips: tags };
  }, [labs, interactions]);

  const shown = filter ? labs.filter((l) => l.interaction === filter || l.tags.includes(filter)) : labs;

  const chip = (name: string) => (
    <Button
      key={name}
      size="compact"
      className="rounded-full"
      variant={filter === name ? "primary" : "secondary"}
      aria-pressed={filter === name}
      onClick={() => setFilter(filter === name ? null : name)}
    >
      {name}
    </Button>
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2" role="group" aria-label="Filter labs">
        <Button size="compact" className="rounded-full" variant={filter === null ? "primary" : "secondary"} aria-pressed={filter === null} onClick={() => setFilter(null)}>
          All
        </Button>
        {interactionChips.map(chip)}
        {tagChips.length > 0 && <span aria-hidden className="mx-1 h-4 w-px bg-foreground/15" />}
        {tagChips.map(chip)}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((lab) => (
          <LabCard key={lab.slug} lab={lab} />
        ))}
      </div>
      {shown.length === 0 && <p className="py-20 text-center text-body text-muted-foreground">Nothing here yet.</p>}
    </>
  );
}
