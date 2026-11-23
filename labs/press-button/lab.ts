import { defineLab } from "@/features/labs/define";

export default defineLab({
  slug: "press-button",
  title: "Press button",
  description:
    "A pill button that squashes under your finger, then morphs through loading and success without the layout jumping.",
  kind: "react",
  interaction: "Press",
  tags: ["React", "Design System"],
  createdAt: "2026-11-22",
  updatedAt: "2026-11-22",
  featured: true,
  dependencies: ["motion"],
  files: ["PressButton.tsx"],
  controls: [
    {
      type: "select",
      key: "tone",
      label: "Tone",
      default: "solid",
      options: [
        { value: "solid", label: "Solid" },
        { value: "soft", label: "Soft" },
      ],
    },
    { type: "slider", key: "depth", label: "Press depth", min: 0, max: 12, step: 1, unit: "%", default: 6 },
    { type: "slider", key: "duration", label: "Loading", min: 600, max: 3000, step: 100, unit: "ms", default: 1400 },
  ],
  cursor: [
    { do: "move", to: "button" },
    { do: "press", to: "button", hold: 420 },
    { do: "wait", ms: 3400 },
    { do: "move", to: "button", ms: 300 },
  ],
});
