---
version: alpha
name: odds-design-system
description: The visual system of ODDS (Open Domain Driven Specification), a browser-only linter and playground for DDD context maps. A cool, violet-tinted neutral canvas carries a single purple accent for action and selection, an azure counterpoint used only in the purple-to-azure gradient, and a solar yellow that is always surface and never ink. Two type families with fixed jobs — Inter for interface and reading, JetBrains Mono for anything that is literal data — and three functional severity colors that never borrow the accent. A dense playground that is lived in.

colors:
  canvas: "#FAFAFD"
  surface: "#FFFFFF"
  surface-muted: "#F4F3FA"
  hairline: "#E6E4F2"
  ink: "#1B1A24"
  ink-mute: "#6B6880"
  accent: "#6C40D9"
  accent-lift: "#8A5BF0"
  azure: "#3D6FE8"
  pulse: "#23A8CD"
  solar: "#FFC53D"
  on-accent: "#FFFFFF"
  error: "#C0342B"
  warning: "#A66A00"
  info: "#5B6B7C"
  edge: "#807D92"
  edge-lit: "#343242"
  edge-far: "#CCCAD8"
  core-ink: "#B07800"
  sup-ink: "#3D6FE8"
  gen-ink: "#545266"
  canvas-dark: "#12111A"
  surface-dark: "#1A1926"
  surface-muted-dark: "#23212F"
  hairline-dark: "#322F45"
  ink-dark: "#ECEBF5"
  ink-mute-dark: "#9A97AE"
  accent-dark: "#AD8DFF"
  accent-lift-dark: "#C6B0FF"
  azure-dark: "#7DA3FF"
  pulse-dark: "#5ED0EE"
  solar-dark: "#FFD163"
  on-accent-dark: "#12111A"
  error-dark: "#E0796F"
  warning-dark: "#D9A441"
  info-dark: "#93A3B3"
  edge-dark: "#76738C"
  edge-lit-dark: "#DEDCEA"
  edge-far-dark: "#403E52"
  core-ink-dark: "#FFC85A"
  sup-ink-dark: "#7DA3FF"
  gen-ink-dark: "#C4C1D6"

typography:
  body:
    fontFamily: "Inter, 'Segoe UI', system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  ui:
    fontFamily: "Inter, 'Segoe UI', system-ui, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  ui-sm:
    fontFamily: "Inter, 'Segoe UI', system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: 0
  code:
    fontFamily: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0
  mono-sm:
    fontFamily: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: 0
  mono-xs:
    fontFamily: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace"
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: 0
  eyebrow:
    fontFamily: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace"
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1.0
    letterSpacing: 0.22em

rounded:
  mark: 3px
  chip: 6px
  control: 8px
  card: 10px
  pill: 999px

spacing:
  xxs: 4px
  xs: 6px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  2xl: 24px
  3xl: 32px
  4xl: 40px

elevation:
  shadow-strength: "0.14"
  shadow-strength-dark: "0.5"
  sm: "0 1px 2px rgb(27 27 25 / calc({elevation.shadow-strength} * .4))"
  cta: "0 10px 30px -8px rgb({colors.accent} / calc({elevation.shadow-strength} * 4))"
  island: "0 2px 10px rgb(27 27 25 / calc({elevation.shadow-strength} * .5))"
  gradient-primary: "linear-gradient(180deg, rgb({colors.accent-lift}), rgb({colors.accent}))"

