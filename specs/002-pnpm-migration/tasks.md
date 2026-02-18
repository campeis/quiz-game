# Tasks: pnpm Migration

**Input**: Design documents from `/specs/002-pnpm-migration/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md

**Tests**: Not explicitly requested — test tasks omitted. Validation is via running existing test suites.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Remove npm lockfiles and generate pnpm lockfiles

- [x] T001 Delete npm lockfile at frontend/package-lock.json
- [x] T002 Delete npm lockfile at e2e/package-lock.json
- [x] T003 Run `pnpm install` in frontend/ to generate frontend/pnpm-lock.yaml
- [x] T004 Run `pnpm install` in e2e/ to generate e2e/pnpm-lock.yaml

**Checkpoint**: Both directories have pnpm-lock.yaml and node_modules installed via pnpm

---

## Phase 2: User Story 1 — Developer Installs Dependencies with pnpm (Priority: P1) 🎯 MVP

**Goal**: Dependencies install correctly via pnpm and all tests pass

**Independent Test**: Run `pnpm install` in frontend/ and e2e/, build the frontend, run all test suites

- [x] T005 [US1] Build frontend using pnpm-installed dependencies (`pnpm run build` in frontend/)
- [x] T006 [US1] Run backend tests (`cargo test` in backend/)
- [x] T007 [US1] Run frontend tests (`pnpm test` in frontend/)
- [x] T008 [US1] Run e2e tests (`pnpm exec playwright test` in e2e/)

**Checkpoint**: All 43 tests pass with pnpm-installed dependencies. If any fail due to pnpm's strict node_modules, add `.npmrc` with `node-linker=hoisted` to the affected directory.

---

## Phase 3: User Story 2 — Developer Uses Project Commands (Priority: P1)

**Goal**: All Justfile recipes and documentation use pnpm commands

**Independent Test**: Run each Justfile recipe and verify it works correctly

- [x] T009 [US2] Update Justfile: replace all `npm` and `npx` references with `pnpm` and `pnpm exec` equivalents in Justfile
- [x] T010 [US2] Update quickstart documentation: replace npm references with pnpm and add pnpm as a prerequisite in specs/001-multiplayer-quiz/quickstart.md
- [x] T011 [P] [US2] Update research documentation: replace npm references with pnpm in specs/001-multiplayer-quiz/research.md
- [x] T012 [US2] Verify all Justfile recipes work: run `just setup`, `just build`, `just test`, `just lint`, `just lint-fix`

**Checkpoint**: All Justfile recipes execute successfully using pnpm

---

## Phase 4: User Story 3 — No npm Artifacts Remain (Priority: P2)

**Goal**: Zero npm-specific artifacts or references remain in the project

**Independent Test**: Search the repository for package-lock.json files and npm/npx command references

- [x] T013 [US3] Verify no package-lock.json files exist outside node_modules/ in the repository
- [x] T014 [US3] Search all project files (excluding node_modules/) for remaining `npm install`, `npm run`, or `npx` references and fix any found
- [x] T015 [US3] Verify .gitignore covers pnpm-lock.yaml (should already be committed, not ignored) and node_modules/ patterns remain valid

**Checkpoint**: Zero npm artifacts or references remain in tracked files

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [x] T016 Run full test suite one final time: `just test` (all 43 tests must pass)
- [x] T017 Run linting: `just lint` (must pass with zero violations)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (US1)**: Depends on Phase 1 — validates pnpm installation works
- **Phase 3 (US2)**: Depends on Phase 1 — can run in parallel with Phase 2
- **Phase 4 (US3)**: Depends on Phases 2 and 3 — verification pass
- **Phase 5 (Polish)**: Depends on all previous phases

### User Story Dependencies

- **US1 (P1)**: Depends on Setup (Phase 1) only
- **US2 (P1)**: Depends on Setup (Phase 1) only — can run in parallel with US1
- **US3 (P2)**: Depends on US1 and US2 completion (verification of their work)

### Parallel Opportunities

- T001 and T002 can run in parallel (different directories)
- T003 and T004 can run in parallel (different directories)
- T005-T008 (US1 verification) can run in parallel with T009-T011 (US2 updates)
- T011 can run in parallel with T009-T010 (different files)

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1: Delete lockfiles, install with pnpm
2. Complete Phase 2: Verify build and tests pass
3. **STOP and VALIDATE**: All tests pass with pnpm

### Full Delivery

1. Setup → Install with pnpm
2. US1 → Verify tests pass (MVP)
3. US2 → Update scripts and docs
4. US3 → Verify clean migration
5. Polish → Final validation

---

## Notes

- This is a tooling migration — no application code changes
- If pnpm's strict node_modules causes import failures, add `.npmrc` with `node-linker=hoisted`
- Total tasks: 17
- Commit after each phase or logical group
