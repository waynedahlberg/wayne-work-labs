"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

interface Option {
  value: string;
  label: string;
}

interface SoftSelectProps {
  options: Option[];
  defaultValue?: string;
  shape?: "pill" | "rounded";
  showCheck?: boolean;
  /** Delay between each option's entrance, in ms. */
  stagger?: number;
  onChange?: (value: string) => void;
}

export function SoftSelect({
  options,
  defaultValue = options[0]?.value,
  shape = "pill",
  showCheck = true,
  stagger = 20,
  onChange,
}: SoftSelectProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const [active, setActive] = useState(-1);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value);
  const menuRadius = shape === "pill" ? "rounded-[1.75rem]" : "rounded-2xl";
  const itemRadius = shape === "pill" ? "rounded-full" : "rounded-xl";

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  const choose = (i: number) => {
    setValue(options[i].value);
    onChange?.(options[i].value);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return setOpen(false);
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setActive(Math.max(0, options.findIndex((o) => o.value === value)));
      return setOpen(true);
    }
    if (!open) return;
    if (e.key === "ArrowDown") setActive((a) => Math.min(options.length - 1, a + 1));
    if (e.key === "ArrowUp") setActive((a) => Math.max(0, a - 1));
    if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      choose(active);
    }
  };

  return (
    <div ref={root} className="relative w-64" onKeyDown={onKeyDown}>
      <button
        type="button"
        data-cursor="trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          setActive(Math.max(0, options.findIndex((o) => o.value === value)));
          setOpen((o) => !o);
        }}
        className={`flex h-12 w-full cursor-pointer items-center justify-between bg-foreground/10 px-5 text-body font-medium outline-none transition-colors hover:bg-foreground/15 focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] ${shape === "pill" ? "rounded-full" : "rounded-2xl"}`}
      >
        <span>{selected?.label}</span>
        <motion.svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: "spring", duration: 0.3, bounce: 0 }}
        >
          <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            id={listId}
            role="listbox"
            initial={{ opacity: 0, scale: 0.92, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4, transition: { duration: 0.12 } }}
            transition={{ type: "spring", duration: 0.3, bounce: 0.08 }}
            style={{ transformOrigin: "top center" }}
            className={`absolute left-0 right-0 top-[calc(100%+8px)] z-20 bg-inset-2 p-1.5 shadow-[0_16px_40px_-12px_rgb(0_0_0/0.45)] ${menuRadius}`}
          >
            {options.map((o, i) => (
              <motion.li
                key={o.value}
                role="option"
                aria-selected={o.value === value}
                data-cursor={`option-${i}`}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0, transition: { delay: (i * stagger) / 1000 } }}
                onPointerEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className={`relative flex h-10 cursor-pointer items-center justify-between px-4 text-body ${itemRadius}`}
              >
                {active === i && (
                  <motion.span
                    layoutId={`${listId}-hl`}
                    className={`absolute inset-0 -z-0 bg-foreground/10 ${itemRadius}`}
                    transition={{ type: "spring", duration: 0.22, bounce: 0.05 }}
                  />
                )}
                <span className="relative">{o.label}</span>
                {showCheck && o.value === value && (
                  <svg className="relative" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="m3.5 8.5 3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
