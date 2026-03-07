# Implementation Plan: Question Time Limit

**Branch**: `010-question-time-limit` | **Date**: 2026-03-07 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/010-question-time-limit/spec.md`

## Summary

Allow the host to configure the per-session question time limit (10–60 s, default 20 s) on the same Lobby page as the scoring rule. The server stores the value on `GameSession`, enforces it server-side as the countdown authority, and the host can also close a question early. Two new WS messages are added (`set_time_limit` / `time_limit_set`); one existing message (`question`) changes its `time_limit_sec` source from the quiz YAML to the session.

## Technical Context

**Language/Version**: Rust (stable, edition 2024) — backend; TypeScript 5.x — frontend
**Primary Dependencies**: Axum + Tokio (backend); React 19 + Rspack (frontend); Vitest + @testing-library/react (unit); Playwright (e2e)
**Storage**: In-memory only — `GameSession` in `HashMap`; no persistence
**Testing**: `cargo test` (backend unit/integration); Vitest (frontend unit); Playwright (e2e)
**Target Platform**: Linux server + browser SPA
**Project Type**: Web application (backend + frontend)
**Performance Goals**: Server-side timer fires within ±100ms of configured duration (Tokio `sleep` accuracy); WS broadcast latency <1 s under expected load (matches SC-005)
**Constraints**: Time limit stored as `u64` seconds; no decimal precision; no per-question override in this feature
**Scale/Scope**: Same as existing system (10 sessions max, 50 players max per session)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | All new functions follow single-responsibility; game_engine refactor removes redundant parameter threading; no dead code introduced |
| II. Testing Standards | PASS | TDD applies — write failing tests first; backend struct changes are pre-condition exception (must compile before tests run); unit + integration + e2e coverage required |
| III. UX Consistency | PASS | Time limit input follows existing fieldset/label pattern; error messages use `colors.error` token; tone matches scoring rule validation |
| IV. Performance | PASS | No new async paths beyond existing timer; `time_limit_sec` read from session (already held under write lock) introduces negligible overhead |

**Complexity Justification**: None required — no new abstractions, layers, or dependencies introduced. Existing patterns replicated.

## Project Structure

### Documentation (this feature)

```text
specs/010-question-time-limit/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── ws-messages.md   # WS message contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (modified files only)

```text
backend/
├── src/
│   ├── models/
│   │   └── session.rs          # Add time_limit_sec field
│   ├── services/
│   │   └── game_engine.rs      # Remove question_time_sec param; add handle_set_time_limit; handle end_question
│   └── handlers/
│       └── ws.rs               # Add set_time_limit + end_question handlers; remove question_time_sec arg

frontend/
├── src/
│   ├── services/
│   │   └── messages.ts         # Add SET_TIME_LIMIT, TIME_LIMIT_SET, END_QUESTION + payload types
│   ├── hooks/
│   │   └── useGameState.ts     # Add timeLimitSec to GameState; handle TIME_LIMIT_SET
│   ├── components/
│   │   ├── Lobby.tsx           # Add time limit input + validation UI
│   │   └── HostDashboard.tsx   # Add "End Question" button
│   └── pages/
│       └── HostPage.tsx        # Wire time limit change and end question handlers
└── tests/
    └── unit/
        ├── components/
        │   ├── Lobby.test.tsx          # New/updated tests for time limit field
        │   └── HostDashboard.test.tsx  # New tests for End Question button
        └── hooks/
            └── useGameState.test.ts    # TIME_LIMIT_SET handling

e2e/
└── tests/
    └── time-limit.spec.ts       # New e2e test
```

**Structure Decision**: Web application (Option 2) — existing `backend/` + `frontend/` + `e2e/` layout; no new top-level directories.

## Implementation Phases

### Phase A: Backend — Session Model

**Goal**: Add `time_limit_sec` to `GameSession`; compile clean.

1. `session.rs`: Add `time_limit_sec: u64` field; initialize from `AppConfig.question_time_sec` in `GameSession::new`.
2. `ws.rs`: Update `GameSession::new` call if needed (check `session_manager.rs`). Remove `question_time_sec` reads from `state.config` in `ws_host` and `ws_player`.

*Struct change must land before tests can compile.*

### Phase B: Backend — Game Engine Refactor

**Goal**: Remove parameter threading; read from session.

1. `game_engine.rs`:
   - Remove `question_time_sec: u64` parameter from `start_game`, `do_advance_question`, `do_end_question`, `handle_answer`, `send_next_question`.
   - Read `session.time_limit_sec` within each function (requires session read lock where not already held).
   - In `do_advance_question`: change `"time_limit_sec": q.time_limit_sec` → `"time_limit_sec": s.time_limit_sec` in the `question` broadcast.
   - In `handle_answer`: change `question.time_limit_sec` → `s.time_limit_sec` in `calculate_points` call.
2. `ws.rs`: Update all call sites to remove the `question_time_sec` argument.

### Phase C: Backend — New WS Handlers

**Goal**: Handle `set_time_limit` and `end_question` messages.