components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.ui}"
    rounded: "{rounded.control}"
    padding: 0 12px
  button-primary-gradient:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.ui}"
    rounded: "{rounded.control}"
    padding: 0 12px
  island:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.ui}"
    rounded: "{rounded.card}"
  pill-mono:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-mute}"
    typography: "{typography.mono-sm}"
    rounded: "{rounded.pill}"
    padding: 6px 14px
  eyebrow:
    textColor: "{colors.ink-mute}"
    typography: "{typography.eyebrow}"
  severity-counter-error:
    textColor: "{colors.error}"
    typography: "{typography.mono-xs}"
    rounded: "{rounded.pill}"
  severity-counter-warning:
    textColor: "{colors.warning}"
    typography: "{typography.mono-xs}"
    rounded: "{rounded.pill}"
  severity-counter-info:
    textColor: "{colors.info}"
    typography: "{typography.mono-xs}"
    rounded: "{rounded.pill}"
  code-chip:
    typography: "{typography.mono-xs}"
    rounded: "{rounded.chip}"
  control:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.ui}"
    rounded: "{rounded.control}"
  solar-block:
    backgroundColor: "{colors.solar}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.card}"
---

## Overview

ODDS is an architecture tool, and its interface reads like one: a light, cool canvas, generous air, and color spent only where it carries meaning. The canvas (`{colors.canvas}`) is a near-white with a breath of violet; content sits on white surfaces (`{colors.surface}`) separated by 1px hairlines, with depth expressed by tinted shadows rather than heavy borders.

Color has three jobs and they never overlap. **Purple** (`{colors.accent}`) is action and selection — the primary button, the selected item, the focused control, inline links. **Severity** belongs to three functional colors (`{colors.error}`, `{colors.warning}`, `{colors.info}`), each paired with its own icon. **Solar yellow** (`{colors.solar}`) is surface: a block, a band, the ground a numeral sits on — never text, never a mark. Azure (`{colors.azure}`) exists to close the purple-to-azure gradient and is not used on its own.

Typography separates prose from data. **Inter** sets every word of interface and reading. **JetBrains Mono** sets anything that is literal data: `.odds` source, a `DiagnosticCode`, a span like `L24:5`, a tag like `[OHS]`, a context name quoted in a sentence. The boundary is the same one `MESSAGES.md` keeps between a diagnostic's `data` and its rendered prose, and the screen makes it visible.

The **playground** is dense — 13px interface type, 30px controls, floating islands over the diagram canvas.

**Key Characteristics:**
- Cool, violet-tinted neutrals; the dark theme is the same family inverted, never a separate palette.
- A single purple accent for action and selection; severity never borrows it.
- Severity always carries an icon — circled X, triangle, circled i — so it never depends on color alone.
- Solar yellow is always surface, with `{colors.ink}` text on it.
- One purple → azure gradient, at most twice per screen.
- Mono means data, sans means prose.
- 1px borders everywhere; emphasis comes from fill, text color or shadow, never from a thicker line.
- Shadows tint with the accent instead of darkening, with negative spread.

**Scope.** This version covers the playground chrome. Diagram rendering — node and edge colors per subdomain type, lit and invalid relationship strokes, and the degraded states required by `PRD.md` §5.2 — is not part of the system yet.

## Colors

All colors are implemented as CSS custom properties holding **RGB triplets**, consumed with `rgb(var(--token) / <alpha>)`. This lets any token take an opacity without defining a second color.

The CSS names are the front-matter names with a `--c-` prefix, generated into the app's `tokens.css` (ADR-0018).

### Brand & Accent
- **Accent** (`{colors.accent}` — `#6C40D9`, CSS `--c-accent`): Action and selection. Primary button fill, selected state, focus ring, inline links.
- **Accent Lift** (`{colors.accent-lift}` — `#8A5BF0`, CSS `--c-accent-lift`): Top stop of `button-primary-gradient`'s vertical gradient; link hover.
- **Azure** (`{colors.azure}` — `#3D6FE8`, CSS `--c-azure`): The far stop of the purple → azure gradient. Not used as a standalone color.
- **Pulse** (`{colors.pulse}` — `#23A8CD`, CSS `--c-pulse`): Secondary accent, used sparingly.
- **Solar** (`{colors.solar}` — `#FFC53D`, CSS `--c-solar`): Third brand color. Surface only — blocks, bands, numeral grounds.

