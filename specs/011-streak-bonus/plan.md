# Implementation Plan: Streak Bonus Scoring Rule

**Branch**: `011-streak-bonus` | **Date**: 2026-03-07 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/011-streak-bonus/spec.md`

## Summary

Add a `StreakBonus` scoring rule that multiplies the base score (1000 pts) by an increasing multiplier for each consecutive correct answer (×1.0 → ×1.5 → ×2.0 …), resetting to ×1.0 on any incorrect or timed-out answer. Per-player streak state is stored as `correct_streak: u32` on the `Player` struct; a separate `apply_streak_multiplier` method is added to `ScoringRule` to avoid changing the existing `calculate_points` signature. The multiplier is always included in the `answer_result` WS payload (1.0 for non-streak rules). The frontend extends `ScoringRuleName`, `AnswerResultPayload`, and displays the multiplier in `Question.tsx` when the active rule is `streak_bonus`.

## Technical Context

**Language/Version**: Rust (stable, edition 2024) — backend; TypeScript 5.x — frontend
**Primary Dependencies**: Axum + Tokio (backend), React 19 + Vitest (frontend), Playwright (e2e)
**Storage**: In-memory only (no database); streak counter lives on `Player` struct in `HashMap`
**Testing**: cargo test (backend unit/integration), Vitest + @testing-library/react (frontend unit), Playwright (e2e)
**Target Platform**: Linux server (backend), browser SPA (frontend)
**Project Type**: Web application (backend/ + frontend/ + e2e/)
**Performance Goals**: No new hot paths; streak counter update is O(1) per answer
**Constraints**: Streak multiplier is uncapped; `f64` arithmetic used for multiplier calculation (no overflow concern at realistic game scale)
**Scale/Scope**: Single-room quiz sessions; per-player state updated on each answer event

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Code Quality | PASS | `apply_streak_multiplier` isolated from `calculate_points`; no signature change to existing interface |
| II. Testing Standards | PASS | TDD: backend unit tests for streak logic; frontend unit tests for updated payload type; e2e for full flow |
| III. UX Consistency | PASS | Multiplier displayed conditionally (streak_bonus only); matches existing conditional styling in Question.tsx |
| IV. Performance | PASS | Streak counter update is O(1); no new allocations on answer path |

**Post-design re-check**: No violations introduced by Phase 1 design artifacts.

## Project Structure

### Documentation (this feature)

```text
specs/011-streak-bonus/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: 6 design decisions
├── data-model.md        # Phase 1: Player.correct_streak, ScoringRule.StreakBonus, answer_result change
├── quickstart.md        # Phase 1: Integration test scenarios
├── contracts/
│   └── ws-messages.md   # Phase 1: WS protocol changes
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── player.rs          # Add correct_streak: u32 field + Player::new init
│   ├── models/
│   │   └── scoring_rule.rs    # Add StreakBonus variant + apply_streak_multiplier method
│   └── services/
│       ├── game_engine.rs     # Call apply_streak_multiplier after calculate_points; reset streak on timeout
│       └── ws.rs              # Include streak_multiplier in answer_result payload
└── tests/
    └── scoring_rule_tests.rs  # Unit tests for StreakBonus calculate_points + apply_streak_multiplier

frontend/
├── src/
│   ├── messages.ts            # Extend ScoringRuleName; add streak_multiplier to AnswerResultPayload
│   └── components/
│       └── Question.tsx       # Display streak_multiplier when scoringRule === "streak_bonus"
└── tests/
    └── unit/
        └── components/
            └── Question.test.tsx   # Tests for multiplier display (shown/hidden by rule)

e2e/
└── tests/
    └── streak-bonus.spec.ts   # End-to-end: streak compounding, reset on incorrect, reset on timeout
```

**Structure Decision**: Web application layout (backend/ + frontend/ + e2e/) — unchanged from prior features.

## Complexity Tracking

> No constitution violations requiring justification.
