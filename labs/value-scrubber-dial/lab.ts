import { defineLab } from "@/features/labs/define";

export default defineLab({
  slug: "value-scrubber-dial",
  title: "Value scrubber dial",
  description:
    "Drag a ruler under a fixed playhead. The ticks swell under the pointer and the numerals roll over like an odometer.",
  kind: "react",
  interaction: "Slide",
  tags: ["React", "Typography"],
  createdAt: "2026-11-22",
  updatedAt: "2026-11-22",
  featured: true,
  dependencies: ["motion"],
  files: ["ValueScrubberDial.tsx"],
  controls: [
    { type: "slider", key: "max", label: "Range", min: 10, max: 99, step: 1, default: 60 },
    { type: "slider", key: "spacing", label: "Tick spacing", min: 8, max: 24, step: 1, unit: "px", default: 14 },
    { type: "slider", key: "magnify", label: "Magnify", min: 0, max: 100, step: 5, unit: "%", default: 70 },
    { type: "slider", key: "blur", label: "Digit blur", min: 0, max: 8, step: 1, unit: "px", default: 3 },
    { type: "toggle", key: "snap", label: "Snap to value", default: true },
  ],
  // Net horizontal travel is zero, so the dial ends where it started (1).
  thumbStep: 1,
  cursor: [
    { do: "move", to: "dial" },
    { do: "drag", dx: -280, ms: 1100 },
    { do: "wait", ms: 350 },
    { do: "drag", dx: 112, ms: 700 },
    { do: "wait", ms: 250 },
    { do: "drag", dx: -336, ms: 1200 },
    { do: "wait", ms: 350 },
    { do: "drag", dx: 504, ms: 1500 },
    { do: "wait", ms: 600 },
  ],
});
