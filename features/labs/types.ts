/**
 * Lab contract. A lab is a folder in /labs/<slug> with a `lab.ts` exporting
 * `defineLab({...})`. Everything the site shows is derived from it.
 * This file is pure types + constants, safe on server and client.
 */

export const INTERACTIONS = [
  "Hover",
  "Press",
  "Drag",
  "Slide",
  "Swipe",
  "Type",
  "Select",
  "Loading",
] as const;
export type Interaction = (typeof INTERACTIONS)[number];

/** `react` runs live in the page. `video` shows a recording plus code
 *  snippets (Swift, macOS, 3D, Wasm…). */
export type LabKind = "react" | "video";

export type SelectControl = {
  type: "select";
  key: string;
  label: string;
  options: readonly { value: string; label: string }[];
  default: string;
};
export type ToggleControl = {
  type: "toggle";
  key: string;
  label: string;
  default: boolean;
};
export type SliderControl = {
  type: "slider";
  key: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  default: number;
};
export type Control = SelectControl | ToggleControl | SliderControl;

export type LabValues = Record<string, string | number | boolean>;

/**
 * Scripted cursor run. `to` is a `data-cursor` name inside the demo (or in a
 * portal it opens): `<button data-cursor="primary">`.
 */
export type CursorStep =
  | { do: "move"; to: string; ms?: number }
  | { do: "click"; to?: string }
  | { do: "press"; to?: string; hold?: number }
  | { do: "type"; to: string; text: string; ms?: number }
  | { do: "wait"; ms: number }
  | { do: "set"; key: string; value: string | number | boolean };

export interface LabMeta {
  /** Must equal the folder name. */
  slug: string;
  title: string;
  /** One or two sentences. Shown under the stage and in the OG card. */
  description: string;
  kind: LabKind;
  interaction: Interaction;
  /** Domain tags: React, iOS, 3D, Vector, Color, Typography, Design System… */
  tags: string[];
  /** ISO dates (YYYY-MM-DD). Bump `updatedAt` on every edit. */
  createdAt: string;
  updatedAt: string;
  featured?: boolean;
  /** Visible in dev, hidden in production. */
  draft?: boolean;
  /** npm packages a copier needs, for the Install section. */
  dependencies?: string[];
  /** Files in the lab folder shown in the Code tab, in order. */
  files?: string[];
  controls?: Control[];
  cursor?: CursorStep[];
  /** Index in `cursor` after which `labs:capture` takes the thumbnail. Omit for the idle state. */
  thumbStep?: number;
  /** kind: "video". Files live in /public/labs/<slug>/. */
  video?: { src: string; poster?: string };
  /** Optional exit link (repo, TestFlight, a subdomain). */
  link?: { href: string; label: string };
  /** Reserved for the sound layer. */
  sounds?: string[];
}

export interface DemoProps {
  values: LabValues;
}
