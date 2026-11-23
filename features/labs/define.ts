import type { Control, LabMeta, LabValues } from "./types";

export function defineLab<const T extends LabMeta>(meta: T): T {
  return meta;
}

export function defaultValues(controls: readonly Control[] = []): LabValues {
  const values: LabValues = {};
  for (const c of controls) values[c.key] = c.default;
  return values;
}

export function randomValues(controls: readonly Control[] = []): LabValues {
  const values: LabValues = {};
  for (const c of controls) {
    if (c.type === "toggle") values[c.key] = Math.random() > 0.5;
    else if (c.type === "select")
      values[c.key] = c.options[Math.floor(Math.random() * c.options.length)].value;
    else {
      const step = c.step ?? 1;
      const n = Math.round((Math.random() * (c.max - c.min)) / step) * step + c.min;
      values[c.key] = Math.min(c.max, Math.max(c.min, Number(n.toFixed(4))));
    }
  }
  return values;
}
