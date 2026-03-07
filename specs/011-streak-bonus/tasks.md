# Tasks: Streak Bonus Scoring Rule

**Input**: Design documents from `/specs/011-streak-bonus/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ws-messages.md, quickstart.md

**Tests**: TDD is the default workflow per the project constitution — test tasks are included and MUST be written before their corresponding implementation tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Exact file paths are included in every description

## Path Conventions

Web application layout: `backend/src/`, `frontend/src/`, `e2e/tests/`

---

## Phase 1: Setup

**Purpose**: No new packages, project structure, or configuration needed — this feature is purely additive to existing files. No setup phase tasks required.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend data model changes that MUST compile before any tests or user story work can proceed.

**⚠️ CRITICAL**: These struct/enum additions are the TDD exception — the code must compile before tests referencing the new types can be written.

- [X] T001 [P] Add `correct_streak: u32` field (default `0`) to `Player` struct and initialize it in `Player::new` in `backend/src/models/player.rs`
- [X] T002 [P] Add `StreakBonus` variant (serialized as `"streak_bonus"`) to `ScoringRule` enum with `calculate_points` returning 1000 for correct answers and 0 for incorrect, in `backend/src/models/scoring_rule.rs`

**Checkpoint**: `cargo build` passes — all user story work can now begin

---

## Phase 3: User Story 1 — Select Streak Bonus in Lobby (Priority: P1) 🎯 MVP

**Goal**: Host can select "Streak Bonus" as a scoring rule in the lobby; all connected players see the rule reflected on their screen.

**Independent Test**: Host uploads a quiz, opens the lobby, sees "Streak Bonus" listed alongside existing rules, selects it, and a player connected to the lobby receives `scoring_rule_set` with `rule: "streak_bonus"`.

> **NOTE: Write T004 FIRST, ensure it FAILS, then implement T005 to make it pass**

- [X] T003 [P] [US1] Extend `ScoringRuleName` type union to include `"streak_bonus"` in `frontend/src/services/messages.ts`
- [X] T004 [US1] Add failing unit test asserting "Streak Bonus" appears as a selectable option in the lobby scoring rule list in `frontend/tests/unit/components/Lobby.test.tsx`
- [X] T005 [US1] Add "Streak Bonus" option with a short description to the scoring rule selector in `frontend/src/components/Lobby.tsx`

**Checkpoint**: User Story 1 is independently testable — lobby displays and transmits "Streak Bonus" selection

---

## Phase 4: User Story 2 — Points Multiply on Consecutive Correct Answers (Priority: P1)

**Goal**: For StreakBonus games, each consecutive correct answer earns `base_score × (1.0 + streak × 0.5)` points. `streak_multiplier` is always present in `answer_result` (1.0 for non-StreakBonus rules).

**Independent Test**: A player answers 3 consecutive questions correctly; `answer_result` payloads show multipliers ×1.0, ×1.5, ×2.0 and points 1000, 1500, 2000.

> **NOTE: Write tests FIRST (T006, T008), ensure they FAIL, then implement (T007, T009, T010, T011)**

- [X] T006 [US2] Add failing unit tests for `apply_streak_multiplier` covering: streak=0→×1.0, streak=1→×1.5, streak=2→×2.0, and no-op for non-StreakBonus rules, in `backend/src/models/scoring_rule.rs` test module
- [X] T007 [US2] Implement `apply_streak_multiplier(base: u32, streak: u32) -> u32` on `ScoringRule` in `backend/src/models/scoring_rule.rs` — `StreakBonus` uses `(base as f64 * (1.0 + streak as f64 * 0.5)) as u32`, all other variants return `base` unchanged
- [X] T008 [US2] Add failing unit tests for `handle_answer` streak points calculation (correct answer with streak=1 yields 1500 pts) in `backend/src/services/game_engine.rs` test module
- [X] T009 [US2] Update `game_engine::handle_answer` to call `apply_streak_multiplier(base_points, player.correct_streak)` after `calculate_points`, then increment `player.correct_streak` by 1 on correct answers, in `backend/src/services/game_engine.rs`
- [X] T010 [US2] Update `answer_result` WebSocket message to always include `streak_multiplier: f64` field — computed as `1.0 + (pre_answer_streak as f64 * 0.5)` for StreakBonus, `1.0` for all other rules — in `backend/src/handlers/ws.rs`
- [X] T011 [P] [US2] Add `streak_multiplier: number` field to `AnswerResultPayload` interface in `frontend/src/services/messages.ts`

**Checkpoint**: Streak scoring compounding is functional; `answer_result` always carries `streak_multiplier`

---

## Phase 5: User Story 3 — Incorrect Answer Resets the Multiplier (Priority: P1)

**Goal**: An incorrect answer or a timed-out (unanswered) question resets `correct_streak` to 0, so the next correct answer uses ×1.0.

**Independent Test**: A player with streak=2 answers incorrectly → next correct answer receives exactly 1000 pts (×1.0). A player with streak=2 who does not answer before timeout also receives ×1.0 on the next question.

> **NOTE: Write tests FIRST (T012, T014), ensure they FAIL, then implement (T013, T015)**

- [X] T012 [US3] Add failing unit tests for `handle_answer` reset: incorrect answer sets `player.correct_streak` to 0 regardless of prior streak, in `backend/src/services/game_engine.rs` test module
- [X] T013 [US3] Update `game_engine::handle_answer` to reset `player.correct_streak` to 0 on incorrect answers in `backend/src/services/game_engine.rs`
- [X] T014 [US3] Add failing unit tests for `do_end_question` timeout reset: players who have not answered the current question have `correct_streak` reset to 0 when rule is `StreakBonus`, in `backend/src/services/game_engine.rs` test module
- [X] T015 [US3] Update `game_engine::do_end_question` to iterate over unanswered players and set `player.correct_streak = 0` when `session.scoring_rule == ScoringRule::StreakBonus` in `backend/src/services/game_engine.rs`

**Checkpoint**: Streak reset is reliable on both incorrect answers and timeouts; all reset unit tests pass

---

## Phase 6: User Story 4 — Multiplier Shown in Answer Result (Priority: P2)

**Goal**: After answering in a StreakBonus game, the player sees the multiplier applied (e.g., "×1.5") in the answer result. For other rules, no multiplier is displayed.

**Independent Test**: With StreakBonus active, after submitting a second consecutive correct answer, the answer result screen displays "×1.5". Switching to Fixed Score, no multiplier text is shown.

> **NOTE: Write T016 FIRST, ensure it FAILS, then implement T017 to make it pass**

- [X] T016 [US4] Add failing unit tests for multiplier display: shows "×1.5" when `scoringRule === "streak_bonus"` and `streak_multiplier === 1.5`; hidden for non-streak rules, in `frontend/tests/unit/components/Question.test.tsx`
- [X] T017 [US4] Display `streak_multiplier` (formatted as "×N.N") in the answer result section of `frontend/src/components/Question.tsx` only when `scoringRule === "streak_bonus"`

**Checkpoint**: All four user stories are independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end validation, lint, formatting, and full test suite verification

- [ ] T018 [P] Add e2e tests covering streak compounding (×1.0/×1.5/×2.0 over 3 correct answers), reset on incorrect, and reset on timeout in `e2e/tests/streak-bonus.spec.ts`
- [ ] T019 Run `cargo clippy -- -D warnings` and fix any new warnings introduced by this feature
- [ ] T020 [P] Run `cargo fmt --check` and fix formatting in modified Rust files
- [ ] T021 [P] Run `pnpm exec biome check src/` and fix any frontend lint or formatting issues
- [X] T022 Run full test suite with `just test` to verify all unit, integration, and e2e tests pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 2 (Foundational)**: No dependencies — start immediately
- **Phase 3 (US1)**: Depends on Phase 2 (needs `ScoringRule::StreakBonus` to compile)
- **Phase 4 (US2)**: Depends on Phase 2 (`correct_streak` field and `StreakBonus` variant must exist)
- **Phase 5 (US3)**: Depends on Phase 4 (T013 extends the same `handle_answer` function as T009)
- **Phase 6 (US4)**: Depends on Phase 4 (`streak_multiplier` in `AnswerResultPayload` must exist — T011)
- **Phase 7 (Polish)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2 only — independently testable after T005
- **US2 (P1)**: Depends on Phase 2 only — independently testable after T011
- **US3 (P1)**: Depends on US2 (T009 must be in place before T012/T013) — same `handle_answer` function
- **US4 (P2)**: Depends on US2 (T011 must be in place) — uses `streak_multiplier` from payload

### Within Each User Story

- Test tasks (T004, T006, T008, T012, T014, T016) MUST be written and FAIL before their paired implementation tasks
- Model/method tasks before service layer tasks within US2
- Backend changes (scoring logic, WS payload) before paired frontend type changes
- Phase 7 runs only after all user stories complete

### Parallel Opportunities

- **T001 & T002**: Different files — run in parallel
- **T003 & T004**: Different files — run in parallel (T003 is a type-only change; T004 is a test)
- **T006 & T003**: Different codebases — backend test and frontend type change are independent
- **T010 & T011**: Different files (`ws.rs` vs `messages.ts`) — run in parallel
- **T018, T020, T021**: Different tools/files — run in parallel after T022

---

## Parallel Example: User Story 2

```bash
# After T007 (apply_streak_multiplier implemented):
Task A: "T008 — Add failing unit tests for handle_answer scoring in game_engine.rs"
Task B: "T011 — Add streak_multiplier field to AnswerResultPayload in messages.ts"
# (T008 is backend, T011 is frontend — no file conflict)

