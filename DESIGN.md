---
name: Dumpstack
description: A short-video sharing platform — raw, dark, mobile-native
colors:
  black: "#000000"
  zinc-950: "#09090b"
  zinc-900: "#18181b"
  zinc-800: "#27272a"
  zinc-700: "#3f3f46"
  zinc-600: "#52525b"
  zinc-500: "#71717a"
  zinc-400: "#a1a1aa"
  zinc-300: "#d4d4d8"
  white: "#ffffff"
  blue-500: "#3b82f6"
  blue-600: "#2563eb"
  blue-700: "#1d4ed8"
  blue-500-10: "rgba(59, 130, 246, 0.1)"
  red-400: "#f87171"
  red-600: "#dc2626"
  red-700: "#b91c1c"
  red-500-10: "rgba(239, 68, 68, 0.1)"
  amber-400: "#fbbf24"
  amber-600: "#d97706"
  amber-700: "#b45309"
  amber-500-10: "rgba(245, 158, 11, 0.1)"
  emerald-400: "#34d399"
  emerald-500-20: "rgba(16, 185, 129, 0.2)"
  rose-400: "#fb7185"
  black-80: "rgba(0, 0, 0, 0.8)"
  black-60: "rgba(0, 0, 0, 0.6)"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.25rem, 5vw, 1.5rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    letterSpacing: "0.08em"
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.75rem"
  xl: "1rem"
  "2xl": "1.5rem"
  full: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.5rem"
  "2xl": "2rem"
components:
  button-primary:
    backgroundColor: "{colors.blue-600}"
    textColor: "{colors.white}"
    rounded: "{rounded.lg}"
    padding: "0.625rem 1rem"
    typography: "body"
  button-primary-hover:
    backgroundColor: "{colors.blue-700}"
  button-destructive:
    backgroundColor: "{colors.red-600}"
    textColor: "{colors.white}"
    rounded: "{rounded.lg}"
    padding: "0.625rem 1rem"
  button-destructive-hover:
    backgroundColor: "{colors.red-700}"
  button-warning:
    backgroundColor: "{colors.amber-600}"
    textColor: "{colors.white}"
    rounded: "{rounded.lg}"
    padding: "0.625rem 1rem"
  button-warning-hover:
    backgroundColor: "{colors.amber-700}"
  input-text:
    backgroundColor: "{colors.zinc-950}"
    textColor: "{colors.white}"
    rounded: "{rounded.lg}"
    padding: "0.625rem 0.75rem"
    borderColor: "{colors.zinc-800}"
  input-text-hover:
    borderColor: "{colors.zinc-600}"
  input-text-focus:
    borderColor: "{colors.blue-500}"
  card-default:
    backgroundColor: "{colors.zinc-900}"
    rounded: "{rounded.lg}"
  card-subtle:
    backgroundColor: "{colors.zinc-950}"
    rounded: "{rounded.lg}"
  card-elevated:
    backgroundColor: "{colors.zinc-900}"
    rounded: "{rounded.lg}"
    borderColor: "{colors.zinc-800}"
  nav-header:
    backgroundColor: "{colors.black-80}"
    textColor: "{colors.zinc-400}"
    rounded: "{rounded.lg}"
  nav-header-active:
    textColor: "{colors.white}"
  nav-bottom:
    backgroundColor: "{colors.black-80}"
    textColor: "{colors.zinc-500}"
  nav-bottom-active:
    textColor: "{colors.white}"
---

# Design System: Dumpstack

## 1. Overview

**Creative North Star: "The Raw Cut"**

Dumpstack lives in darkness — black backgrounds, zinc-toned surfaces, content that commands the full stage. Every design decision serves one goal: get out of the way of the video. Chrome is thin, borders are quiet, hierarchy is flat-on-purpose. This is not "dark mode" — it is dark by nature, dark as identity.

