"use client";

import { animate } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { CodePanelData } from "../data";
import { FitSlot, useLabHost } from "../live/host";
import type { Control, CursorStep } from "../types";
import { CodePanel } from "./code-panel";
import { Inspector } from "./inspector";
import { Poster } from "./poster";
import { useCursorScript } from "./use-cursor-script";
import { Button } from "@/components/ui/button";
import { Tabs, TabsItem } from "@/components/ui/tabs";
import { useIcons } from "@/lib/icon-context";

export interface LabDetailData {
  slug: string;
  title: string;
  description: string;
  kind: "react" | "video";
  interaction: string;
  tags: string[];
  updatedAt: string;
  controls: Control[];
  cursor?: CursorStep[];
  video?: { src: string; poster?: string };
  link?: { href: string; label: string };
  poster: { dark?: string; light?: string };
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
}

type Mode = "overlay" | "page";

/** Overall speed of the open/close choreography: every duration and delay is multiplied by this. */
const PACE = 0.5;
const ms = (n: number) => Math.round(n * PACE);

const OPEN = { type: "spring", visualDuration: 0.52 * PACE, bounce: 0.1 } as const;
const CLOSE = { type: "spring", visualDuration: 0.42 * PACE, bounce: 0 } as const;
const PEER_FLAG = "__labPeerNav";

const circle =
  "grid size-9 shrink-0 place-items-center rounded-full bg-inset-2 text-foreground outline-none transition-colors hover:bg-inset-2/70 focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring)]";

/** The stage area of the lab's gallery/teaser card, if on screen. Where the morph starts and ends. */
function originOf(slug: string): { rect: DOMRect; radius: string } | null {
  const el = document.querySelector<HTMLElement>(`[data-lab-card="${slug}"]`);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.bottom < 0 || rect.top > window.innerHeight) return null;
  return { rect, radius: getComputedStyle(el).borderTopLeftRadius };
}

/**
 * The lab detail view, as an overlay on top of the (still mounted) page that
 * opened it, or as a plain page on a direct load.
 *
 * The stage ("block") is a real box. On open it starts exactly on the card and
 * animates its position and size to the stage; the live demo inside it is the
 * very same instance the card was showing (see live/host.tsx). The extra
 * chrome fades in afterwards. Closing runs it in reverse.
 */
export function LabDetail(props: { lab: LabDetailData; code: CodePanelData; mode: Mode }) {
  // With Cache Components, Next keeps a closed route's UI alive (hidden) so it can be
  // restored on back/forward. A freshly opened overlay must start clean, not as the
  // "closing" one from last time, so key it on the navigation (docs: bfcacheId).
  const { bfcacheId } = useRouter();
  return <LabDetailView key={bfcacheId} {...props} />;
}

