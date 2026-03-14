# Tasks: Add Storybook Component Showcase

**Input**: Design documents from `/specs/014-add-storybook/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, quickstart.md ✓

**Tests**: No automated test tasks — story files ARE the interactive visual validation mechanism. Existing Vitest suite is unaffected by this feature.

**Organization**: Tasks grouped by user story to enable independent implementation and testing of each increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1, US2, US3)

---

## Phase 1: Setup (Storybook Infrastructure)

**Purpose**: Install dependencies and create Storybook configuration files. All subsequent phases depend on this being complete.

- [X] T001 Add Storybook devDependencies to `frontend/package.json`: `storybook`, `storybook-react-rsbuild`, `@rsbuild/core`, `@rsbuild/plugin-react`, `@storybook/addon-essentials`
- [X] T002 [P] Create `frontend/rsbuild.config.ts` with minimal Rsbuild config: import `@rsbuild/core` and `@rsbuild/plugin-react`, export `defineConfig({ plugins: [pluginReact()] })`
- [X] T003 Create `frontend/.storybook/main.ts` with `framework: 'storybook-react-rsbuild'`, `addons: ['@storybook/addon-essentials']`, `stories: ['../src/**/*.stories.@(ts|tsx)']`, `docs: { autodocs: 'tag' }`, and `framework.options.reactDocgen: 'react-docgen-typescript'`
- [X] T004 Create `frontend/.storybook/preview.ts` importing `'../src/styles/arcade.css'` and exporting a `Preview` with controls color/date matchers
- [X] T005 [P] Add `"storybook": "storybook dev -p 6006"` script to `frontend/package.json` scripts section

---

## Phase 2: Foundational (Launch Command — Blocks All User Stories)

**Purpose**: Wire up the project-root `just storybook` command and verify the full build pipeline starts cleanly before writing any story files.

**⚠️ CRITICAL**: Storybook must start without errors before story files can be verified.

- [X] T006 Add `storybook` recipe to `Justfile`: `cd frontend && pnpm storybook` (following the same delegation pattern as `test-frontend` and `lint`)
- [X] T007 Run `just storybook` and verify the dev server starts at `http://localhost:6006` with no build errors — confirms rsbuild.config.ts, .storybook/main.ts, and preview.ts are wired correctly

**Checkpoint**: Storybook starts cleanly — story implementation can now begin

---

## Phase 3: User Story 1 — Browse and Interact with UI Primitives (Priority: P1) 🎯 MVP

**Goal**: All three reusable UI primitives (Button, Card, Timer) are accessible in the component browser with at least 2 stories each and a full interactive Controls panel.

**Independent Test**: Run `just storybook`, navigate to UI/Button, UI/Card, UI/Timer — each must display all variants and expose all configurable props in the Controls panel without console errors.

- [X] T008 [P] [US1] Create `frontend/src/components/ui/Button.stories.tsx` with CSF3 meta (`component: Button`, `satisfies Meta<typeof Button>`), stories: `Primary` (variant: primary), `Secondary` (variant: secondary), `Disabled` (disabled: true), `Loading` (loading: true); all props exposed via Controls
- [X] T009 [P] [US1] Create `frontend/src/components/ui/Card.stories.tsx` with CSF3 meta, stories: `Default` (children: text content), `Empty` (no children), `CompactPadding` (padding: spacing.sm override)
- [X] T010 [P] [US1] Create `frontend/src/components/ui/Timer.stories.tsx` with CSF3 meta, stories: `Running` (totalSeconds: 30, running: true), `Paused` (totalSeconds: 30, running: false), `LowTime` (totalSeconds: 5, running: true — starts near-expiry threshold so urgency color and pulse animation are immediately visible); `onExpired` wired to an `action()`

**Checkpoint**: US1 complete — UI primitives fully browsable with interactive controls

---

## Phase 4: User Story 2 — Browse Feature Components with Mock Data (Priority: P2)

**Goal**: EmojiPicker, Leaderboard, and Podium render in the component browser with representative static mock data, independently of the backend.

**Independent Test**: Run `just storybook`, navigate to Feature/EmojiPicker, Feature/Leaderboard, Feature/Podium — each must render with sample data and show interactive state without backend connection.

