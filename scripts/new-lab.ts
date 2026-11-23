/**
 * pnpm labs:new <slug> [--title "Title"] [--interaction Press] [--tags React,Color]
 *
 * Scaffolds /labs/<slug> with a working component, demo wrapper, usage and
 * how-it-works notes, then regenerates the registry. Edit, then run
 * `pnpm labs:check` and `pnpm labs:capture <slug>`.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { INTERACTIONS } from "@/features/labs/types";

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const slug = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1]?.startsWith("--") === false) ?? args[0];

if (!slug || slug.startsWith("--") || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error('Usage: pnpm labs:new <kebab-case-slug> [--title "Title"] [--interaction Press] [--tags React,Color]');
  process.exit(1);
}

const dir = path.join(process.cwd(), "labs", slug);
if (fs.existsSync(dir)) {
  console.error(`labs/${slug} already exists.`);
  process.exit(1);
}

const pascal = slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join("");
const title = flag("title") ?? slug.split("-").map((w, i) => (i ? w : w[0].toUpperCase() + w.slice(1))).join(" ");
const interaction = flag("interaction") ?? "Press";
if (!(INTERACTIONS as readonly string[]).includes(interaction)) {
  console.error(`--interaction must be one of: ${INTERACTIONS.join(", ")}`);
  process.exit(1);
}
const tags = (flag("tags") ?? "React").split(",").map((t) => t.trim()).filter(Boolean);
const today = new Date().toISOString().slice(0, 10);

const files: Record<string, string> = {
  "lab.ts": `import { defineLab } from "@/features/labs/define";

export default defineLab({
  slug: "${slug}",
  title: ${JSON.stringify(title)},
  description: "One or two sentences about what it does and what makes it feel good.",
  kind: "react",
  interaction: "${interaction}",
  tags: ${JSON.stringify(tags)},
  createdAt: "${today}",
  updatedAt: "${today}",
  draft: true, // remove when it is ready to show
  dependencies: ["motion"],
  files: ["${pascal}.tsx"],
  controls: [
    { type: "slider", key: "size", label: "Size", min: 40, max: 160, step: 4, unit: "px", default: 96 },
  ],
  // Optional scripted cursor run: powers the play button and the hover video.
  // Targets are \`data-cursor\` names set in Demo.tsx / the component.
  cursor: [
    { do: "move", to: "target" },
    { do: "press", to: "target", hold: 400 },
    { do: "wait", ms: 600 },
  ],
});
`,
  [`${pascal}.tsx`]: `"use client";

import { motion } from "motion/react";
import type { ComponentProps } from "react";

interface ${pascal}Props extends Omit<ComponentProps<"button">, "children"> {
  /** Diameter in px. */
  size?: number;
}

export function ${pascal}({ size = 96, ...props }: ${pascal}Props) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", duration: 0.25, bounce: 0.1 }}
      style={{ width: size, height: size }}
      className="cursor-pointer rounded-full bg-foreground outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
      aria-label="${title}"
      {...(props as object)}
    />
  );
}
`,
  "Demo.tsx": `"use client";

import type { DemoProps } from "@/features/labs/types";
import { ${pascal} } from "./${pascal}";

/** Maps inspector values to the component's props. Not shown in the Code tab. */
export default function Demo({ values }: DemoProps) {
  return <${pascal} data-cursor="target" size={Number(values.size)} />;
}
`,
  "usage.txt": `import { ${pascal} } from "./${pascal}";

<${pascal} size={96} />
`,
  "how-it-works.md": `Explain the one or two ideas that make this work: what state drives it, what moves, and why.

- **Idea one:** …
- **Idea two:** …
`,
};

fs.mkdirSync(dir, { recursive: true });
for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), content);
spawnSync("node", ["scripts/generate-registry.mjs"], { stdio: "inherit" });

console.log(`\nCreated labs/${slug}/ (draft). Next:
  1. edit the component, controls and cursor script
  2. pnpm labs:check
  3. pnpm labs:capture ${slug}
  4. remove \`draft: true\` and open a PR`);