# After T008 passes and T009 implemented:
Task: "T010 — Update answer_result WS payload in ws.rs to include streak_multiplier"
```

---

## Implementation Strategy

### MVP First (User Stories 1–3, Priority P1 only)

1. Complete Phase 2: Foundational (compile guard)
2. Complete Phase 3: US1 — lobby selection testable
3. Complete Phase 4: US2 — streak scoring testable
4. Complete Phase 5: US3 — reset mechanics testable
5. **STOP and VALIDATE**: Run `just test`, verify all backend unit tests and e2e pass
6. Demo/deploy MVP with full streak logic

### Incremental Delivery

1. Phase 2 → Foundation compiled
2. Phase 3 (US1) → "Streak Bonus" selectable in lobby
3. Phase 4 (US2) → Streak compounding functional
4. Phase 5 (US3) → Reset mechanics functional → P1 complete
5. Phase 6 (US4) → Multiplier visible to players
6. Phase 7 → Full validation and merge

---

## Notes

- [P] tasks = different files, no blocking dependencies on incomplete tasks
- [Story] label maps task to spec user story for traceability
- Backend struct changes (T001, T002) are the TDD compile exception — they must exist before tests referencing them can compile
- All other test tasks follow strict TDD: write test → verify failure → implement → verify green
- Commit after each task or logical group (e.g., test + implementation pair)
- `streak_multiplier` is always a `f64` in Rust / `number` in TypeScript — never optional
- Pre-answer streak is used for the multiplier calculation (streak BEFORE incrementing)
