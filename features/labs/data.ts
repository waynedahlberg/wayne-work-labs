import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { codeToHtml } from "shiki";
import { marked } from "marked";
import { cacheLife } from "next/cache";
import { allLabs } from "./registry.generated";
import { labAssets, type LabAssets } from "./assets.generated";
import type { LabMeta } from "./types";

const root = process.cwd();
const isProd = process.env.NODE_ENV === "production";

/** File reads are I/O, so under Cache Components they must live in a cache
 *  scope to prerender. In dev, hard-refresh (⌘⇧R) to pick up edits to a lab's
 *  files in the Code tab; a short-lived cache would make every route look
 *  request-time to Next's instant-navigation validation. */
function cacheFor() {
  cacheLife("max");
}

/** Newest first. Drafts show in dev only. */
export function getLabs(): LabMeta[] {
  return allLabs
    .filter((l) => !l.draft || !isProd)
    .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getFeaturedLabs(limit = 6): LabMeta[] {
  const labs = getLabs();
  const featured = labs.filter((l) => l.featured);
  return (featured.length ? featured : labs).slice(0, limit);
}

export function getLab(slug: string): LabMeta | undefined {
  return getLabs().find((l) => l.slug === slug);
}

/** Slugs that are "New": created within the last 30 days. Cached for a day
 *  because `Date.now()` can't run during prerender outside a cache scope. */
export async function getNewSlugs(): Promise<Set<string>> {
  "use cache";
  cacheLife("days");
  const now = Date.now();
  return new Set(
    getLabs()
      .filter((l) => now - new Date(l.createdAt).getTime() < 30 * 24 * 3600 * 1000)
      .map((l) => l.slug),
  );
}

// ---------------------------------------------------------------------------
// Static assets captured by `pnpm labs:capture`, living in /public/labs/<slug>.
// Discovered by scripts/generate-registry.mjs, so there is no runtime file I/O.
// ---------------------------------------------------------------------------

export type { LabAssets } from "./assets.generated";

export function getLabAssets(slug: string): LabAssets {
  return labAssets[slug] ?? { thumb: {}, hover: {} };
}

// ---------------------------------------------------------------------------
// Code tab content
// ---------------------------------------------------------------------------

export interface HighlightedFile {
  name: string;
  lang: string;
  code: string;
  html: string;
}

export interface CodePanelData {
  install: HighlightedFile;
  usage?: HighlightedFile;
  files: HighlightedFile[];
  howItWorks?: string;
  prompt: string;
}

const LANG_BY_EXT: Record<string, string> = {
  tsx: "tsx",
  ts: "typescript",
  jsx: "jsx",
  js: "javascript",
  css: "css",
  swift: "swift",
  rs: "rust",
  py: "python",
  glsl: "glsl",
  wgsl: "wgsl",
  json: "json",
  md: "markdown",
  sh: "bash",
};

async function highlight(name: string, code: string, lang: string): Promise<HighlightedFile> {
  const html = await codeToHtml(code, {
    lang,
    themes: { light: "github-light", dark: "github-dark-default" },
    defaultColor: false,
  });
  return { name, lang, code, html };
}

async function readIfExists(file: string) {
  try {
    return await fs.readFile(file, "utf8");
  } catch {
    return undefined;
  }
}

export async function getCodePanel(slug: string): Promise<CodePanelData> {
  "use cache";
  cacheFor();
  const lab = getLab(slug);
  if (!lab) throw new Error(`Unknown lab: ${slug}`);
  const dir = path.join(root, "labs", lab.slug);

  const installCode = lab.dependencies?.length
    ? `pnpm add ${lab.dependencies.join(" ")}`
    : "# No extra dependencies";
  const install = await highlight("install", installCode, "bash");

  const usageRaw = await readIfExists(path.join(dir, "usage.txt"));
  const usage = usageRaw ? await highlight("usage", usageRaw.trimEnd(), "tsx") : undefined;

  const files = await Promise.all(
    (lab.files ?? []).map(async (name) => {
      const code = ((await readIfExists(path.join(dir, name))) ?? `// ${name} not found`).trimEnd();
      const ext = name.split(".").pop() ?? "";
      return highlight(name, code, LANG_BY_EXT[ext] ?? "text");
    }),
  );

  const md = await readIfExists(path.join(dir, "how-it-works.md"));
  const howItWorks = md ? await marked.parse(md) : undefined;

  const prompt = buildPrompt(lab, install.code, files, usage?.code);
  return { install, usage, files, howItWorks, prompt };
}

/** The text behind "Copy prompt": a self-contained brief an agent can build from. */
function buildPrompt(
  lab: LabMeta,
  install: string,
  files: HighlightedFile[],
  usage?: string,
) {
  const controls = (lab.controls ?? [])
    .map((c) => {
      if (c.type === "select")
        return `- ${c.key} (${c.options.map((o) => o.value).join(" | ")}), default "${c.default}"`;
      if (c.type === "toggle") return `- ${c.key} (boolean), default ${c.default}`;
      return `- ${c.key} (number ${c.min}–${c.max}${c.unit ? ` ${c.unit}` : ""}), default ${c.default}`;
    })
    .join("\n");

  return [
    `Build the "${lab.title}" interaction for a React + Tailwind project.`,
    "",
    lab.description,
    "",
    `Interaction: ${lab.interaction}. Tags: ${lab.tags.join(", ")}.`,
    controls ? `\nProps:\n${controls}` : "",
    "",
    "Install:",
    "```bash",
    install,
    "```",
    usage ? `\nUsage:\n\`\`\`tsx\n${usage}\n\`\`\`` : "",
    ...files.map((f) => `\n${f.name}:\n\`\`\`${f.lang}\n${f.code}\n\`\`\``),
  ]
    .filter((l) => l !== "")
    .join("\n");
}
