"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FitSlot, useLabHost } from "../live/host";
import type { CursorStep } from "../types";
import { Poster } from "./poster";
import { useCursorScript } from "./use-cursor-script";
import { useIcons } from "@/lib/icon-context";

export interface LabCardData {
  slug: string;
  title: string;
  interaction: string;
  kind: "react" | "video";
  isNew: boolean;
  cursor?: CursorStep[];
  video?: { src: string; poster?: string };
  /** Stills captured by `pnpm labs:capture`: the loading placeholder. */
  poster: { dark?: string; light?: string };
}

/** Things inside a card that handle their own clicks; everything else opens the lab. */
const INTERACTIVE =
  'a, button, input, textarea, select, label, summary, [role="button"], [role="slider"], [role="option"], [role="listbox"], [role="textbox"], [contenteditable="true"], [data-no-open]';

/**
 * Gallery card. A react lab shows its real, interactive demo (lazy: it mounts
 * when the card nears the viewport). A video lab shows its recording. The
 * stage area is also the origin rectangle of the detail overlay's morph.
 *
 * Clicking anywhere that is not itself interactive (empty stage area, the title
 * row, the padding) opens the lab; the demo's own controls keep their clicks.
 */
export function LabCard({ lab }: { lab: LabCardData }) {
  const { play: Play, pause: Pause } = useIcons();
  const host = useLabHost();
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const snapshot = useRef<Record<string, string | number | boolean> | null>(null);
  const downAt = useRef<{ x: number; y: number } | null>(null);
  const [near, setNear] = useState(false);

  // Lazy: nothing mounts until the card is about to scroll into view.
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const script = useCursorScript({
    steps: lab.cursor,
    container: slotRef,
    onSet: (key, value) => host.setValue(lab.slug, key, value),
    onFinish: () => {
      if (snapshot.current) host.setValues(lab.slug, snapshot.current);
      snapshot.current = null;
    },
  });

  const togglePlay = () => {
    if (script.running) {
      script.stop();
      if (snapshot.current) host.setValues(lab.slug, snapshot.current);
      snapshot.current = null;
      return;
    }
    snapshot.current = host.values[lab.slug] ?? {};
    void script.run();
  };

  const href = `/labs/${lab.slug}`;

  // Open on a click that lands on nothing interactive and wasn't the end of a drag.
  const openFromCard = (e: React.MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0) return;
    if ((e.target as HTMLElement).closest(INTERACTIVE)) return;
    const d = downAt.current;
    if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey) {
      window.open(href, "_blank");
      return;
    }
    router.push(href, { scroll: false });
  };

  return (
    <div
      ref={cardRef}
      // cursor-pointer also makes Safari (especially iOS) deliver clicks on non-interactive elements.
      className="group relative isolate cursor-pointer rounded-[2rem] bg-stage p-2"
      onPointerDown={(e) => {
        downAt.current = { x: e.clientX, y: e.clientY };
      }}
      onClick={openFromCard}
    >
      {/* The stage area: where the live demo (or the recording) runs, and where the morph starts. */}
      <div data-lab-card={lab.slug} className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-stage">
        {lab.kind === "react" ? (
          <FitSlot slug={lab.slug} slotRef={slotRef} active={near} padding={20} className="absolute inset-0">
            <Poster poster={lab.poster} />
            {script.overlay}
          </FitSlot>
        ) : (
          <CardVideo video={lab.video} poster={lab.poster} title={lab.title} />
        )}
        {lab.isNew && (
          <span className="pointer-events-none absolute left-3 top-3 z-[2] rounded-full bg-inset-2 px-2.5 py-1 text-caption">New</span>
        )}
      </div>

      <div className="flex select-none items-center justify-between gap-2 px-3 pb-2 pt-3">
        <div className="min-w-0">
          <Link
            href={href}
            prefetch
            scroll={false}
            className="block truncate rounded-sm text-body font-semibold tracking-tight outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring)]"
          >
            {lab.title}
          </Link>
          <p className="text-caption text-muted-foreground">{lab.interaction}</p>
        </div>
        {lab.kind === "react" && lab.cursor?.length ? (
          <button
            type="button"
            aria-label={script.running ? `Stop ${lab.title} demo` : `Play ${lab.title} demo`}
            onClick={togglePlay}
            className="grid size-9 shrink-0 place-items-center rounded-full bg-inset-2 outline-none transition-colors hover:bg-inset-2/70 focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring)]"
          >
            {script.running ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** A pre-recorded demo: loads when near, plays while visible. */
function CardVideo({ video, poster, title }: { video?: { src: string; poster?: string }; poster: LabCardData["poster"]; title: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting && entry.intersectionRatio > 0.35);
        if (entry.isIntersecting) setNear(true);
      },
      { threshold: [0, 0.35], rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Play only once the source is attached, and only while on screen.
  useEffect(() => {
    const el = ref.current;
    if (!el || !near) return;
    if (visible) void el.play().catch(() => {});
    else el.pause();
  }, [near, visible]);

  return (
    <>
      <div className="absolute inset-0">
        <Poster poster={poster} />
      </div>
      {video && (
        <video
          ref={ref}
          src={near ? video.src : undefined}
          poster={video.poster}
          muted
          loop
          playsInline
          preload="none"
          aria-label={title}
          className="absolute inset-0 size-full object-cover"
        />
      )}
    </>
  );
}
