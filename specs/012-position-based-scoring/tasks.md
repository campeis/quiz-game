# Tasks: Position-Based Scoring Rule

**Input**: Design documents from `/specs/012-position-based-scoring/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/websocket.md ✅ quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.
**Approach**: TDD — unit tests written and confirmed failing before implementation; e2e tests written before full stack is wired up.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on each other)
- **[Story]**: Which user story this task belongs to ([US1]–[US4])

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Add the new type surface that ALL subsequent tasks (tests and implementations) depend on. Must be complete before any user story work begins — without these the project will not compile.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T001 Add `PositionRace` variant to `ScoringRule` enum and `display_name() → "Position Race"` in `backend/src/models/scoring_rule.rs`
- [X] T002 [P] Add `correct_answer_count: u32` field (default `0`) to `GameSession` struct in `backend/src/models/session.rs`
- [X] T003 [P] Add `position: Option<u32>` field to the `answer_result` broadcast payload in `backend/src/services/game_engine.rs`
- [X] T004 [P] Add `"position_race"` to `ScoringRuleName` union type and `position?: number` to `AnswerResultPayload` interface in `frontend/src/services/messages.ts`

**Checkpoint**: Project compiles with the new variant and fields — user story work can now begin.

---

## Phase 2: User Story 1 — Host Selects Position Race and Game Scores by Position (Priority: P1) 🎯 MVP

**Goal**: The Position Race rule is selectable in the lobby and awards 1000 / 750 / 500 / 250 points based on the order correct answers arrive at the server.

**Independent Test**: Host selects Position Race, starts a two-player game, first player to answer correctly receives 1000 pts, second receives 750 pts.

### Tests for User Story 1

> **Write these tests FIRST — verify they FAIL before implementing T007/T008**

- [X] T005 [US1] Write failing unit tests for position point schedule (1st→1000, 2nd→750, 3rd→500, 4th+→250) in `backend/src/models/scoring_rule.rs` (test module)
- [X] T006 [US1] Write failing unit test confirming `correct_answer_count` resets to 0 when a new question is sent in `backend/src/services/game_engine.rs` (test module)

### Implementation for User Story 1

- [X] T007 [US1] Implement position point calculation and `correct_answer_count` increment inside `handle_answer()` for the `PositionRace` branch in `backend/src/services/game_engine.rs`
- [X] T008 [US1] Reset `correct_answer_count = 0` at the start of each question in `send_next_question()` in `backend/src/services/game_engine.rs`
- [X] T009 [P] [US1] Add `{ value: "position_race", label: "Position Race", description: "Points by answer order: 1st→1000, 2nd→750, 3rd→500, 4th+→250" }` to `SCORING_RULES` array in `frontend/src/components/Lobby.tsx`

**Checkpoint**: Backend compiles and passes unit tests. Host can select Position Race in Lobby UI. Core scoring math is verified.

---

## Phase 3: User Story 2 — Player Sees "Position Race" Label and Position Rank (Priority: P2)

**Goal**: Players see a "Position Race" label on the question screen. After answering correctly they see their rank and points (e.g., "2nd place · +750 points").

**Independent Test**: Start a game with Position Race selected; player sees "Position Race" label on the question screen; after a correct answer the result shows the ordinal rank alongside the points.

### Tests for User Story 2

> **Write these tests FIRST — verify they FAIL before implementing T011/T012**

- [X] T010 [US2] Write failing frontend unit tests for: (a) "Position Race" label rendered when `scoringRule="position_race"`, (b) position rank badge rendered with correct ordinal when `answerResult.correct=true` and `answerResult.position=2`, (c) no rank badge when `answerResult.correct=false` in `frontend/src/components/__tests__/Question.test.tsx`

### Implementation for User Story 2

- [X] T011 [US2] Add `"position_race": "Position Race"` entry to `SCORING_RULE_LABELS` record in `frontend/src/components/Question.tsx`
- [X] T012 [US2] Add `toOrdinal(n: number): string` helper and position rank badge (e.g., "1st place · +1000 points") to answer result section in `frontend/src/components/Question.tsx` — rendered only when `scoringRule === "position_race"` and `answerResult?.correct` and `answerResult?.position` is defined

**Checkpoint**: Frontend unit tests pass. The label and rank badge render correctly for all position values and are absent for wrong/unanswered.

---

## Phase 4: User Story 3 — Wrong Answer or No Answer Earns Zero Points (Priority: P2)

**Goal**: Confirm explicitly that wrong answers and unanswered questions yield 0 points and no position rank, with no counter increment.

**Independent Test**: Player answers incorrectly under Position Race; result shows 0 points and no rank badge.

### Tests for User Story 3

> **Write these tests FIRST — verify they FAIL (or ensure coverage) before confirming implementation**

- [X] T013 [US3] Write failing unit test confirming wrong answer under PositionRace yields `points=0`, `position=None`, and `correct_answer_count` is NOT incremented in `backend/src/services/game_engine.rs` (test module)

### Implementation for User Story 3

- [X] T014 [US3] Verify (and fix if needed) that `handle_answer()` in `backend/src/services/game_engine.rs` leaves `correct_answer_count` unchanged and emits `position: None` when the answer is incorrect under PositionRace — adjust implementation from T007 if the test from T013 exposes a gap

**Checkpoint**: Unit tests confirm zero-point and no-counter-increment behaviour for wrong answers. Backend logic is airtight.

---

## Phase 5: User Story 4 — Final Leaderboard Reflects Position-Based Scores (Priority: P3)

**Goal**: The end-of-game leaderboard accurately accumulates position-based points across all questions.

**Independent Test**: Complete a full Position Race game with two players; the leaderboard shows the player who consistently answered first with a higher total score.

*(No implementation tasks needed — cumulative scoring is already handled generically by the existing leaderboard. This phase is covered entirely by e2e tests.)*

---

## Phase 6: E2E Tests (All User Stories)

**Purpose**: End-to-end coverage for all four user stories using the Playwright fixture infrastructure.

> All e2e tests should be written and confirmed failing (server returning unexpected rule / label / scores) before the full stack is wired up.

- [X] T015 [P] [US2] Add a new `test.describe` block for "Position Race" to `e2e/tests/scoring-rules.spec.ts`: assert the "Position Race" label is visible on the question screen when the rule is selected
- [X] T016 [US1] Create `e2e/tests/position-race.spec.ts` with `test.use({ lobbyOptions: { scoringRule: "Position Race" } })` and `twoPlayerLobby` fixture; write test: first player answers correctly → result shows "1st place" and "+1000 points"
- [X] T017 [P] [US1] In `e2e/tests/position-race.spec.ts`, write test: second correct responder → result shows "2nd place" and "+750 points" (requires sequencing answers via `twoPlayerLobby`)
- [X] T017b [P] [US1] In `e2e/tests/position-race.spec.ts`, write test: third correct responder → result shows "3rd place" and "+500 points"; a fourth+ responder → result shows "+250 points" (covers SC-005 formula branches not otherwise tested e2e)
- [X] T018 [P] [US3] In `e2e/tests/position-race.spec.ts`, write test: player answers incorrectly → result shows "+0 points" and no position rank badge
- [X] T019 [P] [US4] In `e2e/tests/position-race.spec.ts`, write test: complete full game → final leaderboard shows higher score for the player who answered first consistently

**Checkpoint**: All e2e tests run green. Full stack validated end-to-end.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T020 Run `just lint` and fix any Clippy, Biome, or yamllint violations across all changed files
- [X] T021 Run `just test` (cargo test + pnpm test + Playwright) and confirm all suites pass with no regressions
- [X] T022 Update `docs/architecture.md` to document `PositionRace` scoring rule, `correct_answer_count` field, and position rank in `answer_result`
- [X] T023 Regenerate architecture diagram PNGs from `.mmd` source files in `docs/images/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately. T002, T003, T004 can run in parallel after T001.
- **US1 (Phase 2)**: Requires Phase 1 complete. T005/T006 can start once T001+T002 done; T007/T008 require T005/T006 failing first; T009 requires T004.
- **US2 (Phase 3)**: Requires Phase 1 complete (T004). T010 can start; T011/T012 require T010 failing first.
- **US3 (Phase 4)**: Requires T007 complete (logic to test against). T013 first, then T014.
- **US4 (Phase 5)**: No extra implementation — covered by e2e.
- **E2E (Phase 6)**: Requires all implementation phases complete (T007, T008, T009, T011, T012, T014).
- **Polish (Phase 7)**: Requires Phase 6 complete.

