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
app/@modal/             the intercepting slot: /labs/[slug] opens as an overlay over the page that linked to it
components/ui/          Fluid Functionalism (FF) + shadcn: the site-wide design system. Installed code, do not edit
styles/site.css         our tokens on top of FF: stage / inset surfaces, live-demo host, code highlighting
features/labs/          the labs ENGINE (live host, cards, detail overlay, inspector, code panel, cursor runner, registry, data)
labs/<slug>/            the labs CONTENT: one self-contained folder per lab
public/labs/<slug>/     captured stills (thumb-{dark,light}.jpg) and, for video labs, the recording (generated/committed)
scripts/                generate-registry, labs:new, labs:check, labs:capture
```

## How Labs work (read before touching the engine)

The model is Bencho's: **one live instance, one gallery that never unmounts, one box that grows.**

- **Live on cards.** A react lab's gallery/teaser card runs the real, interactive demo. It is lazy: nothing mounts until the card is within ~300px of the viewport; a captured still (`Poster`) fills the card until the demo has rendered. A **video** lab's card plays its recording (lazy, muted, loops while visible) and the whole card opens the lab.
- **Single instance (`features/labs/live/host.tsx`).** Each lab's demo is rendered once, into a host element outside any card or stage. Cards and the detail stage own *slots* (`FitSlot`); the host element is moved (appended) into whichever slot claimed it last and scaled by `--fit` to fit. Opening a lab moves the same DOM node and React state from the card into the stage; closing moves it back. Never render a second copy of a demo for the stage, a thumbnail swap, or an iframe. Inspector values live in the provider (`useLabHost().values`), so card and stage always agree.
- **Overlay, not page swap.** From the gallery or the home teaser, `/labs/[slug]` is intercepted by `app/@modal/(.)labs/[slug]` and opens `LabDetail` (`mode="overlay"`) over the still-mounted page. Direct loads (shared links, refresh, crawlers, OG) hit `app/labs/[slug]` and render the same `LabDetail` as a normal page (`mode="page"`).
- **The morph.** In `lab-detail.tsx` the stage "block" starts at the clicked card's exact rectangle (`[data-lab-card="<slug>"]`) and animates its real `left/top/width/height` to the stage rectangle (constant radius, no snapshot scaling); scrim, controls, inspector and info fade in staggered afterwards. Close runs it in reverse (back button, scrim, Esc), then `router.back()`. Browser back/forward unmounts without the reverse animation. Prev/next inside the overlay use `replace` and skip the morph.
- **Rules that keep it working.**
  - Card links must be `<Link prefetch scroll={false}>` to `/labs/<slug>` so the overlay's payload is ready on click.
  - Never wrap a navigation link in an FF/Base UI `Tooltip` (it calls `flushSync` on press).
  - `cacheComponents` keeps closed routes alive (hidden) via Activity, so `LabDetail` is keyed on `useRouter().bfcacheId` and its effects must clean up (host claims, scroll lock, key listener). Slot content from a previous open must never leak into the next.
  - `app/@modal/[...catchAll]` and `default.tsx` return `null`: they are what clear the overlay on soft navigation.
  - A demo's root must be sized by its content (it is centered and scaled to fit its slot). Don't depend on the viewport or a parent's height; fixed intrinsic sizes are fine.
  - Many live demos share a page: scope `document.querySelector` to your own subtree and never rely on global ids; `data-cursor` names are looked up inside the slot first.
- **Check it in a production build** (`pnpm build && pnpm start`); dev compiles routes on demand and doesn't prefetch the same way.

## Design system

- **FF first, shadcn as fallback.** Use FF components and behaviors for everything; use stock shadcn only when FF has no equivalent. Run the `fluid-functionalism` skill before composing UI or writing motion by hand. Never edit installed FF files to change timing or hover; wrap or compose.
- Base UI flavor, pill shape, Allo (variable, with a ROND roundness axis) for text, Geist Mono for code. Light and dark both, always, via tokens: `bg-background`, `bg-stage`, `bg-inset`, `bg-inset-2`, `text-foreground`, `text-muted-foreground`. **Never hard-code colors** (`labs:check` warns).
- No borders for structure: depth comes from tone (page → stage → inset). Containers use `rounded-[2rem]`/`rounded-[1.5rem]`; buttons and chips are full radius.
- Mobile first: works at 375px, tap targets at least 44px (36px controls get padding), no hover-only interactions. Respect `prefers-reduced-motion` (the root `MotionConfig` handles Motion).
- Motion: springs, no bounce on exits, move with `transform`/`opacity`. Use `@/lib/springs` tokens where FF does; a lab may tune its own timings as long as it stays self-contained.

## Next.js 16 notes

- `cacheComponents` is ON. Request-time reads (`params`, `searchParams`, `cookies()`, `headers()`) must sit under `<Suspense>`; file reads and `Date.now()` must live in a `'use cache'` scope (see `features/labs/data.ts`). Read `node_modules/next/dist/docs/` before using a Next API from memory.
- Page-to-page navigations may use `<PageTransition>` (React `<ViewTransition>`); put it in each `page.tsx`, not layouts. Lab detail is **not** a page transition: see "How Labs work".
- In dev, edits to a lab's files in the Code tab are cached; restart the dev server to see them. Captured stills are discovered by `pnpm labs:sync` (run automatically before dev/build and after `labs:capture`), so a new lab's captures appear as soon as the generated file updates.

## Adding a lab

```bash
pnpm labs:new <slug> --title "Title" --interaction Press --tags React,Color
# edit labs/<slug>/, then:
pnpm labs:check               # contract + boundary checks (must pass)
pnpm labs:capture <slug>      # still images for OG + loading placeholder (builds, serves :3100, uses your Chrome)
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
4. **Cursor script (optional).** `cursor` is a list of steps (`move`, `click`, `press`, `drag`, `type`, `wait`, `set`) targeting `data-cursor="name"` elements. It powers the play button on the card and on the stage, and the still. Keep it under ~10 seconds and make it end where it started. `thumbStep` is the step index after which the still is captured.
5. **Two kinds of lab.** `kind: "react"` (the default) is live on the card and in the stage: build it so it looks right at card size (about 380×285) and stage size, and make its natural size content-driven. `kind: "video"` is for iOS, macOS, 3D, Wasm and anything not interactive in a browser: it needs `video: { src, poster? }` (put the file under `/public/labs/<slug>/`) and `files` with the key snippets (Swift, Rust, WGSL… are highlighted by extension). The card plays the recording; the stage shows it with controls. No `Demo.tsx` for video labs. App-sized work belongs in Projects, not Labs.
6. **Tags.** `interaction` is one of Hover, Press, Drag, Slide, Swipe, Type, Select, Loading. `tags` are domains: React, iOS, 3D, Vector, Color, Typography, Design System…
7. **Bump `updatedAt`** (YYYY-MM-DD) whenever a lab changes. "New" is derived from `createdAt` (30 days).
8. **Regenerate stills** (`pnpm labs:capture <slug>`) for any react lab whose look or script changed, in the same commit. They are the OG image and the placeholder before the live demo loads, not what cards show.

## Workflow

- Work on a branch; a PR gets a Vercel preview. Finish a task by posting the preview link.
- Before finishing: `pnpm lint && pnpm typecheck && pnpm labs:check && pnpm build`.
- `features/labs/registry.generated.ts`, `assets.generated.ts` and `demos.generated.ts` are generated by `pnpm labs:sync` (runs before dev/build). Commit them; never edit by hand.
- When you learn something that would have saved time, add it to this file.

## Sounds

`lib/sound.ts` is a stub. A lab may list `sounds` in its meta for later; nothing plays yet.

## Typography notes

- Allo roundness is **25** (`--allo-rond` in `styles/site.css`). `lib/font-weight.ts` and the weight rules in `globals.css` carry a local patch that appends `'ROND' var(--allo-rond, 25)` to every `font-variation-settings`, because FF sets weight that way and would otherwise reset roundness. Re-apply after a Fluid Functionalism update (`upgrade.mjs` will show the diff). Any new `font-variation-settings` must include ROND.
