# Research: Position-Based Scoring Rule

**Date**: 2026-03-08
**Branch**: `012-position-based-scoring`

## Summary

No external research was required. All design decisions were resolved through direct codebase analysis of the existing `ScoringRule` enum and related infrastructure. Every unknown from Technical Context resolved to "follow existing pattern".

---

## Decision 1: Position counter storage location

**Decision**: Add `correct_answer_count: u32` field to `GameSession` in `session.rs`.

**Rationale**: `GameSession` already holds all per-game state (`scoring_rule`, `time_limit_sec`, `players`). The position counter is per-question session state, consistent with how `time_limit_sec` and `scoring_rule` are stored there. No new struct or service layer needed.

**Alternatives considered**:
- Per-question struct: Would require a new type and more refactoring. Rejected — over-engineered for a single counter.
- Separate `HashMap<question_index, u32>`: Would allow auditing past questions, but position is only needed in the current question window and the existing code already resets `time_limit_sec` per question. Rejected — unnecessary complexity.

---

## Decision 2: `calculate_points` signature changes

**Decision**: Do **not** add `position` to the existing `calculate_points(correct, time_taken_ms, time_limit_sec)` signature. Instead, handle PositionRace inline in `handle_answer()` using the session's `correct_answer_count`.

**Rationale**: The existing signature is time-based; `PositionRace` ignores time entirely. Polluting all callers with a position parameter they don't use violates single responsibility. The inline approach is already precedented by the `apply_streak_multiplier` step that follows `calculate_points` — a second conditional step for PositionRace is symmetrical and readable.

**Alternatives considered**:
- Add `position: Option<u32>` to `calculate_points`: All other variants ignore it; makes the interface less clear. Rejected.
- Add a `calculate_position_points(position: u32) -> u32` method on `ScoringRule`: Valid, but adds a method that only does anything for one variant, requiring a runtime check to decide which method to call. The inline approach in `handle_answer()` is equivalent and avoids dead code paths on non-PositionRace variants.

**Implementation pattern** (pseudocode):
```rust
// In handle_answer(), after verifying correctness:
let (base_points, position) = if correct {
    match &s.scoring_rule {
        ScoringRule::PositionRace => {
            s.correct_answer_count += 1;
            let pos = s.correct_answer_count;
            let pts = match pos {
                1 => 1000,
                2 => 750,
                3 => 500,
                _ => 250,
            };
            (pts, Some(pos))
        }
        _ => {
            let pts = s.scoring_rule.calculate_points(correct, time_taken_ms, s.time_limit_sec);
            (pts, None)
        }
    }
} else {
    (0, None)
};
```

---

## Decision 3: Counter reset timing

**Decision**: Reset `correct_answer_count` to 0 in `send_next_question()`, immediately before broadcasting a new question.

**Rationale**: `send_next_question()` is the single entry point for transitioning to a new question in the game engine. The `correct_streak` reset for StreakBonus (on timeout) is handled in `do_end_question()` — we reset `correct_answer_count` in `send_next_question()` because it only needs to reset at question start, not on individual player timeout.

**Alternatives considered**:
- Reset in `do_advance_question()`: Same call path, but slightly earlier (before the "is game over?" check). Functionally equivalent. Chose `send_next_question()` as it is the point immediately before the question data is sent, making the intent clear.

---

## Decision 4: `answer_result` WebSocket message extension

**Decision**: Add `position: Option<u32>` (serialised as `"position": 1 | null`) to the existing `answer_result` payload. The backend sends `Some(rank)` when PositionRace + correct, `None` otherwise. Frontend reads this optional field.

**Rationale**: Reusing the existing message avoids a new message type. The optional field is backward-compatible — existing non-PositionRace sessions send `null`, which the frontend can safely ignore for those rules.

**Alternatives considered**:
- New `position_result` message type: Unnecessary overhead; the existing `answer_result` already carries all answer feedback. Rejected.
- Always include position (0 = not applicable): Semantically confusing — position 0 has no meaning. `null` is cleaner.

---

## Decision 5: Frontend position rank display

**Decision**: In `Question.tsx`, when `scoringRule === "position_race"` and `answerResult?.correct === true` and `answerResult?.position` is defined, render an ordinal rank badge (e.g., "1st place") above the `+1000 points` line. Wrong/unanswered answers show no rank.

**Rationale**: Follows the existing StreakBonus multiplier badge pattern — a conditional block rendered only for the relevant rule and only when the outcome is positive. Symmetric treatment minimises cognitive load for future maintainers.

**Ordinal helper**: A small `toOrdinal(n: number): string` utility (`1 → "1st"`, `2 → "2nd"`, `3 → "3rd"`, `n → "nth"`) will be defined inline in `Question.tsx` (too small to warrant a shared utility file).
