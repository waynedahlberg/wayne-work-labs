"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { defaultValues } from "../define";
import { DemoSlot } from "../demo-cache";
import type { Control, CursorStep } from "../types";
import { DemoBoundary } from "./demo-boundary";
import { useCursorScript } from "./use-cursor-script";

/**
 * Bare demo on a stage-colored page. Used by `pnpm labs:capture` to record
 * thumbnails and hover videos; `?autoplay=1` runs the cursor script and sets
 * `window.__labDone` when it ends.
 */
function Inner({ slug, controls, cursor }: { slug: string; controls: Control[]; cursor?: CursorStep[] }) {
  const params = useSearchParams();
  const ref = useRef<HTMLDivElement>(null);
  const values = defaultValues(controls);
  const script = useCursorScript({
    steps: cursor,
    container: ref,
    onSet: () => {},
    onFinish: () => {
      (window as unknown as { __labDone?: boolean }).__labDone = true;
    },
  });

  const autoplay = params.get("autoplay") === "1";
  const stopAt = params.get("stopAt");
  const scale = Number(params.get("scale") ?? 1) || 1;
  useEffect(() => {
    const w = window as unknown as { __labReady?: boolean; __labRun?: () => void };
    w.__labReady = true;
    // Capture hook: `pnpm labs:capture` starts recording first, then calls this.
    w.__labRun = () => {
      (window as unknown as { __labDone?: boolean }).__labDone = false;
      void script.run();
    };
    if ((autoplay || stopAt !== null) && cursor?.length) {
      const t = setTimeout(() => void script.run(stopAt !== null ? Number(stopAt) : undefined), 700);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, stopAt]);

  return (
    <div ref={ref} className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-stage p-6">
      <div style={{ transform: `scale(${scale})` }}><DemoBoundary slug={slug}><Suspense><DemoSlot slug={slug} values={values} /></Suspense></DemoBoundary></div>
      {script.overlay}
    </div>
  );
}

export function LabEmbed(props: { slug: string; controls: Control[]; cursor?: CursorStep[] }) {
  return (
    <Suspense>
      <Inner {...props} />
    </Suspense>
  );
}
