# Implementation Plan: 80s Arcade Neon UI Redesign

**Branch**: `013-arcade-neon-ui` | **Date**: 2026-03-10 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/013-arcade-neon-ui/spec.md`

## Summary

Redesign the entire frontend visual identity to an 80s arcade neon aesthetic, replacing the existing Inter-based design system with a neon-glow token system built on self-hosted OFL-licensed pixel fonts (Press Start 2P for display, VT323 for body). All screens — player-facing and host dashboard — receive the full arcade treatment. Animations respect the OS reduced-motion preference. Zero backend changes required.

## Technical Context

**Language/Version**: TypeScript 5.x — frontend only; Rust backend unchanged
**Primary Dependencies**: React 19, Rspack 1.7, Biome (lint/format), Vitest + @testing-library/react
**Storage**: N/A
**Testing**: Vitest + @testing-library/react; Playwright (e2e)
**Target Platform**: Modern desktop and mobile browsers (CSS3, WASM not applicable)
**Project Type**: Web application (frontend-only change)
**Performance Goals**: Glow/hover feedback within 100ms; no layout shift on font load (`font-display: swap`)
**Constraints**: Self-hosted fonts (bundled, no CDN); zero copyrighted assets; no new npm dependencies; CSS animations suppressed when `prefers-reduced-motion: reduce`
**Scale/Scope**: ~18 component/page files + 3 new utility files + 1 new CSS file + 2 font assets

## Constitution Check

### I. Code Quality ✅

- All new utilities (`neon.ts`, `useReducedMotion.ts`) have single, clear responsibilities.
- `tokens.ts` overhaul replaces existing module in-place; no dead code added.
- Biome enforcement unchanged — no new linting rules needed.

### II. Testing Standards ✅

- TDD applies: write tests for `neonBoxShadow`, `neonTextShadow`, `useReducedMotion` before implementation.
- Existing component tests must continue to pass after token changes.
- Visual changes are tested via existing Playwright e2e suite (smoke tests confirm theme renders).
- New unit tests: `neon.ts` utility functions, `useReducedMotion` hook with mocked `matchMedia`.

### III. User Experience Consistency ✅

- Single design system token source (`tokens.ts`) ensures cohesion across all screens.
- All screens (join, lobby, quiz, answer reveal, leaderboard, host dashboard) receive identical theme treatment — no screen left unstyled.
- Reduced-motion support addresses accessibility for users with vestibular disorders.
- Contrast ratio requirement (4.5:1 minimum) enforced for all primary content.

### IV. Performance Requirements ✅

- Font loading uses `font-display: swap` — no invisible text period; layout reflow risk mitigated.
- CSS glow is GPU-composited (`box-shadow` / `text-shadow`) — no JavaScript layout thrashing.
- Animations are CSS-only — no `requestAnimationFrame` loops.
- Rspack asset size budget: VT323 (~75 KB) + Press Start 2P (~13 KB) = ~88 KB additional, within the existing 300 KB `maxAssetSize` budget per entry.

**Post-design re-check**: No constitution violations identified. Complexity Tracking section not required.

## Project Structure

### Documentation (this feature)

```text
specs/013-arcade-neon-ui/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── design-tokens.md # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── assets/
│   │   └── fonts/
│   │       ├── PressStart2P-Regular.woff2   # NEW — self-hosted display font
│   │       ├── VT323-Regular.woff2          # NEW — self-hosted body font
│   │       └── OFL.txt                      # NEW — license file
│   ├── styles/
│   │   └── arcade.css                       # NEW — @font-face, @keyframes, base styles
│   ├── components/
│   │   └── ui/
│   │       ├── tokens.ts                    # OVERHAUL — arcade-neon design tokens
│   │       ├── neon.ts                      # NEW — glow shadow helper functions
│   │       ├── Button.tsx                   # EDIT — neon hover/active glow
│   │       ├── Card.tsx                     # EDIT — neon border, dark surface
│   │       └── Timer.tsx                    # EDIT — arcade score counter style
│   ├── hooks/
│   │   └── useReducedMotion.ts              # NEW — OS reduced-motion preference hook
│   ├── main.tsx                             # EDIT — import arcade.css
│   ├── components/
│   │   ├── JoinForm.tsx                     # EDIT — arcade inputs, neon join code
│   │   ├── Lobby.tsx                        # EDIT — neon join code display, arcade labels
│   │   ├── Question.tsx                     # EDIT — answer glow, burst animations
│   │   ├── Leaderboard.tsx                  # EDIT — high-score neon display
│   │   ├── HostDashboard.tsx                # EDIT — full neon theme
│   │   ├── Podium.tsx                       # EDIT — arcade podium styling
│   │   ├── EmojiPicker.tsx                  # EDIT — neon selection highlight
│   │   ├── AvatarPickerModal.tsx            # EDIT — modal with arcade theme
│   │   └── QuizUpload.tsx                   # EDIT — upload area neon styling
│   └── pages/
│       ├── HomePage.tsx                     # EDIT — neon title, arcade home screen
│       ├── HostPage.tsx                     # EDIT — apply arcade theme wrapper
│       └── PlayerPage.tsx                   # EDIT — apply arcade theme wrapper
└── src/
    └── (test files alongside source)        # EDIT/ADD — update/add token + hook tests
