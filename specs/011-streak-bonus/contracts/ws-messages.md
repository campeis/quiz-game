# WebSocket Message Contracts: Streak Bonus

This feature extends two existing WS messages and adds one new `ScoringRuleName` value. No new message types are introduced.

---

## Modified: `set_scoring_rule` (Client → Server, Host only)

No protocol change. The existing message already carries the rule name as a string.

```json
{
  "type": "set_scoring_rule",
  "payload": {
    "rule": "streak_bonus"
  }
}
```

**Validation**: Backend rejects values outside the known enum variants with an `error` message. `"streak_bonus"` must be accepted as a valid variant.

---

## Modified: `scoring_rule_set` (Server → Client, BroadcastAll)

No protocol change. Carries the confirmed rule name after the host selects it.

```json
{
  "type": "scoring_rule_set",
  "payload": {
    "rule": "streak_bonus"
  }
}
```

---

## Modified: `question` (Server → Client, BroadcastAll)

No protocol change. `scoring_rule` field already present; now also carries `"streak_bonus"`.

```json
{
  "type": "question",
  "payload": {
    "question_index": 0,
    "total_questions": 5,
    "text": "What is the capital of France?",
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "time_limit_sec": 20,
    "scoring_rule": "streak_bonus"
  }
}
```

---

## Modified: `answer_result` (Server → Client, PlayerOnly)

**New field**: `streak_multiplier` (number, always present).

```json
{
  "type": "answer_result",
  "payload": {
    "correct": true,
    "points_awarded": 1500,
    "correct_index": 2,
    "streak_multiplier": 1.5
  }
}
```

| Field | Type | Description |
|---|---|---|
| `correct` | boolean | Whether the selected answer was correct |
| `points_awarded` | number | Points added to the player's score this question |
| `correct_index` | number | Index of the correct option (0-based) |
| `streak_multiplier` | number | Multiplier applied this question. Always `1.0` for non-StreakBonus rules. For StreakBonus: `1.0 + (pre_answer_streak × 0.5)` |

**Examples by scenario:**

| Rule | Streak before answer | Correct | points_awarded | streak_multiplier |
|---|---|---|---|---|
| StreakBonus | 0 | true | 1000 | 1.0 |
| StreakBonus | 1 | true | 1500 | 1.5 |
| StreakBonus | 2 | true | 2000 | 2.0 |
| StreakBonus | 3 | false | 0 | 1.0 (reset) |
| FixedScore | n/a | true | 1000 | 1.0 |
| LinearDecay | n/a | true | 850 | 1.0 |

---

## Unchanged Messages

The following messages require no changes and are listed for completeness:

| Message | Direction | Note |
|---|---|---|
| `start_game` | C→S | No change |
| `end_question` | C→S | No change |
| `submit_answer` | C→S | No change |
| `question_ended` | S→C | No change — leaderboard reflects post-streak scores already |
| `game_finished` | S→C | No change |
| `player_joined` / `player_left` | S→C | No change |

---

## Frontend Type Changes

### `ScoringRuleName` union (messages.ts)

```typescript
// Before
export type ScoringRuleName = "stepped_decay" | "linear_decay" | "fixed_score";

// After
export type ScoringRuleName = "stepped_decay" | "linear_decay" | "fixed_score" | "streak_bonus";
```

### `AnswerResultPayload` interface (messages.ts)

```typescript
// Before
export interface AnswerResultPayload {
  correct: boolean;
  points_awarded: number;
  correct_index: number;
}

// After
export interface AnswerResultPayload {
  correct: boolean;
  points_awarded: number;
  correct_index: number;
  streak_multiplier: number;  // Always present; 1.0 for non-StreakBonus rules
}
```