- [X] T011 [P] [US2] Create `frontend/src/components/EmojiPicker.stories.tsx` with CSF3 meta, stories: `DefaultSelection` (selected: "🦁", onSelect: action), `NoSelection` (selected: "", onSelect: action)
- [X] T012 [P] [US2] Create `frontend/src/components/Leaderboard.stories.tsx` with CSF3 meta and canonical mockPlayers (Alice/🦁/2500, Bob/🤖/1500, Charlie/🐸/500 from data-model.md), stories: `Midgame` (entries: mockPlayers, isFinal: false), `FinalResults` (entries: mockPlayers, isFinal: true), `Empty` (entries: [], isFinal: true)
- [X] T013 [P] [US2] Create `frontend/src/components/Podium.stories.tsx` with CSF3 meta and same mockPlayers, stories: `FullPodium` (entries: mockPlayers), `SingleWinner` (entries: [mockPlayers[0]] only), `Empty` (entries: [])

**Checkpoint**: US2 complete — feature components browsable with mock data

---

## Phase 5: User Story 3 — Single Command Launch and Documentation (Priority: P3)

**Goal**: The component browser is launchable via `just storybook` with hot-reload, and the command is documented for the team.

**Independent Test**: Run `just storybook` from project root, edit any `*.stories.tsx` file and save — browser must update within 3 seconds without a full restart.

- [X] T014 [US3] Verify hot-reload: with `just storybook` running, edit a story `args` value in any `*.stories.tsx` file, save, and confirm the browser reflects the change without a full page reload (validates SC-004)
- [X] T015 [US3] Add `pnpm storybook` to the Commands section of `frontend/CLAUDE.md` and add `just storybook` to the Commands section of the root `CLAUDE.md` (alongside `just test`, `just lint`, `just lint-fix`)
- [X] T016 [US3] Verify story files are excluded from the production build: run `cd frontend && pnpm build` and confirm no `*.stories.*` files appear in `frontend/dist/`

**Checkpoint**: US3 complete — single command works, hot-reload confirmed, docs updated

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality gate validation across all stories.

- [X] T017 [P] Run `cd frontend && pnpm exec biome check src/` and fix any linting violations introduced by the six new `*.stories.tsx` files — all files must pass with zero violations
- [X] T018 Run quickstart.md validation: start `just storybook` and confirm all 6 story categories (Button, Card, Timer, EmojiPicker, Leaderboard, Podium) render without browser console errors (validates SC-005)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 — can start after Storybook confirmed running
- **Phase 4 (US2)**: Depends on Phase 2 — can run in parallel with Phase 3
- **Phase 5 (US3)**: Depends on Phase 2 — T014 also depends on at least one story file existing (Phase 3 or 4)
- **Phase 6 (Polish)**: Depends on all story phases (3, 4, 5) complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependency on US2 or US3
- **US2 (P2)**: Can start after Phase 2 — no dependency on US1 or US3
- **US3 (P3)**: T014 requires at least one story file to test hot-reload (wait for T008–T013)

### Within Each Phase

- T002 (rsbuild.config.ts) and T005 (package.json script) can run in parallel with T003, T004
- T008, T009, T010 are fully parallel (different files, no shared state)
- T011, T012, T013 are fully parallel (different files, no shared state)

---

## Parallel Example: Phase 3 (US1)

```
# All three UI primitive stories can be written simultaneously:
T008: frontend/src/components/ui/Button.stories.tsx
T009: frontend/src/components/ui/Card.stories.tsx
T010: frontend/src/components/ui/Timer.stories.tsx
```

## Parallel Example: Phase 4 (US2)

```
# All three feature component stories can be written simultaneously:
T011: frontend/src/components/EmojiPicker.stories.tsx
T012: frontend/src/components/Leaderboard.stories.tsx
T013: frontend/src/components/Podium.stories.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T005)
2. Complete Phase 2: Foundational (T006–T007)
3. Complete Phase 3: US1 — UI Primitives (T008–T010)
4. **STOP and VALIDATE**: All three UI primitive components browsable with full controls
5. Proceed to US2 and US3

### Incremental Delivery

1. Setup + Foundational → Storybook runs (empty)
2. US1 complete → Button, Card, Timer browsable → MVP demo ready
3. US2 complete → EmojiPicker, Leaderboard, Podium browsable
4. US3 complete → Single command documented, hot-reload confirmed, production build clean
5. Polish → All stories lint-clean, zero console errors

---

## Notes

- Story files (`*.stories.tsx`) must never be imported by `frontend/src/main.tsx` — they are dev-only and excluded from production build automatically
- CSF3 format: use `satisfies Meta<typeof Component>` (not `as Meta<...>`)
- `react-docgen-typescript` is enabled in `main.ts` to ensure inherited HTML attributes (e.g., `disabled`, `onClick`) appear in Controls for Button and Card
- Mock data for Leaderboard and Podium should use the canonical dataset from `data-model.md` — consistent naming across both stories makes comparison easier
- `just storybook` (T006) must be placed before the `dev` recipe or grouped with developer tools in the Justfile
