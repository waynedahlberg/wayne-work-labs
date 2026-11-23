"use client";

import type { DemoProps } from "@/features/labs/types";
import { TypeField } from "./TypeField";

export default function Demo({ values }: DemoProps) {
  return <TypeField shake={Number(values.shake)} live={Boolean(values.live)} />;
}
