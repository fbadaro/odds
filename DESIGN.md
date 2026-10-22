---
version: alpha
name: odds-design-system
description: The visual system of ODDS (Open Domain Driven Specification), a browser-only linter and playground for DDD context maps. A cool, violet-tinted neutral canvas carries a single purple accent for action and selection, an azure counterpoint used only in the purple-to-azure gradient, and a solar yellow that is always surface and never ink. Three type families with fixed jobs — Montserrat for display, Inter for interface and reading, JetBrains Mono for anything that is literal data — and three functional severity colors that never borrow the accent. One system with two densities, a spacious landing page that is read once and a dense playground that is lived in.

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

typography:
  display-hero:
    fontFamily: "Montserrat, Inter, system-ui, sans-serif"
    fontSize: 62px
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: -0.04em
  display-section:
    fontFamily: "Montserrat, Inter, system-ui, sans-serif"
    fontSize: 38px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.03em
  title:
    fontFamily: "Inter, 'Segoe UI', system-ui, sans-serif"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.01em
  body-lg:
    fontFamily: "Inter, 'Segoe UI', system-ui, sans-serif"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: 0
  body:
    fontFamily: "Inter, 'Segoe UI', system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  button:
    fontFamily: "Inter, 'Segoe UI', system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.0
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
  button: 12px
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
  5xl: 64px
  6xl: 96px

elevation:
  shadow-strength: "0.14"
  shadow-strength-dark: "0.5"
  sm: "0 1px 2px rgb(27 27 25 / calc({elevation.shadow-strength} * .4))"
  card: "0 18px 44px -22px rgb({colors.accent} / calc({elevation.shadow-strength} * 2))"
  cta: "0 10px 30px -8px rgb({colors.accent} / calc({elevation.shadow-strength} * 4))"
  island: "0 2px 10px rgb(27 27 25 / calc({elevation.shadow-strength} * .5))"
  lift: "0 22px 48px -20px rgb({colors.accent} / calc({elevation.shadow-strength} * 5))"
  gradient-primary: "linear-gradient(180deg, rgb({colors.accent-lift}), rgb({colors.accent}))"

components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: 12px 24px
  button-primary-gradient:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: 12px 24px
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: 12px 24px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.card}"
    padding: 24px
  card-large:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.card}"
    padding: 32px
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

Typography separates prose from data. **Montserrat** sets display headlines only. **Inter** sets every word of interface and reading. **JetBrains Mono** sets anything that is literal data: `.odds` source, a `DiagnosticCode`, a span like `L24:5`, a tag like `[OHS]`, a context name quoted in a sentence. The boundary is the same one `MESSAGES.md` keeps between a diagnostic's `data` and its rendered prose, and the screen makes it visible.

The system runs at two densities. The **landing** is spacious — large display type, cards, comfortable 44px controls. The **playground** is dense — 13px interface type, 30px controls, floating islands over the diagram canvas. Same palette, same families, same radii; only the rhythm changes.

**Key Characteristics:**
- Cool, violet-tinted neutrals; the dark theme is the same family inverted, never a separate palette.
- A single purple accent for action and selection; severity never borrows it.
- Severity always carries an icon — circled X, triangle, circled i — so it never depends on color alone.
- Solar yellow is always surface, with `{colors.ink}` text on it.
- One purple → azure gradient, at most twice per screen.
- Mono means data, sans means prose.
- 1px borders everywhere; emphasis comes from fill, text color or shadow, never from a thicker line.
- Shadows tint with the accent instead of darkening, with negative spread.

**Scope.** This version covers the landing page and the playground chrome. Diagram rendering — node and edge colors per subdomain type, lit and invalid relationship strokes, and the degraded states required by `PRD.md` §5.2 — is not part of the system yet.

## Colors

All colors are implemented as CSS custom properties holding **RGB triplets**, consumed with `rgb(var(--token) / <alpha>)`. This lets any token take an opacity without defining a second color.

```css
:root {
  color-scheme: light;
  --c-bg: 250 250 253;       /* canvas */
  --c-panel: 255 255 255;    /* surface */
  --c-panel2: 244 243 250;   /* surface-muted */
  --c-border: 230 228 242;   /* hairline */
  --c-ink: 27 26 36;         /* ink */
  --c-dim: 107 104 128;      /* ink-mute */
  --c-accent: 108 64 217;    /* accent */
  --c-accent-lift: 138 91 240;
  --c-azure: 61 111 232;
  --c-pulse: 35 168 205;
  --c-solar: 255 197 61;
  --c-error: 192 52 43;
  --c-warning: 166 106 0;
  --c-info: 91 107 124;
  --shadow-strength: .14;
}
[data-theme="dark"] {
  color-scheme: dark;
  --c-bg: 18 17 26;
  --c-panel: 26 25 38;
  --c-panel2: 35 33 47;
  --c-border: 50 47 69;
  --c-ink: 236 235 245;
  --c-dim: 154 151 174;
  --c-accent: 173 141 255;
  --c-accent-lift: 198 176 255;
  --c-azure: 125 163 255;
  --c-pulse: 94 208 238;
  --c-solar: 255 209 99;
  --c-error: 224 121 111;
  --c-warning: 217 164 65;
  --c-info: 147 163 179;
  --shadow-strength: .5;
}
```

