"use client";

import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "motion/react";
import { memo, useEffect, useMemo, useRef, useState, type ComponentProps } from "react";

const DIGIT_H = 28; // px height of one numeral cell
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

interface ValueScrubberDialProps extends Omit<ComponentProps<"div">, "onChange" | "children"> {
  /** Highest value. The ruler has `max + 1` ticks. */
  max?: number;
  defaultValue?: number;
  /** Distance between ticks, in px. */
  spacing?: number;
  /** How much ticks swell near the playhead, 0–1. */
  magnify?: number;
  /** Peak motion blur on rolling numerals, in px. */
  blur?: number;
  /** Settle on a whole value when released. */
  snap?: boolean;
  onChange?: (value: number) => void;
}

export function ValueScrubberDial({
  max = 60,
  defaultValue = 1,
  spacing = 14,
  magnify = 0.7,
  blur = 3,
  snap = true,
  onChange,
  className = "",
  ...props
}: ValueScrubberDialProps) {
  const pos = useMotionValue(defaultValue); // continuous position, in value units
  const [value, setValue] = useState(defaultValue);
  const drag = useRef<{ x: number; pos: number; lastX: number; lastT: number; v: number } | null>(null);
  const anim = useRef<ReturnType<typeof animate> | null>(null);
  const last = useRef(defaultValue);
  const digits = Math.max(2, String(max).length);

  useMotionValueEvent(pos, "change", (p) => {
    const v = clamp(Math.round(p), 0, max);
    setValue(v);
    if (v !== last.current) {
      last.current = v;
      onChange?.(v);
    }
  });

  // Shrinking the range pulls the dial back inside it.
  useEffect(() => {
    if (pos.get() > max) anim.current = animate(pos, max, { type: "spring", stiffness: 300, damping: 32 });
  }, [max, pos]);

  const settle = (target: number, velocity = 0) => {
    anim.current?.stop();
    anim.current = animate(pos, target, { type: "spring", stiffness: 260, damping: 30, velocity });
  };

  // Past either end the ruler resists, then springs back on release.
  const soft = (p: number) => (p < 0 ? p * 0.35 : p > max ? max + (p - max) * 0.35 : p);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    anim.current?.stop();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    drag.current = { x: e.clientX, pos: pos.get(), lastX: e.clientX, lastT: performance.now(), v: 0 };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const now = performance.now();
    const dt = Math.max(1, now - d.lastT);
    // Smoothed velocity in value units per second (dragging left raises the value).
    d.v = 0.8 * d.v + 0.2 * ((-(e.clientX - d.lastX) / spacing / dt) * 1000);
    d.lastX = e.clientX;
    d.lastT = now;
    pos.set(soft(d.pos - (e.clientX - d.x) / spacing));
  };

  const onPointerUp = () => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    const projected = pos.get() + d.v * 0.12;
    settle(clamp(snap ? Math.round(projected) : projected, 0, max), d.v);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 };
    if (e.key in step) settle(clamp(Math.round(pos.get()) + step[e.key], 0, max));
    else if (e.key === "Home") settle(0);
    else if (e.key === "End") settle(max);
    else return;
    e.preventDefault();
  };

  const x = useTransform(pos, (p) => -p * spacing);
  const ticks = useMemo(() => Array.from({ length: max + 1 }, (_, i) => i), [max]);

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label="Value"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      className={`relative h-[156px] w-[520px] max-w-full cursor-grab touch-pan-y select-none overflow-hidden rounded-[1.5rem] outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] ${className}`}
      {...props}
    >
      {/* Ruler: slides under the playhead and fades out toward both edges. */}
      <div
        className="absolute inset-x-0 top-[34px] h-[120px]"
        style={{ maskImage: "linear-gradient(to right, transparent, black 22%, black 78%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 22%, black 78%, transparent)" }}
      >
        <motion.div className="absolute left-1/2 top-1/2 h-0 w-0" style={{ x }}>
          {ticks.map((i) => (
            <Tick key={`${i}-${spacing}-${magnify}`} i={i} pos={pos} spacing={spacing} magnify={magnify} />
          ))}
        </motion.div>
      </div>

      <Playhead value={value} digits={digits} blur={blur} />
    </div>
  );
}

/** One tick. Height swells with a bell curve around the playhead. */
const Tick = memo(function Tick({ i, pos, spacing, magnify }: { i: number; pos: MotionValue<number>; spacing: number; magnify: number }) {
  const height = useTransform(pos, (p) => {
    const d = i - p;
    return 14 + 46 * magnify * Math.exp(-(d * d) / 72);
  });
  const opacity = useTransform(pos, (p) => clamp(1 - Math.abs(i - p) / 22, 0.15, 1));
  return (
    <motion.span
      className="absolute top-0 w-[3px] -translate-x-1/2 rounded-full bg-foreground/20"
      style={{ left: i * spacing, height, opacity, y: "-50%" }}
    />
  );
});

/** Pill and stem drawn as one shape so the stem flares into the pill. */
function Playhead({ value, digits, blur }: { value: number; digits: number; blur: number }) {
  const w = 22 + digits * 24;
  const cx = w / 2;
  const d = `M18 0H${w - 18}A18 18 0 0 1 ${w} 18V22A18 18 0 0 1 ${w - 18} 40H${cx + 12}Q${cx + 2} 40 ${cx + 2} 50V116A2 2 0 0 1 ${cx - 2} 116V50Q${cx - 2} 40 ${cx - 12} 40H18A18 18 0 0 1 0 22V18A18 18 0 0 1 18 0Z`;
  const padded = String(value).padStart(digits, "0");
  return (
    <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2" style={{ width: w, height: 118 }}>
      <svg width={w} height={118} viewBox={`0 0 ${w} 118`} className="absolute inset-0 overflow-visible text-foreground drop-shadow-[0_10px_14px_rgb(0_0_0/0.28)]" aria-hidden>
        <path d={d} fill="currentColor" />
      </svg>
      <div className="absolute left-0 top-0 flex h-10 w-full items-center justify-center text-[22px] font-bold tabular-nums text-background">
        {padded.split("").map((ch, idx) => (
          <Digit key={idx} digit={Number(ch)} blur={blur} />
        ))}
      </div>
    </div>
  );
}

/** One odometer wheel: numerals 0–9 in a column that rolls to the digit. */
function Digit({ digit, blur }: { digit: number; blur: number }) {
  const reduce = useReducedMotion();
  const y = useSpring(-digit * DIGIT_H, { stiffness: 420, damping: 36, mass: 0.7 });
  const velocity = useVelocity(y);
  const amount = useTransform(velocity, (v) => (reduce ? 0 : Math.min(blur, (Math.abs(v) / 1100) * blur)));
  const filter = useMotionTemplate`blur(${amount}px)`;

  useEffect(() => {
    if (reduce) y.jump(-digit * DIGIT_H);
    else y.set(-digit * DIGIT_H);
  }, [digit, reduce, y]);

  return (
    <div
      className="relative w-[0.68em] overflow-hidden"
      style={{
        height: DIGIT_H,
        maskImage: "linear-gradient(to bottom, transparent, black 14%, black 86%, transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent, black 14%, black 86%, transparent)",
      }}
    >
      <motion.div style={{ y, filter }} className="flex flex-col">
        {Array.from({ length: 10 }, (_, n) => (
          <span key={n} className="grid place-items-center" style={{ height: DIGIT_H }}>
            {n}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
