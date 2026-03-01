# Research: Configurable Scoring Rules

**Branch**: `009-scoring-rules` | **Date**: 2026-03-01 | **Phase**: 0

## Finding 1 — Existing Scoring Implementation

**Decision**: Replace the existing `calculate_points()` free function with a `ScoringRule` enum that carries the strategy as data.

**Current state** (`backend/src/services/scoring.rs:7-24`):
The existing implementation uses a hardcoded **3-tier system** based on thirds of the question time limit (not every 5 seconds as described in the spec's "current" rule). For a 20-second question:
- 0–6.67s → 1000 points
- 6.67–13.33s → 500 points
- 13.33–20s → 250 points
- After expiry or wrong → 0 points

The spec's "Stepped Decay (every 5 seconds)" is a **new uniform equal-parts rule** that replaces the tiered system. It will become the default, preserving the spirit (faster = more points) with a cleaner formula.

**Rationale**: All three new rules are known at compile-time. A Rust enum requires no heap allocation, no `dyn Trait`, and no runtime dispatch overhead. Each variant is independently testable. This satisfies FR-010 (new rules can be added as new variants without touching existing variant logic).

**Alternatives considered**:
- `Box<dyn Trait>`: Unnecessary indirection for a closed, compile-time-known set of rules.
- Function pointers stored on `GameSession`: Less readable, harder to serialize/deserialize for future persistence.

---

## Finding 2 — GameSession Extension Point

**Decision**: Add a `scoring_rule: ScoringRule` field to `GameSession` (`backend/src/models/session.rs:18-28`), defaulting to `ScoringRule::SteppedDecay`.

**Rationale**: The session already owns all per-game state. The rule is session-scoped (confirmed in clarifications), so it belongs here. The `handle_answer()` function in `game_engine.rs:160` calls `calculate_points()` — it will be changed to call `session.scoring_rule.calculate_points(...)`.

**Alternatives considered**:
- Global config field: Would not allow per-session choice.
- Passing rule as parameter: Stateless but requires threading it through every call site.

---

## Finding 3 — Question Time Limit Is Per-Question

**Decision**: The scoring formula receives `time_limit_sec` from `Question.time_limit_sec` (already available at the call site in `game_engine.rs`). No new data needs to be threaded through.

**Key finding**: Questions have individual `time_limit_sec` fields (`backend/src/models/quiz.rs:16`), defaulting to the global `AppConfig.question_time_sec` (default 20s). The equal-parts formula automatically adapts to each question's time limit at runtime.

**Rationale**: No changes needed to the time limit infrastructure. The formula `step_size = floor(max_score / (time_limit_sec / interval))` already uses `time_limit_sec` as a parameter.

---

## Finding 4 — WebSocket Protocol Extension

**Decision**: Add one new client→server message (`set_scoring_rule`) sent by the host while in Lobby phase. Extend the existing `question` server→client message with a `scoring_rule` field.

**Rationale**:
- The rule must be set before the game starts and locked after (FR-009). The Lobby phase is the correct window.
- Players need the rule name during questions (FR-008). Piggybacking on the existing `question` message avoids a new broadcast type.
- No need for a persistent REST endpoint since the rule is session-only (clarified as non-persistent).

**Alternatives considered**:
- Separate `scoring_rule_broadcast` message: Extra round-trip and added frontend state complexity.
- Sending rule in the "start quiz" trigger: Would require a richer start message; the current start flow is already clean.

---

## Finding 5 — Max Score Constant

**Decision**: Keep `MAX_SCORE = 1000` as a module-level constant in `scoring_rule.rs`. The equal-parts formula divides this across steps.

**Rationale**: The existing implementation already uses 1000 as its ceiling. The spec confirms max score is "fixed and determined by existing game configuration." No new config field is introduced.

**Formula reference** (for implementation):
```
// Stepped Decay (5s interval)
num_steps = time_limit_sec / 5          // integer division
step_size = floor(MAX_SCORE / num_steps)
steps_elapsed = time_taken_ms / 5000    // integer division
raw = MAX_SCORE - (steps_elapsed * step_size)
awarded = max(1, raw)                   // floor at 1 for correct answers

// Linear Decay (1s interval)
step_size = floor(MAX_SCORE / time_limit_sec)
seconds_elapsed = time_taken_ms / 1000
raw = MAX_SCORE - (seconds_elapsed * step_size)
awarded = max(1, raw)

// Fixed Score
awarded = MAX_SCORE
```

---

## Finding 6 — Frontend Integration Points

**Decision**:
1. Add scoring rule selector to `Lobby.tsx` (host-only, before the Start button).
2. Display active rule name in `Question.tsx` (received via extended `question` message).
3. Extend `messages.ts` with new message types.

**Rationale**: The Lobby component already has an `isHost` prop and a conditional section for host controls (line 75). The Question component already receives a `QuestionPayload` — adding `scoring_rule` to it is a minimal, non-breaking extension.

**No changes needed** to: `Leaderboard.tsx`, `HostDashboard.tsx`, `PlayerPage.tsx` (score display logic unchanged — still shows `points_awarded` from `answer_result`).

---

## Resolved Unknowns

| Unknown | Resolution |
|---------|-----------|
| How does the equal-parts formula handle edge cases (time_limit < interval)? | Guard: if `num_steps == 0`, return `MAX_SCORE` (treat as Fixed Score behaviour). |
| Where does the host UI send the rule choice? | Via new `set_scoring_rule` WebSocket message from Lobby. |
| Does the frontend need a new state slice for the active rule? | Yes — `scoring_rule: ScoringRule` added to `useGameState` hook, populated from `question` message. |
