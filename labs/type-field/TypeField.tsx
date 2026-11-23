"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useAnimationControls } from "motion/react";

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

interface TypeFieldProps {
  label?: string;
  /** Horizontal distance of the error shake, in px. */
  shake?: number;
  /** Validate on every keystroke instead of on submit. */
  live?: boolean;
}

export function TypeField({ label = "Email address", shake = 8, live = false }: TypeFieldProps) {
  const id = useId();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState(false);
  const [sent, setSent] = useState(false);
  const controls = useAnimationControls();

  const valid = isEmail(value);
  const floated = focused || value.length > 0;
  const showError = error && !valid;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      setError(true);
      await controls.start({
        x: [0, -shake, shake, -shake / 2, shake / 2, 0],
        transition: { duration: 0.38, ease: "easeInOut" },
      });
      return;
    }
    setError(false);
    setSent(true);
    setTimeout(() => setSent(false), 1600);
  };

  return (
    <form onSubmit={submit} className="w-72" noValidate>
      <motion.div animate={controls} className="relative">
        <div
          className={`relative h-14 rounded-2xl bg-foreground/10 transition-shadow duration-200 ${
            showError ? "shadow-[0_0_0_2px_var(--color-destructive)]" : focused ? "shadow-[0_0_0_2px_var(--focus-ring)]" : ""
          }`}
        >
          <motion.label
            htmlFor={id}
            initial={false}
            animate={{ y: floated ? -11 : 0, scale: floated ? 0.78 : 1 }}
            transition={{ type: "spring", duration: 0.25, bounce: 0 }}
            style={{ transformOrigin: "left center" }}
            className="pointer-events-none absolute left-4 top-1/2 -mt-3 text-body text-muted-foreground"
          >
            {label}
          </motion.label>
          <input
            id={id}
            data-cursor="field"
            type="email"
            value={value}
            autoComplete="off"
            aria-invalid={showError}
            aria-describedby={showError ? `${id}-err` : undefined}
            onChange={(e) => {
              setValue(e.target.value);
              if (live) setError(e.target.value.length > 0);
              else if (error) setError(false);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="absolute inset-0 w-full rounded-2xl bg-transparent px-4 pb-0 pt-5 text-[16px] outline-none"
          />
          <AnimatePresence>
            {valid && (
              <motion.svg
                key="ok"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: "spring", duration: 0.25, bounce: 0.2 }}
                className="absolute right-4 top-1/2 -mt-2 text-success"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden
              >
                <path d="m3.5 8.5 3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </motion.svg>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence initial={false}>
          {showError && (
            <motion.p
              id={`${id}-err`}
              role="alert"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", duration: 0.25, bounce: 0 }}
              className="overflow-hidden px-4 pt-2 text-caption text-destructive"
            >
              Enter a full email address.
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      <button
        type="submit"
        data-cursor="submit"
        className="mt-3 h-11 w-full cursor-pointer rounded-full bg-foreground text-body font-semibold text-background outline-none transition-transform active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
      >
        {sent ? "Saved" : "Continue"}
      </button>
    </form>
  );
}