### User Story Dependencies

- **US1 (P1)**: After foundational — no dependency on other stories
- **US2 (P2)**: After foundational — no dependency on US1 (frontend label is independent of backend scoring)
- **US3 (P2)**: After US1 implementation (T007) — tests verify the negative path of the same code
- **US4 (P3)**: After US1 — leaderboard reuses existing infrastructure

### Parallel Opportunities Within Each Phase

- **Phase 1**: T002, T003, T004 can be done simultaneously (different files)
- **Phase 2**: T005 + T006 can be written simultaneously; T009 can be done simultaneously with T007/T008 (different file)
- **Phase 3**: T011 + T012 can be done simultaneously (same file but non-conflicting sections)
- **Phase 6**: T015, T017, T018, T019 can be added simultaneously (same file, non-conflicting tests)

---

## Parallel Execution Example: Phase 1

```bash
# Run simultaneously (different files, no conflicts):
Task T002: Add correct_answer_count to backend/src/models/session.rs
Task T003: Add position field to answer_result in backend/src/services/game_engine.rs
Task T004: Extend ScoringRuleName + AnswerResultPayload in frontend/src/services/messages.ts
```

## Parallel Execution Example: Phase 2

```bash
# After T005/T006 fail, run simultaneously:
Task T007+T008: Implement backend logic in backend/src/services/game_engine.rs
Task T009:      Add Lobby option in frontend/src/components/Lobby.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Foundational
2. Complete Phase 2: User Story 1 (backend scoring + lobby UI)
3. **STOP and VALIDATE**: `cargo test` passes; host can select Position Race; points calculated correctly
4. Proceed to US2 (label + rank display) and US3 (zero-point coverage)

### Incremental Delivery

1. Phase 1 → Phase 2 → `cargo test` green — **Backend MVP**
2. Phase 3 → `pnpm test` green — **Frontend label + rank badge**
3. Phase 4 → all unit tests green — **Zero-point coverage confirmed**
4. Phase 6 → e2e green — **Full stack verified**
5. Phase 7 → lint + docs — **Merge-ready**

---

## Notes

- [P] tasks operate on different files or non-conflicting sections — safe to parallelise
- Constitution mandates TDD: every test task (T005, T006, T010, T013) must be confirmed **failing** before the corresponding implementation task runs
- `correct_answer_count` is session-scoped and in-memory — no migration or persistence concerns
- `streak_multiplier` is always `1.0` for PositionRace — no streak logic to add or remove
- The e2e position-race tests require `twoPlayerLobby` fixture to control answer order between two players
