/**
 * pnpm labs:capture [slug…] [--missing] [--theme=dark|light] [--base=URL]
 *
 * For each react lab, renders /labs/<slug>/embed in Chrome and writes
 * public/labs/<slug>/thumb-{dark,light}.jpg: a still taken after `thumbStep`
 * of the cursor script. Stills are the OG image and the placeholder shown in a
 * card or stage while its live demo loads. Cards themselves run the real demo.
 *
 * Without --base it builds the site and serves it on :3100 (so the dev
 * overlay never lands in a capture). Uses your installed Google Chrome.
 */
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium, type Browser } from "playwright-core";
import { allLabs } from "@/features/labs/registry.generated";

const args = process.argv.slice(2);
const flag = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const slugs = args.filter((a) => !a.startsWith("--"));
const onlyMissing = args.includes("--missing");
const themes = (flag("theme") ? [flag("theme")!] : ["dark", "light"]) as ("dark" | "light")[];
const root = process.cwd();

// 4:3 frame, matching the gallery card. A small CSS viewport keeps demos large;
// the device scale factor keeps them sharp.
const W = 480;
const H = 360;

async function exists(p: string) {
  return fs.access(p).then(() => true, () => false);
}

async function waitForServer(base: string, ms = 60_000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      if ((await fetch(base)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Server at ${base} did not start`);
}

function run(cmd: string, argv: string[]) {
  return new Promise<void>((resolve, reject) => {
    const p = spawn(cmd, argv, { stdio: "inherit", cwd: root });
    p.on("exit", (c) => (c === 0 ? resolve() : reject(new Error(`${cmd} ${argv.join(" ")} exited ${c}`))));
  });
}

async function launch(): Promise<Browser> {
  try {
    return await chromium.launch({ channel: "chrome" });
  } catch {
    const mac = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    if (await exists(mac)) return chromium.launch({ executablePath: mac });
    throw new Error("Google Chrome not found. Install it, or run: pnpm exec playwright-core install chromium");
  }
}

async function main() {
  let server: ChildProcess | undefined;
  let base = flag("base");
  if (!base) {
    base = "http://localhost:3100";
    console.log("Building…");
    await run("pnpm", ["build"]);
    server = spawn("pnpm", ["exec", "next", "start", "-p", "3100"], { cwd: root, stdio: "ignore" });
    await waitForServer(base);
  }

  const labs = allLabs.filter((l) => l.kind === "react" && (!slugs.length || slugs.includes(l.slug)));
  if (!labs.length) console.log("No matching react labs.");

  const browser = await launch();

  try {
    for (const lab of labs) {
      const outDir = path.join(root, "public/labs", lab.slug);
      await fs.mkdir(outDir, { recursive: true });

      for (const theme of themes) {
        const thumbFile = path.join(outDir, `thumb-${theme}.jpg`);
        const base_ = `${base}/labs/${lab.slug}/embed`;
        const ctxOpts = { viewport: { width: W, height: H }, colorScheme: theme } as const;
        const init = `localStorage.setItem("theme", "${theme}")`;

        // --- thumbnail -------------------------------------------------
        if (!(onlyMissing && (await exists(thumbFile)))) {
          const ctx = await browser.newContext({ ...ctxOpts, deviceScaleFactor: 3 });
          await ctx.addInitScript(init);
          const page = await ctx.newPage();
          const stop = lab.thumbStep !== undefined && lab.cursor?.length ? `?stopAt=${lab.thumbStep}` : "";
          await page.goto(base_ + stop, { waitUntil: "networkidle" });
          await page.waitForFunction(() => (window as never as { __labReady?: boolean }).__labReady, undefined, { timeout: 20_000 });
          if (stop) await page.waitForFunction(() => (window as never as { __labDone?: boolean }).__labDone, undefined, { timeout: 30_000 });
          await page.evaluate(() => document.fonts.ready);
          await page.waitForTimeout(700);
          await page.screenshot({ path: thumbFile, type: "jpeg", quality: 86 });
          await ctx.close();
          console.log(`✓ ${lab.slug} thumb-${theme}.jpg`);
        }

      }
    }
    // Pick up the new files in the generated assets map.
    await run("node", ["scripts/generate-registry.mjs"]);
  } finally {
    await browser.close();
    server?.kill();
  }
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
