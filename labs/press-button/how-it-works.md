The button is a single `motion.button` with `layout`, so its width animates between the three labels instead of jumping.

- **Press:** `whileTap` scales it down by `depth` percent on a spring with a touch of bounce on release.
- **Phases:** `idle → loading → done → idle`, driven by two timers. A press during `loading` or `done` is ignored.
- **Label swap:** `AnimatePresence mode="popLayout"` lets the outgoing label leave the flow while the incoming one slides in, each with a small blur so the crossfade never shows two crisp words at once.
- **Accessibility:** `aria-busy` while loading; the focus ring uses the shared `--focus-ring` token.