### Surface
- **Canvas** (`{colors.canvas}` — `#FAFAFD`, CSS `--c-canvas`): Page and diagram background.
- **Surface** (`{colors.surface}` — `#FFFFFF`, CSS `--c-surface`): Islands and panels.
- **Surface Muted** (`{colors.surface-muted}` — `#F4F3FA`, CSS `--c-surface-muted`): Bands, rails, panel headers, inactive states.
- **Hairline** (`{colors.hairline}` — `#E6E4F2`, CSS `--c-hairline`): Every border in the system, always 1px.

### Text
- **Ink** (`{colors.ink}` — `#1B1A24`, CSS `--c-ink`): Primary text; also the text color on solar surfaces.
- **Ink Mute** (`{colors.ink-mute}` — `#6B6880`, CSS `--c-ink-mute`): Secondary text, eyebrows, metadata, spans.
- **On Accent** (`{colors.on-accent}` — `#FFFFFF`; dark `{colors.on-accent-dark}` — `#12111A`): Text on the primary button. The accent lightens in the dark theme, so white on it stops reading; the dark value is the dark canvas.

- **Map line** (`{colors.edge}` — `#807D92`, CSS `--c-edge`; lit `{colors.edge-lit}` — `#343242`, `--c-edge-lit`; far `{colors.edge-far}` — `#CCCAD8`, `--c-edge-far`): The relationship line of the context map at rest, lit when hovered or selected, and seen from afar (zoomed out). Neutral, never the accent; the dark values are in `{colors.edge-dark}`, `{colors.edge-lit-dark}` and `{colors.edge-far-dark}`.
- **Type inks** (`{colors.core-ink}` — `#B07800`, `{colors.sup-ink}` — `#3D6FE8`, `{colors.gen-ink}` — `#545266`; CSS `--c-core-ink`, `--c-sup-ink`, `--c-gen-ink`): The ink of each subdomain type (core, supporting, generic), used for borders and highlights on the map. Dark counterparts: `{colors.core-ink-dark}`, `{colors.sup-ink-dark}`, `{colors.gen-ink-dark}`.

### Semantic
Severity is the product's verdict, and it has its own three colors. Each is always paired with its icon.

| Severity | Token | Light | Dark | Icon |
|---|---|---|---|---|
| Error | `{colors.error}` | `#C0342B` | `#E0796F` | Circle with X |
| Warning | `{colors.warning}` | `#A66A00` | `#D9A441` | Triangle |
| Info | `{colors.info}` | `#5B6B7C` | `#93A3B3` | Circle with i |

Tinted fills (counters, chips) use the functional color at 8% opacity: `rgb(var(--c-error) / .08)`.

### Dark Theme
Every token has a dark counterpart (`{colors.canvas-dark}`, `{colors.accent-dark}`, …), switched by `[data-theme="dark"]`. Neutrals keep the violet hue. Accent, pulse and the functional colors **lighten** in the dark theme rather than reusing the light hex, which would sink into the background. Light is the default theme.

## Typography

### Font Family

| Role | Family | Job |
|---|---|---|
| Sans | **Inter** | All interface and reading text: body, buttons, labels, panels |
| Mono | **JetBrains Mono** | `.odds` editor, `DiagnosticCode`, spans, tags, pills, eyebrows — anything that is data |

Both are open-source and loaded from Google Fonts. Fallback stacks are part of the token: `Inter, 'Segoe UI', system-ui, sans-serif` · `'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace`.

