# Tasks: Configurable Scoring Rules

**Input**: Design documents from `specs/009-scoring-rules/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

**Tests**: TDD is the default workflow per the project constitution. Test tasks are included and MUST be written before their corresponding implementation tasks. Backend struct creation is the exception — structs must compile before tests can reference them.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other [P] tasks in the same phase (different files, no blocking dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (New File Scaffolding)

**Purpose**: Create new files so the codebase compiles with stubs before any tests are written.

> **Note**: The entire existing codebase continues to compile after this phase. `calculate_points` stubs return `MAX_SCORE` for correct answers and `0` for incorrect — preserving the broadly correct behaviour until US2 implements the real formulas.

- [X] T001 Create `backend/src/models/scoring_rule.rs` with: `pub const MAX_SCORE: u32 = 1000`; `#[derive(Debug, Clone, Default, serde::Serialize, serde::Deserialize)] #[serde(rename_all = "snake_case")] pub enum ScoringRule { #[default] SteppedDecay, LinearDecay, FixedScore }`; stub `pub fn calculate_points(&self, correct: bool, time_taken_ms: u64, time_limit_sec: u64) -> u32` returning `if !correct { 0 } else { MAX_SCORE }` for all variants; stub `pub fn display_name(&self) -> &'static str` returning `""`. Add `pub mod scoring_rule;` to `backend/src/models/mod.rs`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Wire `ScoringRule` into the session and replace the old scoring call so the full backend compiles cleanly. No user story work starts until this phase is complete.

**⚠️ CRITICAL**: All three tasks must be complete before Phase 3 begins.

- [X] T002 Add `pub scoring_rule: ScoringRule` field to `GameSession` in `backend/src/models/session.rs`; initialise to `ScoringRule::default()` in `GameSession::new()`. Add `use crate::models::scoring_rule::ScoringRule;` import.
- [X] T003 Update the `calculate_points(correct, elapsed_ms, q.time_limit_sec)` call in `backend/src/services/game_engine.rs` (~line 160, inside `handle_answer()`) to `session.scoring_rule.calculate_points(correct, elapsed_ms, q.time_limit_sec)`. Remove the `use crate::services::scoring::calculate_points;` import.
- [X] T004 Delete the `calculate_points` free function from `backend/src/services/scoring.rs`. If the file becomes empty, delete it and remove its `mod scoring;` declaration from `backend/src/services/mod.rs`. Run `cargo build` to confirm zero compilation errors.

**Checkpoint**: `cargo build` passes. Scoring stubs return MAX_SCORE for correct answers (unchanged visible behaviour for now).

---

## Phase 3: User Story 1 — Host Selects Scoring Rule (Priority: P1) 🎯 MVP

**Goal**: Host sees a scoring rule selector in the Lobby and can change it; the choice is broadcast to all connected clients and locked once the game starts.

**Independent Test**: Create a game, change the rule to "Linear Decay" in the Lobby, start the game, verify the rule cannot be changed again. A second connected client must receive the rule update immediately.

### Tests for User Story 1 (write first — verify they FAIL before implementing)

- [X] T005 Write backend integration tests in `backend/tests/ws_scoring_rule_test.rs`: (a) default `GameSession.scoring_rule` is `ScoringRule::SteppedDecay`; (b) host WebSocket client sending `{"type":"set_scoring_rule","payload":{"rule":"linear_decay"}}` while in Lobby updates the session rule and triggers a `scoring_rule_set` broadcast; (c) same message from a non-host connection is ignored; (d) same message when session status is `Active` is ignored. Tests must fail at this point.
- [X] T006 [P] Add to `frontend/src/services/messages.ts`: `export type ScoringRuleName = "stepped_decay" | "linear_decay" | "fixed_score";`; `export interface SetScoringRulePayload { rule: ScoringRuleName; }`; `export interface ScoringRuleSetPayload { rule: ScoringRuleName; }`; `MSG.SET_SCORING_RULE = "set_scoring_rule"`; `MSG.SCORING_RULE_SET = "scoring_rule_set"` constants.
- [X] T007 [P] Write frontend unit tests in `frontend/src/components/Lobby.test.tsx`: (a) rule selector is rendered when `isHost={true}`; (b) rule selector is NOT rendered when `isHost={false}`; (c) "Stepped Decay" option is selected by default; (d) selecting "Linear Decay" sends a `MSG.SET_SCORING_RULE` WebSocket message with `{ rule: "linear_decay" }`. Tests must fail at this point. Depends on T006.

### Implementation for User Story 1

