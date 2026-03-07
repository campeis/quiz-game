---

description: "Task list template for feature implementation"
---

# Tasks: Question Time Limit

**Input**: Design documents from `/specs/010-question-time-limit/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ws-messages.md, quickstart.md

**Tests**: Included per the constitution (TDD is the default workflow).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- TDD rule: test tasks are written **before** implementation tasks within each story

## Path Conventions

- **Backend**: `backend/src/`
- **Frontend**: `frontend/src/`, `frontend/tests/`
- **E2E**: `e2e/tests/`

---

## Phase 1: Setup

**Purpose**: No new project scaffolding required — this feature modifies existing files only. Confirm toolchain is working before beginning.

- [X] T001 Verify `cargo test` and `pnpm test` both pass on `main`-state codebase (no regressions at start)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Structural changes that must compile before any user-story work can begin. Backend struct change is a TDD exception — it must exist for tests to compile.

**⚠️ CRITICAL**: No user story work can begin until T002–T006 are complete and `cargo build` passes.

- [X] T002 Add `time_limit_sec: u64` field to `GameSession` in `backend/src/models/session.rs`; initialize it from `AppConfig.question_time_sec` in `GameSession::new`; derive/impl nothing extra — struct change only
- [X] T003 Write backend unit tests (failing) in `backend/src/services/game_engine.rs` `#[cfg(test)]` module: assert question broadcast payload contains `session.time_limit_sec` (not `question.time_limit_sec`); assert `calculate_points` is called with `session.time_limit_sec`
- [X] T004 Refactor `backend/src/services/game_engine.rs`: remove `question_time_sec: u64` parameter from `start_game`, `send_next_question`, `do_advance_question`, `do_end_question`, `handle_answer`; read `s.time_limit_sec` from the session inside each function; change `"time_limit_sec": q.time_limit_sec` to `"time_limit_sec": s.time_limit_sec` in the question broadcast payload; change `calculate_points(..., question.time_limit_sec)` to `calculate_points(..., s.time_limit_sec)` in `handle_answer`
- [X] T005 Update `backend/src/handlers/ws.rs`: remove `let question_time_sec = state.config.question_time_sec;` from both `ws_host` and `ws_player`; remove the `question_time_sec` argument from all `game_engine::start_game` and `game_engine::handle_answer` call sites; verify `cargo build` succeeds
- [X] T006 [P] Add `SET_TIME_LIMIT`, `TIME_LIMIT_SET`, and `END_QUESTION` string constants to the `MSG` object in `frontend/src/services/messages.ts`; add `SetTimeLimitPayload { seconds: number }` and `TimeLimitSetPayload { seconds: number }` payload types
- [X] T007 Add `timeLimitSec: number` field (initial value: `20`) to `GameState` and `initialState` in `frontend/src/hooks/useGameState.ts`; add `case MSG.TIME_LIMIT_SET:` to the reducer returning `{ ...state, timeLimitSec: (payload as TimeLimitSetPayload).seconds }`

**Checkpoint**: `cargo test` and `pnpm test` pass (T003 tests may still fail until T004 is complete). Foundation ready for user story implementation.

---

## Phase 3: User Story 1 — Set Question Time Limit (Priority: P1) 🎯 MVP

**Goal**: Host sees a "Question Time Limit" field on the Lobby page (co-located with scoring rules); default is 20 s; valid range 10–60 s enforced on both frontend and backend; server broadcasts the chosen value.

**Independent Test**: Navigate to `/host`, upload a quiz, reach the lobby. The time limit field shows 20 by default. Entering 5 shows the minimum error. Entering 90 shows the maximum error. Entering 30 clears the error and the server echoes `time_limit_set` with `seconds: 30`.

### Tests (write first — must fail before implementation)

- [X] T008 Write backend unit tests in `backend/src/services/game_engine.rs` `#[cfg(test)]` for `handle_set_time_limit`: (a) accepts value 10 and broadcasts `time_limit_set`; (b) accepts value 60 and broadcasts `time_limit_set`; (c) rejects value 9 with a `HostOnly` error event; (d) rejects value 61 with a `HostOnly` error event; (e) silently ignores when session status is `Active`
- [X] T009 [P] Write Vitest unit tests in `frontend/tests/unit/components/Lobby.test.tsx` for the time limit field: (a) renders `<input type="number">` with value `20` by default; (b) displays "Time must be at least 10 seconds." when value is `9`; (c) displays "Time must be no more than 60 seconds." when value is `61`; (d) displays an error for empty / non-numeric input; (e) calls `onTimeLimitChange(30)` when value `30` is entered and field is valid; (f) does NOT call `onTimeLimitChange` for invalid values
- [X] T010 [P] Write Vitest unit test in `frontend/tests/unit/hooks/useGameState.test.ts`: assert that dispatching `{ type: MSG.TIME_LIMIT_SET, payload: { seconds: 45 } }` updates `timeLimitSec` to `45`

### Implementation