### Brand & Accent
- **Accent** (`{colors.accent}` — `#6C40D9`, CSS `--c-accent`): Action and selection. Primary button fill, selected state, focus ring, inline links.
- **Accent Lift** (`{colors.accent-lift}` — `#8A5BF0`, CSS `--c-accent-lift`): Top stop of `button-primary-gradient`'s vertical gradient; link hover.
- **Azure** (`{colors.azure}` — `#3D6FE8`, CSS `--c-azure`): The far stop of the purple → azure gradient. Not used as a standalone color.
- **Pulse** (`{colors.pulse}` — `#23A8CD`, CSS `--c-pulse`): Secondary accent, used sparingly.
- **Solar** (`{colors.solar}` — `#FFC53D`, CSS `--c-solar`): Third brand color. Surface only — blocks, bands, numeral grounds.

### Surface
- **Canvas** (`{colors.canvas}` — `#FAFAFD`, CSS `--c-bg`): Page background.
- **Surface** (`{colors.surface}` — `#FFFFFF`, CSS `--c-panel`): Cards, islands, panels.
- **Surface Muted** (`{colors.surface-muted}` — `#F4F3FA`, CSS `--c-panel2`): Bands, rails, panel headers, inactive states.
- **Hairline** (`{colors.hairline}` — `#E6E4F2`, CSS `--c-border`): Every border in the system, always 1px.

### Text
- **Ink** (`{colors.ink}` — `#1B1A24`, CSS `--c-ink`): Primary text; also the text color on solar surfaces.
- **Ink Mute** (`{colors.ink-mute}` — `#6B6880`, CSS `--c-dim`): Secondary text, eyebrows, metadata, spans.
- **On Accent** (`{colors.on-accent}` — `#FFFFFF`; dark `{colors.on-accent-dark}` — `#12111A`): Text on the primary button. The accent lightens in the dark theme, so white on it stops reading; the dark value is the dark canvas.

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
| Display | **Montserrat** | Hero headline and large section openers. Nothing else |
| Sans | **Inter** | All interface and reading text: body, buttons, labels, panels |
| Mono | **JetBrains Mono** | `.odds` editor, `DiagnosticCode`, spans, tags, pills, eyebrows — anything that is data |

All three are open-source and loaded from Google Fonts. Fallback stacks are part of the token: `Montserrat, Inter, system-ui, sans-serif` · `Inter, 'Segoe UI', system-ui, sans-serif` · `'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace`.

