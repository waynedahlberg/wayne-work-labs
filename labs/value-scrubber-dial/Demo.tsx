"use client";

import type { DemoProps } from "@/features/labs/types";
import { ValueScrubberDial } from "./ValueScrubberDial";

/** Maps inspector values to the component's props. Not shown in the Code tab. */
export default function Demo({ values }: DemoProps) {
  return (
    <ValueScrubberDial
      data-cursor="dial"
      max={Number(values.max)}
      spacing={Number(values.spacing)}
      magnify={Number(values.magnify) / 100}
      blur={Number(values.blur)}
      snap={Boolean(values.snap)}
    />
  );
}
