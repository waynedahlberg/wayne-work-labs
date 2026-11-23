"use client";

import type { DemoProps } from "@/features/labs/types";
import { SoftSelect } from "./SoftSelect";

const options = [
  { value: "type", label: "Typography" },
  { value: "color", label: "Color" },
  { value: "motion", label: "Motion" },
  { value: "systems", label: "Design systems" },
];

export default function Demo({ values }: DemoProps) {
  return (
    <div className="h-72 pt-8">
      <SoftSelect
        options={options}
        defaultValue="color"
        shape={values.shape as "pill" | "rounded"}
        showCheck={Boolean(values.check)}
        stagger={Number(values.stagger)}
      />
    </div>
  );
}