In the editor, disable ligatures (`font-variant-ligatures: none`): JetBrains Mono draws `<--` as a single arrow, and a DSL editor must show exactly what was typed.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-hero}` | 62px (42px < 640px) | 800 | 1.05 | -0.04em | Hero headline, once per page |
| `{typography.display-section}` | 38px (30px < 640px) | 700 | 1.1 | -0.03em | Section opener |
| `{typography.title}` | 20px | 600 | 1.3 | -0.01em | Card title |
| `{typography.body-lg}` | 18px | 400 | 1.65 | 0 | Hero subtitle, lead paragraph |
| `{typography.body}` | 16px | 400 | 1.6 | 0 | Running text |
| `{typography.button}` | 16px | 600 | 1.0 | 0 | Landing button label |
| `{typography.ui}` | 13px | 400 / 500 | 1.4 | 0 | Dense interface: buttons, labels, playground lists |
| `{typography.ui-sm}` | 12px | 400 / 500 | 1.35 | 0 | Metadata, counters |
| `{typography.code}` | 13px | 400 | 20px | 0 | Editor and `.odds` excerpts |
| `{typography.mono-sm}` | 12px | 400 | 1.3 | 0 | Pill text |
| `{typography.mono-xs}` | 11px | 400 | 1.3 | 0 | `DiagnosticCode`, line/column span |
| `{typography.eyebrow}` | 11px | 500 | 1.0 | 0.22em, uppercase | Section label, panel name |

### Principles
- **Mono is data, sans is prose.** A `DiagnosticCode`, a quoted context name, a span, a tag: mono. A sentence about them: sans.
- **Display is Montserrat, and only display.** Never set interface or body text in Montserrat.
- **Five weights, each with a place.** 400 and 500 for text and interface, 600 for titles and buttons, 700 for section display, 800 only for the hero headline.
- **Tight tracking on display.** Montserrat is wide and geometric; -0.04em at hero size and -0.03em at section size keep headlines dense.

## Layout

### Spacing System
- **Base unit**: 4px.
- **Tokens**: `{spacing.xxs}` 4px · `{spacing.xs}` 6px · `{spacing.sm}` 8px · `{spacing.md}` 12px · `{spacing.lg}` 16px · `{spacing.xl}` 20px · `{spacing.2xl}` 24px · `{spacing.3xl}` 32px · `{spacing.4xl}` 40px · `{spacing.5xl}` 64px · `{spacing.6xl}` 96px.

### Densities

| Context | Landing (spacious) | Playground (dense) |
|---|---|---|
| Control height | 44px | 30px |
| Interface type | `{typography.body}` | `{typography.ui}` |
| Section padding | 96px vertical (64px < 640px) | — |
| Card padding | 24px, 32px on large cards | — |
| Panel header | — | 36px |
| List row (diagnostics) | — | 34px |
| Inline gap (pill, row) | 8px | 8px |

### Grid & Container
- Landing content centers in a **1152px** container with a **24px** gutter.
- The playground is full-viewport: the diagram canvas fills the screen and the chrome floats over it as islands.

### Whitespace Philosophy
The landing is read once, so it breathes: 96px between sections, one idea per band. The playground is lived in, so it packs: dense type and short controls, with air concentrated around the diagram rather than inside the chrome.

## Elevation & Depth

Shadows **tint, they don't darken**: the color comes from the accent and the spread is negative, so the shadow is smaller than the element and suggests height without dirtying the edge. A single variable per theme, `--shadow-strength`, scales every shadow — a tinted shadow that works in light mode disappears in dark mode, and one number fixes both.

The five shadows live in the front matter's `elevation` group — `{elevation.sm}`, `{elevation.card}`, `{elevation.cta}`, `{elevation.island}` and `{elevation.lift}` — as CSS `--sh-sm`, `--sh-card`, `--sh-cta`, `--sh-island` and `--sh-lift`. Each is built from `{elevation.shadow-strength}` (`0.14` in light, `0.5` in dark, via `shadow-strength-dark`) and, when tinted, from `{colors.accent}`. The values are defined once, there; this section says what they are for.

| Level | Token | Use |
|---|---|---|
| 0 | Flat, 1px `{colors.hairline}` border | Default surface |
| 1 | `--sh-sm` | Resting controls, pills, secondary button |
| 2 | `--sh-card` | Cards |
| 3 | `--sh-cta` | Primary button |
| 4 | `--sh-island` | Playground islands floating over the canvas |
| state | `--sh-lift` | Card hover (landing only) |

Shadows never take a functional color: an element with an error gets a marker, not a red shadow.

### Decorative Depth
- **Grid backdrop.** The landing uses a 28px line grid at `rgb(var(--c-accent) / .07)` behind the hero and canvas; the playground uses a 22px **dot** grid. Lines are atmosphere; dots are a position reference.
- **Blurred blobs.** Behind the landing hero, final CTA and section edges: four or five large circular blobs, `filter: blur(64px)`, 22–34rem in diameter, opacity 0.28–0.50, in pale violet, pale azure and pale cyan (at most one blob outside that family). They drift on a 16s `ease-in-out` loop with a different **negative** delay each, so they never pulse in unison.
- **Perspective drafting board.** A line grid receding to the horizon behind the hero and the final CTA, built without images: two 1px `linear-gradient`s, `transform: perspective(600px) rotateX(62deg)`, and a `mask-image` that dissolves it before the horizon. Lines at ~8% of the accent.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.mark}` | 3px | Canvas markers |
| `{rounded.chip}` | 6px | Code chip, tag chip `[OHS]` |
| `{rounded.control}` | 8px | Dense controls: segmented control, icon button, rail squares |
| `{rounded.button}` | 12px | Buttons and tall fields |
| `{rounded.card}` | 10px | Cards, large panels, playground islands |
| `{rounded.pill}` | 999px | Pills, severity counters, badges |

### Borders
Every border is **1px** and `{colors.hairline}`. There is no 2px border in the system.

## Components

### Buttons

**`button-primary`** — the main call to action.
- Solid `{colors.accent}`, text `{colors.on-accent}` in `{typography.button}`, padding 12px 24px, rounded `{rounded.button}`, shadow `--sh-cta`.
- Hover: `filter: brightness(1.08)`.

