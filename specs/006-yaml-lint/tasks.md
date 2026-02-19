# Tasks: YAML Linting

**Input**: Design documents from `/specs/006-yaml-lint/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: No test tasks — not requested in the specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Exact file paths included in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the yamllint configuration that both user stories depend on.

- [X] T001 Create `.yamllint.yml` at repository root with: `extends: default`, ignore block for `frontend/pnpm-lock.yaml` and `e2e/pnpm-lock.yaml`, `truthy: { check-keys: false }` (suppresses GitHub Actions `on:` false positive), `line-length: { max: 120, allow-non-breakable-words: true }`, `comments: { require-starting-space: true, min-spaces-from-content: 2 }`

**Checkpoint**: `.yamllint.yml` exists and `yamllint .` exits 0 on the current codebase

---

## Phase 2: User Story 1 — Developer Catches YAML Errors Locally (Priority: P1) 🎯 MVP

**Goal**: Developer can run `just lint` locally and have yamllint check all YAML files, catching errors with file name and line number before committing.

**Independent Test**: Run `just lint` — it should run yamllint and exit 0. Introduce a deliberate YAML syntax error, re-run, and confirm a non-zero exit with the file and line reported. Revert and confirm it passes again.

### Implementation for User Story 1

- [X] T002 [US1] Add `yamllint .` to the `lint` recipe in `Justfile` (after existing lint checks)

**Checkpoint**: `just lint` runs yamllint and passes on the current codebase; User Story 1 is independently testable

---

## Phase 3: User Story 2 — CI Blocks Merges with Invalid YAML (Priority: P2)

**Goal**: The CI workflow automatically runs yamllint as part of the existing lint step, failing the run if any YAML file contains an error.

**Independent Test**: Verify `.github/workflows/ci.yml` contains a `pip install yamllint` step placed before the `just lint` step. A push with a YAML syntax error should cause the CI lint step to fail.

### Implementation for User Story 2

- [X] T003 [US2] Add `- name: Install yamllint` step with `run: pip install yamllint` to `.github/workflows/ci.yml`, placed immediately before the existing `Lint (just lint)` step

**Checkpoint**: CI workflow installs yamllint before running `just lint`; User Story 2 is complete

---

## Phase 4: Polish & Validation

**Purpose**: End-to-end verification and quickstart scenario validation.

- [X] T004 [P] Verify all quickstart.md validation scenarios pass: `yamllint .` exits 0 (confirms lockfiles are excluded — they would fail line-length checks if linted); introduce a deliberate YAML syntax error in `.github/dependabot.yml`, confirm `yamllint .` reports it with file and line, revert and confirm clean pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **User Story 1 (Phase 2)**: Depends on T001 (`.yamllint.yml` must exist before Justfile runs it)
- **User Story 2 (Phase 3)**: Depends on T001 (`.yamllint.yml` must exist); can run in parallel with US1 after T001 completes
- **Polish (Phase 4)**: Depends on all phases complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on T001 only — no dependency on US2
- **User Story 2 (P2)**: Depends on T001 only — no dependency on US1; T002 and T003 are parallelizable once T001 is done

### Within Each User Story

- T001 must complete before T002 and T003
- T002 and T003 touch different files (Justfile vs ci.yml) and can run in parallel

### Parallel Opportunities

- T002 [US1] and T003 [US2] can run in parallel after T001 completes (different files)
- T004 is independent of T002/T003 ordering but requires both to be complete

---

## Parallel Example: After T001 Completes

```bash
# Both tasks touch different files — run in parallel:
Task T002: "Add yamllint . to lint recipe in Justfile"
Task T003: "Add pip install yamllint step to .github/workflows/ci.yml"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: T001 (create `.yamllint.yml`)
2. Complete Phase 2: T002 (add to Justfile)
3. **STOP and VALIDATE**: Run `just lint` — confirm yamllint runs and passes

### Incremental Delivery

1. T001 → yamllint config exists and all YAML files pass
2. T002 → `just lint` includes yamllint (US1 complete)
3. T003 → CI installs and runs yamllint (US2 complete)
4. T004 → quickstart validation confirms all scenarios

---

## Notes

- [P] tasks = different files, no dependencies on each other
- [Story] label maps each task to its user story for traceability
- No test tasks: spec does not request them; validation is `yamllint .` exiting 0
- The `.yamllint.yml` config is the shared foundation — both stories depend on it
- SC-001: All 4 YAML files pass (2 checked, 2 excluded) — verified in T004
- SC-004: 4 YAML files linted in <1s — well within 30s budget
