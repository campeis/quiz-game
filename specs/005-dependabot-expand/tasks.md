# Tasks: Expand Dependabot Coverage to All Package Ecosystems

**Input**: Design documents from `/specs/005-dependabot-expand/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: Not requested — validation is via visual inspection of `.github/dependabot.yml`.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

**Purpose**: No setup required — file already exists

*(No tasks — `.github/dependabot.yml` exists from feature 004)*

---

## Phase 2: User Stories 1 & 2 — Daily Cargo and pnpm Alerts (Priority: P1)

**Goal**: All three package ecosystems monitored daily

**Independent Test**: Run `grep "interval:" .github/dependabot.yml` — all 4 lines output `daily`

- [x] T001 [US1] Add `cargo` ecosystem entry to `.github/dependabot.yml` with `directory: /backend` and `interval: daily` (FR-001)
- [x] T002 [US2] Add `npm` ecosystem entry to `.github/dependabot.yml` with `directory: /frontend` and `interval: daily` (FR-002)
- [x] T003 [US2] Add `npm` ecosystem entry to `.github/dependabot.yml` with `directory: /e2e` and `interval: daily` (FR-003)

**Checkpoint**: Cargo and pnpm directories covered daily

---

## Phase 3: User Story 3 — Daily GitHub Actions Alerts (Priority: P2)

**Goal**: GitHub Actions schedule upgraded from weekly to daily

**Independent Test**: Confirm `github-actions` entry has `interval: daily`

- [x] T004 [US3] Change `interval: weekly` to `interval: daily` for the `github-actions` entry in `.github/dependabot.yml` (FR-004, FR-005)

---

## Phase 4: Polish & Validation

- [x] T005 Verify `.github/dependabot.yml` has exactly 4 ecosystem entries all with `interval: daily` (SC-001, SC-002)

---

## Dependencies & Execution Order

- T001, T002, T003 can run in parallel (different entries in the same file — sequential recommended to avoid conflicts)
- T004 can run in parallel with T001-T003 (different entry)
- T005 depends on T001-T004

---

## Notes

- Total tasks: 5
- All tasks modify a single file (`.github/dependabot.yml`)
- Sequential execution recommended despite parallel opportunity (same file)