- [X] T008 Add `"set_scoring_rule"` routing to `backend/src/handlers/ws.rs` (match arm deserialising `SetScoringRulePayload`); implement `pub fn handle_set_scoring_rule(session: &mut GameSession, rule: ScoringRule, sender_id: &str)` in `backend/src/services/game_engine.rs` that: validates `sender_id == session.host_id`, validates `session.status == SessionStatus::Lobby`, sets `session.scoring_rule = rule`, broadcasts `{"type":"scoring_rule_set","payload":{"rule": <snake_case>}}` to all clients. Depends on T005.
- [X] T009 Add `scoring_rule: ScoringRuleName` field (default `"stepped_decay"`) to `useGameState` hook state in `frontend/src/hooks/useGameState.ts`; handle `MSG.SCORING_RULE_SET` message by updating `scoringRule` state. Depends on T006.
- [X] T010 Implement scoring rule selector in `frontend/src/components/Lobby.tsx`: render a group of three labelled radio/button options ("Stepped Decay", "Linear Decay", "Fixed Score") only when `isHost` is true; default selection is "Stepped Decay"; on change, send `MSG.SET_SCORING_RULE` via the game WebSocket. Depends on T007, T009.

**Checkpoint**: Host selects a rule in the Lobby, the backend accepts it, all connected clients receive `scoring_rule_set`. Rule is rejected after game starts. US1 backend integration tests and Lobby unit tests pass.

---

## Phase 4: User Story 2 — Players' Scores Calculated by Active Rule (Priority: P2)

**Goal**: Correct-answer scores reflect the active rule's formula. Wrong answers always yield 0. The minimum score for a correct answer is 1.

**Independent Test**: Run a game with each rule selected. Submit correct answers at known elapsed times and verify awarded points match the formula table in `quickstart.md`. Submit a wrong answer and verify 0 points under every rule.

### Tests for User Story 2 (write first — verify they FAIL before implementing)

- [X] T011 Write unit tests in `backend/tests/scoring_rule_test.rs` for `ScoringRule::calculate_points`: wrong answer → 0 for all three variants; `SteppedDecay` with 20s limit 1000 max: 0–4s → 1000, 5–9s → 750, 10–14s → 500, 15–20s → 250; `LinearDecay` with 20s limit 1000 max: 0s → 1000, 3s → 850, 10s → 500, 19s → 50; `FixedScore`: any elapsed time → 1000; edge case: correct answer at exactly time_limit → min 1 (not 0). Tests fail against stubs.

### Implementation for User Story 2

- [X] T012 Implement `ScoringRule::SteppedDecay` branch in `calculate_points()` in `backend/src/models/scoring_rule.rs`: `num_steps = max(1, time_limit_sec / 5)`; `step_size = MAX_SCORE / num_steps`; `steps_elapsed = time_taken_ms / 5000`; `raw = MAX_SCORE.saturating_sub(steps_elapsed as u32 * step_size)`; return `max(1, raw)` for correct, `0` for incorrect.
- [X] T013 Implement `ScoringRule::LinearDecay` branch in `calculate_points()` in `backend/src/models/scoring_rule.rs`: `step_size = max(1, MAX_SCORE / time_limit_sec as u32)`; `secs_elapsed = time_taken_ms / 1000`; `raw = MAX_SCORE.saturating_sub(secs_elapsed as u32 * step_size)`; return `max(1, raw)` for correct, `0` for incorrect.
- [X] T014 Implement `ScoringRule::FixedScore` branch in `calculate_points()` (return `MAX_SCORE` for correct, `0` for incorrect) and implement `display_name()` for all three variants in `backend/src/models/scoring_rule.rs`: `SteppedDecay` → `"Stepped Decay"`, `LinearDecay` → `"Linear Decay"`, `FixedScore` → `"Fixed Score"`.

**Checkpoint**: All `backend/tests/scoring_rule_test.rs` tests pass. `cargo test` reports no failures.

---

## Phase 5: User Story 3 — Scoring Rule Visible to Players (Priority: P3)

**Goal**: Players see the active rule name on the question screen throughout the game session.

**Independent Test**: Join a game as a player; confirm the rule name label appears on the question screen immediately when the first question is displayed and matches what the host selected.

### Tests for User Story 3 (write first — verify they FAIL before implementing)

- [X] T015 [P] Write frontend unit test in `frontend/src/components/Question.test.tsx` (add to existing test file if present): when `scoringRule` in game state is `"linear_decay"`, the `Question` component renders a visible text element containing `"Linear Decay"`. Test fails.

### Implementation for User Story 3

