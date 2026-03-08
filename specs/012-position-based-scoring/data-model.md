# Data Model: Position-Based Scoring Rule

**Date**: 2026-03-08
**Branch**: `012-position-based-scoring`

## Changes to Existing Entities

### `ScoringRule` (backend/src/models/scoring_rule.rs)

Add new variant `PositionRace` to the existing enum:

```
ScoringRule
├── SteppedDecay   (existing)
├── LinearDecay    (existing)
├── FixedScore     (existing)
├── StreakBonus    (existing)
└── PositionRace   ← NEW
```

**Serialisation**: `"position_race"` (snake_case, consistent with existing variants)
**display_name()**: `"Position Race"`
**calculate_points()**: Not used for PositionRace — points computed inline in `handle_answer()` based on position counter. Method returns 0 for PositionRace to avoid misuse; position-based calculation is handled separately.

---

### `GameSession` (backend/src/models/session.rs)

Add one field:

| Field | Type | Default | Lifecycle |
|-------|------|---------|-----------|
| `correct_answer_count` | `u32` | `0` | Reset to `0` at the start of each question in `send_next_question()`. Incremented by `1` in `handle_answer()` for each correct answer when rule is `PositionRace`. |

No other GameSession fields change. The field is ignored by all non-PositionRace rules.

---

### `AnswerResultPayload` (WebSocket message — backend + frontend)

Add one optional field:

| Field | Type | When present |
|-------|------|-------------|
| `position` | `u32 \| null` | `Some(rank)` when `PositionRace` + answer is correct; `None` otherwise |

**Backend** (`answer_result` message): `position: Option<u32>` serialised by Serde as `null` when `None`.
**Frontend** (`AnswerResultPayload` interface in `messages.ts`): `position?: number` (optional field).

---

## Unchanged Entities

| Entity | File | Notes |
|--------|------|-------|
| `Player` | `backend/src/models/player.rs` | No changes — PositionRace has no per-player persistent state |
| `LeaderboardEntry` | existing | No changes — cumulative score already handled generically |
| `GameState` (frontend) | `useGameState.ts` | No changes — `scoringRule` field already stores rule name as string |
| All other WS messages | — | Unchanged |

## State Transition: correct_answer_count

```
Question starts (send_next_question)
  → correct_answer_count = 0

Player answers correctly (PositionRace only)
  → correct_answer_count += 1
  → position = correct_answer_count   (1, 2, 3, …)
  → points = position_points(position) (1000, 750, 500, 250)

Player answers incorrectly
  → correct_answer_count unchanged
  → points = 0, position = None

Question ends / next question starts
  → correct_answer_count = 0  (reset)
```

## Point Schedule

| Position | Points | Fraction of max |
|----------|--------|----------------|
| 1st      | 1000   | 4/4             |
| 2nd      | 750    | 3/4             |
| 3rd      | 500    | 2/4             |
| 4th+     | 250    | 1/4             |
| Wrong / no answer | 0 | — |
