# WebSocket Contract: Position-Based Scoring Rule

**Date**: 2026-03-08
**Branch**: `012-position-based-scoring`

No new message types are introduced. Three existing messages gain the `"position_race"` value for the `rule`/`scoring_rule` field, and one existing message gains an optional `position` field.

---

## Modified Messages

### 1. `set_scoring_rule` (Client → Server)

Host sends this to select a scoring rule while in Lobby state.

**Direction**: Host WebSocket → Backend
**Trigger**: Host clicks "Position Race" radio button in Lobby

```json
{
  "type": "set_scoring_rule",
  "payload": {
    "rule": "position_race"
  }
}
```

**Valid `rule` values** (all, for reference):
`"stepped_decay"` | `"linear_decay"` | `"fixed_score"` | `"streak_bonus"` | `"position_race"` ← new

**Backend behaviour**: Accepted only when session is in `Lobby` status. Silently ignored otherwise.

---

### 2. `scoring_rule_set` (Server → All Clients)

Backend broadcasts after successfully processing `set_scoring_rule`.

**Direction**: Backend → All connected clients (host + players)

```json
{
  "type": "scoring_rule_set",
  "payload": {
    "rule": "position_race"
  }
}
```

---

### 3. `question` (Server → All Clients)

Sent at the start of each question. The `scoring_rule` field now accepts `"position_race"`.

**Direction**: Backend → All connected clients

```json
{
  "type": "question",
  "payload": {
    "question_index": 0,
    "total_questions": 5,
    "text": "What is the capital of France?",
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "time_limit_sec": 20,
    "scoring_rule": "position_race"
  }
}
```

---

### 4. `answer_result` (Server → Player)

Sent to the answering player after processing their answer. Gains a new optional `position` field.

**Direction**: Backend → Player WebSocket

**When correct (PositionRace)**:
```json
{
  "type": "answer_result",
  "payload": {
    "correct": true,
    "points_awarded": 750,
    "correct_index": 2,
    "streak_multiplier": 1.0,
    "position": 2
  }
}
```

**When incorrect (PositionRace)**:
```json
{
  "type": "answer_result",
  "payload": {
    "correct": false,
    "points_awarded": 0,
    "correct_index": 2,
    "streak_multiplier": 1.0,
    "position": null
  }
}
```

**When any non-PositionRace rule**:
```json
{
  "type": "answer_result",
  "payload": {
    "correct": true,
    "points_awarded": 850,
    "correct_index": 2,
    "streak_multiplier": 1.0,
    "position": null
  }
}
```

**Field definitions**:

| Field | Type | Description |
|-------|------|-------------|
| `correct` | `boolean` | Whether the submitted answer was correct |
| `points_awarded` | `number` | Points added to player's score this question |
| `correct_index` | `number` | Index of the correct answer option |
| `streak_multiplier` | `number` | Always `1.0` for PositionRace (streak not tracked) |
| `position` | `number \| null` | 1-based rank among correct responders; `null` if wrong/unanswered or non-PositionRace rule |

---

## Unchanged Messages

All other WebSocket messages (`join`, `player_joined`, `game_started`, `game_finished`, `leaderboard`, `end_game`, etc.) are unaffected by this feature.
