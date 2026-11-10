---
name: SkyRig
description: Weather-aware truck routing. A dark-first product UI built on shadcn/ui and Tailwind CSS v4.
implementation: apps/web/src/index.css
colors:
  # Dark theme (default). Light values are listed under colors-light.
  canvas: "#08090c"
  surface-1: "#0f1115"
  surface-2: "#16181d"
  surface-3: "#1d2027"
  surface-4: "#252831"
  hairline: "#23262d"
  hairline-strong: "#2e323b"
  hairline-tertiary: "#3a3f4a"
  ink: "#f4f6f8"
  ink-muted: "#c9d1db"
  ink-subtle: "#8b939e"
  ink-tertiary: "#5f6670"
  primary: "#38bdf8"
  on-primary: "#04121c"
  destructive: "#f87171"
  success: "#22c55e"
  risk-low: "#22c55e"
  risk-moderate: "#eab308"
  risk-high: "#f97316"
  risk-severe: "#ef4444"
  risk-no-travel: "#a855f7"
  route-selected: "#38bdf8"
  route-alternate: "#5f6670"
colors-light:
  canvas: "#fbfbfc"
  surface-1: "#ffffff"
  surface-2: "#f4f5f7"
  surface-3: "#eceef1"
  surface-4: "#e3e6ea"
  hairline: "#e4e7ec"
  hairline-strong: "#d3d8df"
  hairline-tertiary: "#c3c9d2"
  ink: "#0b0d12"
  ink-muted: "#3c434e"
  ink-subtle: "#6b7380"
  ink-tertiary: "#9aa1ab"
  primary: "#0284c7"
  on-primary: "#ffffff"
  destructive: "#dc2626"
  success: "#16a34a"
  risk-low: "#16a34a"
  risk-moderate: "#ca8a04"
  risk-high: "#ea580c"
  risk-severe: "#dc2626"
  risk-no-travel: "#9333ea"
  route-selected: "#0284c7"
  route-alternate: "#9aa1ab"
typography:
  display: { size: 40px, weight: 600, lineHeight: 1.1, letterSpacing: -1.2px }
  headline: { size: 28px, weight: 600, lineHeight: 1.2, letterSpacing: -0.6px }
  title: { size: 20px, weight: 600, lineHeight: 1.3, letterSpacing: -0.3px }
  card-title:
    { size: 16px, weight: 600, lineHeight: 1.35, letterSpacing: -0.2px }
  body-lg: { size: 16px, weight: 400, lineHeight: 1.5, letterSpacing: -0.1px }
  body: { size: 14px, weight: 400, lineHeight: 1.5, letterSpacing: -0.05px }
  body-sm: { size: 13px, weight: 400, lineHeight: 1.45, letterSpacing: 0 }
  caption: { size: 12px, weight: 400, lineHeight: 1.4, letterSpacing: 0 }
  eyebrow:
    {
      size: 11px,
      weight: 500,
      lineHeight: 1.3,
      letterSpacing: 0.4px,
      transform: uppercase,
    }
  button: { size: 14px, weight: 500, lineHeight: 1.2, letterSpacing: 0 }
  data:
    {
      size: 14px,
      weight: 500,
      lineHeight: 1.4,
      letterSpacing: 0,
      numeric: tabular-nums,
    }
  mono: { size: 13px, weight: 400, lineHeight: 1.5, letterSpacing: 0 }
rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  2xl: 24px
  pill: 9999px
spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 64px
---

# SkyRig Design System

## Overview

SkyRig is a working tool, not a marketing site. A driver or dispatcher enters a trip, compares three
routes, and reads weather risk off a map. The interface stays **dark, quiet and dense** so that the
only loud things on screen are the ones that matter: **the risk colors on the map** and **the one
recommended route**.

