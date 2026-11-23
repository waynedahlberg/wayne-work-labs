import { defineLab } from "@/features/labs/define";

export default defineLab({
  slug: "soft-select",
  title: "Soft select",
  description:
    "A dropdown whose highlight glides between options and whose menu grows out of the trigger instead of fading in.",
  kind: "react",
  interaction: "Select",
  tags: ["React", "Design System"],
  createdAt: "2026-11-22",
  updatedAt: "2026-11-22",
  featured: true,
  dependencies: ["motion"],
  files: ["SoftSelect.tsx"],
  controls: [
    {
      type: "select",
      key: "shape",
      label: "Shape",
      default: "pill",
      options: [
        { value: "pill", label: "Pill" },
        { value: "rounded", label: "Rounded" },
      ],
    },
    { type: "toggle", key: "check", label: "Show check", default: true },
    { type: "slider", key: "stagger", label: "Stagger", min: 0, max: 60, step: 5, unit: "ms", default: 20 },
  ],
  thumbStep: 3,
  cursor: [
    { do: "move", to: "trigger" },
    { do: "click", to: "trigger" },
    { do: "wait", ms: 500 },
    { do: "move", to: "option-1", ms: 500 },
    { do: "move", to: "option-2", ms: 450 },
    { do: "click", to: "option-2" },
    { do: "wait", ms: 900 },
    { do: "click", to: "trigger" },
    { do: "wait", ms: 500 },
    { do: "move", to: "option-0", ms: 600 },
    { do: "click", to: "option-0" },
    { do: "wait", ms: 700 },
  ],
});
