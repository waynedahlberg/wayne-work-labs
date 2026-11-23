"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CursorStep, LabValues } from "../types";

interface CursorState {
  x: number;
  y: number;
  visible: boolean;
  down: boolean;
  ms: number;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function find(name: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-cursor="${name}"]`);
}

function fire(el: Element, types: string[], extra: Record<string, unknown> = {}) {
  const rect = el.getBoundingClientRect();
  const init = {
    bubbles: true,
    cancelable: true,
    composed: true,
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
    button: 0,
    pointerType: "mouse",
    pointerId: 1,
    isPrimary: true,
    ...extra,
  };
  for (const type of types) {
    const Ctor = type.startsWith("pointer") ? PointerEvent : MouseEvent;
    el.dispatchEvent(new Ctor(type, init));
  }
}

function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

/**
 * Runs a lab's `cursor` script: a fake pointer glides to `data-cursor`
 * targets and drives the real DOM with real events. The same script powers
 * the play button, the captured hover video and the thumbnail.
 *
 * `container` is the positioned element the cursor overlay is drawn in.
 */
export function useCursorScript({
  steps,
  container,
  onSet,
  onFinish,
}: {
  steps: CursorStep[] | undefined;
  container: React.RefObject<HTMLElement | null>;
  onSet: (key: string, value: LabValues[string]) => void;
  onFinish?: () => void;
}) {
  const [running, setRunning] = useState(false);
  const [cursor, setCursor] = useState<CursorState>({ x: 0, y: 0, visible: false, down: false, ms: 0 });
  const runId = useRef(0);
  const onSetRef = useRef(onSet);
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onSetRef.current = onSet;
    onFinishRef.current = onFinish;
  });

  const stop = useCallback(() => {
    runId.current++;
    setRunning(false);
    setCursor((c) => ({ ...c, visible: false, down: false }));
  }, []);

  useEffect(() => stop, [stop]);

  const run = useCallback(async (until?: number) => {
    if (!steps?.length) return;
    const id = ++runId.current;
    const alive = () => runId.current === id;
    setRunning(true);

    const toLocal = (el: HTMLElement) => {
      const c = container.current?.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2 - (c?.left ?? 0), y: r.top + r.height / 2 - (c?.top ?? 0) };
    };

    let current: HTMLElement | null = null;
    const moveTo = async (name: string, ms = 650) => {
      const el = find(name);
      if (!el || !alive()) return null;
      const { x, y } = toLocal(el);
      setCursor((c) => ({ ...c, x, y, ms, visible: true }));
      await sleep(ms);
      if (!alive()) return null;
      fire(el, ["pointerover", "pointerenter", "pointermove", "mouseover", "mouseenter", "mousemove"]);
      current = el;
      return el;
    };

    // Appear on the first target instead of sweeping in from a corner, so
    // the clip has no lateral travel before anything happens.
    const firstTarget = steps.find((st) => "to" in st && st.to) as { to: string } | undefined;
    const startEl = firstTarget ? find(firstTarget.to) : null;
    const box = container.current?.getBoundingClientRect();
    const start = startEl ? toLocal(startEl) : { x: (box?.width ?? 400) / 2, y: (box?.height ?? 300) / 2 };
    setCursor({ ...start, visible: false, down: false, ms: 0 });
    await sleep(60);
    setCursor((c) => ({ ...c, visible: true }));
    await sleep(250);

    for (const [index, step] of steps.entries()) {
      if (!alive()) return;
      switch (step.do) {
        case "move":
          await moveTo(step.to, step.ms);
          break;
        case "click":
        case "press": {
          const el = step.to ? await moveTo(step.to) : current;
          if (!el || !alive()) break;
          setCursor((c) => ({ ...c, down: true, ms: 0 }));
          fire(el, ["pointerdown", "mousedown"], { buttons: 1 });
          await sleep(step.do === "press" ? (step.hold ?? 600) : 110);
          if (!alive()) break;
          fire(el, ["pointerup", "mouseup"]);
          fire(el, ["click"]);
          setCursor((c) => ({ ...c, down: false }));
          await sleep(180);
          break;
        }
        case "type": {
          const el = (await moveTo(step.to)) as HTMLInputElement | HTMLTextAreaElement | null;
          if (!el || !alive()) break;
          fire(el, ["pointerdown", "mousedown"], { buttons: 1 });
          el.focus();
          fire(el, ["pointerup", "mouseup", "click"]);
          let text = "";
          for (const ch of step.text) {
            if (!alive()) break;
            text += ch;
            setNativeValue(el, text);
            await sleep(step.ms ?? 70);
          }
          break;
        }
        case "drag": {
          const el = step.to ? await moveTo(step.to) : current;
          if (!el || !alive()) break;
          const r = el.getBoundingClientRect();
          const x0 = r.left + r.width / 2;
          const y0 = r.top + r.height / 2;
          const base = toLocal(el);
          const dy = step.dy ?? 0;
          setCursor((c) => ({ ...c, down: true, ms: 0 }));
          fire(el, ["pointerdown", "mousedown"], { buttons: 1, clientX: x0, clientY: y0 });
          const frames = Math.max(2, Math.round((step.ms ?? 800) / 16));
          for (let i = 1; i <= frames && alive(); i++) {
            const t = i / frames;
            const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // easeInOutCubic
            setCursor((c) => ({ ...c, x: base.x + step.dx * e, y: base.y + dy * e, ms: 0 }));
            fire(el, ["pointermove", "mousemove"], { buttons: 1, clientX: x0 + step.dx * e, clientY: y0 + dy * e });
            await sleep(16);
          }
          fire(el, ["pointerup", "mouseup"], { clientX: x0 + step.dx, clientY: y0 + dy });
          setCursor((c) => ({ ...c, down: false }));
          await sleep(120);
          break;
        }
        case "wait":
          await sleep(step.ms);
          break;
        case "set":
          onSetRef.current(step.key, step.value);
          await sleep(120);
          break;
      }
      // Capture mode: stop after this step and leave the cursor where it is.
      if (until !== undefined && index >= until) {
        setRunning(false);
        onFinishRef.current?.();
        return;
      }
    }

    if (!alive()) return;
    await sleep(500);
    if (!alive()) return;
    setCursor((c) => ({ ...c, visible: false }));
    setRunning(false);
    onFinishRef.current?.();
  }, [steps, container]);

  const overlay = (
    <div
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 z-[60] will-change-transform"
      style={{
        transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)`,
        transition: cursor.ms ? `transform ${cursor.ms}ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms` : "opacity 200ms",
        opacity: cursor.visible ? 1 : 0,
      }}
    >
      <div
        className="origin-top-left transition-transform duration-100"
        style={{ transform: cursor.down ? "scale(0.88)" : "scale(1)" }}
      >
        <svg width="22" height="26" viewBox="0 0 22 26" fill="none" className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]">
          <path d="M3 2.2v18.4l4.7-4.4 3.3 7.2 3.1-1.4-3.2-7 6.4-.3L3 2.2Z" fill="#fff" stroke="#0a0a0a" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );

  return { running, run, stop, overlay };
}