**`button-primary-gradient`** — the same button, opted into the gradient (CSS: `.primary.gradient`).
- Replaces only the background: the vertical gradient `{elevation.gradient-primary}` (CSS `--grad-primary`), `{colors.accent-lift}` → `{colors.accent}`. The stops are tokens, so each theme draws its own gradient. Counts toward the gradient's twice-per-screen limit; everything else is `button-primary`.

**`button-secondary`** — the alternative action.
- Background `{colors.surface}`, 1px `{colors.hairline}` border, text `{colors.ink}` in `{typography.button}`, same geometry, shadow `--sh-sm`.
- Hover: border becomes `rgb(var(--c-accent) / .5)`.

**`control`** — dense playground controls (segmented control, icon button, rail square).
- `{typography.ui}`, rounded `{rounded.control}`, 30px tall. The selected state uses the accent.

### Cards & Containers

**`card`** — the landing's content container.
- Background `{colors.surface}`, 1px `{colors.hairline}` border, rounded `{rounded.card}`, padding 24px (`card-large`: 32px), shadow `--sh-card`.
- Hover (landing only): shadow `--sh-lift` and a 4px rise.

**`island`** — the playground's floating chrome: identity, view switch, actions, zoom, panels, diagnostics.
- Background `{colors.surface}`, 1px `{colors.hairline}` border, rounded `{rounded.card}`, shadow `--sh-island`. Islands float over the canvas with a margin; none is docked to the viewport edge.

**`solar-block`** — the yellow surface.
- Background `{colors.solar}`, text `{colors.ink}`. A band, a block, the ground of a numeral. Content that carries a severity marker sits on a white surface placed in front of the block, never on the yellow itself.

### Pills, Tags and Chips

**`pill-mono`** — the most repeated element of the system.
- Background `{colors.surface}`, 1px `{colors.hairline}` border, text `{colors.ink-mute}` in `{typography.mono-sm}`, padding 6px 14px, rounded `{rounded.pill}`, shadow `--sh-sm`, 8px gap when it carries an icon or status dot.

**`eyebrow`** — section label on the landing, panel name in the playground.
- `{typography.eyebrow}` (mono 11px, uppercase, 0.22em tracking) in `{colors.ink-mute}`.

**`code-chip`** — the literal `DiagnosticCode`.
- `{typography.mono-xs}`, rounded `{rounded.chip}`, fill at 8% of the functional color, text in the functional color. Carries the code, never the sentence.

### Diagnostics

**`severity-counter`** — one per severity (`-error`, `-warning`, `-info`), side by side in the playground's diagnostics footer.
- Rounded `{rounded.pill}`, fill at 8% of the functional color, text in a darkened shade of the functional color, severity icon on the left, count in `{typography.mono-xs}`.
- The counters are filters: toggling one hides or shows that severity in the list.

### Motion

Two animations and no ornament:
- **Rise** — hero entrance: 8px translate + opacity, 0.7s, `cubic-bezier(.2,.7,.2,1)`, staggered 80ms per element.
- **Lift** — card hover on the landing (`--sh-lift` + 4px rise).

The playground animates only what is functional: opening and closing a panel, 180ms.

Everything stops under `prefers-reduced-motion: reduce`, including blob drift (the blobs remain, still).

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
- Don't use the gradient more than twice per screen (a `button-primary-gradient`, one hero expression), and never across reading text.
- Don't use `{colors.solar}` as text, highlight, underline, or behind small text — and never at chip scale next to a diagnostic, where it reads as a warning.
- Don't add 2px borders; emphasize with fill, text color or shadow.
- Don't give shadows a functional color.
- Don't place blobs behind small text.
- Don't use warm neutrals next to the violet accent.
- Don't set interface text in Montserrat.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Desktop | ≥ 640px | Hero 62px, section display 38px, section padding 96px |
| Mobile | < 640px | Hero 42px, section display 30px, section padding 64px |

### Touch Targets
- Minimum touch target is **44px**. Landing controls are 44px tall.

### Collapsing Strategy
- Display type and section padding step down at 640px (see Breakpoints).
- In the playground, islands keep their margin from the viewport edge at every width.

## Iteration Guide

1. Change one component at a time.
2. Reference tokens by name (`{colors.accent}`, `{rounded.card}`, `{typography.ui}`), never by raw value.
3. Add a token to the front matter before using it in a page; a value that exists only in a stylesheet is not part of the system.
4. Add variants as separate entries (`card-large`, `severity-counter-warning`).
5. Default interface text to `{typography.ui}` in the playground and `{typography.body}` on the landing.
6. Check every change in both themes.
7. When a page and this file disagree, the page is wrong.
