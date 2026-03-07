# WebSocket Message Contracts: Question Time Limit

**Branch**: `010-question-time-limit`

All messages follow the existing envelope: `{ "type": string, "payload": object }`.

---

## New Messages

### `set_time_limit`

**Direction**: Client (host) → Server
**When**: Lobby phase only
**Auth**: Host connection only (player connections ignore this message)

**Payload**:
```json
{
  "seconds": 30
}
```

**Field constraints**:
| Field   | Type   | Min | Max | Required |
|---------|--------|-----|-----|----------|
| seconds | u64    | 10  | 60  | yes      |

**Server behavior**:
- If `session.status != Lobby`: silently ignore
- If `seconds < 10` or `seconds > 60`: send `error` to host with `code: "invalid_time_limit"`
- Otherwise: update `session.time_limit_sec = seconds`, broadcast `time_limit_set`

**Error response** (to host only):
```json
{
  "type": "error",
  "payload": {
    "code": "invalid_time_limit",
    "message": "Time limit must be between 10 and 60 seconds"
  }
}
```

---

### `time_limit_set`

**Direction**: Server → Client (broadcast all)
**Trigger**: Successful `set_time_limit` processing

**Payload**:
```json
{
  "seconds": 30
}
```

---

### `end_question`

**Direction**: Client (host) → Server
**When**: Active phase, during a question
**Auth**: Host connection only

**Payload**:
```json
{}
```

**Server behavior**:
- Read `current_question_index` from session
- Call `do_end_question(session, tx, current_question_index)` — idempotent via existing guard
- If no question active: silently ignore

---

## Modified Messages

### `question` (existing — payload source change)

**Direction**: Server → Client (broadcast all)

**Changed field**: `time_limit_sec` now sourced from `session.time_limit_sec` (previously `question.time_limit_sec`).

**Payload** (unchanged shape):
```json
{
  "question_index": 0,
  "total_questions": 5,
  "text": "What is the capital of France?",
  "options": ["Berlin", "Paris", "Rome", "Madrid"],
  "time_limit_sec": 30,
  "scoring_rule": "stepped_decay"
}
```

**Impact**: `time_limit_sec` now reflects the host-configured session value, not the YAML default. Frontend `Timer` component reads this field — no frontend changes needed for timer display.
