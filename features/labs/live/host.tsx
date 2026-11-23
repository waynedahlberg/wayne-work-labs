"use client";

import {
  Suspense,
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { DemoBoundary } from "../components/demo-boundary";
import { DemoSlot, preloadDemo } from "../demo-cache";
import { defaultValues, randomValues } from "../define";
import type { Control, LabValues } from "../types";

/**
 * One live instance per lab.
 *
 * A lab's demo is rendered exactly once, into a host element that lives
 * outside any card or stage. Cards and the detail stage each own a "slot";
 * whichever slot claimed the host last gets the element appended into it.
 * Opening a lab moves the same DOM node (and the same React state) from the
 * card into the stage; closing moves it back. Nothing is duplicated, swapped
 * or re-created, so the transition is continuous by construction.
 */

interface Claim {
  slot: HTMLElement;
  fit: () => void;
}

interface Entry {
  el: HTMLDivElement;
  refs: number;
  claims: Claim[];
}

interface Active {
  slug: string;
  el: HTMLDivElement;
}

interface LabHost {
  values: Record<string, LabValues>;
  setValue: (slug: string, key: string, value: LabValues[string]) => void;
  setValues: (slug: string, values: LabValues) => void;
  reset: (slug: string) => void;
  randomize: (slug: string) => void;
  defaults: (slug: string) => LabValues;
  entry: (slug: string) => Entry | undefined;
  acquire: (slug: string) => void;
  release: (slug: string) => void;
  claim: (slug: string, claim: Claim) => void;
  unclaim: (slug: string, slot: HTMLElement) => void;
}

const HostContext = createContext<LabHost | null>(null);

export function useLabHost(): LabHost {
  const host = useContext(HostContext);
  if (!host) throw new Error("useLabHost must be used inside <LabHostProvider>");
  return host;
}

export function LabHostProvider({
  labs,
  children,
}: {
  labs: { slug: string; controls: Control[] }[];
  children: ReactNode;
}) {
  const controls = useMemo(() => Object.fromEntries(labs.map((l) => [l.slug, l.controls])), [labs]);
  const [values, setAll] = useState<Record<string, LabValues>>(() =>
    Object.fromEntries(labs.map((l) => [l.slug, defaultValues(l.controls)])),
  );
  const [active, setActive] = useState<Active[]>([]);
  const entries = useRef(new Map<string, Entry>());

  const api = useMemo<LabHost>(
    () => ({
      values,
      setValue: (slug, key, value) => setAll((v) => ({ ...v, [slug]: { ...v[slug], [key]: value } })),
      setValues: (slug, next) => setAll((v) => ({ ...v, [slug]: { ...v[slug], ...next } })),
      reset: (slug) => setAll((v) => ({ ...v, [slug]: defaultValues(controls[slug]) })),
      randomize: (slug) => setAll((v) => ({ ...v, [slug]: randomValues(controls[slug]) })),
      defaults: (slug) => defaultValues(controls[slug]),
      entry: (slug) => entries.current.get(slug),

      acquire: (slug) => {
        let entry = entries.current.get(slug);
        if (!entry) {
          const el = document.createElement("div");
          el.className = "lab-host";
          el.dataset.labHost = slug;
          entry = { el, refs: 0, claims: [] };
          entries.current.set(slug, entry);
          setActive((a) => [...a, { slug, el }]);
          void preloadDemo(slug);
        }
        entry.refs++;
      },

      release: (slug) => {
        const entry = entries.current.get(slug);
        if (!entry) return;
        entry.refs--;
        if (entry.refs > 0) return;
        entries.current.delete(slug);
        entry.el.remove();
        setActive((a) => a.filter((x) => x.slug !== slug));
      },

      claim: (slug, claim) => {
        const entry = entries.current.get(slug);
        if (!entry) return;
        entry.claims.push(claim);
        claim.slot.appendChild(entry.el);
        claim.fit();
      },

      unclaim: (slug, slot) => {
        const entry = entries.current.get(slug);
        if (!entry) return;
        entry.claims = entry.claims.filter((c) => c.slot !== slot);
        const next = entry.claims.at(-1);
        if (next) {
          next.slot.appendChild(entry.el);
          next.fit();
        } else if (entry.el.parentElement === slot) {
          entry.el.remove();
        }
      },
    }),
    [values, controls],
  );

  return (
    <HostContext.Provider value={api}>
      {children}
      {active.map(({ slug, el }) =>
        createPortal(
          <DemoBoundary slug={slug}>
            <Suspense fallback={null}>
              <DemoSlot slug={slug} values={values[slug] ?? {}} />
              <Ready el={el} />
            </Suspense>
          </DemoBoundary>,
          el,
          slug,
        ),
      )}
    </HostContext.Provider>
  );
}

/** Marks the host once the demo has actually rendered, so a poster can fade out. */
function Ready({ el }: { el: HTMLElement }) {
  useLayoutEffect(() => {
    el.setAttribute("data-ready", "1");
    return () => el.removeAttribute("data-ready");
  }, [el]);
  return null;
}

/**
 * A place the live demo can live. Renders an empty, clipped box; when
 * `active`, claims the lab's host element and keeps it scaled to fit.
 * Children (a poster, a cursor overlay) render underneath/over the host.
 */
export function FitSlot({
  slug,
  slotRef,
  active = true,
  padding = 16,
  className = "",
  children,
}: {
  slug: string;
  slotRef: RefObject<HTMLDivElement | null>;
  active?: boolean;
  padding?: number;
  className?: string;
  children?: ReactNode;
}) {
  const host = useLabHost();

  useLayoutEffect(() => {
    if (!active) return;
    const slot = slotRef.current;
    if (!slot) return;
    host.acquire(slug);
    const entry = host.entry(slug);
    if (!entry) return;

    const fit = () => {
      if (entry.el.parentElement !== slot) return; // another slot owns it right now
      const nw = entry.el.offsetWidth;
      const nh = entry.el.offsetHeight;
      const w = slot.clientWidth - padding * 2;
      const h = slot.clientHeight - padding * 2;
      if (!nw || !nh || w <= 0 || h <= 0) return;
      entry.el.style.setProperty("--fit", String(Math.min(1, w / nw, h / nh)));
    };

    host.claim(slug, { slot, fit });
    const ro = new ResizeObserver(fit);
    ro.observe(slot);
    ro.observe(entry.el);
    return () => {
      ro.disconnect();
      host.unclaim(slug, slot);
      host.release(slug);
    };
    // `host` changes identity with every value edit; the claim must not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, slug, padding]);

  return (
    <div ref={slotRef} data-lab-slot={slug} className={`overflow-hidden ${className || "relative"}`}>
      {children}
    </div>
  );
}
