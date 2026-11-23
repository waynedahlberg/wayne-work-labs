<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# wayne.work: agent rules

This repo is the canonical wayne.work site (Next.js App Router, pnpm, Vercel). The first feature is **Labs** at `/labs`: small interface experiments shown with a preview, code, and an inspector. Read this before adding or changing anything.

## Layout

```
app/                    routes (thin). / and /labs and /labs/[slug] (+ /embed, opengraph-image)
components/ui/          Fluid Functionalism (FF) + shadcn: the site-wide design system. Installed code, do not edit
styles/site.css         our tokens on top of FF: stage / inset surfaces, view transitions, code highlighting
features/labs/          the labs ENGINE (stage, inspector, code panel, cursor runner, registry, data)
labs/<slug>/            the labs CONTENT: one self-contained folder per lab
public/labs/<slug>/     captured thumbnails + hover videos (generated, committed)
scripts/                generate-registry, labs:new, labs:check, labs:capture
```

## Design system

- **FF first, shadcn as fallback.** Use FF components and behaviors for everything; use stock shadcn only when FF has no equivalent. Run the `fluid-functionalism` skill before composing UI or writing motion by hand. Never edit installed FF files to change timing or hover; wrap or compose.
- Base UI flavor, pill shape, Allo (variable, with a ROND roundness axis) for text, Geist Mono for code. Light and dark both, always, via tokens: `bg-background`, `bg-stage`, `bg-inset`, `bg-inset-2`, `text-foreground`, `text-muted-foreground`. **Never hard-code colors** (`labs:check` warns).
- No borders for structure: depth comes from tone (page → stage → inset). Containers use `rounded-[2rem]`/`rounded-[1.5rem]`; buttons and chips are full radius.
- Mobile first: works at 375px, tap targets at least 44px (36px controls get padding), no hover-only interactions. Respect `prefers-reduced-motion` (the root `MotionConfig` handles Motion).
- Motion: springs, no bounce on exits, move with `transform`/`opacity`. Use `@/lib/springs` tokens where FF does; a lab may tune its own timings as long as it stays self-contained.

## Next.js 16 notes

- `cacheComponents` is ON. Request-time reads (`params`, `searchParams`, `cookies()`, `headers()`) must sit under `<Suspense>`; file reads and `Date.now()` must live in a `'use cache'` scope (see `features/labs/data.ts`). Read `node_modules/next/dist/docs/` before using a Next API from memory.
- Route navigations are transitions, so React `<ViewTransition>` works. The whole gallery card and the detail stage section share ``name={`lab-${slug}`}`` with `share="lab-morph"`, so the card morphs into the stage (thumbnail crossfades to the live demo) and back. Rules that keep it working: card links use `prefetch={true}` and `transitionTypes={["lab-open"]}` (the back button uses `"lab-close"`); the stage must render in the same commit as the navigation, so don't put new Suspense boundaries above it; put `<PageTransition>` in each `page.tsx`, not in layouts. Check it in a production build (`pnpm build && pnpm start`): dev does not prefetch the same way, so the pair may not form there.
- In dev, edits to a lab's files in the Code tab are cached; restart the dev server to see them. Captured thumbnails/videos are discovered by `pnpm labs:sync` (run automatically before dev/build and after `labs:capture`), so a new lab's captures appear as soon as the generated file updates.

## Adding a lab

```bash
pnpm labs:new <slug> --title "Title" --interaction Press --tags React,Color
# edit labs/<slug>/, then:
pnpm labs:check               # contract + boundary checks (must pass)
pnpm labs:capture <slug>      # thumbnails + hover video (builds, serves :3100, uses your Chrome; needs ffmpeg for the MP4)
# remove `draft: true`, bump updatedAt, open a PR
```

A lab folder contains:

| File | Purpose |
|---|---|
| `lab.ts` | `defineLab({...})`: title, description, interaction, tags, dates, `files`, `controls`, `cursor`, `thumbStep`, `dependencies`, optional `link`/`video`. `slug` must equal the folder name |
| `<Name>.tsx` | the copy-paste component. Props only; no site imports. This is what the Code tab shows |
| `Demo.tsx` | `"use client"`, default export `Demo({ values })`: maps inspector `values` to the component's props and sets `data-cursor` targets. Not shown in the Code tab |
| `usage.txt` | the Usage snippet |
| `how-it-works.md` | one or two ideas: what state drives it, what moves, why |

Rules for a lab (the boundaries are enforced by ESLint):

1. **Self-contained.** Import only from `@/components/ui/*`, `@/lib/*`, `@/features/labs/{types,define}`, and its own folder. Never another lab, `app/`, or the engine.
2. **Minimal UI.** Build only what the title says. No extra labels, counts, sparkle icons or panels; complexity is earned and disclosed progressively.
3. **Knobs.** Every tunable value is a `controls` entry (`select`, `toggle`, `slider`) with a sensible default. The inspector, Randomize, Reset and share-links come for free. Slider `default` must sit inside `min`/`max`.
4. **Cursor script (optional).** `cursor` is a list of steps (`move`, `click`, `press`, `drag`, `type`, `wait`, `set`) targeting `data-cursor="name"` elements. It powers the play button, the hover video and the thumbnail. Keep it under ~10 seconds and make it end where it started. `thumbStep` is the step index after which the still is captured.
5. **Types of lab.** `kind: "react"` runs live. `kind: "video"` (iOS, macOS, 3D, Wasm…) needs `video: { src, poster? }` under `/public/labs/<slug>/` plus `files` with the key snippets (Swift, Rust, WGSL… are highlighted by extension). App-sized work belongs in Projects, not Labs.
6. **Tags.** `interaction` is one of Hover, Press, Drag, Slide, Swipe, Type, Select, Loading. `tags` are domains: React, iOS, 3D, Vector, Color, Typography, Design System…
7. **Bump `updatedAt`** (YYYY-MM-DD) whenever a lab changes. "New" is derived from `createdAt` (30 days).
8. **Regenerate captures** for any lab whose look or script changed, in the same commit.

## Workflow

- Work on a branch; a PR gets a Vercel preview. Finish a task by posting the preview link.
- Before finishing: `pnpm lint && pnpm typecheck && pnpm labs:check && pnpm build`.
- `features/labs/registry.generated.ts`, `assets.generated.ts` and `demos.generated.tsx` are generated by `pnpm labs:sync` (runs before dev/build). Commit them; never edit by hand.
- When you learn something that would have saved time, add it to this file.

## Sounds

`lib/sound.ts` is a stub. A lab may list `sounds` in its meta for later; nothing plays yet.

## Typography notes

- Allo roundness is **25** (`--allo-rond` in `styles/site.css`). `lib/font-weight.ts` and the weight rules in `globals.css` carry a local patch that appends `'ROND' var(--allo-rond, 25)` to every `font-variation-settings`, because FF sets weight that way and would otherwise reset roundness. Re-apply after a Fluid Functionalism update (`upgrade.mjs` will show the diff). Any new `font-variation-settings` must include ROND.