The system explicitly rejects generic AI app aesthetics: no purple gradients, no glassmorphism, no identical card grids, no SaaS clichés. It takes cues from underground culture — raw, unfiltered, energetic. The interface feels like a back-alley venue, not a corporate lobby.

**Key Characteristics:**
- Content-first: video fills 65% of the viewport; UI chrome occupies the remaining edges
- Dark-grounded: pure black body (`#000000`), subtle zinc layers for depth
- Singular accent: blue (`#3b82f6`) is the only action color — used for CTAs, active states, and focus indicators
- Flat-by-default: no shadows except on the slide-out panel (`shadow-xl`); depth is conveyed through tonal layering (black → zinc-950 → zinc-900)
- Mobile-native: `max-w-sm` (384px) content width centered on all screens

## 2. Colors

The palette is intentionally restrained — black foundations with zinc neutrals, one blue accent, and semantic colors for destructive/warning/success states.

### Primary
- **Black** (`#000000`): Body background, full-screen pages. The canvas.
- **Zinc-950** (`#09090b`): Input backgrounds, subtle card surfaces. Nearly black — one step above the body.
- **Zinc-900** (`#18181b`): Card surfaces, panel backgrounds, video container. The primary surface color.
- **Zinc-800** (`#27272a`): Hover states, avatar placeholders, input backgrounds. Border color for dividers.
- **White** (`#ffffff`): Primary text, headings, navigation icons.

### Accent
- **Blue-500** (`#3b82f6`): Primary CTAs, focus rings, active states, following button, link color, language selection, toggle active.
- **Blue-600** (`#2563eb`): Primary button background.
- **Blue-700** (`#1d4ed8`): Primary button hover.

### Semantic
- **Red-400** (`#f87171`): Danger text, error messages, liked heart icon.
- **Red-600** (`#dc2626`): Destructive button background.
- **Amber-400** (`#fbbf24`): Warning text, deactivation icon.
- **Amber-600** (`#d97706`): Warning button background.
- **Emerald-400** (`#34d399`): Success text, confirmation states.

### Neutral Scale
- **Zinc-300** (`#d4d4d8`): Secondary body text, comment content.
- **Zinc-400** (`#a1a1aa`): Tertiary text, icon color, placeholder text, inactive navigation.
- **Zinc-500** (`#71717a`): Muted text, stat labels, search placeholder.
- **Zinc-600** (`#52525b`): Chevron icons, drop zone border.

### Named Rules
**The One Accent Rule.** Blue is the only action color on the page. It appears on buttons, focus rings, active navigation, and links — and nowhere else. Green, red, and amber are strictly semantic (success, error, warning). Diluting the accent role dilutes recognition.

**The Dark Canvas Rule.** The body is always `#000000`. Surfaces stack upward from black through zinc-950 to zinc-900. No light backgrounds, no warm tones, no paper textures. The app exists in darkness.

## 3. Typography

**Display Font:** Geist (with ui-sans-serif, system-ui fallback)
**Body Font:** Geist (same family, variable weight)
**Label/Mono Font:** Geist Mono (with ui-monospace fallback)

**Character:** Single-family discipline — Geist across all roles. Hierarchy is achieved through weight, size, and color, not font changes. This keeps the interface unified and the typography invisible.

### Hierarchy
- **Display** (700, `clamp(1.25rem, 5vw, 1.5rem)`, 1.2, -0.02em): Brand name in header. Purposely restrained — never competing with content.
- **Headline** (600, `1.125rem`, 1.3): Section titles, view titles in hamburger menu.
- **Title** (500, `1rem`, 1.4): Panel titles, profile name.
- **Body** (400, `0.875rem`, 1.5): The default — buttons, inputs, comments, descriptions, menu rows. Primary reading size.
- **Label** (500/600, `0.75rem`, 1.5, 0.08em uppercase): Section headings, meta labels. Used sparingly.
- **Caption** (400, `0.75rem`, 1.4): Dates, timestamps, secondary metadata.

