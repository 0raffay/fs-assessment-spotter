# Feature: app-shell

The frame every screen sits in: the header and the rounded map frame (DESIGN.md › Layout).

## What it renders

- **Header** (64px desktop, 56px handheld) on the page canvas, with no border:
  - Left: a slot for the trip chip (provided by `trip-planner`).
  - Center: the brand (logo + "SkyRig").
  - Right (desktop): status ("Forecast updated 10:42"), **Share** (copies the URL, which encodes
    the trip), **Help** (a dialog with the PDF's thresholds, load rules and ranking order), and the
    theme toggle. Handheld shows only the theme toggle.
- **Map frame**: a `relative` rounded container (28px desktop, 24px handheld) inset from the page.
  The map fills it, and panels float inside it with absolute positioning.

## Public API (`features/app-shell/index.ts`)

| Export            | Purpose                                             |
| ----------------- | --------------------------------------------------- |
| `AppShell`        | `{ headerStart?, status?, canShare, children }`     |
| `StatusIndicator` | Dot + label; tones `ok`, `pending`, `error`, `idle` |
| Types             | `AppShellProps`, `StatusInfo`, `StatusTone`         |

## Theme

`lib/theme.ts` is a small typed store (`useTheme()`, `setTheme()`, `applyTheme()`), dark by default,
saved to `localStorage`. It replaced `next-themes` because that library injects a `<script>` tag,
which React 19 warns about. The shadcn `Toaster` receives the theme as a prop.

## Shared pieces added with this feature

- `hooks/use-media-query.ts`: `useMediaQuery`, `useIsDesktop` (≥1024px), `usePrefersReducedMotion`.
- `components/icon-button.tsx`: ghost icon button with tooltip and `pressed` state.
- `components/floating-panel.tsx`: the floating surface with enter/exit motion.
- `lib/motion.ts`: motion tokens and panel variants.

## Tests

`components/tests/app-shell.test.tsx`: renders slots and status, Share disabled until a trip
exists and then copies the link, theme toggle, help dialog content.