In the editor, disable ligatures (`font-variant-ligatures: none`): JetBrains Mono draws `<--` as a single arrow, and a DSL editor must show exactly what was typed.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.body}` | 16px | 400 | 1.6 | 0 | Running text (help, long-form prose) |
| `{typography.ui}` | 13px | 400 / 500 | 1.4 | 0 | Dense interface: buttons, labels, playground lists |
| `{typography.ui-sm}` | 12px | 400 / 500 | 1.35 | 0 | Metadata, counters |
| `{typography.code}` | 13px | 400 | 20px | 0 | Editor and `.odds` excerpts |
| `{typography.mono-sm}` | 12px | 400 | 1.3 | 0 | Pill text |
| `{typography.mono-xs}` | 11px | 400 | 1.3 | 0 | `DiagnosticCode`, line/column span |
| `{typography.eyebrow}` | 11px | 500 | 1.0 | 0.22em, uppercase | Section label, panel name |

### Principles
- **Mono is data, sans is prose.** A `DiagnosticCode`, a quoted context name, a span, a tag: mono. A sentence about them: sans.
- **Three weights, each with a place.** 400 and 500 for text and interface, 600 for titles.

## Layout

### Spacing System
- **Base unit**: 4px.
- **Tokens**: `{spacing.xxs}` 4px · `{spacing.xs}` 6px · `{spacing.sm}` 8px · `{spacing.md}` 12px · `{spacing.lg}` 16px · `{spacing.xl}` 20px · `{spacing.2xl}` 24px · `{spacing.3xl}` 32px · `{spacing.4xl}` 40px.

### Density

| Element | Size |
|---|---|
| Control height | 30px |
| Interface type | `{typography.ui}` |
| Panel header | 36px |
| List row (diagnostics) | 34px |
| Inline gap (pill, row) | 8px |

### Container
The playground is full-viewport: the diagram canvas fills the screen and the chrome floats over it as islands, with air concentrated around the diagram rather than inside the chrome.

## Elevation & Depth

Shadows **tint, they don't darken**: the color comes from the accent and the spread is negative, so the shadow is smaller than the element and suggests height without dirtying the edge. A single variable per theme, `--shadow-strength`, scales every shadow — a tinted shadow that works in light mode disappears in dark mode, and one number fixes both.

The three shadows live in the front matter's `elevation` group — `{elevation.sm}`, `{elevation.cta}` and `{elevation.island}` — as CSS `--sh-sm`, `--sh-cta` and `--sh-island`. Each is built from `{elevation.shadow-strength}` (`0.14` in light, `0.5` in dark, via `shadow-strength-dark`) and, when tinted, from `{colors.accent}`. The values are defined once, there; this section says what they are for.

| Level | Token | Use |
|---|---|---|
| 0 | Flat, 1px `{colors.hairline}` border | Default surface |
| 1 | `--sh-sm` | Resting controls, pills |
| 2 | `--sh-cta` | Primary button |
| 3 | `--sh-island` | Playground islands floating over the canvas |

Shadows never take a functional color: an element with an error gets a marker, not a red shadow.

### Decorative Depth
- **Dot grid.** The playground canvas uses a 22px **dot** grid, a position reference behind the diagram.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.mark}` | 3px | Canvas markers |
| `{rounded.chip}` | 6px | Code chip, tag chip `[OHS]` |
| `{rounded.control}` | 8px | Buttons and dense controls: segmented control, icon button, rail squares |
| `{rounded.card}` | 10px | Panels and playground islands |
| `{rounded.pill}` | 999px | Pills, severity counters, badges |

### Borders
Every border is **1px** and `{colors.hairline}`. There is no 2px border in the system.

## Components

### Buttons

**`button-primary`** — the main action of an island (Share).
- Solid `{colors.accent}`, text `{colors.on-accent}` in `{typography.ui}` at weight 500, 30px tall, padding 0 12px, rounded `{rounded.control}`, shadow `--sh-cta`.
- Hover: `filter: brightness(1.08)`.

**`button-primary-gradient`** — the same button, opted into the gradient.
- Replaces only the background: the vertical gradient `{elevation.gradient-primary}` (CSS `--grad-primary`), `{colors.accent-lift}` → `{colors.accent}`. The stops are tokens, so each theme draws its own gradient. Counts toward the gradient's twice-per-screen limit; everything else is `button-primary`.