### Named Rules
**The Single Family Rule.** Geist Sans carries everything. No serif, no second sans. Hierarchy comes from weight (400 → 500 → 600 → 700 → 900) and color (white → zinc-300 → zinc-400 → zinc-500), not from font switching.

## 4. Elevation

Dumpstack uses **tonal layering** instead of shadows. Depth is communicated by stepping up from the black body through progressively lighter zinc backgrounds:

| Layer | Background | Example |
|-------|-----------|---------|
| Body | `bg-black` (`#000000`) | Page background |
| Surface | `bg-zinc-950` (`#09090b`) | Input fields |
| Card | `bg-zinc-900` (`#18181b`) | Video cards, panels, auth forms |
| Elevated | `bg-zinc-900` + `border-zinc-800` | Hamburger menu panel, share sheet |

The only exception is the hamburger menu panel, which uses `shadow-xl` to separate it from the overlay behind it. Everywhere else, a thin `border-zinc-800` (`1px`) provides the separation between surfaces.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. No card shadows, no lifted buttons, no dropdown depth. The tonal layer (black → zinc-950 → zinc-900) establishes hierarchy without faux-3D. Borders at `border-zinc-800` are the only separators.

## 5. Components

### Buttons

- **Shape:** Soft corners — rounded-lg (12px) for all buttons.
- **Primary** (`bg-blue-600 text-white`): Submit, save, confirm actions. Hover deepens to `bg-blue-700`.
- **Destructive** (`bg-red-600 text-white`): Delete account, irreversible actions. Hover deepens to `bg-red-700`.
- **Warning** (`bg-amber-600 text-white`): Deactivate account. Hover deepens to `bg-amber-700`.
- **Ghost Menu Row** (`text-zinc-300 hover:bg-zinc-800`): Hamburger menu items. No border, full-width, left-aligned.
- **Danger Menu Row** (`text-red-400 hover:bg-red-500/10`): Destructive menu items. Same ghost shape, red tinted.
- **Header Icon** (`h-8 w-8 rounded-lg text-zinc-400 hover:text-white`): Icon-only buttons in the header bar.
- **Follow/Unfollow** (`rounded-lg border px-3 py-1 text-xs`): Outline button with `border-blue-500` (follow) / `border-zinc-600` (following).
- **Transitions:** All buttons use `transition-colors` — background color changes, no movement, no scale transforms.

### Inputs / Fields

- **Style:** Dark input on dark surface (`bg-zinc-950` or `bg-zinc-900`), thin `border-zinc-800` stroked border, `rounded-lg` corners.
- **Text:** White text (`text-white`), placeholder at `text-zinc-500`.
- **Focus:** Border shifts to `border-zinc-600` (subtle) or `border-blue-500` (search, primary inputs). No glow, no ring by default — some inputs use `ring-2 ring-blue-500` when focus needs extra clarity.
- **Error:** Border shifts to `border-red-600` on validation error.
- **Textarea:** Same treatment as inputs, plus `resize-none` and optional `h-24` height constraint.
- **Disabled:** `opacity-50` with no pointer events.

### Cards / Containers

- **Video Card** (`relative h-[65vh] overflow-hidden rounded-lg bg-zinc-900`): The hero component. Fills 65% of the viewport height, dark zinc-900 background, rounded corners.
- **Auth Form Card** (`w-full max-w-sm rounded-lg bg-zinc-900 p-8`): Center-aligned card for login/register.
- **Status Card** (`rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center`): Slightly elevated card for reactivation, status messages.
- **Surface Card** (`rounded-lg border border-zinc-800 bg-zinc-900/50 p-4`): Generic card for stat displays, blocked users, account management.
- **Search Result Card** (`rounded-lg bg-black px-4 py-3 hover:bg-zinc-900`): Darker-than-surface card for search results. Hover lifts it to zinc-900.

### Navigation