function LabDetailView({ lab, code, mode }: { lab: LabDetailData; code: CodePanelData; mode: Mode }) {
  const overlay = mode === "overlay";
  const router = useRouter();
  const host = useLabHost();
  const icons = useIcons();
  const { "arrow-left": ArrowLeft, play: Play, pause: Pause, link: LinkIcon, check: Check, "panel-right": PanelRight, "rotate-ccw": Rotate } = icons;

  const values = host.values[lab.slug] ?? {};
  const hasControls = lab.controls.length > 0;

  const [tab, setTab] = useState(0);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [shown, setShown] = useState(!overlay);
  const [copied, setCopied] = useState<"prompt" | "link" | null>(null);

  const shellRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const snapshot = useRef<Record<string, string | number | boolean> | null>(null);
  const closing = useRef(false);

  // Share links: apply ?v= once, on the first render of a direct load.
  useLayoutEffect(() => {
    const v = new URLSearchParams(window.location.search).get("v");
    if (!v) return;
    try {
      host.setValues(lab.slug, JSON.parse(v));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Open: start on the card, grow into the stage.
  useLayoutEffect(() => {
    if (!overlay) return;
    const block = blockRef.current;
    const shell = shellRef.current;
    if (!block || !shell) return;

    // Also runs when Next re-reveals a hidden overlay (back/forward): start fresh.
    closing.current = false;
    block.style.left = block.style.top = block.style.width = block.style.height = block.style.borderRadius = "";
    const w = window as unknown as Record<string, boolean>;
    const peer = w[PEER_FLAG];
    w[PEER_FLAG] = false;
    const origin = peer ? null : originOf(lab.slug);

    const raf = requestAnimationFrame(() => setShown(true));
    if (!origin) {
      block.style.visibility = "visible";
      return () => cancelAnimationFrame(raf);
    }

    const s = shell.getBoundingClientRect();
    Object.assign(block.style, {
      left: `${origin.rect.left - s.left}px`,
      top: `${origin.rect.top - s.top}px`,
      width: `${origin.rect.width}px`,
      height: `${origin.rect.height}px`,
      borderRadius: origin.radius,
      visibility: "visible",
    });
    const run = animate(block, { left: 0, top: 0, width: s.width, height: s.height, borderRadius: "32px" }, OPEN);
    // Once settled, hand sizing back to CSS so the stage follows resizes.
    run.then(() => {
      block.style.left = block.style.top = block.style.width = block.style.height = block.style.borderRadius = "";
    });
    return () => {
      cancelAnimationFrame(raf);
      run.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = useCallback(async () => {
    if (!overlay || closing.current) return;
    closing.current = true;
    setShown(false);
    const block = blockRef.current;
    const shell = shellRef.current;
    const origin = originOf(lab.slug);
    if (block && shell && origin) {
      const s = shell.getBoundingClientRect();
      const b = block.getBoundingClientRect();
      Object.assign(block.style, {
        left: `${b.left - s.left}px`,
        top: `${b.top - s.top}px`,
        width: `${b.width}px`,
        height: `${b.height}px`,
        borderRadius: "32px",
      });
      await animate(
        block,
        {
          left: origin.rect.left - s.left,
          top: origin.rect.top - s.top,
          width: origin.rect.width,
          height: origin.rect.height,
          borderRadius: origin.radius,
        },
        CLOSE,
      );
    } else {
      await new Promise((r) => setTimeout(r, ms(220)));
    }
    router.back();
  }, [overlay, lab.slug, router]);

  // Esc closes; the page behind doesn't scroll while the overlay is open.
  useEffect(() => {
    if (!overlay) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && void close();
    window.addEventListener("keydown", onKey);
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      html.style.overflow = prev;
    };
  }, [overlay, close]);

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
    snapshot.current = values;
    void script.run();
  };

  const flash = (what: "prompt" | "link") => {
    setCopied(what);
    setTimeout(() => setCopied((c) => (c === what ? null : c)), 1600);
  };

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(code.prompt).catch(() => {});
    flash("prompt");
  };

  const copyLink = async () => {
    const defaults = host.defaults(lab.slug);
    const changed = Object.fromEntries(Object.entries(values).filter(([k, v]) => v !== defaults[k]));
    const url = new URL(`/labs/${lab.slug}`, window.location.origin);
    if (Object.keys(changed).length) url.searchParams.set("v", JSON.stringify(changed));
    await navigator.clipboard.writeText(url.toString()).catch(() => {});
    flash("link");
  };

  const markPeer = () => {
    (window as unknown as Record<string, boolean>)[PEER_FLAG] = true;
  };

  const showInspector = hasControls && tab === 0 && inspectorOpen;
  const ins = showInspector && shown ? "288px" : "0px";

  // Chrome fades in after the block has started moving, and out first on close.
  const fade = (delay: number): CSSProperties => ({
    opacity: shown ? 1 : 0,
    transition: `opacity ${ms(220)}ms ease-out ${shown ? ms(delay) : 0}ms`,
  });

  const inspector = (
    <Inspector
      title={lab.title}
      controls={lab.controls}
      values={values}
      onChange={(k, v) => host.setValue(lab.slug, k, v)}
      onReset={() => host.reset(lab.slug)}
      onRandomize={() => host.randomize(lab.slug)}
      onClose={() => setInspectorOpen(false)}
    />
  );

  return (
    <div
      role={overlay ? "dialog" : undefined}
      aria-modal={overlay ? true : undefined}
      aria-label={overlay ? lab.title : undefined}
      className={overlay ? "fixed inset-0 z-50 overflow-y-auto overflow-x-hidden overscroll-contain" : "relative"}
    >
      {overlay && (
        <button
          type="button"
          aria-label="Close"
          tabIndex={-1}
          onClick={() => void close()}
          className="fixed inset-0 cursor-default bg-background/80 backdrop-blur-sm"
          style={{ opacity: shown ? 1 : 0, transition: `opacity ${ms(shown ? 300 : 260)}ms ease-out` }}
        />
      )}

      <div className={`relative mx-auto w-full max-w-[1200px] px-4 pb-24 sm:px-6 ${overlay ? "pointer-events-none pt-16" : ""}`}>
        {/* Shell: where the stage ends up. The block animates between the card and this box. */}
        <div
          ref={shellRef}
          className="pointer-events-auto relative h-[26rem] lg:h-[36rem]"
          style={{ "--ins": ins } as CSSProperties}
        >
          <div
            ref={blockRef}
            className="absolute inset-0 overflow-hidden rounded-[2rem] bg-stage"
            style={overlay ? { visibility: "hidden" } : undefined}
          >
            {/* Preview: the lab's one live instance, or its recording. */}
            <div
              className={`absolute inset-0 transition-[right] duration-150 ease-out lg:right-[var(--ins,0px)] ${tab === 1 ? "invisible" : ""}`}
              aria-hidden={tab === 1}
            >
              {lab.kind === "react" ? (
                <FitSlot slug={lab.slug} slotRef={slotRef} padding={28} className="absolute inset-0">
                  <Poster poster={lab.poster} />
                  {script.overlay}
                </FitSlot>
              ) : (
                <div ref={slotRef} className="absolute inset-0 grid place-items-center p-6 pt-16">
                  {lab.video && (
                    <video
                      key={lab.video.src}
                      src={lab.video.src}
                      poster={lab.video.poster}
                      className="max-h-full max-w-full rounded-3xl bg-black object-contain"
                      controls
                      playsInline
                      loop
                      muted
                      autoPlay
                    />
                  )}
                </div>
              )}
            </div>

            <div className="absolute inset-x-3 top-3 z-10 flex items-center gap-2" style={fade(160)}>
              {overlay ? (
                <button type="button" aria-label="Back to labs" className={circle} onClick={() => void close()}>
                  <ArrowLeft className="size-4" />
                </button>
              ) : (
                <Link href="/labs" aria-label="Back to labs" className={circle}>
                  <ArrowLeft className="size-4" />
                </Link>
              )}
              {code.files.length > 0 && (
                <Tabs selectedIndex={tab} onSelect={setTab} idPrefix="lab-mode" aria-label="View" className="rounded-full bg-inset-2">
                  <TabsItem index={0} label="Preview" />
                  <TabsItem index={1} label="Code" />
                </Tabs>
              )}
              <div className="ml-auto flex items-center gap-2">
                {tab === 1 ? (
                  <Button variant="primary" className="rounded-full" onClick={copyPrompt}>
                    {copied === "prompt" ? "Copied" : "Copy prompt"}
                  </Button>
                ) : (
                  <span className={`hidden h-9 items-center rounded-full bg-inset-2 px-4 text-body sm:inline-flex ${showInspector ? "lg:hidden" : ""}`}>{lab.title}</span>
                )}
                {hasControls && !showInspector && tab === 0 && (
                  <button type="button" aria-label="Show inspector" className={circle} onClick={() => setInspectorOpen(true)}>
                    <PanelRight className="size-4" />
                  </button>
                )}
              </div>
            </div>

            {tab === 0 && (
              <div className="absolute bottom-3 right-3 z-10 flex gap-2 transition-[right] duration-150 ease-out lg:right-[calc(var(--ins,0px)+0.75rem)]" style={fade(200)}>
                {lab.kind === "react" && lab.cursor?.length ? (
                  <button type="button" aria-label={script.running ? "Stop demo" : "Play demo"} className={circle} onClick={togglePlay}>
                    {script.running ? <Pause className="size-4" /> : <Play className="size-4" />}
                  </button>
                ) : null}
                <button type="button" aria-label="Copy link" className={circle} onClick={copyLink}>
                  {copied === "link" ? <Check className="size-4" /> : <LinkIcon className="size-4" />}
                </button>
                {hasControls && (
                  <button type="button" aria-label="Reset values" className={circle} onClick={() => host.reset(lab.slug)}>
                    <Rotate className="size-4" />
                  </button>
                )}
              </div>
            )}

            {tab === 1 && (
              <div className="absolute inset-x-3 bottom-3 top-16 z-10 overflow-y-auto" style={fade(120)}>
                <CodePanel code={code} />
              </div>
            )}
          </div>

          {/* Inspector, desktop: inside the stage, on the right. */}
          {showInspector && (
            <aside
              className="absolute bottom-3 right-3 top-3 z-20 hidden w-[272px] lg:block"
              style={{
                opacity: shown ? 1 : 0,
                filter: shown ? "blur(0)" : "blur(8px)",
                transition: `opacity ${ms(300)}ms ease-out ${shown ? ms(260) : 0}ms, filter ${ms(300)}ms ease-out ${shown ? ms(260) : 0}ms`,
              }}
            >
              {inspector}
            </aside>
          )}
        </div>

        {/* Inspector, mobile: its own card under the stage. */}
        {showInspector && (
          <aside className="pointer-events-auto mt-3 rounded-[2rem] bg-stage lg:hidden" style={fade(260)}>
            {inspector}
          </aside>
        )}

        <section
          className="pointer-events-auto mt-3 rounded-[2rem] bg-stage p-3"
          style={{
            opacity: shown ? 1 : 0,
            transform: shown ? "none" : "translateY(16px)",
            transition: `opacity ${ms(260)}ms ease-out ${shown ? ms(300) : 0}ms, transform ${ms(360)}ms cubic-bezier(0.22,1,0.36,1) ${shown ? ms(300) : 0}ms`,
          }}
        >
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

        {(lab.prev || lab.next) && (
          <nav aria-label="More labs" className="pointer-events-auto mt-3 grid grid-cols-2 gap-3" style={fade(340)}>
            {lab.prev ? (
              <Link
                href={`/labs/${lab.prev.slug}`}
                replace={overlay}
                scroll={false}
                onClick={markPeer}
                className="rounded-full bg-stage px-5 py-3 text-body outline-none transition-colors hover:bg-inset-2 focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring)]"
              >
                <span className="text-muted-foreground">← </span>
                {lab.prev.title}
              </Link>
            ) : (
              <span />
            )}
            {lab.next ? (
              <Link
                href={`/labs/${lab.next.slug}`}
                replace={overlay}
                scroll={false}
                onClick={markPeer}
                className="rounded-full bg-stage px-5 py-3 text-right text-body outline-none transition-colors hover:bg-inset-2 focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring)]"
              >
                {lab.next.title}
                <span className="text-muted-foreground"> →</span>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