- [X] T016 Extend `QuestionPayload` in `frontend/src/services/messages.ts` to add `scoring_rule: ScoringRuleName`; update question broadcast in `backend/src/services/game_engine.rs` (where the `"question"` serde JSON is constructed) to include `"scoring_rule": session.scoring_rule` (serde will serialise it as the snake_case string via the `#[serde(rename_all = "snake_case")]` derive); update `useGameState.ts` to set `scoringRule` state from `QuestionPayload.scoring_rule` on each `MSG.QUESTION` message. Depends on T009, T014.
- [X] T017 Add a scoring rule label to `frontend/src/components/Question.tsx`: display the human-readable rule name (e.g., `"Stepped Decay"`) sourced from `scoringRule` in game state, visible to all players throughout the question timer. Depends on T015, T016.

**Checkpoint**: Player joins a game where host chose "Linear Decay"; question screen shows "Linear Decay" label. All three user stories are independently testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: E2E coverage, lint hygiene, dead code removal.

- [X] T018 Write E2E test in `e2e/scoring-rules.spec.ts`: host creates game → selects "Linear Decay" in Lobby → starts quiz → player answers question correctly after ~3 s → verify points awarded match Linear Decay formula (approximately 850 for 20 s/1000 max) → player answers second question incorrectly → verify 0 points. Depends on all prior phases.
- [X] T019 [P] Run `cargo clippy --all-targets -- -D warnings` and `cargo test` from `backend/`; resolve any warnings or test failures introduced by this feature.
- [X] T020 [P] Run `pnpm exec biome check --write` and `pnpm test` from `frontend/`; resolve any type errors, lint violations, or failing unit tests introduced by this feature.

**Checkpoint**: All automated checks pass. Manual quickstart.md validation matches expected scores table.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001) — **BLOCKS** all user story phases
- **US1 (Phase 3)**: Depends on Phase 2 completion
- **US2 (Phase 4)**: Depends on Phase 2 completion (can run in parallel with US1 if staffed)
- **US3 (Phase 5)**: Depends on Phase 2 + US2 (T014 provides `display_name()` needed for T016)
- **Polish (Phase 6)**: Depends on all user story phases

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational — no dependency on US2 or US3
- **US2 (P2)**: Starts after Foundational — no dependency on US1 or US3
- **US3 (P3)**: Starts after Foundational + US2 (needs `display_name()` complete)

### Within Each User Story

```
Tests (write + confirm FAIL) → Implementation → Checkpoint validation
Models → Services → Handlers → Frontend
```

### Parallel Opportunities

- T006 and T007 are [P] within Phase 3 (different frontend files)
- T005, T006, T007 can all be started in parallel (backend vs frontend)
- T012 and T013 are logically independent branches (same file — sequential)
- T015 can run in parallel with T016 backend work (different files)
- T019 and T020 are [P] in Phase 6 (backend vs frontend)

---

## Parallel Example: Phase 3 (US1)

```bash
# Write tests simultaneously (all fail):
T005 — backend/tests/ws_scoring_rule_test.rs  (backend integration)
T006 — frontend/src/services/messages.ts      (add types/constants)
T007 — frontend/src/components/Lobby.test.tsx (frontend unit test)

# Then implement:
T008 — backend handler (ws.rs + game_engine.rs)
T009 — frontend useGameState.ts
T010 — frontend Lobby.tsx                     (after T006, T007, T009)
```

---

## Implementation Strategy

### MVP (User Story 1 only)

1. Phase 1: Setup (T001)
2. Phase 2: Foundational (T002–T004)
3. Phase 3: US1 (T005–T010)
4. **STOP and VALIDATE**: Host can select a scoring rule; it is locked after start. Score still uses stub (FixedScore behaviour: always MAX_SCORE for correct). Demo-able.

### Incremental Delivery

1. Setup + Foundational → compiles cleanly
2. US1 → host selects rule (stub scoring) → demo-able MVP
3. US2 → correct formulas applied → scoring is meaningful
4. US3 → players see rule name → full feature complete
5. Polish → E2E test + lint pass → merge-ready

### Parallel Team Strategy

After Phase 2 is done:
- Developer A: US1 (host UI + WebSocket handler)
- Developer B: US2 (scoring formulas)
- Developer C: US3 (player display — start after US2 T014 is done)

---

## Notes

- `[P]` tasks have no blocking dependency on other in-progress tasks in the same phase — different files or independent concerns
- `[Story]` label maps each task to a specific user story for traceability
- TDD exception: backend structs (T001–T002) must exist and compile before test files can reference them; follow the Rust exception pattern documented in project memory
- Commit after each phase checkpoint, or after each logical group (test + implementation)
- Verify tests fail before implementing; verify tests pass before moving to the next story
- `cargo test scoring_rule` runs only the scoring unit tests; `cargo test` runs everything
