# Data Model: 80s Arcade Neon UI Redesign

This feature introduces no new backend data model. It is a pure frontend visual redesign. The entities below describe the **design system model** — the TypeScript types and structures that govern the arcade theme.

---

## Entity 1: ArcadeTokens (replaces `tokens.ts`)

The central design token object, exported from `frontend/src/components/ui/tokens.ts`. All components import from this single source of truth.

### colors

| Token | Value | Usage |
|-------|-------|-------|
| `background` | `#050510` | Page/root background |
| `surface` | `#0d0d2b` | Card and panel backgrounds |
| `surfaceHover` | `#12124a` | Card hover state |
| `border` | `#00ffff` | Default element border (neon cyan) |
| `borderDim` | `#00ffff44` | Subdued borders, separators |
| `text` | `#e0f8ff` | Primary text (pale cyan-white) |
| `textSecondary` | `#7ec8e3` | Secondary/muted text |
| `primary` | `#00ffff` | Primary interactive elements |
| `primaryHover` | `#66ffff` | Primary element hover |
| `accent` | `#ff00ff` | Secondary accent (neon magenta) |
| `success` | `#39ff14` | Correct answer, success states |
| `error` | `#ff3131` | Incorrect answer, error states |
| `warning` | `#fff01f` | Timer urgency, caution |
| `winner` | `#fff01f` | Rank 1 highlight (neon yellow) |

### typography

| Token | Value | Notes |
|-------|-------|-------|
| `fontDisplay` | `'Press Start 2P', monospace` | Headings, titles, scores, rank numbers |
| `fontBody` | `'VT323', monospace` | Body text, question text, labels, answer options |
| `fontFallback` | `monospace` | System fallback if fonts fail to load |

Font sizes and weights are unchanged from existing `tokens.ts` structure. `fontFamily` token is split into `fontDisplay` and `fontBody`.

### spacing, borderRadius, breakpoints

Unchanged from existing values — these are layout tokens, not visual identity tokens.

---

## Entity 2: NeonGlow (new `neon.ts` utility)

A set of pure TypeScript helper functions that return CSS string values for `box-shadow` and `text-shadow` properties, used in inline styles.

**File**: `frontend/src/components/ui/neon.ts`

### Functions

| Function | Parameters | Returns | Usage |
|----------|------------|---------|-------|
| `neonBoxShadow(color, intensity)` | color: hex string; intensity: `'low' \| 'medium' \| 'high'` | CSS `box-shadow` string | Borders, card edges, button outlines |
| `neonTextShadow(color, intensity)` | color: hex string; intensity: `'low' \| 'medium' \| 'high'` | CSS `text-shadow` string | Headings, score values, neon text labels |
| `neonPulseStyle(color)` | color: hex string | `React.CSSProperties` object with `animation` property | Elements with continuous pulse animation |

### Intensity Levels

| Level | Description | Layer count |
|-------|-------------|-------------|
| `low` | Subtle ambient glow; used for inactive or background elements | 2 layers |
| `medium` | Clear glow halo; default for active UI elements | 3 layers |
| `high` | Bright burst; used for correct answers, rank 1 highlight | 4 layers |

---

## Entity 3: ReducedMotionContext

A React hook that reads the OS-level `prefers-reduced-motion` preference and provides a boolean to components.

**File**: `frontend/src/hooks/useReducedMotion.ts`

| Export | Type | Description |
|--------|------|-------------|
| `useReducedMotion()` | `() => boolean` | Returns `true` when the user has opted into reduced motion. Re-evaluates automatically when the preference changes. |

**Usage rule**: Any component applying CSS animations via inline `style.animation` or `style.transition` MUST check `useReducedMotion()` and conditionally suppress the animation value.

---

## Entity 4: ArcadeCSS (global stylesheet)

**File**: `frontend/src/styles/arcade.css`

A single global CSS file imported in `main.tsx`. Contains:

### @font-face declarations

| Font family | File | Format |
|-------------|------|--------|
| `Press Start 2P` | `../assets/fonts/PressStart2P-Regular.woff2` | woff2 |
| `VT323` | `../assets/fonts/VT323-Regular.woff2` | woff2 |

Both declarations include `font-display: swap` for graceful loading behavior (prevents invisible text during font load).

### @keyframes

| Name | Duration | Usage |
|------|----------|-------|
| `neonPulse` | 2s, infinite | Continuous pulsing glow on borders/buttons |
| `correctBurst` | 0.5s, forwards | Celebratory flash on correct answer |
| `incorrectFlash` | 0.6s, forwards | Negative flash on incorrect answer |
| `neonShimmer` | 1.5s, infinite | Subtle text shimmer for headings |
| `scanline` | 8s, linear, infinite | Optional subtle CRT scanline effect on page background |

### @media (prefers-reduced-motion: reduce)

Targets all animation/transition properties and sets to `none` / `0s` for full suppression.

### Base styles

- `body`: `background-color: #050510; color: #e0f8ff; font-family: 'VT323', monospace`
- `*`: `box-sizing: border-box`

---

## Font Assets

**Directory**: `frontend/src/assets/fonts/`

| File | Size (approx) | Source |
|------|---------------|--------|
| `PressStart2P-Regular.woff2` | ~13 KB | Google Fonts download → convert .ttf → .woff2 |
| `VT323-Regular.woff2` | ~75 KB | Google Fonts download → convert .ttf → .woff2 |

Both fonts are OFL 1.1 licensed. License files to be stored at `frontend/src/assets/fonts/OFL.txt`.

---

## Unchanged: Backend Data Model

No changes to any Rust structs, API payloads, or WebSocket message schemas. The following remain identical:

- `Player` struct
- `GameSession` struct
- `LeaderboardEntry` / `LeaderboardEntryPayload`
- All WebSocket message types in `messages.ts`
- All API service functions in `api.ts`
