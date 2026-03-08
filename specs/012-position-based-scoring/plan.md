# Implementation Plan: Position-Based Scoring Rule

**Branch**: `012-position-based-scoring` | **Date**: 2026-03-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/012-position-based-scoring/spec.md`

## Summary

Add a **Position Race** scoring rule that awards points based on the order in which players submit a correct answer for each question: 1st → 1000, 2nd → 750, 3rd → 500, 4th+ → 250, wrong/unanswered → 0. Position rank and points are assigned immediately on server receipt of a correct answer. The backend tracks a per-question correct-answer counter on `GameSession`; the frontend displays a "Position Race" label on the question screen and shows the player's rank alongside points earned.

## Technical Context

**Language/Version**: Rust stable (edition 2024) — backend; TypeScript 5.x — frontend
**Primary Dependencies**: Axum + Tokio + Serde (backend); React 19 + Rspack (frontend)
**Storage**: In-memory only — `GameSession` in `DashMap` via `SessionManager`; no persistence
**Testing**: `cargo test` (backend unit/integration), Vitest + @testing-library/react (frontend unit), Playwright (e2e)
**Target Platform**: Linux server (Axum HTTP + WebSocket) + browser SPA
**Project Type**: Web application (backend + frontend)
**Performance Goals**: Position counter increment and point lookup are O(1); no measurable latency impact
**Constraints**: All state in-memory; no database; in-flight games tolerate server restart loss (by design)
**Scale/Scope**: Same as existing game engine — small multiplayer sessions (tens of players)

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| Code Quality | ✅ PASS | New variant follows existing `ScoringRule` enum pattern; single-responsibility additions |
| Testing Standards | ✅ PASS | TDD: unit tests for `position_points()` written before implementation; e2e tests cover full flow |
| UX Consistency | ✅ PASS | Follows identical pattern as existing rules (radio button in Lobby, label on Question screen) |
| Performance | ✅ PASS | O(1) counter increment + match expression; no regression risk |
| Complexity Justification | ✅ PASS | No new abstractions; extends existing enum and reuses all existing infrastructure |

No violations. No complexity justification required.

## Project Structure

### Documentation (this feature)

```text
specs/012-position-based-scoring/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── websocket.md
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   ├── scoring_rule.rs    ← add PositionRace variant, position_points(), display_name()
│   │   └── session.rs         ← add correct_answer_count: u32 field to GameSession
│   └── services/
│       └── game_engine.rs     ← handle_answer(): position counter + point calc; send_next_question(): reset counter
└── (tests inline in each module)

frontend/
├── src/
│   ├── services/
│   │   └── messages.ts        ← add "position_race" to ScoringRuleName; add position?: number to AnswerResultPayload
│   ├── components/
│   │   ├── Lobby.tsx           ← add Position Race entry to SCORING_RULES array
│   │   └── Question.tsx        ← add label; add position rank badge for Position Race correct answers
│   └── hooks/
│       └── useGameState.ts    ← no changes required
└── (unit tests co-located or in src/__tests__/)

e2e/
└── tests/
    ├── scoring-rules.spec.ts  ← add Position Race label test (extend existing describe block)
    └── position-race.spec.ts  ← new: point formula tests (1st/2nd/3rd/4th+, wrong answer)
```

**Structure Decision**: Existing web-app layout (Option 2). All changes are additive extensions to existing files with one new e2e spec file.
