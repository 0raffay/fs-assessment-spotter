---
name: SkyRig
description: Weather-aware truck routing. A dark-first, map-first product UI built on shadcn/ui and Tailwind CSS v4.
implementation: apps/web/src/index.css
wireframes: https://claude.ai/artifact/AufGx61iEsoqFkGZNgbvry
colors:
  # Dark theme (default). Light values are listed under colors-light.
  canvas: "#08090c"
  map: "#0b0d12"
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
  map: "#eef0f3"
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
  display:
    {
      size: 34px,
      weight: 300,
      lineHeight: 1,
      letterSpacing: -1.2px,
      numeric: tabular-nums,
    }
  headline:
    {
      size: 28px,
      weight: 300,
      lineHeight: 1.1,
      letterSpacing: -0.8px,
      numeric: tabular-nums,
    }
  title: { size: 18px, weight: 500, lineHeight: 1.3, letterSpacing: -0.4px }
  card-title:
    { size: 15px, weight: 500, lineHeight: 1.35, letterSpacing: -0.2px }
  body-lg: { size: 16px, weight: 400, lineHeight: 1.5, letterSpacing: -0.1px }
  body: { size: 14px, weight: 400, lineHeight: 1.5, letterSpacing: -0.05px }
  input: { size: 15px, weight: 400, lineHeight: 1.4, letterSpacing: -0.1px }
  body-sm: { size: 13px, weight: 400, lineHeight: 1.45, letterSpacing: 0 }
  label: { size: 13px, weight: 400, lineHeight: 1.4, letterSpacing: 0 }
  caption: { size: 12px, weight: 400, lineHeight: 1.4, letterSpacing: 0 }
  button: { size: 14px, weight: 500, lineHeight: 1, letterSpacing: -0.1px }
  data:
    {
      size: 17px,
      weight: 300,
      lineHeight: 1.2,
      letterSpacing: -0.4px,
      numeric: tabular-nums,
    }
  data-sm:
    {
      size: 13px,
      weight: 400,
      lineHeight: 1.4,
      letterSpacing: 0,
      numeric: tabular-nums,
    }
  mono: { size: 12px, weight: 400, lineHeight: 1.5, letterSpacing: 0 }
rounded:
  xs: 6px
  sm: 10px
  md: 12px
  lg: 14px
  xl: 20px
  2xl: 24px
  3xl: 28px
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
motion:
  ease-out: cubic-bezier(0.2, 0.8, 0.2, 1)
  ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
  press: 120ms
  hover: 160ms
  toggle: 220ms
  panel: 360ms
  stagger: 50ms
  route-draw: 1400ms
---

# SkyRig Design System

## Overview

SkyRig is a working tool. A driver or dispatcher enters a trip, compares three routes and reads
weather risk off a map. **The map is the product**: it fills the screen, and everything else floats
over it in rounded panels that can be opened, collapsed or dismissed.

