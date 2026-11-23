"use client";

import { createElement, use, type ComponentType, type ReactElement } from "react";
import { demoLoaders } from "./demos.generated";
import type { DemoProps, LabValues } from "./types";

type DemoPromise = Promise<ComponentType<DemoProps>> & {
  status?: "fulfilled";
  value?: ComponentType<DemoProps>;
};

const cache = new Map<string, DemoPromise>();

/**
 * Start loading a lab's demo chunk. Call it on hover/focus/pointer-down of a
 * card so the chunk is already there when the detail page renders.
 */
export function preloadDemo(slug: string): DemoPromise | undefined {
  const cached = cache.get(slug);
  if (cached) return cached;
  const load = demoLoaders[slug];
  if (!load) return undefined;
  const promise: DemoPromise = load().then((m) => {
    // React's `use` reads these fields, so a promise that has already
    // settled returns synchronously instead of suspending.
    promise.status = "fulfilled";
    promise.value = m.default;
    return m.default;
  });
  cache.set(slug, promise);
  return promise;
}

/**
 * Renders a lab's demo. The chunk is usually preloaded, so this returns on the
 * first render; it suspends only when the chunk is not loaded yet.
 */
export function DemoSlot({ slug, values }: { slug: string; values: LabValues }): ReactElement | null {
  const promise = preloadDemo(slug);
  if (!promise) return null;
  const Demo = use(promise as Promise<ComponentType<DemoProps>>);
  return createElement(Demo, { values });
}
