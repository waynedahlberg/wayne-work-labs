"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { AnimatePresence, motion } from "motion/react";

type Phase = "idle" | "loading" | "done";

interface PressButtonProps extends Omit<ComponentProps<"button">, "onClick" | "children"> {
  label?: string;
  doneLabel?: string;
  tone?: "solid" | "soft";
  /** How far the button sinks when pressed, in percent. */
  depth?: number;
  /** How long the loading phase lasts, in ms. */
  duration?: number;
  onPress?: () => void;
}

const swap = {
  initial: { opacity: 0, y: 6, filter: "blur(3px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -6, filter: "blur(3px)" },
  transition: { type: "spring", duration: 0.28, bounce: 0 },
} as const;

export function PressButton({
  label = "Send",
  doneLabel = "Sent",
  tone = "solid",
  depth = 6,
  duration = 1400,
  onPress,
  className = "",
  ...props
}: PressButtonProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const press = () => {
    if (phase !== "idle") return;
    onPress?.();
    setPhase("loading");
    timers.current.push(
      window.setTimeout(() => setPhase("done"), duration),
      window.setTimeout(() => setPhase("idle"), duration + 1400),
    );
  };

  const colors =
    tone === "solid"
      ? "bg-foreground text-background"
      : "bg-foreground/10 text-foreground hover:bg-foreground/15";

  return (
    <motion.button
      type="button"
      layout
      onClick={press}
      aria-busy={phase === "loading"}
      whileTap={{ scale: 1 - depth / 100 }}
      transition={{ type: "spring", duration: 0.3, bounce: 0.1 }}
      className={`relative inline-flex h-12 cursor-pointer select-none items-center justify-center overflow-hidden rounded-full px-7 text-body font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] ${colors} ${className}`}
      {...(props as object)}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {phase === "idle" && (
          <motion.span key="idle" layout="position" {...swap}>
            {label}
          </motion.span>
        )}
        {phase === "loading" && (
          <motion.span key="loading" layout="position" className="flex items-center gap-2" {...swap}>
            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
            Sending
          </motion.span>
        )}
        {phase === "done" && (
          <motion.span key="done" layout="position" className="flex items-center gap-2" {...swap}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="m3.5 8.5 3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {doneLabel}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