The canvas is `{colors.canvas}` (#08090c): near-black with a faint blue tint, never pure `#000`. A
four-step surface ladder (`{colors.surface-1}` → `{colors.surface-4}`) separates panels, cards and
popovers without shadows. Hairline borders (`{colors.hairline}` #23262d and stronger steps) draw the
edges. Text is light gray `{colors.ink}` (#f4f6f8), stepping down through muted, subtle and tertiary.

The single brand accent is **SkyRig sky blue** `{colors.primary}` (#38bdf8), taken from the logo's
trailer. It's used sparingly: the primary button, focus rings, links, the selected route line and the
"Recommended" badge. Everything else is neutral.

The second color system is the **risk scale**, a fixed five-step ramp from green to purple. It has one
meaning (weather risk at a checkpoint) and is never used for decoration, branding or generic status.

Built on **shadcn/ui** (Radix base, Nova preset) with **Tailwind CSS v4**. Every token in this file
maps to a CSS variable in `apps/web/src/index.css`, so components consume tokens as Tailwind
utilities (`bg-surface-2`, `text-ink-subtle`, `bg-risk-severe`). Hex values are never written in
components.

**Key characteristics:**

- **Dark-first.** `<html class="dark">` is the default; a full light theme exists for daylight use.
- **One brand accent** (sky blue), used only for action, focus and selection.
- **Risk colors are data, not decoration.** Green → yellow → orange → red → purple, meaning fixed.
- **Hierarchy through surface lift + hairlines**, not shadows.
- **Product density:** 14px body, 32px controls, 12px radius on controls and cards.
- **shadcn components are used as generated** by the CLI; the look comes from tokens, not code edits.
- **The map is the protagonist.** Chrome stays out of its way.
- The logo's orange stays in the logo. It is not a UI color, because it would read as "High risk".

## Colors

> Source of truth: `apps/web/src/index.css` (`.dark` = default, `:root` = light).

### Brand & Accent

- **Sky Blue** (`{colors.primary}` #38bdf8): primary button, focus ring, links, selected route,
  "Recommended" badge, slider range.
- **Hover / pressed:** primary at 80% opacity (`hover:bg-primary/80`), the shadcn default.
- **On Primary** (`{colors.on-primary}` #04121c): text on sky-blue fills. Dark text, because sky
  blue is light.

### Surface

| Token                        | Dark      | Use                                                        |
| ---------------------------- | --------- | ---------------------------------------------------------- |
| `{colors.canvas}`            | `#08090c` | Page background, top bar, map letterbox                    |
| `{colors.surface-1}`         | `#0f1115` | Planner side panel, cards, inputs                          |
| `{colors.surface-2}`         | `#16181d` | Selected route card, popovers, map popups, toggle selected |
| `{colors.surface-3}`         | `#1d2027` | Hover fills, slider track, menu item hover                 |
| `{colors.surface-4}`         | `#252831` | Deepest lift: nested hover inside a popover, skeletons     |
| `{colors.hairline}`          | `#23262d` | Default 1px borders and dividers                           |
| `{colors.hairline-strong}`   | `#2e323b` | Input borders, popover borders, hovered card border        |
| `{colors.hairline-tertiary}` | `#3a3f4a` | Borders on nested surfaces, slider tick marks              |

### Text

- **Ink** (`{colors.ink}` #f4f6f8): headings, values, primary body.
- **Ink Muted** (`{colors.ink-muted}` #c9d1db): secondary body, popup values.
- **Ink Subtle** (`{colors.ink-subtle}` #8b939e): labels, meta, units ("mi", "lb", "mph").
- **Ink Tertiary** (`{colors.ink-tertiary}` #5f6670): disabled, placeholders, footnotes.

### Risk Scale

The five levels from the spec's risk rules. Use exactly these, in this order, everywhere: map
markers, heatmap cells, badges, the route risk bar and the legend.

| Level     | Token                     | Dark      | Light     |
| --------- | ------------------------- | --------- | --------- |
| Low       | `{colors.risk-low}`       | `#22c55e` | `#16a34a` |
| Moderate  | `{colors.risk-moderate}`  | `#eab308` | `#ca8a04` |
| High      | `{colors.risk-high}`      | `#f97316` | `#ea580c` |
| Severe    | `{colors.risk-severe}`    | `#ef4444` | `#dc2626` |
| No Travel | `{colors.risk-no-travel}` | `#a855f7` | `#9333ea` |

Risk color is never the only signal. It is always paired with a label, an icon or position in the
legend (see Accessibility).

### Map Routes

- **Selected route** (`{colors.route-selected}`): sky blue, matching the brand accent.
- **Alternate routes** (`{colors.route-alternate}`): neutral gray, so only one route competes with
  the risk colors.

### Semantic

- **Destructive** (`{colors.destructive}` #f87171): form errors, failed requests, destructive
  actions. Softer than `risk-severe` so an error message doesn't read as a weather warning.
- **Success** (`{colors.success}`): "API connected" and similar system confirmations only.

### shadcn Variable Mapping

| shadcn variable          | Dark value                | Light value       |
| ------------------------ | ------------------------- | ----------------- |
| `--background`           | canvas                    | canvas            |
| `--foreground`           | ink                       | ink               |
| `--card`                 | surface-1                 | surface-1         |
| `--popover`              | surface-2                 | surface-1         |
| `--primary`              | `#38bdf8`                 | `#0284c7`         |
| `--primary-foreground`   | `#04121c`                 | `#ffffff`         |
| `--secondary`, `--muted` | surface-2                 | surface-2         |
| `--muted-foreground`     | ink-subtle                | ink-subtle        |
| `--accent`               | surface-3                 | surface-3         |
| `--border`               | hairline                  | hairline          |
| `--input`                | hairline-strong           | hairline-strong   |
| `--ring`                 | primary                   | primary           |
| `--destructive`          | `#f87171`                 | `#dc2626`         |
| `--chart-1…5`            | sky, indigo, teal, slate… | same hues, darker |
| `--sidebar-*`            | surface-1 family          | surface-1 family  |

Chart colors deliberately avoid the risk hues, so a chart never looks like a risk reading.

## Typography

### Font Family

- **Inter Variable**: all UI text, from display to caption. Self-hosted via
  `@fontsource-variable/inter`. Stylistic sets `cv11` and `ss01` are on for clearer numerals.
- **JetBrains Mono Variable**: coordinates, timestamps in popups, IDs, raw API values. Self-hosted
  via `@fontsource-variable/jetbrains-mono`.

Numbers that change or get compared (ETAs, miles, mph, inches/hr, weights) use **`tabular-nums`**
so columns and live slider values don't jitter.

### Hierarchy

| Token                     | Size | Weight | Line Height | Letter Spacing | Use                                    |
| ------------------------- | ---- | ------ | ----------- | -------------- | -------------------------------------- |
| `{typography.display}`    | 40px | 600    | 1.10        | -1.2px         | Empty-state hero only                  |
| `{typography.headline}`   | 28px | 600    | 1.20        | -0.6px         | Page titles (rare in-app)              |
| `{typography.title}`      | 20px | 600    | 1.30        | -0.3px         | Panel titles ("Plan a trip", "Routes") |
| `{typography.card-title}` | 16px | 600    | 1.35        | -0.2px         | Route card name, popup heading         |
| `{typography.body-lg}`    | 16px | 400    | 1.50        | -0.1px         | Recommendation explanation             |
| `{typography.body}`       | 14px | 400    | 1.50        | -0.05px        | Default UI text, inputs                |
| `{typography.body-sm}`    | 13px | 400    | 1.45        | 0              | Card meta, helper text                 |
| `{typography.caption}`    | 12px | 400    | 1.40        | 0              | Legend, badges, slider tick labels     |
| `{typography.eyebrow}`    | 11px | 500    | 1.30        | +0.4px, UPPER  | Section labels ("ORIGIN", "LOAD")      |
| `{typography.button}`     | 14px | 500    | 1.20        | 0              | All button labels                      |
| `{typography.data}`       | 14px | 500    | 1.40        | 0, tabular     | ETAs, distances, durations, risk miles |
| `{typography.mono}`       | 13px | 400    | 1.50        | 0              | Coordinates, timestamps, IDs           |

### Principles

- **Weights stay between 400 and 600.** No 700+ in the product.
- **Negative tracking only at 16px and up**, scaling with size. Eyebrows use positive tracking.
- **Units are quieter than values:** `412` in ink and `mi` in ink-subtle.
- **Times show the local zone of the place**, e.g. `Tue 14:00 CST`, in `{typography.data}`.

## Layout

### Spacing System

- **Base unit:** 4px. Tokens: `{spacing.xxs}` 4 · `{spacing.xs}` 8 · `{spacing.sm}` 12 ·
  `{spacing.md}` 16 · `{spacing.lg}` 24 · `{spacing.xl}` 32 · `{spacing.xxl}` 48 ·
  `{spacing.section}` 64.
- **Panel padding:** `{spacing.lg}` 24px on desktop, `{spacing.md}` 16px on mobile.
- **Card padding:** `{spacing.md}` 16px, with `{spacing.sm}` 12px gaps between card rows.
- **Form field stack:** `{spacing.md}` 16px between fields, `{spacing.xs}` 8px between label and
  input.
- **Controls:** shadcn sizes as generated: `default` 32px (`h-8`), `lg` 36px (`h-9`), `sm` 28px. Use
  `lg` for the main form action.

### App Shell

```
┌──────────────────────────────────────────────────────────────┐
│ top-bar (56px, canvas, hairline bottom)                      │
├──────────────────┬───────────────────────────────────────────┤
│ planner-panel    │                                           │
│ 400px, surface-1 │              map (fills)                  │
│ hairline right   │                                           │
│  · trip form     │                           ┌─────────────┐ │
│  · route cards   │                           │ risk-legend │ │
│  · recommendation│  ┌────────────────────────┴─────────────┤ │
│                  │  │ forecast-timeline (floating, 0–48 h) │ │
└──────────────────┴──┴──────────────────────────────────────┴─┘
```

- The **planner panel** scrolls on its own; the map never scrolls.
- **Map overlays** (legend, forecast timeline, zoom controls) float on `{colors.surface-2}` with a
  `{colors.hairline-strong}` border and `{rounded.lg}`, inset `{spacing.md}` from the map edges.

### Whitespace Philosophy

The dark canvas does the separating. Panels lift onto surface-1, and selected or open things lift
one step more. Keep the panel dense but aligned: one left edge, one value column.

## Elevation & Depth

| Level | Treatment                                                          | Use                                     |
| ----- | ------------------------------------------------------------------ | --------------------------------------- |
| 0     | `{colors.canvas}`, no border                                       | Page, top bar                           |
| 1     | `{colors.surface-1}` + 1px `{colors.hairline}`                     | Planner panel, route cards, inputs      |
| 2     | `{colors.surface-2}` + 1px `{colors.hairline-strong}`              | Selected route card, popovers, overlays |
| 3     | `{colors.surface-3}`                                               | Hover fill, active menu item            |
| Focus | 3px `{colors.primary}` ring at 50% opacity (`ring-3 ring-ring/50`) | Every focusable control                 |

- **Shadows:** none on surfaces. Only floating layers that cover the map (popovers, map popups,
  overlays) may use one soft shadow, `0 8px 24px rgb(0 0 0 / 0.4)`, so they separate from busy
  map tiles.
- **No gradients, glows or glass blur** on chrome. The heatmap is the only "atmosphere".

## Shapes

### Border Radius Scale

| Token            | Value  | Use                                               |
| ---------------- | ------ | ------------------------------------------------- |
| `{rounded.xs}`   | 4px    | Legend swatches, small chips                      |
| `{rounded.sm}`   | 6px    | Inline tags, toggle-group items                   |
| `{rounded.md}`   | 8px    | Small buttons (`xs`/`sm` sizes), menu items       |
| `{rounded.lg}`   | 12px   | **Buttons, inputs**, cards, popovers, overlays    |
| `{rounded.xl}`   | 16px   | The map frame on desktop                          |
| `{rounded.2xl}`  | 24px   | Mobile bottom-sheet top corners                   |
| `{rounded.pill}` | 9999px | Risk badges, status pills, risk bar, slider thumb |

Tailwind: `rounded-xs` … `rounded-2xl` map to these values exactly (overridden in `@theme`).

## Components

Names in `code` are the design tokens. The shadcn component each one builds on is in brackets.

### Buttons (`ui/button`)

- **`button-primary`** (`variant="default"`): `{colors.primary}` fill, `{colors.on-primary}` text,
  `{typography.button}`, `{rounded.lg}`. Hover at primary/80. Use `size="lg"` for the main form
  action. **One per view:** "Plan routes".
- **`button-secondary`** (`variant="secondary"`): `{colors.surface-2}` fill, `{colors.ink}` text.
  For "Swap origin/destination" or "Reset".
- **`button-outline`** (`variant="outline"`): transparent with a `{colors.hairline-strong}` border.
  For map overlay actions.
- **`button-ghost`** (`variant="ghost"`): no fill until hover (`{colors.surface-3}`). For icon
  buttons: theme toggle, play/pause, zoom.
- **`button-destructive`**: only for clearing a planned trip.

### Trip Form (`ui/input`, `ui/label`, `ui/popover`, `ui/command`, `ui/calendar`, `ui/toggle-group`)

- **`text-input`**: shadcn `ui/input` as generated: `{colors.input}` border, `{rounded.lg}`, 32px,
  `{typography.body}`. Placeholder `{colors.ink-tertiary}`. Focus: border `{colors.ring}` + ring.
- **`location-combobox`**: origin and destination. A text input that opens a `{colors.surface-2}`
  popover of geocoding results. Each result shows the place name in ink and the region in ink-subtle.
- **`datetime-picker`**: departure. A button-styled input showing `Tue, Nov 12 · 06:00`, which opens
  a calendar and a time list.
- **`weight-input`**: number input with a trailing `lb` suffix in ink-subtle, and thousands
  separators.
- **`interval-toggle`**: checkpoint spacing `10 | 25 | 50 mi`. A segmented control on
  `{colors.surface-1}`; the selected item lifts to `{colors.surface-2}` with ink text, and the others
  stay ink-subtle. Selection is shown by surface lift, not color.
- **`field-label`**: `{typography.eyebrow}` in ink-subtle above each field.
- **`field-error`**: `{typography.body-sm}` in `{colors.destructive}` under the field, and the input
  gets `aria-invalid` (destructive border + ring).

### Route Cards (`ui/card`, `ui/badge`)

- **`route-card`**: `{colors.surface-1}`, 1px `{colors.hairline}`, `{rounded.lg}`, `{spacing.md}`
  padding. Rows: name + badges · duration and distance (`{typography.data}`) · `risk-bar` · risk
  miles summary ("12 mi Severe · 30 mi High"). Hover: border `{colors.hairline-strong}`.
- **`route-card-selected`**: lifts to `{colors.surface-2}` with a 1px `{colors.primary}` border at
  60% opacity. Its line on the map is `{colors.route-selected}`.
- **`recommended-badge`**: `{colors.primary}` text on `{colors.primary}` at 15% opacity, sparkle or
  check icon, `{rounded.pill}`, `{typography.caption}` 500. Only one route ever has it.
- **`recommendation-note`**: under the cards, a `{typography.body-sm}` sentence explaining why, e.g.
  "Fewest Severe miles (0 vs 18); 25 min slower than the fastest."

### Risk Display

- **`risk-badge`**: 6px dot + label, text in the risk color, background in the same color at 15%,
  `{rounded.pill}`, `{typography.caption}` 500, padding 2px 8px. "No Travel" adds a ban icon.
- **`risk-bar`**: 6px-tall stacked bar, `{rounded.pill}`, one segment per risk level sized by
  miles, in fixed order Low → No Travel. The tooltip lists miles per level.
- **`risk-legend`**: map overlay with five `{rounded.xs}` swatches, each with a label in
  `{typography.caption}`, plus a "Heatmap: +18 h" line in ink-subtle.

### Map (MapLibre GL)

- **Basemap:** a dark, low-contrast vector style (labels in ink-subtle, roads in hairline grays).
  It switches to a light style in light theme.
- **`route-line`**: selected is 5px `{colors.route-selected}` with a 2px `{colors.canvas}` casing.
  Alternates are 3px `{colors.route-alternate}`, drawn underneath. Clicking an alternate selects it.
- **`checkpoint-marker`**: 10px circle in its risk color with a 2px `{colors.canvas}` ring. Hover or
  selected: 14px with a 2px `{colors.ink}` ring. Markers only show for the selected route.
- **`map-popup`** (`ui/popover` look): `{colors.surface-2}`, 1px `{colors.hairline-strong}`,
  `{rounded.lg}`, `{spacing.sm}` padding, max 280px. Content: mile marker and ETA
  (`{typography.data}`), `risk-badge`, then wind / rain / snow rows (label ink-subtle, value ink
  tabular), with the condition that set the risk level marked by a small dot.
- **`heatmap-layer`**: a grid of square cells along the corridor in risk colors. Low at 12% opacity,
  Moderate 30%, High 40%, Severe 50%, No Travel 55%. Calm areas stay quiet, dangerous areas glow.
  It sits below the route lines and markers.

### Forecast Timeline (`ui/slider`)

- **`forecast-timeline`**: floating overlay along the bottom of the map. Left: `button-ghost`
  play/pause. Center: slider 0–48 h, track `{colors.surface-3}`, range `{colors.primary}`, 16px
  thumb in `{colors.ink}` with a `{colors.primary}` ring. Ticks every 6 h with caption labels
  ("Now", "+6h" … "+48h"). Right: current time in `{typography.data}` ("+18h · Tue 14:00").
- **`departure-marker`**: a 2px `{colors.primary}` tick on the track at the departure hour, and a
  thin bracket spanning the trip's arrival window.
- Moving the slider only restyles the heatmap. The map never re-renders.

### Feedback (`ui/skeleton`, `ui/alert`, `ui/sonner`, `ui/tooltip`)

- **`loading-state`**: route cards render as `{colors.surface-2}` skeleton blocks with the same
  shape. The map shows an inline "Fetching forecasts…" pill (surface-2, caption).
- **`empty-state`**: before the first search, the panel shows a short `{typography.title}` heading,
  one body-sm line, and the form.
- **`error-alert`**: `{colors.destructive}` icon and title on `{colors.surface-1}`, 1px destructive
  border at 40%, plus a "Try again" `button-secondary`.
- **`toast`**: bottom-right, surface-2 with hairline-strong. For non-blocking notices ("Only 2 routes
  found; 1 alternate generated").
- **`tooltip`**: `{colors.surface-4}` with ink, `{typography.caption}`, `{rounded.sm}`.

### Navigation

- **`top-bar`**: 56px, `{colors.canvas}`, 1px `{colors.hairline}` bottom. Left: 28px logo mark +
  "SkyRig" wordmark in `{typography.card-title}`. Right: `button-ghost` theme toggle.

## Do's and Don'ts

### Do

- Keep `{colors.primary}` for action, focus, selection and links only.
- Use risk colors **only** to mean risk level, always with a label or icon too.
- Lift with surfaces (1 → 2 → 3) and draw edges with hairlines.
- Use `tabular-nums` for every live or compared number.
- Add shadcn components only with the CLI (`pnpm dlx shadcn@latest add <name>`) and keep them as
  generated. Change the look through tokens in `index.css`; compose new pieces in feature
  components instead of editing `components/ui/`.
- Show units in ink-subtle next to values in ink.
- Keep one `button-primary` per view.

### Don't

- Don't use pure `#000000` for the canvas or pure `#ffffff` text on dark.
- Don't use orange, red, yellow, green or purple for anything that isn't risk.
- Don't use the logo's orange as a UI color.
- Don't fill large areas (cards, panels, sections) with sky blue.
- Don't add drop shadows to cards or panels, or gradients and glass blur to chrome.
- Don't pill-round buttons or inputs.
- Don't hand-write or hand-edit files in `components/ui/`; regenerate them with
  `shadcn add <name> --overwrite`.
- Don't write hex values in components; add a token first.
- Don't animate the map or heatmap on slider drag beyond the frame swap.

## Accessibility

- Text contrast meets WCAG AA: ink, ink-muted and ink-subtle on canvas and surfaces 1–2.
  Ink-tertiary is for disabled and placeholder text only.
- **Risk is never color-only:** badges have labels, markers have popups, the legend names every
  level, and "No Travel" adds an icon.
- Every interactive element has a visible focus ring (`ring-3 ring-ring/50`).
- The forecast slider is keyboard operable (arrow keys = 1 h, Page Up/Down = 6 h) and announces
  "+18 hours, Tuesday 14:00".
- Hit targets are at least 36px on desktop and 44px on touch.
- Respect `prefers-reduced-motion`: no autoplay on the forecast timeline, and instant transitions.

## Responsive Behavior

### Breakpoints

| Name    | Width   | Key changes                                                       |
| ------- | ------- | ----------------------------------------------------------------- |
| Desktop | ≥1280px | Side panel 400px + map                                            |
| Laptop  | ≥1024px | Side panel 360px                                                  |
| Tablet  | ≥768px  | Panel becomes a collapsible drawer over the map                   |
| Mobile  | <768px  | Full-screen map; planner becomes a bottom sheet (`{rounded.2xl}`) |

### Collapsing Strategy

- **Planner panel:** side panel → drawer → bottom sheet with three snap points (peek: the
  recommended route only; half: all routes; full: the form).
- **Forecast timeline:** stays docked at the bottom of the map, above the sheet's peek height.
  Tick labels thin to every 12 h below 768px.
- **Legend:** collapses to a single "Risk" button that opens it in a popover.
- **Route cards:** the risk bar and summary always show; the risk-miles text wraps under it.

## Iteration Guide

1. Before styling anything, decide which surface level it lives on.
2. Reach for a shadcn component first: `pnpm dlx shadcn@latest add <name>` from `apps/web`.
3. Default text is `{typography.body}` 14/400; promote only with a reason.
4. New color? Add it as a variable in `index.css` and a token here, in both themes, in the same
   change.
5. Check every new component in **both** themes and on top of the map.
6. Treat sky blue as scarce and risk colors as reserved.

## Known Gaps

- **Logo on dark:** `logo.svg` uses dark outlines and a slate tagline, which lose contrast on
  `{colors.canvas}`. It needs a dark-theme variant (light outline, ink-muted tagline).
- **Basemap provider** is not chosen yet; the style rules above are provider-agnostic.
- **Light theme** is defined, but the heatmap opacities are tuned for dark and may need raising.
- **Chart tokens** are defined but unused until a chart (e.g. risk over distance) is designed.
