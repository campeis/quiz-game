# Quickstart: Position-Based Scoring Rule

**Date**: 2026-03-08
**Branch**: `012-position-based-scoring`

## What's changing

| Layer | File | Change |
|-------|------|--------|
| Backend model | `backend/src/models/scoring_rule.rs` | Add `PositionRace` variant; `display_name()` → `"Position Race"` |
| Backend model | `backend/src/models/session.rs` | Add `correct_answer_count: u32` field to `GameSession` |
| Backend service | `backend/src/services/game_engine.rs` | Reset counter in `send_next_question()`; position calc + counter increment in `handle_answer()` |
| WS messages | `backend/src/models/messages.rs` (or equivalent) | Add `position: Option<u32>` to `AnswerResult` struct |
| Frontend types | `frontend/src/services/messages.ts` | Add `"position_race"` to `ScoringRuleName`; add `position?: number` to `AnswerResultPayload` |
| Frontend UI | `frontend/src/components/Lobby.tsx` | Add Position Race entry to `SCORING_RULES` array |
| Frontend UI | `frontend/src/components/Question.tsx` | Add `"Position Race"` label; add position rank badge for correct PositionRace answers |
| E2E tests | `e2e/tests/scoring-rules.spec.ts` | Add Position Race label test in new describe block |
| E2E tests | `e2e/tests/position-race.spec.ts` | New file: formula tests (1st/2nd/3rd/4th+, wrong answer) |

## Implementation order (TDD)

1. **Backend unit tests** — Write failing tests for `correct_answer_count` reset and position point values in `scoring_rule.rs` / `game_engine.rs`
2. **Backend model** — Add `PositionRace` to enum; add `correct_answer_count` to `GameSession`
3. **Backend service** — Implement counter reset + inline point calculation in `handle_answer()`; add `position` to `AnswerResult` serialisation
4. **Frontend unit tests** — Write failing tests for label display and position badge rendering in `Question.tsx`
5. **Frontend** — Add `"position_race"` to types; add Lobby option; add label + badge in `Question.tsx`
6. **E2E tests** — Write failing e2e tests; run full suite to confirm all pass

## Running the feature locally

```bash
# Backend
cargo test                        # unit + integration tests
cargo clippy -- -D warnings       # linting

# Frontend
pnpm test                         # unit tests
pnpm exec biome check src/        # linting

# E2E (requires backend running)
just test                         # full suite
```

## Key invariants

- `correct_answer_count` is **always 0** at the moment `send_next_question()` broadcasts a question
- Only correct answers increment `correct_answer_count`; wrong answers leave it unchanged
- `position` in `answer_result` is `None`/`null` for all non-PositionRace rules and for incorrect/unanswered PositionRace answers
- `streak_multiplier` is always `1.0` for PositionRace (no streak tracking)

## Point formula reference

```
position → points
1        → 1000
2        → 750
3        → 500
≥4       → 250
wrong    → 0
```
