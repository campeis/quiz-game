# Research: Streak Bonus Scoring Rule

## Decision 1: How to integrate streak into the scoring pipeline

**Decision**: Keep `ScoringRule::calculate_points(correct, time_taken_ms, time_limit_sec) -> u32` unchanged. Add a separate `ScoringRule::apply_streak_multiplier(base: u32, streak: u32) -> u32` method. For all non-StreakBonus rules it is a no-op returning `base` unchanged. In `game_engine::handle_answer`, call `calculate_points` first, then `apply_streak_multiplier`.

**Rationale**: Avoids changing the signature of `calculate_points` (which would touch every call site and every test). The multiplier is a post-processing step orthogonal to time-based decay. Keeps each rule's logic self-contained.

**Alternatives considered**:
- Add `streak: u32` parameter to `calculate_points` — rejected because it changes a stable interface for a concern that only matters to one rule variant.
- Store the multiplier on `GameSession` and apply it in `ws.rs` — rejected; scoring logic belongs in `game_engine` / `scoring_rule`.

---

## Decision 2: Where to store correct_streak

**Decision**: Add `correct_streak: u32` field to the `Player` struct in `backend/src/models/player.rs`. Initialize to `0` in `Player::new`. Reset to `0` on incorrect or missed answer. Increment by `1` on correct answer (after computing points, so the streak used for the current question is the pre-answer streak count).

**Rationale**: `Player` already holds all per-player game state (`score`, `correct_count`, `answers`). This is the natural home. Streak persists through reconnection automatically because the player record survives reconnection unchanged — consistent with score preservation.

**Alternatives considered**:
- Store streak in a separate `HashMap<player_id, u32>` on `GameSession` — rejected; unnecessary indirection when `Player` already exists for this purpose.

---

## Decision 3: Streak reset on question timeout

**Decision**: In `game_engine::do_end_question`, after broadcasting `question_ended`, if `session.scoring_rule == ScoringRule::StreakBonus`, iterate over all players who have NOT answered the current question (`!player.has_answered(question_index)`) and set `player.correct_streak = 0`.

**Rationale**: Players who time out receive the same treatment as an incorrect answer per FR-006. The existing `handle_answer` path already handles reset for players who answer incorrectly. Only the timeout path needs explicit handling.

**Alternatives considered**:
- Reset all streaks at question end regardless of rule — rejected; unnecessary for non-StreakBonus sessions.
- Track "missed" answers as explicit Answer records — rejected; over-engineering for this use case.

---

## Decision 4: Multiplier in answer_result payload

**Decision**: Always include `streak_multiplier: f64` in the `answer_result` WebSocket payload, regardless of active scoring rule. For non-StreakBonus rules, the value is always `1.0`. For StreakBonus, it is `1.0 + (pre_answer_streak * 0.5)`.

**Rationale**: Uniform payload shape simplifies frontend handling — no optional field branching. The field is semantically meaningful for all rules (multiplier of 1.0 = no streak effect). Avoids conditional serialization logic.

**Alternatives considered**:
- `Option<f64>` / null for non-StreakBonus — rejected; optional fields complicate both backend serialization and frontend type narrowing.

---

## Decision 5: Float arithmetic safety

**Decision**: Use `f64` for multiplier calculation: `(base as f64 * multiplier) as u32`. At the maximum realistic streak (5-question quiz, streak=5, multiplier=3.5, points=3500) there is no overflow or precision concern. `f64` has 53-bit mantissa precision, comfortably covering any realistic point total.

**Rationale**: Simple and correct. A `u32` can hold up to ~4.29 billion — unreachable even with extreme streaks on a 1000-point base.

**Alternatives considered**:
- Integer-only arithmetic (e.g., multiply by 10, divide by 10) — rejected; unnecessary complexity for this scale.

---

## Decision 6: Frontend ScoringRuleName type

**Decision**: Extend the TypeScript union `ScoringRuleName = "stepped_decay" | "linear_decay" | "fixed_score" | "streak_bonus"`. Add `streak_multiplier: number` to `AnswerResultPayload`. Display the multiplier in the answer result section of `Question.tsx` only when `scoringRule === "streak_bonus"` (avoids noise for other rules, since 1.0 is always the multiplier there).

**Rationale**: Consistent with how `scoring_rule` label is already conditionally styled in `Question.tsx`. Frontend receives the multiplier from the server; the conditional display avoids showing "×1.0" to players using non-streak rules.

**Alternatives considered**:
- Always show multiplier — rejected; clutters the UI for non-StreakBonus games.