```

**Structure Decision**: Web application (Option 2 from template). Frontend-only change; backend directory untouched.

## Implementation Phases

### Phase A: Foundation (prerequisite for all other phases)

Must be completed first. All subsequent work depends on font files existing and tokens being updated.

1. **Obtain font files** — download Press Start 2P and VT323 from Google Fonts; convert `.ttf` → `.woff2` using fonttools; place in `frontend/src/assets/fonts/`
2. **Create `arcade.css`** — `@font-face` declarations with `font-display: swap`; `@keyframes` (neonPulse, correctBurst, incorrectFlash, neonShimmer, scanline); base body styles; `@media (prefers-reduced-motion: reduce)` overrides
3. **Import `arcade.css` in `main.tsx`**
4. **Overhaul `tokens.ts`** — replace color palette with neon values; split `fontFamily` into `fontDisplay`/`fontBody`; preserve spacing/radius/breakpoints unchanged
5. **Create `neon.ts`** — `neonBoxShadow(color, intensity)`, `neonTextShadow(color, intensity)`, `neonPulseStyle(color)` pure helper functions
6. **Create `useReducedMotion.ts`** — hook wrapping `matchMedia('(prefers-reduced-motion: reduce)')` with listener cleanup

### Phase B: Primitive Components

Update the three primitive UI components that all other components use:

7. **`Button.tsx`** — neon border (`neonBoxShadow`); primary variant uses neon cyan; secondary variant uses dimmed neon border; hover state brightens glow; use `fontDisplay` for button labels; animate with `neonPulse` on hover (check `useReducedMotion`)
8. **`Card.tsx`** — dark surface color (`colors.surface`); neon border (`neonBoxShadow(colors.border, 'low')`)
9. **`Timer.tsx`** — `fontDisplay` for the countdown number; neon color shifts (cyan → yellow → red) at urgency thresholds; progress bar uses neon glow

### Phase C: Content Components

Update all content/feature components:

10. **`JoinForm.tsx`** — arcade-themed inputs (neon border on focus, dark background); join code input in `fontDisplay`; player name input in `fontBody`; avatar picker button with neon border
11. **`Lobby.tsx`** — join code displayed large in `fontDisplay` with `neonTextShadow`; player list with subtle neon separators; scoring rule fieldset with arcade styling
12. **`Question.tsx`** — question text in `fontBody` (larger size); answer options with neon border on selection; correct answer burst animation (`correctBurst`) via `animation` property when `answerResult` arrives; incorrect answer flash (`incorrectFlash`); use `useReducedMotion` to suppress
13. **`Leaderboard.tsx`** — rank #1 entry with `neonBoxShadow(colors.winner, 'high')`; rank numbers in `fontDisplay`; player names in `fontBody`; final leaderboard heading with `neonShimmer` animation
14. **`HostDashboard.tsx`** — question text and options in arcade theme; answer progress bar with neon fill; standings list with neon rank numbers; full neon theme applied
15. **`Podium.tsx`** — podium steps with neon color by rank (yellow/cyan/magenta); winner name with `neonTextShadow`
16. **`EmojiPicker.tsx`** — selected emoji with neon cyan `box-shadow`; grid background dark surface
17. **`AvatarPickerModal.tsx`** — modal overlay with dark backdrop; modal body as `Card` (inherits arcade theme)
18. **`QuizUpload.tsx`** — drag-and-drop area with neon dashed border; file name in `fontBody`

### Phase D: Pages

Update page-level layout wrappers:

19. **`HomePage.tsx`** — "Quiz Game" title in `fontDisplay` with `neonTextShadow(colors.primary, 'high')`; subtitle in `fontBody`; `backgroundColor: colors.background` on root element
20. **`HostPage.tsx`** — ensure page background is `colors.background`; `fontBody` on body
21. **`PlayerPage.tsx`** — ensure page background is `colors.background`; `fontBody` on body

### Phase E: Validation

22. **Run full test suite**: `just test` — all existing tests must pass
23. **Run linter**: `just lint` — zero violations
24. **Visual inspection** of all 6 screens against spec acceptance criteria
25. **Contrast verification**: Check primary text against background using browser DevTools color picker; verify ≥4.5:1 ratio
26. **Reduced-motion test**: Enable OS reduced-motion preference and verify no animations play while neon colors/glows remain

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Display font | Press Start 2P (OFL 1.1) | Most authentic arcade pixel font; self-hostable |
| Body font | VT323 (OFL 1.1) | CRT terminal style; readable at normal sizes |
| Font hosting | Self-hosted in `src/assets/fonts/` | Per clarification Q3; eliminates CDN dependency |
| Animation architecture | Global CSS `arcade.css` + inline `animation` strings | Rspack already supports CSS; keyframes cannot be inline |
| Glow implementation | Multi-layer `box-shadow`/`text-shadow` in `neon.ts` | GPU-composited; no JS layout cost |
| Reduced motion | CSS `@media` + `useReducedMotion` hook | Dual coverage for CSS and inline-style animations |
| New dependencies | None | All changes use CSS3 + existing React hooks |
| Backend changes | None | Pure frontend visual reskin |
