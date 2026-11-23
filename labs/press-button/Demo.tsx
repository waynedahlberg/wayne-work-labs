"use client";

import type { DemoProps } from "@/features/labs/types";
import { PressButton } from "./PressButton";

export default function Demo({ values }: DemoProps) {
  return (
    <PressButton
      data-cursor="button"
      tone={values.tone as "solid" | "soft"}
      depth={Number(values.depth)}
      duration={Number(values.duration)}
    />
  );
}
