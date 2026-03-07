# Quickstart: Streak Bonus Scoring Rule

Integration scenarios for testing end-to-end behaviour of the Streak Bonus rule.

---

## Prerequisites

- Backend running on `ws://localhost:3000`
- A valid quiz fixture with at least 3 questions

---

## Scenario 1: Host selects Streak Bonus in lobby

**Goal**: Confirm the new rule variant is accepted by the server and broadcast to all clients.

```
1. Host connects and uploads a quiz → receives `game_created`
2. Host sends:
   { "type": "set_scoring_rule", "payload": { "rule": "streak_bonus" } }
3. Server broadcasts:
   { "type": "scoring_rule_set", "payload": { "rule": "streak_bonus" } }
4. Player connects → lobby state shows scoring_rule = "streak_bonus"
```

**Assert**: `scoring_rule_set.payload.rule === "streak_bonus"` received by both host and player.

---

## Scenario 2: Streak multiplier increases on consecutive correct answers

**Goal**: Verify points compounding: ×1.0 → ×1.5 → ×2.0.

```
Setup: Streak Bonus selected, quiz has 3 questions, player answers all correctly.

Q1: player submits correct answer
    → answer_result.streak_multiplier === 1.0
    → answer_result.points_awarded === 1000

Q2: player submits correct answer
    → answer_result.streak_multiplier === 1.5
    → answer_result.points_awarded === 1500

Q3: player submits correct answer
    → answer_result.streak_multiplier === 2.0
    → answer_result.points_awarded === 2000

Total score after 3 correct: 4500
(vs Fixed Score total: 3000)
```

---

## Scenario 3: Incorrect answer resets the multiplier

**Goal**: Confirm streak resets to ×1.0 after a wrong answer.

```
Setup: Streak Bonus selected, player has answered Q1 and Q2 correctly (streak=2).

Q3: player submits incorrect answer
    → answer_result.correct === false
    → answer_result.points_awarded === 0
    → answer_result.streak_multiplier === 1.0  (reset, not 2.0)

Q4: player submits correct answer
    → answer_result.streak_multiplier === 1.0  (streak restarts from 0)
    → answer_result.points_awarded === 1000
```

---

## Scenario 4: Timeout resets the multiplier

**Goal**: Confirm a missed (timed-out) question is treated as an incorrect answer for streak purposes.

```
Setup: Streak Bonus selected, player has answered Q1 and Q2 correctly (streak=2).

Q3: player does NOT submit → host ends question (or timer expires)
    Server processes missed answer: streak reset to 0.

Q4: player submits correct answer
    → answer_result.streak_multiplier === 1.0
    → answer_result.points_awarded === 1000
```

---

## Scenario 5: Non-StreakBonus rule always returns multiplier 1.0

**Goal**: Confirm `streak_multiplier` is always present and always `1.0` for other rules.

```
Setup: Fixed Score selected, player answers Q1 and Q2 correctly.

Q2 result:
    → answer_result.streak_multiplier === 1.0
    (field present but streak mechanics inactive)
```

---

## Scenario 6: Mid-game join starts at streak 0

**Goal**: Confirm a player who joins after game start begins with multiplier ×1.0.

```
Setup: Streak Bonus selected, game already on Q3, a new player joins mid-game.

Player answers Q3 correctly:
    → answer_result.streak_multiplier === 1.0  (not carrying over from others)
    → answer_result.points_awarded === 1000
```

---

## Key Assertions Summary

| Scenario | Field | Expected |
|---|---|---|
| Correct answer, streak=0 | `streak_multiplier` | 1.0 |
| Correct answer, streak=1 | `streak_multiplier` | 1.5 |
| Correct answer, streak=2 | `streak_multiplier` | 2.0 |
| Incorrect answer | `streak_multiplier` | 1.0 (reset) |
| Timed-out answer | `streak_multiplier` | 1.0 (reset) |
| Non-StreakBonus rule | `streak_multiplier` | 1.0 (always) |
| Mid-game join, first answer | `streak_multiplier` | 1.0 |
