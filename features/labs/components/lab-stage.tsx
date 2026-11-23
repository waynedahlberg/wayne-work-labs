"use client";

import Link from "next/link";
import { Suspense, ViewTransition, useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { CodePanelData } from "../data";
import { defaultValues, randomValues } from "../define";
import { demos } from "../demos.generated";
import type { Control, CursorStep, LabValues } from "../types";
import { CodePanel } from "./code-panel";
import { Inspector } from "./inspector";
import { useCursorScript } from "./use-cursor-script";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsItem } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { useIcons } from "@/lib/icon-context";

interface LabStageProps {
  slug: string;
  title: string;
  kind: "react" | "video";
  controls: Control[];
  cursor?: CursorStep[];
  video?: { src: string; poster?: string };
  code: CodePanelData;
}

const subscribeNone = () => () => {};

const circle =
  "grid size-9 shrink-0 place-items-center rounded-full bg-inset-2 text-foreground outline-none transition-colors hover:bg-inset-2/70 focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring)]";

export function LabStage({ slug, title, kind, controls, cursor, video, code }: LabStageProps) {
  const icons = useIcons();
  const { "arrow-left": ArrowLeft, play: Play, pause: Pause, link: LinkIcon, check: Check, "panel-right": PanelRight, "rotate-ccw": Rotate } = icons;

  const defaults = useMemo(() => defaultValues(controls), [controls]);
  // Shared state arrives in ?v=; user edits layer on top of defaults + URL.
  const search = useSyncExternalStore(subscribeNone, () => window.location.search, () => "");
  const fromUrl = useMemo(() => {
    try {
      const v = new URLSearchParams(search).get("v");
      return v ? (JSON.parse(v) as LabValues) : {};
    } catch {
      return {};
    }
  }, [search]);
  const [edits, setEdits] = useState<LabValues>({});
  const values = useMemo<LabValues>(() => ({ ...defaults, ...fromUrl, ...edits }), [defaults, fromUrl, edits]);
  const [mode, setMode] = useState(0);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [copied, setCopied] = useState<"prompt" | "link" | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const snapshot = useRef<LabValues | null>(null);
  const hasControls = controls.length > 0;
  const Demo = demos[slug];

  const setValue = useCallback((key: string, value: LabValues[string]) => setEdits((v) => ({ ...v, [key]: value })), []);

  const script = useCursorScript({
    steps: cursor,
    container: previewRef,
    onSet: setValue,
    onFinish: () => {
      if (snapshot.current) setEdits(snapshot.current);
      snapshot.current = null;
    },
  });

  const togglePlay = () => {
    if (script.running) {
      script.stop();
      if (snapshot.current) setEdits(snapshot.current);
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
    const url = new URL(window.location.href);
    const changed = Object.fromEntries(Object.entries(values).filter(([k, v]) => v !== defaults[k]));
    if (Object.keys(changed).length) url.searchParams.set("v", JSON.stringify(changed));
    else url.searchParams.delete("v");
    await navigator.clipboard.writeText(url.toString()).catch(() => {});
    flash("link");
  };

  const showInspector = hasControls && inspectorOpen && mode === 0;

  return (
    <div className={`grid grid-cols-[minmax(0,1fr)] gap-3 lg:rounded-[2rem] lg:bg-stage ${showInspector ? "lg:grid-cols-[minmax(0,1fr)_288px]" : ""}`}>
      <section className="flex min-h-[26rem] min-w-0 flex-col rounded-[2rem] bg-stage p-3 lg:min-h-[35rem] lg:bg-transparent">
        <div className="flex items-center gap-2">
          <Tooltip content="All labs" side="bottom">
            <Link href="/labs" transitionTypes={["nav-back"]} aria-label="Back to labs" className={circle}>
              <ArrowLeft className="size-4" />
            </Link>
          </Tooltip>
          <Tabs selectedIndex={mode} onSelect={setMode} idPrefix="lab-mode" aria-label="View" className="rounded-full bg-inset-2">
            <TabsItem index={0} label="Preview" />
            <TabsItem index={1} label="Code" />
          </Tabs>
          <div className="ml-auto flex items-center gap-2">
            {mode === 1 ? (
              <Button variant="primary" className="rounded-full" onClick={copyPrompt}>
                {copied === "prompt" ? "Copied" : "Copy prompt"}
              </Button>
            ) : (
              <span className="hidden h-9 items-center rounded-full bg-inset-2 px-4 text-body sm:inline-flex">{title}</span>
            )}
            {hasControls && !showInspector && mode === 0 && (
              <Tooltip content="Show inspector" side="bottom">
                <button type="button" aria-label="Show inspector" className={circle} onClick={() => setInspectorOpen(true)}>
                  <PanelRight className="size-4" />
                </button>
              </Tooltip>
            )}
          </div>
        </div>

        {mode === 0 ? (
          <div ref={previewRef} className="relative mt-2 flex flex-1 items-center justify-center overflow-hidden rounded-[1.5rem]">
            <ViewTransition name={`lab-${slug}`} share="lab-morph" default="none">
              <div className="flex w-full items-center justify-center p-6 sm:p-10">
                {kind === "video" && video ? (
                  <video
                    src={video.src}
                    poster={video.poster}
                    className="max-h-[32rem] w-full rounded-[1.5rem] bg-black object-contain"
                    controls
                    playsInline
                    loop
                    muted
                    autoPlay
                  />
                ) : Demo ? (
                  <Suspense fallback={<Skeleton className="h-40 w-64 rounded-3xl" />}>
                    <Demo values={values} />
                  </Suspense>
                ) : null}
              </div>
            </ViewTransition>
            {script.overlay}

            <div className="absolute bottom-3 right-3 z-10 flex gap-2">
              {cursor?.length ? (
                <Tooltip content={script.running ? "Stop" : "Play demo"} side="top">
                  <button type="button" aria-label={script.running ? "Stop demo" : "Play demo"} className={circle} onClick={togglePlay}>
                    {script.running ? <Pause className="size-4" /> : <Play className="size-4" />}
                  </button>
                </Tooltip>
              ) : null}
              <Tooltip content={copied === "link" ? "Copied" : "Copy link"} side="top">
                <button type="button" aria-label="Copy link" className={circle} onClick={copyLink}>
                  {copied === "link" ? <Check className="size-4" /> : <LinkIcon className="size-4" />}
                </button>
              </Tooltip>
              {hasControls && (
                <Tooltip content="Reset" side="top">
                  <button type="button" aria-label="Reset values" className={circle} onClick={() => setEdits(defaults)}>
                    <Rotate className="size-4" />
                  </button>
                </Tooltip>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-2 min-w-0 flex-1">
            <CodePanel code={code} />
          </div>
        )}
      </section>

      {showInspector && (
        <aside className="rounded-[2rem] bg-stage lg:rounded-none lg:bg-transparent">
          <Inspector
            title={title}
            controls={controls}
            values={values}
            onChange={setValue}
            onReset={() => setEdits(defaults)}
            onRandomize={() => setEdits(randomValues(controls))}
            onClose={() => setInspectorOpen(false)}
          />
        </aside>
      )}
    </div>
  );
}
