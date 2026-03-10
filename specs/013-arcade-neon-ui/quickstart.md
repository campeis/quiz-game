# Quickstart: 80s Arcade Neon UI Redesign

## Prerequisites

- Node.js 20+, pnpm installed
- Python 3.8+ with `fonttools` for font conversion: `pip install fonttools brotli`
- Repo checked out on branch `013-arcade-neon-ui`

## Step 1: Download and Convert Fonts

Font files must be obtained from Google Fonts and converted to `.woff2` before implementation can begin.

```bash
# Create font assets directory
mkdir -p frontend/src/assets/fonts

# Download Press Start 2P from Google Fonts:
# 1. Go to: https://fonts.google.com/specimen/Press+Start+2P
# 2. Click "Download family"
# 3. Extract PressStart2P-Regular.ttf

# Download VT323 from Google Fonts:
# 1. Go to: https://fonts.google.com/specimen/VT323
# 2. Click "Download family"
# 3. Extract VT323-Regular.ttf

# Convert both to .woff2
python -m fonttools.ttLib.woff2 compress PressStart2P-Regular.ttf
python -m fonttools.ttLib.woff2 compress VT323-Regular.ttf

# Move to assets
mv PressStart2P-Regular.woff2 frontend/src/assets/fonts/
mv VT323-Regular.woff2 frontend/src/assets/fonts/

# Copy OFL license text into font directory
# (Download from: https://scripts.sil.org/OFL_web)
cp OFL.txt frontend/src/assets/fonts/
```

## Step 2: Run the Dev Server

```bash
cd frontend
pnpm install
pnpm dev
```

Open `http://localhost:5173` to view the app.

## Step 3: Running Tests

```bash
cd frontend
pnpm test
```

Tests use Vitest + @testing-library/react. The `useReducedMotion` hook should be mocked in tests.

## Step 4: Linting

```bash
cd frontend
pnpm exec biome check src/
```

Fix issues:
```bash
pnpm exec biome check --write src/
```

## Step 5: Full Test Suite

```bash
just test   # runs backend + frontend + e2e
just lint   # runs all linters
```

## Implementation Entry Points

| File | What to do |
|------|-----------|
| `frontend/src/styles/arcade.css` | CREATE — @font-face, @keyframes, base styles |
| `frontend/src/components/ui/tokens.ts` | OVERHAUL — replace with arcade-neon tokens |
| `frontend/src/components/ui/neon.ts` | CREATE — glow shadow helpers |
| `frontend/src/hooks/useReducedMotion.ts` | CREATE — OS motion preference hook |
| `frontend/src/main.tsx` | EDIT — add `import "./styles/arcade.css"` |
| All `components/` and `pages/` files | EDIT — apply arcade tokens and neon effects |

## Architecture Notes

- **No CSS framework**: Inline styles continue to be the primary styling approach. The new global CSS file is for `@font-face` and `@keyframes` only (cannot be expressed as inline styles).
- **No new dependencies**: All changes use native CSS and existing React hooks.
- **Font loading**: `font-display: swap` ensures text is always visible during font load. Layout reflow is prevented because font metrics for `VT323` and `Press Start 2P` must match their fallback equivalents in size/spacing (test this carefully).
- **Reduced motion**: Any component using CSS `animation` in an inline style must check `useReducedMotion()` and omit or shorten the animation when `true`.
- **Token split**: `typography.fontFamily` is now `typography.fontDisplay` (headings) and `typography.fontBody` (body). Update all references during the token overhaul task.

## Neon Glow Quick Reference

```typescript
import { neonBoxShadow, neonTextShadow } from "./ui/neon";
import { colors } from "./ui/tokens";

// Button border glow
style={{ boxShadow: neonBoxShadow(colors.primary, "medium") }}

// Heading text glow
style={{ textShadow: neonTextShadow(colors.primary, "low") }}

// Correct answer burst — check reduced motion first
const prefersReducedMotion = useReducedMotion();
style={{ animation: prefersReducedMotion ? "none" : "correctBurst 0.5s forwards" }}
```