**`control`** — dense playground controls (segmented control, icon button, rail square).
- `{typography.ui}`, rounded `{rounded.control}`, 30px tall. The selected state uses the accent.

### Containers

**`island`** — the playground's floating chrome: identity, view switch, actions, zoom, panels, diagnostics.
- Background `{colors.surface}`, 1px `{colors.hairline}` border, rounded `{rounded.card}`, shadow `--sh-island`. Islands float over the canvas with a margin; none is docked to the viewport edge.

**`solar-block`** — the yellow surface.
- Background `{colors.solar}`, text `{colors.ink}`. A band, a block, the ground of a numeral. Content that carries a severity marker sits on a white surface placed in front of the block, never on the yellow itself.

### Pills, Tags and Chips

**`pill-mono`** — the most repeated element of the system.
- Background `{colors.surface}`, 1px `{colors.hairline}` border, text `{colors.ink-mute}` in `{typography.mono-sm}`, padding 6px 14px, rounded `{rounded.pill}`, shadow `--sh-sm`, 8px gap when it carries an icon or status dot.

**`eyebrow`** — panel name in the playground.
- `{typography.eyebrow}` (mono 11px, uppercase, 0.22em tracking) in `{colors.ink-mute}`.

**`code-chip`** — the literal `DiagnosticCode`.
- `{typography.mono-xs}`, rounded `{rounded.chip}`, fill at 8% of the functional color, text in the functional color. Carries the code, never the sentence.

### Diagnostics

**`severity-counter`** — one per severity (`-error`, `-warning`, `-info`), side by side in the playground's diagnostics footer.
- Rounded `{rounded.pill}`, fill at 8% of the functional color, text in a darkened shade of the functional color, severity icon on the left, count in `{typography.mono-xs}`.
- The counters are filters: toggling one hides or shows that severity in the list.

### Motion

The playground animates only what is functional: opening and closing a panel, 180ms, and the map's own transitions. Everything stops under `prefers-reduced-motion: reduce`.

## Do's and Don'ts

### Do
- Reserve `{colors.accent}` for action and selection.
- Pair every severity color with its icon — circled X, triangle, circled i.
- Run the gradient purple → azure (`{colors.accent}` → `{colors.azure}`), in that order.
- Use `{colors.solar}` as surface, with `{colors.ink}` text on it.
- Set literal data in JetBrains Mono and prose in Inter.
- Consume colors through RGB-triplet variables with an alpha: `rgb(var(--c-accent) / .08)`.
- Give every token its dark value; lighten accent and functional colors in dark mode.
- Keep reading text on flat surfaces.
- Respect `prefers-reduced-motion` in every animation.

### Don't
- Don't use the accent to communicate severity — a purple button inside an error row is still a button.
- Don't let severity depend on color alone; exports in grayscale and color-blind readers are real, and the export carries the markers.
- Don't use the gradient more than twice per screen, and never across reading text.
- Don't use `{colors.solar}` as text, highlight, underline, or behind small text — and never at chip scale next to a diagnostic, where it reads as a warning.
- Don't add 2px borders; emphasize with fill, text color or shadow.
- Don't give shadows a functional color.
- Don't use warm neutrals next to the violet accent.

## Responsive Behavior

- Minimum touch target is **44px**.
- Islands keep their margin from the viewport edge at every width.

## Iteration Guide

1. Change one component at a time.
2. Reference tokens by name (`{colors.accent}`, `{rounded.card}`, `{typography.ui}`), never by raw value.
3. Add a token to the front matter before using it in a page; a value that exists only in a stylesheet is not part of the system.
4. Add variants as separate entries (`severity-counter-warning`).
5. Default interface text to `{typography.ui}`.
6. Check every change in both themes.
7. When the app and this file disagree, the app is wrong.
