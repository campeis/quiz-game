# Tasks: GitHub Actions CI Workflow

**Input**: Design documents from `/specs/004-github-actions-ci/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: Not explicitly requested — test tasks omitted. Validation is via actual GitHub Actions run after workflow is pushed to main.

**Organization**: Tasks are grouped by user story. US1 (quality gate) is the MVP; US2 (branch scoping) is implemented as part of the same workflow file but validated separately.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Create the `.github/workflows/` directory structure

- [x] T001 Create directory `.github/workflows/` at repository root

**Checkpoint**: Directory structure ready for workflow file

---

## Phase 2: User Story 1 — Automated Quality Gate on Push to Main (Priority: P1) 🎯 MVP

**Goal**: A push to `main` triggers automated checks: setup, test, lint, build

**Independent Test**: Push a clean commit to `main` — verify all steps pass. Push a commit with a test failure — verify the workflow fails and reports which step failed.

- [x] T002 [US1] Create `.github/workflows/ci.yml` with workflow name, `on: push: branches: [main]` trigger, `permissions: contents: read`, and `timeout-minutes: 15` job config (FR-001, FR-002, FR-008, FR-010)
- [x] T003 [US1] Add checkout step to `.github/workflows/ci.yml` using `actions/checkout` pinned to SHA `11bd71901bbe5b1630ceea73d27597364c9af683` with `# v4.2.2` comment (FR-009)
- [x] T004 [US1] Add Rust toolchain setup step to `.github/workflows/ci.yml` using `dtolnay/rust-toolchain` pinned to SHA `efa25f7f19611383d5b0ccf2d1c8914531636bf9` with `toolchain: stable` (FR-009)
- [x] T005 [US1] Add pnpm setup step to `.github/workflows/ci.yml` using `pnpm/action-setup` pinned to SHA `41ff72655975bd51cab0327fa583b6e92b6d3061` with `version: '10'` (FR-009)
- [x] T006 [US1] Add Node.js setup step to `.github/workflows/ci.yml` using `actions/setup-node` pinned to SHA `49933ea5288caeca8642d1e84afbd3f7d6820020` with `node-version: 20` (FR-009)
- [x] T007 [US1] Add `just` install step to `.github/workflows/ci.yml` using `taiki-e/install-action` pinned to SHA `70e00552f3196d9a4c7dde7c57ef4c4830d422dd` with `tool: just` (FR-009)
- [x] T008 [US1] Add Cargo dependency cache step to `.github/workflows/ci.yml` using `actions/cache` pinned to SHA `cdf6c1fa76f9f475f3d7449005a359c84ca0f306`, caching `~/.cargo/registry`, `~/.cargo/git`, `backend/target`, keyed on `Cargo.lock` hash (FR-009)
- [x] T009 [US1] Add pnpm store cache step to `.github/workflows/ci.yml` using `actions/cache` pinned to same SHA, caching `~/.local/share/pnpm/store`, keyed on all `pnpm-lock.yaml` file hashes (FR-009)
- [x] T010 [US1] Add Playwright system dependencies step to `.github/workflows/ci.yml` running `sudo apt-get update && sudo apt-get install -y libnss3 libatk-bridge2.0-0 libdrm2 libxcomposite1 libxdamage1 libxrandr2 libgbm1` before `just setup`
- [x] T011 [US1] Add `just setup` step to `.github/workflows/ci.yml` (FR-003)
- [x] T012 [US1] Add `just test` step to `.github/workflows/ci.yml` (FR-004)
- [x] T013 [US1] Add `just lint` step to `.github/workflows/ci.yml` (FR-005)
- [x] T014 [US1] Add `just build` step to `.github/workflows/ci.yml` (FR-006)

**Checkpoint**: Workflow file complete; all steps are sequential and will fail-fast on any error (FR-007)

---

## Phase 3: User Story 2 — Workflow Scoped to Main Branch Only (Priority: P2)

**Goal**: The workflow does NOT trigger on non-main branches or pull requests

**Independent Test**: The trigger configuration is already set in T002 (`push: branches: [main]` with no `pull_request` event). Verify by pushing to a feature branch and checking the Actions tab.

- [x] T015 [US2] Verify `.github/workflows/ci.yml` trigger block contains only `push: branches: [main]` with no `pull_request`, `workflow_dispatch`, or other trigger events (FR-001, FR-002)

**Checkpoint**: Trigger scope confirmed — workflow only fires on main pushes

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Security hardening, playwright config fix, and automatic update setup

- [x] T016 [P] Update `e2e/playwright.config.ts` — change both `reuseExistingServer: true` entries to `reuseExistingServer: !process.env.CI` (research decision R6)
- [x] T017 [P] Create `.github/dependabot.yml` configured for `package-ecosystem: github-actions` to keep pinned action SHAs automatically updated (research decision R7)
- [x] T018 Verify `.github/workflows/ci.yml` has no unpinned third-party actions — every `uses:` line with a non-GitHub-owned action must have a full 40-char SHA (SC-004)
- [x] T019 Verify `.github/workflows/ci.yml` declares `permissions: contents: read` at workflow level with no elevated permissions at job level (SC-005)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (US1)**: Depends on Phase 1 — writes to `.github/workflows/ci.yml`
- **Phase 3 (US2)**: Depends on Phase 2 — verifies trigger config already written in T002
- **Phase 4 (Polish)**: Depends on Phase 2 — T016 modifies `playwright.config.ts`; T017 creates new file; T018/T019 verify the workflow file

### Within Phase 2

- T002 must be first (creates the file with top-level config)
- T003–T014 must be written in order (sequential steps in the job)
- T008 and T009 (caches) can be placed after T007 but before T010

### Parallel Opportunities

- T016 (playwright.config.ts) and T017 (dependabot.yml) can run in parallel — different files
- T018 and T019 (verification tasks) are read-only and can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1: Create `.github/workflows/` directory
2. Complete Phase 2: Write full `ci.yml` (T002-T014)
3. **STOP and VALIDATE**: Commit and push to `main`, watch the workflow run in GitHub Actions
4. Verify: all steps green on clean code; failure reported on broken code

### Full Delivery

1. Setup + US1 → working CI workflow (MVP)
2. US2 verification → confirm trigger scoping is correct
3. Polish → playwright.config.ts update, Dependabot config, final security checks

---

## Notes

- Total tasks: 19
- The core deliverable (`.github/workflows/ci.yml`) is written incrementally in T002-T014
- T015 is a verification task only — the trigger is already set in T002
- No secrets needed for this project's CI run
- Commit and push to `main` after Phase 2 to validate the workflow before Phase 4
