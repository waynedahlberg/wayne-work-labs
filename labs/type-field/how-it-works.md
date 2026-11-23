Three small pieces of state make the field feel alive: `focused`, `value` and `error`.

- **Floating label:** the label is always rendered. When the field is focused or has text, it animates `y` and `scale` on a spring from a left origin, so it shrinks toward the corner instead of being swapped for a second element.
- **Shake:** `useAnimationControls` runs a short keyframe sequence on the wrapper, with the distance set by `shake`. The error message grows in with an animated height so nothing below it jumps.
- **Validation:** a plain regex. By default it runs on submit; with `live` on, it runs on every keystroke.
- **Success:** a checkmark springs in as soon as the value is valid.
