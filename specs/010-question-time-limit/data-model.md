# Data Model: Question Time Limit

**Branch**: `010-question-time-limit`

## Changed Entities

### `GameSession` (backend/src/models/session.rs)

**Change**: Add `time_limit_sec: u64` field.

```
GameSession {
  join_code:        String
  quiz:             Quiz
  players:          HashMap<String, Player>
  host_id:          Option<String>
  current_question: i32
  status:           SessionStatus
  question_started: Option<Instant>
  created_at:       Instant
  scoring_rule:     ScoringRule          ← existing
  time_limit_sec:   u64                  ← NEW (default: AppConfig.question_time_sec, min: 10, max: 60)
}
```

**Validation rules**:
- `time_limit_sec` MUST be in the range `[10, 60]` inclusive
- Can only be changed while `status == Lobby`
- Default is seeded from `AppConfig.question_time_sec` (env default: 20)

**State transitions**:
- Created in `Lobby` phase with default value from config
- Updated via `set_time_limit` WS message (Lobby only)
- Frozen at `start_game` — no changes permitted once Active/Finished

---

### `AppConfig` (backend/src/config.rs)

**Change**: `question_time_sec` field role narrows — it is now only the default seed for new sessions, not the runtime value.

No struct changes needed; its role in `ws.rs` and `game_engine.rs` changes.

---

## Unchanged Entities

### `Question` (backend/src/models/quiz.rs)

`Question.time_limit_sec` is retained as a per-question attribute (populated from `default_time_limit` in `parse_quiz`). It is **not used at runtime** in this feature — `session.time_limit_sec` is authoritative. Kept for future per-question override capability.

### `ScoringRule` (backend/src/models/scoring_rule.rs)

`calculate_points(correct, time_taken_ms, time_limit_sec)` — the third argument changes from `question.time_limit_sec` to `session.time_limit_sec` at the call site. No struct change.

---

## Frontend State

### `GameState` (frontend/src/hooks/useGameState.ts)

**Change**: Add `timeLimitSec: number` field to store the host-configured time limit in Lobby (for display and validation feedback in `Lobby` component).

```
GameState {
  ...existing fields...
  timeLimitSec: number   ← NEW (default: 20, updated by TIME_LIMIT_SET message)
}
```

**Note**: The `currentQuestion.time_limit_sec` field in `QuestionPayload` continues to drive the `Timer` component during gameplay — no change needed there. `timeLimitSec` in `GameState` is only for the Lobby setup UI.

---

## WebSocket Message Protocol Changes

### New messages

#### `set_time_limit` (Client → Server, host only)

```json
{
  "type": "set_time_limit",
  "payload": { "seconds": 30 }
}
```

Constraints: `seconds` must be integer in `[10, 60]`. Only accepted in `Lobby` status. Invalid value returns error to host.

#### `time_limit_set` (Server → Client, broadcast all)

```json
{
  "type": "time_limit_set",
  "payload": { "seconds": 30 }
}
```

Broadcast to host and all players whenever the time limit is successfully changed.

#### `end_question` (Client → Server, host only)

```json
{
  "type": "end_question",
  "payload": {}
}
```

Host closes the current question early. Server calls `do_end_question` for the current question index. Idempotent — ignored if question already closed.

### Modified messages

#### `question` (Server → Client, broadcast — existing message)

**Change**: `time_limit_sec` in payload now sourced from `session.time_limit_sec` instead of `question.time_limit_sec`.

```json
{
  "type": "question",
  "payload": {
    "question_index": 0,
    "total_questions": 5,
    "text": "...",
    "options": ["...", "..."],
    "time_limit_sec": 30,      ← now from session, not quiz YAML
    "scoring_rule": "stepped_decay"
  }
}
```