- **Header** (`fixed top-0 z-50 bg-black/80 backdrop-blur-sm border-b border-zinc-800`): Fixed top bar with glass effect. Three-column grid layout (left icon, center brand, right icon). Brand is `text-lg font-bold tracking-tight text-white`. Icons are `text-zinc-400 hover:text-white`.
- **BottomNav** (`fixed bottom-0 z-50 bg-black/80 backdrop-blur-sm border-t border-zinc-800`): Fixed bottom bar. Items are `flex flex-col gap-0.5 text-xs` — active is `text-white`, inactive is `text-zinc-500 hover:text-zinc-300`.
- **Hamburger Panel** (`fixed right-0 top-0 z-[70] w-80 max-w-[85vw] bg-zinc-900 shadow-xl`): Slide-out drawer with `translate-x` animation. View headers have `border-b border-zinc-800`. Menu rows are `py-3.5 px-4` with hover state.
- **Sub-page Navigation** (`flex items-center gap-3`): Back arrow + page title pattern for all sub-views (stats, blocked, filters, terms).

### Chips / Labels

- **Language Selector:** `rounded-lg border px-4 py-3` with `border-zinc-800` default, `border-blue-500 bg-blue-500/10` selected.
- **Toggle:** `relative h-6 w-11 rounded-full` — `bg-blue-600` (on) / `bg-zinc-700` (off), with `h-5 w-5` white knob.
- **Status Badges:** Not used. Status is communicated through icon + color (amber for warning, red for error, emerald for success) inside full-width message containers.

### Navigation Component Icons

- **Avatar (profile):** `h-24 w-24 rounded-full bg-zinc-800` — 96px circle for profile page.
- **Avatar (search result):** `h-10 w-10 rounded-full bg-zinc-700` — 40px circle.
- **Avatar (comment):** `h-8 w-8 rounded-full bg-zinc-800` — 32px circle.
- **Avatar (bottom nav):** `h-6 w-6 rounded-md border border-zinc-500 bg-zinc-700` — 24px square with rounded-md.

## 6. Do's and Don'ts

### Do:
- **Do** use black (`#000000`) as the body background everywhere — no exceptions.
- **Do** use zinc-900 for surface/card backgrounds. It's the primary surface color.
- **Do** use blue-600 for primary actions — one accent, used consistently.
- **Do** use `border-zinc-800` as the default separator. It's subtle and consistent.
- **Do** keep content width constrained to `max-w-sm` (384px) centered in the viewport.
- **Do** use `transition-colors` for all interactive states — simple, performant, sufficient.
- **Do** use tonal layering (black → zinc-950 → zinc-900) instead of shadows for depth.
- **Do** truncate button labels to one line. No wrapped CTA text.
- **Do** keep the video as the hero — 65vh container, minimal chrome around it.
- **Do** use Geist exclusively. One family, variable weight for hierarchy.

### Don't:
- **Don't** use purple gradients, glassmorphism, or neon accents. This is not a generic AI app.
- **Don't** use `bg-zinc-900` as page background. The body is always black.
- **Don't** add shadows to cards, buttons, or surfaces. The only exception is the hamburger panel (`shadow-xl`).
- **Don't** use multiple accent colors. Blue is the only action color. Green, red, amber are semantic only.
- **Don't** use three identical cards in a row. Vary card layouts or skip cards entirely.
- **Don't** put em-dashes (`—`) or en-dashes (`–`) anywhere in visible text. Use a hyphen (`-`).
- **Don't** use emoji as icons. Use inline SVG icons.
- **Don't** use `h-screen` — use `min-h-[100dvh]` for mobile viewport stability.
- **Don't** use generic placeholder names, avatars, or numbers. Keep data real or explicitly marked as sample.
- **Don't** mix surface colors. Page = black, card = zinc-900, elevated = zinc-900 + border. No zinc-700 bodies, no zinc-800 cards.
- **Don't** animate layout properties (width, height, margin, padding). Animate only `transform` and `opacity`.
- **Don't** add scroll cues, version labels, or decorative text strips to the UI.
