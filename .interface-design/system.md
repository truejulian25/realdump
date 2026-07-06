# Dumpstack — Interface Design System

## Direction & Feel

Raw, dark, mobile-native. Black canvas, zinc-toned surfaces, blue single accent. Content-first — video commands the stage, chrome stays thin.

## Depth Strategy

- **Borders-only** — no shadows (except hamburger panel). `border-zinc-800` (`rgba(255,255,255,0.1)`) as the universal separator.
- **Tonal layering** — body `#000000` → surface `bg-zinc-950` (`#09090b`) → card `bg-zinc-900` (`#18181b`).
- No `active:scale` transforms on buttons — `transition-colors` only.

## Spacing Base

- **Base unit:** 4px, used in multiples.
- **Page content:** `max-w-sm` (384px) centered `mx-auto`, `px-4 py-6`.
- **Header gap:** `gap-3` between back arrow and title.
- **Form spacing:** `gap-5` between fields.
- **Card spacing:** `gap-0.5` for video grids, `gap-3` for stat grids.

## Hierarchy Decisions

- **Type scale ratio:** ~1.25.
- **Size/weight/color levers:**
  - Page title: `text-lg font-bold text-white`
  - Body/default: `text-sm text-zinc-300`
  - Label: `text-xs text-zinc-400`
  - Placeholder: `text-zinc-500`
  - Muted/desc: `text-xs text-zinc-500`

## Sub-page Pattern (all secondary views)

```
┌─────────────────────────────┐
│  ←  Título de la página     │  min-h-screen bg-black pt-14 pb-20
├─────────────────────────────┤
│  mx-auto w-full max-w-sm    │
│  px-4 py-6                  │
│                             │
│  [content]                  │
│                             │
└─────────────────────────────┘
```

- **Header:** `flex items-center gap-3 mb-6` — back arrow SVG + `h1.text-lg.font-bold.text-white`.
- **Back arrow:** `<Link href="/profile">` with same SVG chevron.
- **Max width:** Always `max-w-sm` centered.

## Component Styles

### Buttons
- **Primary:** `rounded-lg bg-blue-600 py-2.5 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50`
- **Destructive:** `rounded-lg bg-red-600 text-white hover:bg-red-700`
- **Ghost:** `text-zinc-300 hover:bg-zinc-800`
- Full width when inside form: prepend `w-full`
- No `active:scale` or motion transforms

### Inputs / Textareas
- **Default:** `rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-blue-500`
- **Focus:** blue-500 border, no ring
- **Textarea:** add `resize-none`

### Cards
- **Stat card:** `rounded-xl border border-zinc-800 bg-zinc-900/50 p-4`
- **Blocked user row:** `rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3`
- **Drop zone:** `rounded-lg border-2 border-dashed border-zinc-800 bg-zinc-900 hover:border-blue-500`

### Empty States
- Container: `flex flex-col items-center justify-center py-16 text-center`
- Icon: `rounded-full bg-zinc-800 p-4 text-zinc-500`
- Title: `text-sm text-zinc-400`
- Description: `mt-1 text-xs text-zinc-600`

### Loading States
- Spinner: `flex min-h-screen items-center justify-center bg-black pt-14 pb-20` + `p.text-zinc-400` with loading text

## Auth Guard Pattern
- Always redirect with `router.push("/auth/login")` when `!user`
- Return `null` during redirect (not spinner)

## Pages Covered

| Route | Pattern | Notes |
|---|---|---|
| `/upload` | Sub-page + form | Drop zone + inputs + submit |
| `/profile/edit` | Sub-page + form | Avatar + fields + save |
| `/saved` | Sub-page + grid | 3-col video grid |
| `/profile/stats` | Sub-page + cards | 2-col stat cards |
| `/profile/blocked` | Sub-page + list | User rows + unblock |
| `/profile/filters` | Sub-page + form | Textareas + toggle + save |
