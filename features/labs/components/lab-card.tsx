"use client";

import Link from "next/link";
import { ViewTransition, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import type { LabAssets } from "../data";
import { preloadDemo } from "../demo-cache";
import { useIcons } from "@/lib/icon-context";

const subscribeNone = () => () => {};

export interface LabCardData {
  slug: string;
  title: string;
  interaction: string;
  isNew: boolean;
  hasCursor: boolean;
  assets: LabAssets;
}

/**
 * Gallery card. Shows a static thumbnail (never a live embed). Hovering, or
 * pressing the play button, plays the captured cursor run on top of it.
 */
export function LabCard({ lab }: { lab: LabCardData }) {
  const { play: Play, pause: Pause } = useIcons();
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribeNone, () => true, () => false);
  const [playing, setPlaying] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const root = useRef<HTMLDivElement>(null);

  // Warm the demo chunk once the card is on screen, so opening it never waits.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const idle = (cb: () => void) =>
      typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(cb) : setTimeout(cb, 200);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          idle(() => preloadDemo(lab.slug));
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [lab.slug]);

  const theme = mounted && resolvedTheme === "light" ? "light" : "dark";
  const hover = lab.assets.hover[theme] ?? lab.assets.hover.dark ?? lab.assets.hover.light;
  const hasThumb = lab.assets.thumb.dark || lab.assets.thumb.light;

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (playing) void v.play().catch(() => setPlaying(false));
    else {
      v.pause();
      v.currentTime = 0;
    }
  }, [playing, hover]);

  return (
    <ViewTransition name={`lab-${lab.slug}`} share="lab-morph" default="none">
    <div
      ref={root}
      className="group relative isolate rounded-[2rem] bg-stage p-2"
      onPointerDown={() => preloadDemo(lab.slug)}
      onFocus={() => preloadDemo(lab.slug)}
      onPointerEnter={(e) => {
        preloadDemo(lab.slug);
        if (e.pointerType === "mouse" && hover) setPlaying(true);
      }}
      onPointerLeave={(e) => e.pointerType === "mouse" && setPlaying(false)}
    >
      <Link
        href={`/labs/${lab.slug}`}
        // Resolve the detail page's params-dependent content before the click,
        // so the stage exists in the same commit and the shared-element morph can form.
        prefetch={true}
        transitionTypes={["lab-open"]}
        aria-label={lab.title}
        className="absolute inset-0 z-0 rounded-[2rem] outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring)]"
      />
      <div className="pointer-events-none relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-inset">
          {hasThumb ? (
            <>
              {lab.assets.thumb.dark && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={lab.assets.thumb.dark} alt="" className={`absolute inset-0 size-full object-cover ${lab.assets.thumb.light ? "hidden dark:block" : ""}`} loading="lazy" />
              )}
              {lab.assets.thumb.light && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={lab.assets.thumb.light} alt="" className={`absolute inset-0 size-full object-cover ${lab.assets.thumb.dark ? "dark:hidden" : ""}`} loading="lazy" />
              )}
            </>
          ) : (
            <div className="absolute inset-0 grid place-items-center text-body text-muted-foreground">No preview yet</div>
          )}
          {hover && (
            <video
              ref={video}
              src={playing ? hover : undefined}
              muted
              loop
              playsInline
              preload="none"
              width={960}
              height={720}
              disablePictureInPicture
              disableRemotePlayback
              poster={lab.assets.thumb[theme] ?? lab.assets.thumb.dark ?? lab.assets.thumb.light}
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
              className={`absolute inset-0 size-full object-cover transition-opacity duration-200 ${playing ? "opacity-100" : "opacity-0"}`}
            />
          )}
        </div>

      <div className="pointer-events-none absolute left-5 top-5 flex gap-2">
        {lab.isNew && <span className="rounded-full bg-inset-2 px-2.5 py-1 text-caption">New</span>}
      </div>

      <div className="flex items-center justify-between gap-2 px-3 pb-2 pt-3">
        <div className="pointer-events-none min-w-0">
          <p className="truncate text-body font-semibold tracking-tight">{lab.title}</p>
          <p className="text-caption text-muted-foreground">{lab.interaction}</p>
        </div>
        {hover && (
          <button
            type="button"
            aria-label={playing ? `Pause ${lab.title} preview` : `Play ${lab.title} preview`}
            onClick={() => setPlaying((p) => !p)}
            className="relative z-10 grid size-9 shrink-0 place-items-center rounded-full bg-inset-2 outline-none transition-colors hover:bg-inset-2/70 focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring)]"
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
        )}
      </div>
    </div>
    </ViewTransition>
  );
}