The page and header share one near-black canvas (`{colors.canvas}` #08090c). The map sits inside it
as a single rounded frame (`{rounded.3xl}` 28px), inset 14px from the sides, so the app reads as one
calm surface with the map set into it. Panels float on `{colors.surface-1}` with a
`{colors.hairline-strong}` edge and a soft shadow.

Type is **light and quiet**: Inter at weights 300–500, large numbers set thin (300), labels in
sentence case. No all-caps anywhere.

There are two color systems and they never mix:

- **Sky blue** `{colors.primary}` (#38bdf8, from the logo's trailer) means _action, focus,
  selection_: the primary button, focus rings, the selected route, the Recommended badge, active
  tools, slider fills.
- **The risk scale** (green → yellow → orange → red → purple) means _weather risk at a checkpoint_,
  and nothing else.

Every control is **alive**: it responds to hover, keyboard focus and press, and panels move in
rather than appear. Motion stays short, purposeful, and off when the user asks for reduced motion.

Built on **shadcn/ui** (Radix base, Nova preset) and **Tailwind CSS v4**. Every token here maps to a
CSS variable in `apps/web/src/index.css`, used as Tailwind utilities (`bg-surface-2`,
`text-ink-subtle`, `bg-risk-severe`, `rounded-xl`). Components never contain hex values.

**Key characteristics**

- Dark-first (`<html class="dark">`), with a complete light theme.
- Map-first: a rounded map frame with floating, rounded panels over it.
- Centered logo in the header; header and page share the same canvas.
- One accent (sky blue) for interaction; the risk scale is reserved for data.
- Light typography (300–500), sentence case only, tabular numbers.
- Generous radius: 14px controls, 20px cards, 24px floating panels, 28px map frame.
- Every control has hover, focus-visible and active states; panels and data animate in.
- Tablet uses the mobile layout.

## Colors

> Source of truth: `apps/web/src/index.css` (`.dark` = default, `:root` = light).

### Brand and interaction

- **Sky blue** (`{colors.primary}` #38bdf8): primary button, focus ring, selected route, route
  number badge of the selected route, Recommended badge, active tool in the rail, slider fills,
  switch "on" track.
- **On primary** (`{colors.on-primary}` #04121c): text and icons on sky-blue fills.
- **Tinted states:** active tool and Recommended badge use primary at 14% as the fill with primary
  (or `#7dd3fc`) as the text.

### Surfaces

| Token                        | Dark      | Use                                                           |
| ---------------------------- | --------- | ------------------------------------------------------------- |
| `{colors.canvas}`            | `#08090c` | Page and header (one continuous surface)                      |
| `{colors.map}`               | `#0b0d12` | Map frame background under the tiles                          |
| `{colors.surface-1}`         | `#0f1115` | Floating panels, sheets, cards, the tool rail                 |
| `{colors.surface-2}`         | `#16181d` | Selected card, chips, metric tiles, segmented-control track   |
| `{colors.surface-3}`         | `#1d2027` | Hover fills, neutral badges, selected list row                |
| `{colors.surface-4}`         | `#252831` | Slider track, empty meter segments, selected segmented option |
| `{colors.hairline}`          | `#23262d` | Dividers inside panels, resting card border                   |
| `{colors.hairline-strong}`   | `#2e323b` | Floating panel edge, input border, outline button             |
| `{colors.hairline-tertiary}` | `#3a3f4a` | Hover border, sheet handle, connector dots                    |

### Text

- **Ink** (`{colors.ink}` #f4f6f8): headings, values.
- **Ink muted** (`{colors.ink-muted}` #c9d1db): secondary text, chip text.
- **Ink subtle** (`{colors.ink-subtle}` #8b939e): labels, meta, units.
- **Ink tertiary** (`{colors.ink-tertiary}` #5f6670): placeholders, footnotes, disabled.

### Risk scale

Five levels, always in this order, used for map markers, heatmap cells, route risk strips, the
forecast hour bars, metric meters, badges and the legend.

| Level     | Token                     | Dark      | Light     |
| --------- | ------------------------- | --------- | --------- |
| Low       | `{colors.risk-low}`       | `#22c55e` | `#16a34a` |
| Moderate  | `{colors.risk-moderate}`  | `#eab308` | `#ca8a04` |
| High      | `{colors.risk-high}`      | `#f97316` | `#ea580c` |
| Severe    | `{colors.risk-severe}`    | `#ef4444` | `#dc2626` |
| No Travel | `{colors.risk-no-travel}` | `#a855f7` | `#9333ea` |

Risk is never shown by color alone: it always comes with a label, a number or a legend.

### Map routes

- **Selected route** (`{colors.route-selected}`): 5px sky blue with a 2px canvas casing.
- **Alternate routes** (`{colors.route-alternate}`): 3px neutral gray, drawn underneath.

### Semantic

- **Destructive** (`{colors.destructive}` #f87171): errors only. Error panels use it at 7% fill
  with a 35% inset border, so an error never looks like a Severe weather warning.
- **Success** (`{colors.success}`): system status only (the "Forecast updated" dot).

### shadcn variable mapping

| shadcn variable          | Dark value       | Light value      |
| ------------------------ | ---------------- | ---------------- |
| `--background`           | canvas           | canvas           |
| `--foreground`           | ink              | ink              |
| `--card`                 | surface-1        | surface-1        |
| `--popover`              | surface-2        | surface-1        |
| `--primary`              | `#38bdf8`        | `#0284c7`        |
| `--primary-foreground`   | `#04121c`        | `#ffffff`        |
| `--secondary`, `--muted` | surface-2        | surface-2        |
| `--muted-foreground`     | ink-subtle       | ink-subtle       |
| `--accent`               | surface-3        | surface-3        |
| `--border`               | hairline         | hairline         |
| `--input`                | hairline-strong  | hairline-strong  |
| `--ring`                 | primary          | primary          |
| `--destructive`          | `#f87171`        | `#dc2626`        |
| `--chart-1…5`            | non-risk hues    | non-risk hues    |
| `--sidebar-*`            | surface-1 family | surface-1 family |

## Typography

### Families

- **Inter Variable** (`@fontsource-variable/inter`), weights 300, 400 and 500 only. Stylistic sets
  `cv11` and `ss01` on.
- **JetBrains Mono Variable** (`@fontsource-variable/jetbrains-mono`) for mile markers and raw
  values in lists.

### Scale

| Token                     | Size | Weight | Tracking | Use                                                        |
| ------------------------- | ---- | ------ | -------- | ---------------------------------------------------------- |
| `{typography.display}`    | 34px | 300    | -1.2px   | The big number in a card: checkpoint ETA                   |
| `{typography.headline}`   | 28px | 300    | -0.8px   | Forecast hour ("Tue 12:00"); 22px in compact layouts       |
| `{typography.title}`      | 18px | 500    | -0.4px   | Panel titles ("Trip", "Plan a trip"), logo wordmark        |
| `{typography.card-title}` | 15px | 500    | -0.2px   | Route name, panel headings ("Map layers")                  |
| `{typography.body-lg}`    | 16px | 400    | -0.1px   | Rare emphasis                                              |
| `{typography.input}`      | 15px | 400    | -0.1px   | Text inside inputs and field buttons                       |
| `{typography.body}`       | 14px | 400    | -0.05px  | Default UI text                                            |
| `{typography.body-sm}`    | 13px | 400    | 0        | Meta lines ("via Oklahoma City, Wichita"), help text       |
| `{typography.label}`      | 13px | 400    | 0        | Field and section labels, sentence case, ink-subtle        |
| `{typography.caption}`    | 12px | 400    | 0        | Chips, badges, legend, tick labels                         |
| `{typography.button}`     | 14px | 500    | -0.1px   | Button labels                                              |
| `{typography.data}`       | 17px | 300    | -0.4px   | Drive time on route cards, metric tile values (22px there) |
| `{typography.data-sm}`    | 13px | 400    | 0        | Distances, ETAs in lists, risk-mile counts                 |
| `{typography.mono}`       | 12px | 400    | 0        | Mile markers in the checkpoint list                        |

### Rules

- **Sentence case everywhere.** No `text-transform: uppercase`, no letter-spaced small caps.
  Labels read "Load weight", "Check the weather every", "On the map".
- **Thin numbers, steady text.** Large numbers use weight 300; text stays at 400; only titles,
  buttons and emphasized names use 500. Nothing above 500.
- **Tabular numbers** for every ETA, distance, duration, weight and forecast value.
- **Units are quieter than values:** `11:50` in ink, `Tue · CST` in ink-subtle.
- **Times are local to the place:** `Tue 11:50 CST`.

## Layout

### Desktop shell (≥1024px)

```
canvas ───────────────────────────────────────────────────────────────────────
 [ ⟲ Dallas, TX → Denver, CO  Tue 06:00 · 42,000 lb ▾ ]   (logo) SkyRig   ● updated 10:42  Share  ?  ☾
╭────────────────────────────────────────────────────────────────────────────╮
│ ╭ planner ──────╮                                                 ╭─────╮ │
│ │ Trip      ⟨   │                 map (rounded 28px)              │ rail│ │
│ │ ○ Dallas      │                                                 │  ◫  │ │
│ │ ┊             │          ① ━━━━━━ selected route                │  ◷  │ │
│ │ ■ Denver Edit │        ② ── ③ ── alternates (gray)              │  ▤  │ │
│ │ chips         │                                                 │  ☰  │ │
│ │ ───────────── │                                                 │  ⟋  │ │
│ │ Routes 3      │   ╭ forecast panel / chip ─────────────────╮    │  ⛶  │ │
│ │ [1] [2] [3]   │   │ Tue 12:00  ◀ ▶ ▶   hour bars + slider  │    │ + − │ │
│ ╰───────────────╯   ╰────────────────────────────────────────╯    ╰─────╯ │
╰────────────────────────────────────────────────────────────────────────────╯
```

- **Header:** 64px on the canvas with no border. A three-column grid: trip chip on the left, logo
  centered, status and actions on the right.
- **Map frame:** inset 14px left and right, from 64px to 12px above the bottom; `{rounded.3xl}`.
- **Planner:** floats 16px from the frame's top-left, 360px wide, at most the frame height minus
  32px; scrolls inside.
- **Tool rail:** floats 16px from the top-right.
- **Bottom dock:** the forecast panel, forecast chip or risk profile floats 16px from the bottom,
  between the planner and the rail.
- **Right panels:** layers, checkpoint list and checkpoint card open to the left of the rail.
- The map content is padded (fit-bounds padding) so routes never sit under a panel.

### Handheld shell (<1024px, tablet and phone)

- Header 56px: trip button (phone) or trip chip (tablet), centered logo, theme toggle.
- Map frame inset 8px, `{rounded.2xl}` corners.
- **Planner sheet** floats inside the frame: full width with 8px insets on phones, and 380px
  anchored bottom-left on tablets. `{rounded.xl}` corners on all sides, with a 40×5px grab handle.
- Phone sheet snap points: **peek** (recommended route only), **half** (all routes), **full**
  (form). Tablets keep the sheet at full height beside the map.
- Tool rail top-right with 44px buttons. The forecast chip and panel dock above the sheet.

### Spacing

- 4px base. Panel padding 16–18px, sheet padding 16px, card padding 14–16px.
- 18px between form groups, 8px between a label and its control, 12px between cards.

## Shapes

| Token            | Value  | Use                                                           |
| ---------------- | ------ | ------------------------------------------------------------- |
| `{rounded.xs}`   | 6px    | Heatmap cells, legend swatches                                |
| `{rounded.sm}`   | 10px   | Chips, small icon buttons, list rows                          |
| `{rounded.md}`   | 12px   | Metric tiles, route number badges (9px at 26px size)          |
| `{rounded.lg}`   | 14px   | **Buttons, inputs, segmented controls** (shadcn `rounded-lg`) |
| `{rounded.xl}`   | 20px   | Cards, error panels, handheld sheets                          |
| `{rounded.2xl}`  | 24px   | Floating panels (planner, forecast, layers, checkpoint card)  |
| `{rounded.3xl}`  | 28px   | The map frame                                                 |
| `{rounded.pill}` | 9999px | Header chips, badges, forecast chip, switches, slider         |

shadcn components use `rounded-lg` for controls and `rounded-xl` for cards, so these values reach
them through tokens without editing `components/ui/`.

## Elevation

| Level    | Treatment                                                                | Use                         |
| -------- | ------------------------------------------------------------------------ | --------------------------- |
| Canvas   | `{colors.canvas}`                                                        | Page, header                |
| Map      | `{colors.map}`, 1px inner edge `#1a1d23`                                 | Map frame                   |
| Floating | `{colors.surface-1}`, 1px hairline-strong, `0 18px 44px rgb(0 0 0 / .5)` | Panels, rail, sheets, chip  |
| Raised   | `{colors.surface-2}`                                                     | Chips, tiles, selected card |
| Focus    | 3px ring, primary at 45%                                                 | Every focusable control     |

Shadows belong only to things that float over the map. Panel contents use surface steps, not
shadows. No gradients and no glass blur.

## Interaction states

Every interactive element has four visible states. In the app these come from shadcn's variants plus
Tailwind `hover:`, `focus-visible:`, `active:` and `aria-[pressed=true]:` utilities in feature
components.

| Element               | Hover                               | Focus-visible                    | Active / pressed        | Selected / on                         |
| --------------------- | ----------------------------------- | -------------------------------- | ----------------------- | ------------------------------------- |
| Primary button        | Shadcn default (primary at 80%)     | 3px primary ring                 | 1px nudge down (shadcn) | —                                     |
| Ghost / tool button   | surface-3 fill, ink text            | 3px ring                         | scale 0.96              | primary at 14% fill, primary icon     |
| Outline button / chip | surface-2 fill, hairline-tertiary   | 3px ring                         | scale 0.96              | —                                     |
| Input                 | Border to hairline-tertiary         | Primary border + 4px glow at 16% | —                       | —                                     |
| Segmented option      | Ink text on surface-3               | 2px ring                         | scale 0.97              | surface-4 fill with a soft shadow     |
| Switch                | Track one step lighter              | 3px ring                         | —                       | Primary track, knob slides 16px       |
| Route card            | Lifts 1px, border hairline-tertiary | 3px ring                         | scale 0.99              | surface-2 fill, primary border at 55% |
| List row              | surface-2 fill                      | 2px inset ring                   | —                       | surface-3 fill + 1px primary inset    |
| Checkpoint marker     | Scales 1.4×                         | Scales 1.4×                      | —                       | 16px, ink ring, pulsing halo          |
| Route number tag      | Scales 1.12×                        | 3px ring                         | —                       | Primary fill                          |

Disabled controls sit at 40–45% opacity and ignore pointer events.

## Motion

Use the **`motion`** library (formerly Framer Motion, `motion/react`) for enter/exit and layout
animations (panels, sheets, the forecast chip expanding into the panel, route card reordering).
Use plain CSS transitions for hover, focus and press. All values come from the `motion` tokens.

| Moment                          | Animation                                                      | Duration / easing                       |
| ------------------------------- | -------------------------------------------------------------- | --------------------------------------- |
| Button / control press          | Scale to 0.96–0.99                                             | `{motion.press}` 120ms                  |
| Hover color and border changes  | Color, background, border, shadow                              | `{motion.hover}` 160ms                  |
| Switch knob                     | Slide 16px                                                     | `{motion.toggle}` 220ms, ease-out       |
| Planner panel enters            | Fade + slide 14px from the left                                | `{motion.panel}` 360ms, ease-out        |
| Rail / right panels enter       | Fade + slide 14px from the right                               | 360ms, ease-out                         |
| Forecast panel, chip, sheet     | Fade + rise 24px; the chip morphs into the panel (`layoutId`)  | 360ms, ease-out                         |
| Selected route appears          | Line draws from origin to destination                          | `{motion.route-draw}` 1.4s, ease-in-out |
| Heatmap appears                 | Fade in after the route starts drawing                         | 800ms, 300ms delay                      |
| Checkpoint markers appear       | Fade in, staggered along the route                             | `{motion.stagger}` 50ms each            |
| Selected checkpoint             | Soft halo pulse in its risk color                              | 1.8s loop                               |
| Loading skeletons               | Shimmer sweep                                                  | 1.4s loop                               |
| Status dot ("Forecast updated") | Gentle breathe                                                 | 1.6s loop                               |
| Forecast play                   | Advances one hour every 600ms; the hour bar and map cross-fade | 200ms cross-fade                        |

Rules:

- Animate **opacity and transform only** (no width, height or top/left), so motion stays smooth
  over the map.
- Dragging the slider never animates the map; the heatmap restyles the frame directly.
- Respect `prefers-reduced-motion`: loops stop, route lines appear without drawing, panels appear
  without sliding, and the forecast doesn't autoplay. With `motion`, use `useReducedMotion()`.

## Components

Each line names the design token, then the shadcn component it is built from. Components are added
only with `pnpm dlx shadcn@latest add <name>` and are composed, never edited.

### Header

- **`trip-chip`** (`ui/button` outline, pill): route icon in primary, "Dallas, TX → Denver, CO",
  then "Tue 06:00 · 42,000 lb" in ink-subtle and a chevron. Opens or focuses the planner. Shows
  "New trip" before the first search.
- **`brand`**: 34px logo mark with "SkyRig" in `{typography.title}`, centered.
- **`status`**: a breathing success dot with "Forecast updated 10:42" in caption.
- **`header-actions`**: Share (outline, pill), Help and theme (ghost, round, 40px).

### Planner panel and sheet

- **`planner`** (`ui/card` composition): floating, `{rounded.2xl}`, header row with the title and a
  collapse button. Collapsed, it becomes the trip chip only.
- **`trip-form`** (`ui/input`, `ui/label`, `ui/popover`, `ui/command`, `ui/calendar`,
  `ui/toggle-group`):
  - **Route:** From and To fields joined by a dotted connector (open circle, then filled square),
    with a swap ghost button on the right. Inputs 44px (48px on touch), `{rounded.lg}`,
    `{typography.input}`, an inline "From"/"To" label in ink-subtle.
  - **Departure:** a date field ("Tue, Nov 12") and a time field ("06:00 CST"), each with its icon.
  - **Load weight:** numeric input with a trailing "lb".
  - **Check the weather every:** segmented `10 mi | 25 mi | 50 mi`.
  - **Plan routes:** full-width primary button, 44px; while planning it shows a spinner and
    "Planning routes…".
- **`trip-summary`**: after planning, the form collapses to the connector with both places, an Edit
  outline button, and chips for departure, load and interval.

### Routes

- **`route-list`**: header "Routes" with a count chip, and a "Safest first" sort ghost button.
- **`route-card`** (`ui/card`, button semantics, `aria-pressed`):
  - Row 1: number badge (26px; primary when selected), route name in `{typography.card-title}`,
    "via …" in body-sm; drive time in `{typography.data}` and distance in data-sm on the right.
  - Row 2: risk strip, 6px, one rounded segment per level, sized by miles.
  - Row 3: severe, high and moderate miles as colored dots with numbers, then a Recommended or
    Fastest badge.
  - Recommended card only: two neutral chips with the reason as facts ("0 severe mi, others 50
    and 75", "+2h 10m vs fastest"). No sentences.
- **`ranking-note`**: an info icon with "Ranked by severe miles, then high miles, average risk and
  drive time." in caption.

### Map

- **`map-frame`**: `{rounded.3xl}` (desktop) or `{rounded.2xl}` (handheld), `{colors.map}`
  background, dark CARTO basemap (Positron in light theme).
- **`route-line`** and **`route-tag`**: numbered 24px tags on each line, matching the cards.
- **`checkpoint-marker`**: 11px circle in its risk color with a 2px canvas ring; selected 16px with
  an ink ring and a pulse.
- **`city-pin`**: origin is an open ink circle, destination a filled ink square, each with a pill
  label.
- **`heatmap-layer`**: cells in risk colors at 9% / 26% / 36% / 48% / 55% opacity (Low → No Travel),
  below the lines.

### Tool rail (`ui/button` ghost, `ui/tooltip`)

Vertical, floating, `{rounded.xl}` container, 40px buttons (44px touch), `aria-pressed` for the open
tool:

1. **Layers**: opens `layers-panel`.
2. **Forecast**: opens `forecast-panel` (the chip collapses into it).
3. **Legend**: opens the risk legend popover.
4. **Checkpoints**: opens `checkpoint-list`.
5. **Risk profile**: opens `risk-profile` (desktop only).
6. Divider, then **Fit routes**, **Zoom in** and **Zoom out** (zoom on desktop only; phones pinch).

Before a trip is planned, the rail is disabled at 40% opacity.

### Forecast

- **`forecast-chip`**: floating pill with a clock icon, "Tue 12:00", a "+14h" badge and an up
  chevron. Opens the panel.
- **`forecast-panel`** (`ui/slider`, `ui/button`):
  - Top: "Heatmap hour" label, the hour in `{typography.headline}`, zone, a "+14h" badge; previous
    hour, play (round primary, 44px), next hour, close.
  - **Hour bars:** 49 bars, one per hour, each colored by the worst risk along the trip at that
    hour and sized by level. The current hour is full opacity with an ink outline; the rest are at
    45%.
  - **Slider:** track surface-4, fill primary up to the current hour, an 18px ink thumb with a
    primary halo, and the drive window shaded at primary 20%.
  - **Ticks:** clock times every 6h (12h compact), plus "Depart 06:00" (primary, with a flag) and
    "Arrive 20:50".
  - Footer (desktop): the inline risk legend and "Bars show the worst risk along the trip, hour by
    hour".

### Panels opened from the rail

- **`layers-panel`** (`ui/switch`, `ui/toggle-group`, `ui/slider`): heatmap switch; heatmap measure
  `Risk | Wind | Rain | Snow`; opacity slider; switches for alternate routes, checkpoints, route
  numbers and city labels; basemap choice (Map, Terrain, Satellite) as preview tiles: drawn mini maps for Map and Terrain, a real imagery tile for Satellite.
- **`checkpoint-list`** (`ui/scroll-area`, `ui/toggle-group`): "Checkpoints" with "Route 1 · 39
  stops, every 25 mi"; filter `All | Moderate+ | High+`; rows of mile (mono), ETA, the condition
  that drives the level, and the risk label. The selected row is highlighted and synced with the
  map.
- **`risk-profile`**: one strip per route, scaled by distance, colored by each checkpoint's risk at
  its ETA. The selected route is taller; a vertical marker and a "mi 375" pill track the selected
  checkpoint across all routes.

### Checkpoint card (`ui/popover` composition)

Floating, 304px, `{rounded.2xl}`, with a pointer to its marker on desktop (docked under the rail on
tablet, below the marker on phones):

- A risk badge ("High risk") and "15 of 39", then previous, next and close buttons.
- The ETA in `{typography.display}` with "Tue · CST", then "Mile 375 · I-70 near Salina, KS".
- Three metric tiles (Wind, Rain, Snow): value in 22px weight 300, unit, a 5-step meter colored up
  to its level, and the level name. The condition that decides the checkpoint gets a tinted tile.
- Footer: which condition decides the level, the load-rule result, and the forecast hour and source.

### Feedback (`ui/skeleton`, `ui/alert`, `ui/sonner`)

- **`loading`**: shimmering skeleton cards, a spinner line "Checking weather at each checkpoint's
  arrival time", a floating map pill "Finding routes and fetching forecasts", and a breathing
  dashed origin–destination line.
- **`empty`**: the planner shows the form with the From field focused; the map shows a floating pill
  "Routes and weather risk appear here".
- **`error`**: a destructive-tinted panel ("Couldn't plan routes", one sentence, "Try again"
  secondary button). The form keeps its values.
- **`toast`**: floating surface-1 for non-blocking notices ("Only 2 routes found; 1 alternate
  generated").

## Do's and Don'ts

### Do

- Keep sky blue for interaction and selection only.
- Use risk colors only for risk, always with a label or number.
- Float panels over the map and pad the map so routes stay visible.
- Give every control hover, focus-visible and active states.
- Animate opacity and transform, and honor reduced motion.
- Use sentence case and weights 300–500.
- Add shadcn components with the CLI; style through tokens and composition.

### Don't

- Don't use all-caps labels or letter-spaced small caps.
- Don't use weights above 500 or heavy display type.
- Don't use the logo's orange, or any risk hue, for UI chrome.
- Don't put shadows on things that don't float over the map.
- Don't use square corners on panels or controls; follow the radius scale.
- Don't write sentences where a number or chip says it ("0 severe mi" beats "This route was chosen
  because…").
- Don't hand-edit `components/ui/`; regenerate with `shadcn add <name> --overwrite`.
- Don't animate layout properties or the map during slider drags.

## Accessibility

- Text meets WCAG AA on canvas and surfaces 1–2; ink-tertiary is for placeholders and footnotes.
- Risk always has a text label or value next to its color.
- Every control is a real `button`, `input` or `a` with a visible focus ring. Icon buttons have
  `aria-label`; toggles use `aria-pressed`, `role="switch"` or radio groups.
- The forecast slider is keyboard operable (arrow keys = 1h, Page Up/Down = 6h) and announces
  "+14 hours, Tuesday 12:00".
- Touch targets are at least 44px on handheld layouts.
- `prefers-reduced-motion` turns off loops, drawing and slides.

## Responsive behavior

| Width       | Layout                                                                                   |
| ----------- | ---------------------------------------------------------------------------------------- |
| ≥1280px     | Desktop shell, planner 360px, all rail tools                                             |
| 1024–1279px | Desktop shell; risk profile and checkpoint list share the bottom dock                    |
| 768–1023px  | **Tablet uses the handheld shell:** 380px sheet bottom-left, compact rail, docked panels |
| <768px      | Handheld shell: full-width floating sheet with snap points; compact forecast (12h ticks) |

## Iteration guide

1. Decide where it lives first: canvas, map, floating panel or inside a panel.
2. Start from a shadcn component (`pnpm dlx shadcn@latest add <name>`), then compose.
3. Define its hover, focus, active and selected states before shipping.
4. Pick its motion from the Motion table; don't invent new timings.
5. New color, radius or timing? Add the token here and in `index.css` in the same change.
6. Check it in both themes, on top of the map, and with reduced motion on.

## Known gaps

- **Logo on dark:** `logo.svg` has dark outlines and a slate tagline that lose contrast on the
  canvas; a dark-theme variant is needed.
- **Terrain basemap:** the Layers panel offers it, but no terrain style is chosen yet.
- **Light theme:** heatmap opacities are tuned for dark and may need raising.
- **Wireframe values are illustrative:** routes, mileages and weather in the wireframes are sample
  data, not computed results.
