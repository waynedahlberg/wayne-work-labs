import { defineLab } from "@/features/labs/define";

export default defineLab({
  slug: "type-field",
  title: "Type field",
  description:
    "A text field whose label floats up as you type and whose error shakes once, then settles into a checkmark when the value is valid.",
  kind: "react",
  interaction: "Type",
  tags: ["React", "Typography"],
  createdAt: "2026-11-22",
  updatedAt: "2026-11-22",
  featured: true,
  dependencies: ["motion"],
  files: ["TypeField.tsx"],
  controls: [
    { type: "slider", key: "shake", label: "Shake", min: 0, max: 16, step: 1, unit: "px", default: 8 },
    { type: "toggle", key: "live", label: "Validate while typing", default: false },
  ],
  thumbStep: 1,
  cursor: [
    { do: "move", to: "field" },
    { do: "type", to: "field", text: "wayne@", ms: 90 },
    { do: "click", to: "submit" },
    { do: "wait", ms: 1100 },
    { do: "type", to: "field", text: "wayne@wayne.work", ms: 60 },
    { do: "click", to: "submit" },
    { do: "wait", ms: 1400 },
  ],
});
