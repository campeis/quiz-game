# Quickstart: Question Time Limit

**Branch**: `010-question-time-limit`

## Development Setup

No new dependencies. Uses existing Rust/Axum backend and React/TypeScript frontend.

```bash
# Run backend
cargo run

# Run frontend (separate terminal)
cd frontend && pnpm dev

# Run all tests
just test

# Run linters
just lint
```

## Manual Testing the Feature

1. Navigate to `/host` and upload a quiz file from `fixtures/`
2. In the lobby, locate the **"Question Time Limit"** field (below or adjacent to the Scoring Rule selector)
3. The field defaults to `20` seconds
4. **Test validation**:
   - Enter `5` → error: "Time must be at least 10 seconds."
   - Enter `90` → error: "Time must be no more than 60 seconds."
   - Enter `abc` → error prompting a valid number
   - Enter `10` → accepted; field clears error
   - Enter `60` → accepted
5. Set time limit to `15`; join as a player from another tab/browser
6. Start the quiz — the countdown on both host and player views should count from 15
7. On the host dashboard, click **"End Question"** before the timer expires — question closes immediately
8. Verify that a player answer submitted after early close is rejected

## Key Files Changed

### Backend
| File | Change |
|------|--------|
| `backend/src/models/session.rs` | Add `time_limit_sec: u64` field; seed from config |
| `backend/src/services/game_engine.rs` | Remove `question_time_sec` param; read from session; add `handle_set_time_limit`; handle `end_question` |
| `backend/src/handlers/ws.rs` | Add `set_time_limit` and `end_question` message handlers; remove `question_time_sec` arg |

### Frontend
| File | Change |
|------|--------|
| `frontend/src/services/messages.ts` | Add `SET_TIME_LIMIT`, `TIME_LIMIT_SET`, `END_QUESTION` constants and payload types |
| `frontend/src/hooks/useGameState.ts` | Add `timeLimitSec` to `GameState`; handle `TIME_LIMIT_SET` message |
| `frontend/src/components/Lobby.tsx` | Add time limit `<input type="number">` with validation and error messages; call `onTimeLimitChange` |
| `frontend/src/pages/HostPage.tsx` | Wire `onTimeLimitChange` → `send(SET_TIME_LIMIT)` |
| `frontend/src/components/HostDashboard.tsx` | Add "End Question" button; call `onEndQuestion` prop |

## Test Coverage Expected

### Backend (cargo test)
- `handle_set_time_limit`: accepts 10, 20, 60; rejects 9, 61; ignores non-Lobby sessions
- `do_end_question` idempotency: second call with same index is no-op
- `calculate_points` called with session's `time_limit_sec`

### Frontend Unit (Vitest)
- `Lobby` component: renders time limit input with default 20; shows correct error for below-min; shows correct error for above-max; calls `onTimeLimitChange` on valid input
- `useGameState`: `TIME_LIMIT_SET` message updates `timeLimitSec`
- `HostDashboard`: renders "End Question" button; calls `onEndQuestion` on click

### E2E (Playwright)
- `time-limit.spec.ts`: host sets time limit to 15s; player sees 15s countdown; host closes question early; timer stops

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `QUESTION_TIME_SEC` | `20` | Server-side default seeded into new sessions. Hosts can override in the Lobby. |