- [X] T011 Add `pub fn handle_set_time_limit(session: &mut GameSession, seconds: u64, tx: &broadcast::Sender<GameEvent>)` to `backend/src/services/game_engine.rs`: return early if `session.status != Lobby`; send `HostOnly` error with `code: "invalid_time_limit"` if `seconds < 10 || seconds > 60`; otherwise set `session.time_limit_sec = seconds` and broadcast `time_limit_set` to all
- [X] T012 Add `Some("set_time_limit")` match arm to the host recv loop in `backend/src/handlers/ws.rs`: parse `payload["seconds"].as_u64()`; call `game_engine::handle_set_time_limit(&mut s, seconds, &recv_tx)` with session write lock
- [X] T013 [P] Add time limit section to `frontend/src/components/Lobby.tsx`: add `timeLimitSec: number` and `onTimeLimitChange?: (seconds: number) => void` props; render a `<fieldset>` with legend "Question Time Limit" adjacent to the scoring rule fieldset (host only); render `<input type="number" min="10" max="60">` with controlled local state; show inline error "Time must be at least 10 seconds." when `< 10`; show inline error "Time must be no more than 60 seconds." when `> 60`; show error "Please enter a valid number." when empty or NaN; use `aria-describedby` on input pointing to the error element; call `onTimeLimitChange` only when valid
- [X] T014 Wire time limit in `frontend/src/pages/HostPage.tsx`: add `handleTimeLimitChange = (seconds: number) => send({ type: MSG.SET_TIME_LIMIT, payload: { seconds } })`; pass `timeLimitSec={gameState.timeLimitSec}` and `onTimeLimitChange={handleTimeLimitChange}` props to `<Lobby>`

**Checkpoint**: User Story 1 fully functional. Host can configure time limit in the Lobby; validation messages appear; server confirms with `time_limit_set` broadcast.

---

## Phase 4: User Story 2 — Time Limit Applied During Quiz (Priority: P2)

**Goal**: Every question countdown starts from the session's configured time limit; the server closes the question when the countdown reaches zero; late answers are rejected by the server.

**Independent Test**: Set time limit to 15 s, start the quiz. Observe the `question` WS payload has `time_limit_sec: 15`. The timer component counts from 15. After 15 s, `question_ended` is broadcast and further answer submissions are rejected.

**Note**: All implementation for this story was delivered in Phase 2 (foundational refactor). This phase adds verification and the e2e test only.

### Tests

- [X] T015 Verify T003 backend tests pass after Phase 2 implementation: run `cargo test` and confirm assertions on question broadcast payload and calculate_points call use `session.time_limit_sec` — `backend/src/services/game_engine.rs`
- [X] T016 Write e2e test in `e2e/tests/time-limit.spec.ts` (new file): host uploads quiz, sets time limit to 15 s in lobby (aria input), player joins, host starts game; assert player page shows `Timer` counting from 15; wait for timer to expire; assert `question_ended` state renders on player page (leaderboard visible) before 20 s elapses

**Checkpoint**: User Story 2 verified end-to-end. Timer countdown matches configured value; server enforces cutoff.

---

## Phase 5: User Story 3 — Host Closes Question Early (Priority: P3)

**Goal**: Host sees an "End Question" button on the HostDashboard while a question is active. Clicking it immediately broadcasts `question_ended` to all clients; remaining countdown is cancelled; late player answers are rejected.

**Independent Test**: Start a quiz with a 60 s time limit. Click "End Question" after 5 s. Verify `question_ended` arrives on the player page within 2 s. Verify that clicking "End Question" again does nothing (idempotent).

### Tests (write first — must fail before implementation)

- [X] T017 Write backend unit test in `backend/src/services/game_engine.rs` `#[cfg(test)]` for `do_end_question` idempotency: call `do_end_question` for question index 0, then call again for index 0 with `current_question` already advanced; assert the second call broadcasts nothing (question index guard fires)
- [X] T018 [P] Write Vitest unit test in `frontend/tests/unit/components/HostDashboard.test.tsx`: (a) "End Question" button is present when `gameState.phase === "question"`; (b) clicking it calls `onEndQuestion`; (c) button is absent when `phase === "question_ended"`

### Implementation

- [X] T019 Add `Some("end_question")` match arm to the host recv loop in `backend/src/handlers/ws.rs`: read `s.current_question` from the session; call `game_engine::do_end_question(session.clone(), recv_tx.clone(), current_question as usize).await` inside a spawned task (to avoid blocking the recv loop)
- [X] T020 [P] Add `onEndQuestion?: () => void` prop to `HostDashboard` in `frontend/src/components/HostDashboard.tsx`; render `<Button onClick={onEndQuestion}>End Question</Button>` only when `gameState.phase === "question"` (inside the existing card layout)
- [X] T021 Wire early close in `frontend/src/pages/HostPage.tsx`: add `handleEndQuestion = () => send({ type: MSG.END_QUESTION, payload: {} })`; pass `onEndQuestion={handleEndQuestion}` to `<HostDashboard>`

