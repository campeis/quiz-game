# Data Model: Streak Bonus Scoring Rule

## Changed Entities

### Player *(modified)*

Adds streak tracking to the existing `Player` struct.

| Field | Type | Default | Description |
|---|---|---|---|
| `id` | String | — | Unique player identifier (UUID) |
| `display_name` | String | — | Player's display name |
| `avatar` | String | "🙂" | Emoji avatar |
| `score` | u32 | 0 | Cumulative points earned |
| `correct_count` | u32 | 0 | Number of correct answers |
| `answers` | Vec\<Answer\> | [] | Per-question answer records |
| `connection_status` | ConnectionStatus | Connected | Current connection state |
| `disconnected_at` | Option\<Instant\> | None | Timestamp of last disconnection |
| **`correct_streak`** | **u32** | **0** | **NEW: consecutive correct answers; resets to 0 on any incorrect or missed answer** |

**State transitions for `correct_streak`**:
- Initialized to `0` when player record is created (join or mid-game re-join)
- Incremented by `1` after a correct answer is scored
- Reset to `0` after an incorrect answer
- Reset to `0` when the question timer expires and the player has not answered

### ScoringRule *(modified)*

Adds the `StreakBonus` variant to the existing enum.

| Variant | Serialized | Points formula | Streak effect |
|---|---|---|---|
| `SteppedDecay` | `"stepped_decay"` | Decays by step every 5 s | None (multiplier = 1.0) |
| `LinearDecay` | `"linear_decay"` | Decays by 1 step per second | None (multiplier = 1.0) |
| `FixedScore` | `"fixed_score"` | Always MAX_SCORE | None (multiplier = 1.0) |
| **`StreakBonus`** | **`"streak_bonus"`** | **MAX_SCORE × (1.0 + streak × 0.5)** | **Multiplier increases +0.5 per consecutive correct answer** |

New method added:

```
apply_streak_multiplier(base: u32, streak: u32) -> u32
  For StreakBonus: (base * (1.0 + streak * 0.5)) as u32
  For all others:  base (unchanged)
```

## Unchanged Entities

### GameSession

No changes. `scoring_rule: ScoringRule` already stores the active rule; it will now also hold `StreakBonus` transparently.

### Answer

No changes. Per-answer records do not store streak state (streak is a running counter on `Player`).

### LeaderboardEntry

No changes. Leaderboard is computed from `Player.score` — streak does not appear in standings.

## WS Payload Changes

### answer_result *(modified)*

Adds `streak_multiplier` to the existing payload sent to each player after answering.

**Before:**
```json
{
  "type": "answer_result",
  "payload": {
    "correct": true,
    "points_awarded": 1000,
    "correct_index": 2
  }
}
```

**After:**
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

`streak_multiplier` is always present. Value is `1.0` for all non-StreakBonus rules. For StreakBonus, value is `1.0 + (pre_answer_streak × 0.5)`.
