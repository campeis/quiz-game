# Implementation Plan: Add Storybook Component Showcase

**Branch**: `014-add-storybook` | **Date**: 2026-03-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/014-add-storybook/spec.md`

## Summary

Introduce Storybook as an interactive component browser for the speckit frontend. Using `storybook-react-rsbuild` — the community Storybook builder that wraps Rsbuild (the higher-level build tool built on Rspack) — Storybook runs within the existing Rspack ecosystem without requiring a separate webpack or Vite setup. Six components receive collocated `*.stories.tsx` files: three UI primitives (Button, Card, Timer) with full interactive prop controls, and three feature components (EmojiPicker, Leaderboard, Podium) with static mock data. Global arcade styles and fonts are loaded in `preview.ts` to ensure visual parity with the main app. A single `just storybook` command from the project root launches the browser.

## Technical Context

**Language/Version**: TypeScript 5.7 / React 19
**Primary Dependencies**: `storybook` (>=8), `storybook-react-rsbuild` (Rspack-ecosystem Storybook builder), `@rsbuild/core`, `@rsbuild/plugin-react`, `@storybook/addon-essentials`; existing: Rspack 1.7, Biome 2.x, pnpm
**Storage**: N/A — developer-only tooling, no persistence
**Testing**: Story files are interactive visual documentation, not automated tests; existing Vitest suite unchanged
**Target Platform**: Browser on developer workstation (port 6006)
**Project Type**: Frontend developer tooling (excluded from production build)
**Performance Goals**: <30s cold start; <3s hot-reload on story file edits
**Constraints**: Story files must not appear in production Rspack bundle; component browser runs independently of backend and main dev server
**Scale/Scope**: 6 story files (3 UI primitives + 3 feature components)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | ✅ Pass | Story files follow TypeScript + Biome conventions; collocated `ComponentName.stories.tsx` naming is consistent and tooling-enforced |
| II. Testing Standards | ✅ Pass | TDD applies to component logic, not story scaffolding. Stories are interactive visual documentation; no new business logic is introduced. Existing Vitest coverage is unaffected. |
| III. UX Consistency | ✅ Pass | `arcade.css` + custom fonts loaded in `preview.ts` — stories render with identical visual styles as the main app |
| IV. Performance | ✅ Pass | SC-003 (<30s startup) and SC-004 (<3s hot-reload) are within acceptable performance budgets for a dev tool |

No violations. Complexity Tracking section not required.

## Project Structure

### Documentation (this feature)

```text
specs/014-add-storybook/
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 output (/speckit.plan)
├── data-model.md        # Phase 1 output (/speckit.plan)
├── quickstart.md        # Phase 1 output (/speckit.plan)
└── tasks.md             # Phase 2 output (/speckit.tasks — not created here)
```

### Source Code (repository root)

```text
frontend/
├── .storybook/
│   ├── main.ts              ← NEW: builder, addons, stories glob, autodocs
│   └── preview.ts           ← NEW: global decorators, parameters, arcade.css import
├── rsbuild.config.ts        ← NEW: minimal Rsbuild config for Storybook (pluginReact only)
├── src/
│   └── components/
│       ├── ui/
│       │   ├── Button.tsx
│       │   ├── Button.stories.tsx    ← NEW (collocated)
│       │   ├── Card.tsx
│       │   ├── Card.stories.tsx      ← NEW (collocated)
│       │   ├── Timer.tsx
│       │   └── Timer.stories.tsx     ← NEW (collocated)
│       ├── EmojiPicker.tsx
│       ├── EmojiPicker.stories.tsx   ← NEW (collocated)
│       ├── Leaderboard.tsx
│       ├── Leaderboard.stories.tsx   ← NEW (collocated)
│       ├── Podium.tsx
│       └── Podium.stories.tsx        ← NEW (collocated)
└── package.json              (add storybook script + new devDependencies)

Justfile                      ← add storybook recipe
```

**Structure Decision**: Frontend-only change. All story files collocated with their component (per clarification 2026-03-14). Storybook configuration in `frontend/.storybook/`. A dedicated `rsbuild.config.ts` at `frontend/` root keeps the Storybook build pipeline independent from the main `rspack.config.ts`. The Justfile at project root gets a `storybook` recipe delegating to `cd frontend && pnpm storybook`.
