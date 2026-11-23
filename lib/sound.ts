/**
 * Sound layer: stubbed. Labs can already declare `sounds: ["press"]` in
 * lab.ts; nothing plays until assets and a UI toggle exist.
 *
 * When we add it: load short files from /public/sounds/<name>.{webm,mp3},
 * play through one shared AudioContext, respect prefers-reduced-motion and a
 * persisted mute toggle, and stay silent until the first user gesture.
 */
export type SoundName = string;

let enabled = false;

export function setSoundsEnabled(value: boolean) {
  enabled = value;
}

export function soundsEnabled() {
  return enabled;
}

/** No-op until the sound layer ships. Safe to call from any demo. */
export function playSound(name: SoundName, options?: { volume?: number }) {
  void name;
  void options;
  if (!enabled) return;
}
