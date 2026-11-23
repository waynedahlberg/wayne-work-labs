/**
 * pnpm labs:check
 *
 * Validates every lab against the contract and fails (exit 1) on errors.
 * Warnings (missing captures, stale updatedAt) don't fail the run.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { allLabs } from "@/features/labs/registry.generated";
import { INTERACTIONS } from "@/features/labs/types";

const root = process.cwd();
const errors: string[] = [];
const warnings: string[] = [];
const err = (slug: string, m: string) => errors.push(`${slug}: ${m}`);
const warn = (slug: string, m: string) => warnings.push(`${slug}: ${m}`);
const iso = /^\d{4}-\d{2}-\d{2}$/;

// Registry must match the folders on disk.
const before = fs.readFileSync("features/labs/registry.generated.ts", "utf8");
spawnSync("node", ["scripts/generate-registry.mjs"], { stdio: "ignore" });
if (fs.readFileSync("features/labs/registry.generated.ts", "utf8") !== before)
  warnings.push("registry: was out of date and has been regenerated. Commit the change.");

const slugs = new Set<string>();

for (const lab of allLabs) {
  const s = lab.slug;
  const dir = path.join(root, "labs", s);
  const has = (f: string) => fs.existsSync(path.join(dir, f));
  const read = (f: string) => (has(f) ? fs.readFileSync(path.join(dir, f), "utf8") : "");

  if (slugs.has(s)) err(s, "duplicate slug");
  slugs.add(s);
  if (!fs.existsSync(dir)) err(s, `folder labs/${s} not found (slug must equal the folder name)`);

  if (!lab.title?.trim()) err(s, "title is empty");
  if (!lab.description?.trim()) err(s, "description is empty");
  else if (lab.description.length > 220) warn(s, "description is long; keep it to one or two sentences");
  if (!(INTERACTIONS as readonly string[]).includes(lab.interaction)) err(s, `interaction "${lab.interaction}" is not one of ${INTERACTIONS.join(", ")}`);
  if (!lab.tags?.length) err(s, "tags is empty");
  if (!iso.test(lab.createdAt) || !iso.test(lab.updatedAt)) err(s, "createdAt/updatedAt must be YYYY-MM-DD");
  else if (lab.updatedAt < lab.createdAt) err(s, "updatedAt is before createdAt");

  for (const f of lab.files ?? []) if (!has(f)) err(s, `files: "${f}" not found`);
  if (!has("how-it-works.md")) warn(s, "how-it-works.md is missing");

  if (lab.kind === "react") {
    if (!has("Demo.tsx")) err(s, "react labs need Demo.tsx");
    else {
      const demo = read("Demo.tsx");
      if (!/^["']use client["']/.test(demo.trim())) err(s, 'Demo.tsx must start with "use client"');
      if (!/export default/.test(demo)) err(s, "Demo.tsx must have a default export");
    }
    if (!lab.files?.length) warn(s, "no files listed: the Code tab will be empty");
  } else if (lab.kind === "video") {
    if (!lab.video?.src) err(s, "video labs need video.src");
    else if (lab.video.src.startsWith("/") && !fs.existsSync(path.join(root, "public", lab.video.src))) err(s, `video file public${lab.video.src} not found`);
  }

  // Controls
  const keys = new Set<string>();
  for (const c of lab.controls ?? []) {
    if (keys.has(c.key)) err(s, `duplicate control key "${c.key}"`);
    keys.add(c.key);
    if (c.type === "select" && !c.options.some((o) => o.value === c.default)) err(s, `control "${c.key}": default is not one of its options`);
    if (c.type === "slider" && (c.default < c.min || c.default > c.max)) err(s, `control "${c.key}": default is outside min/max`);
  }

  // Cursor targets must exist as data-cursor="…" in the lab's sources.
  const sources = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.(tsx?|jsx?)$/.test(f)).map(read).join("\n") : "";
  for (const step of lab.cursor ?? []) {
    if ("to" in step && step.to) {
      const name = step.to;
      const found = new RegExp(`data-cursor=(?:"${name}"|\\{\`${name.replace(/\d+$/, "")}\\$\\{)`).test(sources) || sources.includes(`data-cursor="${name}"`) || sources.includes(`data-cursor={\`${name.replace(/\d+$/, "")}`);
      if (!found) err(s, `cursor target "${name}" has no matching data-cursor in the lab's files`);
    }
    if (step.do === "set" && !keys.has(step.key)) err(s, `cursor "set" targets unknown control "${step.key}"`);
  }
  if (lab.thumbStep !== undefined && (!lab.cursor || lab.thumbStep >= lab.cursor.length)) err(s, "thumbStep is outside the cursor script");

  // Hard-coded colors break theming.
  const hex = sources.match(/#[0-9a-fA-F]{3,8}\b/g);
  if (hex) warn(s, `hard-coded colors (${[...new Set(hex)].slice(0, 3).join(", ")}): use theme tokens so light and dark both work`);

  // Captures
  if (lab.kind === "react" && !lab.draft) {
    for (const f of ["thumb-dark.jpg", "thumb-light.jpg"])
      if (!fs.existsSync(path.join(root, "public/labs", s, f))) warn(s, `missing public/labs/${s}/${f}: run pnpm labs:capture ${s}`);
  }

  // Stale updatedAt: a source file changed after the stated date.
  if (fs.existsSync(dir)) {
    const newest = Math.max(...fs.readdirSync(dir).map((f) => fs.statSync(path.join(dir, f)).mtimeMs));
    const stated = new Date(`${lab.updatedAt}T23:59:59`).getTime();
    if (newest > stated) warn(s, `files changed after updatedAt (${lab.updatedAt}): bump it to today`);
  }
}

for (const w of warnings) console.log(`⚠  ${w}`);
for (const e of errors) console.log(`✗  ${e}`);
console.log(`\n${allLabs.length} lab(s) · ${errors.length} error(s) · ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
