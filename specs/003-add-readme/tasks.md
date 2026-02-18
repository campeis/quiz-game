# Tasks: Project README

**Input**: Design documents from `/specs/003-add-readme/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, quickstart.md

**Tests**: Not explicitly requested — test tasks omitted. Validation is via manual review of referenced commands.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Gather information needed to write an accurate README

- [x] T001 Review existing project structure and identify all top-level directories and their purposes at repository root
- [x] T002 Review tech stack from specs/001-multiplayer-quiz/quickstart.md and Justfile to confirm accurate technology references

**Checkpoint**: All project information gathered, ready to write README content

---

## Phase 2: User Story 1 — New Developer Discovers the Project (Priority: P1) 🎯 MVP

**Goal**: A developer visiting the repository can understand its purpose, structure, and how to get started

**Independent Test**: Read the README and follow its instructions to set up and run the project from scratch

- [x] T003 [US1] Create README.md at repository root with project title and concise description of the multiplayer quiz application (FR-001, FR-007)
- [x] T004 [US1] Add key features list section to README.md describing what the application does (FR-002)
- [x] T005 [US1] Add project structure section to README.md documenting main directories (backend/, frontend/, e2e/, fixtures/) and their purposes (FR-003)
- [x] T006 [US1] Add getting started section to README.md with prerequisites list and reference to specs/001-multiplayer-quiz/quickstart.md for detailed instructions (FR-005, FR-008)

**Checkpoint**: Developer can identify the project's purpose, see the structure, and find setup instructions

---

## Phase 3: User Story 2 — Developer Evaluates the Project (Priority: P2)

**Goal**: A developer evaluating the project can understand its tech stack, features, and how to run tests

**Independent Test**: Have someone unfamiliar with the project read the README and answer questions about tech stack, features, and test commands

- [x] T007 [US2] Add tech stack section to README.md listing languages (Rust, TypeScript), frameworks (Axum, React 19), bundler (Rspack), linter (Biome), and tools (just, pnpm, Playwright) (FR-004)
- [x] T008 [US2] Add testing and linting section to README.md with commands for running tests (just test, just lint) and references to individual test commands (FR-006)

**Checkpoint**: Developer can identify the tech stack and run tests/linting

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and accuracy checks

- [x] T009 Verify all commands referenced in README.md are accurate by running them (just setup, just test, just lint)
- [x] T010 Verify README.md does not duplicate detailed content from specs/001-multiplayer-quiz/quickstart.md (FR-008)
- [x] T011 Verify README.md contains all 8 functional requirements with no placeholder or incomplete sections, and confirm no license section exists since no LICENSE file is present (SC-002, edge case)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (US1)**: Depends on Phase 1 — requires gathered project info
- **Phase 3 (US2)**: Depends on Phase 1 — can run in parallel with Phase 2 (different sections)
- **Phase 4 (Polish)**: Depends on Phases 2 and 3 — validation pass

### User Story Dependencies

- **US1 (P1)**: Depends on Setup only — creates foundational README sections
- **US2 (P2)**: Depends on Setup only — adds evaluation sections, can run in parallel with US1

### Parallel Opportunities

- T004 and T005 can run in parallel (different sections of README.md, but same file — sequential recommended)
- T007 and T008 can run in parallel (different sections, same file — sequential recommended)
- Phase 2 (US1) and Phase 3 (US2) could run in parallel if writing to separate files, but since both write to README.md, sequential execution is recommended

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1: Gather project information
2. Complete Phase 2: Write core README sections (title, description, features, structure, getting started)
3. **STOP and VALIDATE**: Developer can understand the project and find setup instructions

### Full Delivery

1. Setup → Gather project information
2. US1 → Core README content (MVP)
3. US2 → Tech stack and testing sections
4. Polish → Validate accuracy and completeness

---

## Notes

- This is a documentation-only feature — single file (README.md) at repository root
- All tasks write to the same file (README.md), so parallel execution within a phase is not practical
- Total tasks: 11
- Commit after Phase 2 (MVP) and again after Phase 4 (complete)
