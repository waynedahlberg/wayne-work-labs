"use client";

import type { Control, LabValues } from "../types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tooltip } from "@/components/ui/tooltip";
import { useIcons } from "@/lib/icon-context";

interface InspectorProps {
  title: string;
  controls: Control[];
  values: LabValues;
  onChange: (key: string, value: LabValues[string]) => void;
  onReset: () => void;
  onRandomize: () => void;
  onClose: () => void;
}

const row = "rounded-3xl bg-inset-2 px-1";

export function Inspector({ title, controls, values, onChange, onReset, onRandomize, onClose }: InspectorProps) {
  const icons = useIcons();
  const Panel = icons["panel-right"];

  return (
    <div className="flex h-full flex-col gap-3 p-4 lg:p-3">
      <div className="flex h-9 items-center justify-between pl-1">
        <h2 className="text-subtitle font-semibold tracking-tight">{title}</h2>
        <Tooltip content="Hide inspector" side="left">
          <Button variant="ghost" size="icon" aria-label="Hide inspector" onClick={onClose}>
            <Panel />
          </Button>
        </Tooltip>
      </div>

      <div className="flex flex-col gap-2">
        {controls.map((c) => {
          if (c.type === "select") {
            return (
              <div key={c.key} className={`${row} flex items-center justify-between pl-3`}>
                <span className="text-body text-muted-foreground">{c.label}</span>
                <Select value={String(values[c.key])} onValueChange={(v) => onChange(c.key, v)}>
                  <SelectTrigger variant="borderless" aria-label={c.label} />
                  <SelectContent>
                    {c.options.map((o, i) => (
                      <SelectItem key={o.value} index={i} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (c.type === "toggle") {
            return (
              <div key={c.key} className={`${row} py-0.5`}>
                <Switch label={c.label} checked={Boolean(values[c.key])} onToggle={() => onChange(c.key, !values[c.key])} />
              </div>
            );
          }
          return (
            <div key={c.key} className={row}>
              <Slider
                variant="scrubber"
                label={c.label}
                min={c.min}
                max={c.max}
                step={c.step ?? 1}
                value={Number(values[c.key])}
                onChange={(v) => onChange(c.key, Array.isArray(v) ? v[0] : v)}
                formatValue={(v) => `${v}${c.unit ?? ""}`}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-2">
        <Button variant="primary" className="w-full rounded-full" onClick={onRandomize}>
          Randomize
        </Button>
        <Button variant="secondary" className="w-full rounded-full" onClick={onReset}>
          Reset
        </Button>
      </div>
    </div>
  );
}