**Checkpoint**: User Story 3 fully functional. Host can close questions early; clients receive `question_ended`; idempotency verified.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T022 Add second `describe` block "Host early close" to `e2e/tests/time-limit.spec.ts`: host sets 60 s limit; start quiz; host clicks "End Question" after 3 s; assert player page transitions to leaderboard within 5 s (well before 60 s)
- [X] T023 [P] Run `just test` (all suites: cargo test + pnpm test + Playwright); confirm zero failures and no coverage regressions
- [X] T024 [P] Run `just lint` (Clippy `-D warnings` + Biome + rustfmt --check); fix any issues introduced by this feature

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** (T001): No dependencies — can start immediately
- **Phase 2** (T002–T007): T002 first (struct change, compile prerequisite); T003 next (write failing tests); T004 (implement refactor, T003 tests pass); T005 (update ws.rs call sites); T006–T007 can run in parallel with T002–T005 (different files/language)
- **Phase 3** (T008–T014): All depend on Phase 2 completion; T008/T009/T010 (tests) before T011/T012/T013/T014 (impl); T009 and T010 parallel with T008; T013 parallel with T011+T012
- **Phase 4** (T015–T016): Depends on Phase 2 and Phase 3 completion
- **Phase 5** (T017–T021): Depends on Phase 2 and Phase 4 completion; T017/T018 (tests) before T019/T020/T021 (impl); T018 parallel with T017; T020 parallel with T019
- **Phase 6** (T022–T024): All user stories complete; T023 depends on T022; T024 parallel with T022/T023

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no other story dependency
- **US2 (P2)**: Implementation already in Phase 2; tests/e2e can start after Phase 3 (no runtime dependency)
- **US3 (P3)**: Can start after Phase 2 — no dependency on US1 or US2 for backend; frontend needs Phase 3 wiring complete for HostPage context

### Within Each User Story (TDD order)

1. Write test tasks (marked first in each phase) — verify they FAIL
2. Write implementation tasks — verify tests PASS
3. Commit before moving to next story

### Parallel Opportunities

- T006 (messages.ts) + T007 (useGameState.ts) run in parallel with T002–T005 (backend work)
- T008 (backend tests) + T009 (Lobby unit tests) + T010 (useGameState unit test) are parallel
- T013 (Lobby.tsx impl) runs in parallel with T011 (game_engine) + T012 (ws.rs)
- T017 (idempotency test) + T018 (HostDashboard unit test) are parallel
- T019 (ws.rs) + T020 (HostDashboard.tsx) are parallel
- T023 + T024 are parallel

---

## Parallel Example: User Story 1

```bash
# Write all US1 tests in parallel (different files):
Task T008: "Backend unit tests for handle_set_time_limit in game_engine.rs"
Task T009: "Vitest unit tests for Lobby time limit field in Lobby.test.tsx"
Task T010: "Vitest unit test for TIME_LIMIT_SET in useGameState.test.ts"

# Then implement in parallel (backend vs frontend):
Task T011+T012: "Backend: handle_set_time_limit + ws.rs handler"
Task T013:      "Frontend: Lobby.tsx time limit fieldset"
```

## Parallel Example: User Story 3

```bash
# Write tests in parallel:
Task T017: "Backend idempotency test for do_end_question"
Task T018: "Vitest unit tests for HostDashboard End Question button"

# Implement in parallel:
Task T019: "Backend: ws.rs end_question handler"
Task T020: "Frontend: HostDashboard End Question button"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (T001) — verify baseline
2. Complete Phase 2 (T002–T007) — foundational changes
3. Complete Phase 3 (T008–T014) — US1: time limit setup in Lobby
4. **STOP and VALIDATE**: Host can set time limit in Lobby; validation messages correct; backend stores value
5. Ship MVP

### Incremental Delivery

1. Phase 1 + Phase 2 → Infrastructure ready
2. Phase 3 → US1: Lobby time limit picker (MVP — host control)
3. Phase 4 → US2: Timer enforcement verified end-to-end
4. Phase 5 → US3: Host early close
5. Phase 6 → Polish and full suite validation

### Parallel Team Strategy

With two developers after Phase 2 is complete:
- **Developer A**: Phase 3 (US1 — backend + Lobby UI)
- **Developer B**: Phase 5 (US3 — backend + HostDashboard)

US3 backend (`end_question` in `ws.rs`) and US1 backend (`set_time_limit` in `ws.rs`) touch the same file; coordinate to avoid merge conflicts on that match arm.

---

## Notes

- [P] tasks = different files / no incomplete dependencies — safe to parallelize
- [Story] label maps task to specific user story for traceability
- TDD: always verify tests FAIL before writing implementation
- Backend struct change (T002) is a TDD exception — must compile before tests run
- `ws.rs` host recv loop is touched by both US1 (T012) and US3 (T019) — sequence these or coordinate carefully
- Commit after each logical group (at minimum: after each story checkpoint)
- `just test` must be green before Phase 6 closes