1. `game_engine.rs`: Add `handle_set_time_limit(session, seconds, tx)`:
   - Ignore if `session.status != Lobby`
   - Return `HostOnly` error message if `seconds < 10 || seconds > 60`
   - Set `session.time_limit_sec = seconds`; broadcast `time_limit_set`
2. `ws.rs` `ws_host` recv loop: Add two match arms:
   - `"set_time_limit"` → parse `payload.seconds`, call `handle_set_time_limit`
   - `"end_question"` → read `current_question`, call `do_end_question(session, tx, current_question as usize)`

### Phase D: Frontend — Message Types

**Goal**: Add new message constants and payload types.

1. `messages.ts`:
   - Add `SET_TIME_LIMIT`, `TIME_LIMIT_SET`, `END_QUESTION` to `MSG` constant
   - Add `SetTimeLimitPayload { seconds: number }`, `TimeLimitSetPayload { seconds: number }`

### Phase E: Frontend — State

**Goal**: Track time limit in game state.

1. `useGameState.ts`:
   - Add `timeLimitSec: number` to `GameState` (initial: 20)
   - Handle `MSG.TIME_LIMIT_SET` in reducer: `return { ...state, timeLimitSec: p.seconds }`

### Phase F: Frontend — Lobby UI

**Goal**: Render time limit input with validation on the Lobby page (host only).

1. `Lobby.tsx`:
   - Add `timeLimitSec: number` and `onTimeLimitChange?: (seconds: number) => void` props
   - Render a `<fieldset>` for "Question Time Limit" (same structure as Scoring Rule fieldset) containing:
     - `<input type="number" min="10" max="60" value={localValue} ...>`
     - Inline error text when value < 10: "Time must be at least 10 seconds."
     - Inline error text when value > 60: "Time must be no more than 60 seconds."
     - Inline error text when empty/NaN: "Please enter a valid number."
     - `aria-describedby` pointing to the error element
   - Call `onTimeLimitChange` only when value is valid (10–60)
2. `HostPage.tsx`:
   - Add `handleTimeLimitChange = (seconds) => send({ type: MSG.SET_TIME_LIMIT, payload: { seconds } })`
   - Pass `timeLimitSec={gameState.timeLimitSec}` and `onTimeLimitChange={handleTimeLimitChange}` to `<Lobby>`

### Phase G: Frontend — Host Dashboard (Early Close)

**Goal**: Allow host to close active question early.

1. `HostDashboard.tsx`:
   - Add `onEndQuestion?: () => void` prop
   - Render an "End Question" `<Button>` when `gameState.phase === "question"`
2. `HostPage.tsx`:
   - Add `handleEndQuestion = () => send({ type: MSG.END_QUESTION, payload: {} })`
   - Pass `onEndQuestion={handleEndQuestion}` to `<HostDashboard>`

### Phase H: Tests

**Goal**: Full TDD coverage per constitution.

**Backend tests** (`backend/src/services/game_engine.rs` `#[cfg(test)]` module):
- `handle_set_time_limit` accepts boundary values 10 and 60
- `handle_set_time_limit` rejects 9 (returns error event)
- `handle_set_time_limit` rejects 61 (returns error event)
- `handle_set_time_limit` ignores non-Lobby session (no broadcast)
- `do_end_question` is idempotent: second call with same index is no-op
- `question` broadcast contains `session.time_limit_sec` (not question-level value)
- `calculate_points` receives `session.time_limit_sec` at scoring time

**Frontend unit tests** (Vitest):
- `Lobby.test.tsx`: renders input with default value 20; shows below-min error; shows above-max error; shows empty-value error; calls `onTimeLimitChange` only for valid values; does not call for invalid
- `HostDashboard.test.tsx`: renders "End Question" button during question phase; calls `onEndQuestion` on click; does not render button in non-question phase
- `useGameState.test.ts`: `TIME_LIMIT_SET` message updates `timeLimitSec` field

**E2E tests** (Playwright):
- `time-limit.spec.ts`:
  - Host sets time limit to 15s; player joins; game starts; player sees 15s countdown
  - Host sets time limit to 12s; host closes question early; countdown stops before 0

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Timer authority | Server-side (`GameSession.time_limit_sec` + Tokio sleep) | Consistent cutoff enforcement; matches clarification answer |
| Parameter threading | Removed; read from session | Single source of truth; no divergence risk |
| `question.time_limit_sec` at runtime | Replaced by `session.time_limit_sec` | Session is authoritative; quiz YAML value kept for future per-question use |
| Early close | `end_question` message → `do_end_question` | Reuses existing idempotent function; no new state machine |
| Frontend validation | Inline error below input | Consistent with existing patterns; accessible via `aria-describedby` |
| `AppConfig.question_time_sec` | Retained as session default seed | Backwards-compatible; env-var deployment control preserved |

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Timer race: early close fires simultaneously with Tokio sleep | Existing index guard in `do_end_question` handles this; no additional logic needed |
| Frontend sends `set_time_limit` with invalid value | Backend rejects with error; frontend also validates before sending |
| `question_time_sec` parameter removal breaks callers | All callers are in `ws.rs` and `game_engine.rs`; compiler enforces correctness |
