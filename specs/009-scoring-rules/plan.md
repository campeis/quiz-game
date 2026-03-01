# Implementation Plan: Configurable Scoring Rules

**Branch**: `009-scoring-rules` | **Date**: 2026-03-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/009-scoring-rules/spec.md`

## Summary

Hosts can select a scoring rule (Stepped Decay, Linear Decay, or Fixed Score) before starting a quiz session. The selection is applied to all questions in that session and locked once the game starts. The backend replaces its current hardcoded 3-tier scoring function with a `ScoringRule` enum whose variants encapsulate each rule's formula, making future rule additions additive. A new WebSocket message lets the host communicate the rule choice from the Lobby screen; players see the active rule name on every question screen.

## Technical Context

**Language/Version**: Rust (stable, edition 2024) — backend; TypeScript 5.x — frontend
**Primary Dependencies**: Axum (WebSocket) — backend; React 19 — frontend; Biome — linting/formatting
**Storage**: In-memory session state only (`GameSession` in `HashMap`); no persistence
**Testing**: `cargo test` (backend unit + integration); Vitest + @testing-library/react (frontend unit); Playwright (e2e)
**Target Platform**: Linux server (backend); browser SPA (frontend)
**Project Type**: Web application (backend + frontend)
**Performance Goals**: Scoring calculation is pure integer arithmetic — negligible overhead; no performance budget change needed
**Constraints**: Scoring rule locked at session start; rule not persisted beyond session; minimum correct-answer score is 1 point
**Scale/Scope**: Session-scoped in-memory change; touches ~9 files across backend and frontend

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Code Quality | ✅ Pass | `ScoringRule` enum gives each variant single responsibility. `scoring.rs` free function replaced cleanly. |
| II. Testing Standards | ✅ Pass | TDD applies. Backend struct changes compile first (known exception). Unit tests per variant + edge cases. Integration tests for WebSocket flow. E2E for UI selection. |
| III. UX Consistency | ✅ Pass | Rule selector in Lobby (host-only, consistent with existing host-gated controls). Rule label in Question (immediate, unambiguous). |
| IV. Performance | ✅ Pass | Integer arithmetic only. No heap allocation. No async in hot path. |

**Post-design re-check**: No violations introduced by Phase 1 design. Strategy enum avoids unnecessary abstraction (no `Box<dyn Trait>`). Complexity Tracking table not required.

## Project Structure

### Documentation (this feature)

```text
specs/009-scoring-rules/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── ws-messages.md   # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks — not created here)
```

### Source Code

```text
backend/
├── src/
│   ├── models/
│   │   ├── scoring_rule.rs     ← NEW: ScoringRule enum + calculate_points + display_name
│   │   ├── session.rs          ← MODIFIED: add scoring_rule: ScoringRule field
│   │   └── mod.rs              ← MODIFIED: pub mod scoring_rule
│   ├── services/
│   │   ├── scoring.rs          ← REPLACED: thin re-export or removed; logic moves to scoring_rule.rs
│   │   └── game_engine.rs      ← MODIFIED: handle_answer uses session.scoring_rule; handle set_scoring_rule msg
│   └── handlers/
│       └── ws.rs               ← MODIFIED: route set_scoring_rule message to game_engine
└── tests/
    └── scoring_rule_test.rs    ← NEW: unit tests for all variants and edge cases

frontend/
├── src/
│   ├── services/
│   │   └── messages.ts         ← MODIFIED: ScoringRuleName type; SetScoringRulePayload; extend QuestionPayload
│   ├── hooks/
│   │   └── useGameState.ts     ← MODIFIED: scoringRule state field; handle scoring_rule_set msg
│   └── components/
│       ├── Lobby.tsx            ← MODIFIED: scoring rule selector (host-only, above Start button)
│       └── Question.tsx         ← MODIFIED: active rule name label
└── src/
    └── [tests alongside components per existing pattern]

e2e/
└── scoring-rules.spec.ts       ← NEW: E2E test for full host-select → player-sees flow
```

**Structure Decision**: Web application (Option 2). Backend and frontend are separate projects in the same repo, consistent with all prior features.

## Phase 0: Research

**Status**: Complete. See [research.md](./research.md).

### Key decisions from research

| Decision | Rationale |
|---|---|
| `ScoringRule` Rust enum (not trait object) | Variants are compile-time-known; zero runtime overhead; each variant independently testable |
| `GameSession.scoring_rule: ScoringRule` | Rule is session-scoped; session already owns all per-game state |
| Host sets rule via `set_scoring_rule` WebSocket message in Lobby | Consistent with existing WebSocket-only game control; no new HTTP endpoint needed |
| Rule broadcast via extended `question` message | Players need rule on each question; piggybacking avoids an extra message type |
| `MAX_SCORE = 1000` constant preserved | Matches existing ceiling; no config change needed |
| Equal-parts formula with integer floor | Clarified in spec: step_size = floor(max / num_steps); min correct score = 1 |

## Phase 1: Design & Contracts

**Status**: Complete. See [data-model.md](./data-model.md), [contracts/ws-messages.md](./contracts/ws-messages.md), [quickstart.md](./quickstart.md).

### Backend design

#### `backend/src/models/scoring_rule.rs` (new)

```
pub const MAX_SCORE: u32 = 1000;

pub enum ScoringRule { SteppedDecay, LinearDecay, FixedScore }

impl Default for ScoringRule → SteppedDecay

impl ScoringRule {
    pub fn calculate_points(&self, correct: bool, time_taken_ms: u64, time_limit_sec: u64) -> u32
    pub fn display_name(&self) -> &'static str
}
```

Formula per variant (all integer arithmetic):

- **SteppedDecay**: `num_steps = max(1, time_limit_sec/5)`, `step_size = MAX_SCORE/num_steps`, `steps = time_taken_ms/5000`, `max(1, MAX_SCORE - steps*step_size)`
- **LinearDecay**: `step_size = max(1, MAX_SCORE/time_limit_sec)`, `secs = time_taken_ms/1000`, `max(1, MAX_SCORE - secs*step_size)`
- **FixedScore**: `MAX_SCORE`
- Any incorrect answer: `0`

#### `backend/src/models/session.rs` (modified)

Add field: `pub scoring_rule: ScoringRule` (default via `ScoringRule::default()`).

#### `backend/src/services/game_engine.rs` (modified)

- `handle_answer()`: replace `calculate_points(correct, elapsed_ms, time_limit_sec)` call with `session.scoring_rule.calculate_points(correct, elapsed_ms, time_limit_sec)`.
- New handler `handle_set_scoring_rule(session, rule)`: validates session status is `Lobby`, sets `session.scoring_rule`, broadcasts `scoring_rule_set` to all clients.

#### `backend/src/handlers/ws.rs` (modified)

Route new `"set_scoring_rule"` message type to `handle_set_scoring_rule()`.

#### `backend/src/services/scoring.rs` (replaced)

Remove the hardcoded `calculate_points()` function. If the file has no remaining content, remove it and update `mod.rs`. Otherwise replace with a doc comment pointing to `scoring_rule.rs`.

### Frontend design

#### `frontend/src/services/messages.ts` (modified)

```typescript
export type ScoringRuleName = "stepped_decay" | "linear_decay" | "fixed_score";

// Extend existing:
export interface QuestionPayload {
  // ... existing fields ...
  scoring_rule: ScoringRuleName;   // new
}

// New:
export interface SetScoringRulePayload { rule: ScoringRuleName; }
export interface ScoringRuleSetPayload { rule: ScoringRuleName; }

// New constants:
MSG.SET_SCORING_RULE = "set_scoring_rule"
MSG.SCORING_RULE_SET = "scoring_rule_set"
```

#### `frontend/src/hooks/useGameState.ts` (modified)

Add `scoringRule: ScoringRuleName | null` to state. Populate from `question` message (`payload.scoring_rule`). Also update on `scoring_rule_set` message (for lobby preview to host — optional but clean).

#### `frontend/src/components/Lobby.tsx` (modified)

Add a scoring rule selector **visible only when `isHost`**. Renders three options (radio group or styled button group). On change, sends `set_scoring_rule` WebSocket message. Disabled state after game starts (consistent with existing Start button disable pattern).

```
[ ] Stepped Decay   score drops every 5 s  (default, pre-selected)
[ ] Linear Decay    score drops every 1 s
[ ] Fixed Score     full points always
```

#### `frontend/src/components/Question.tsx` (modified)

Display `scoringRule` as a small label (e.g., "Scoring: Stepped Decay") near the question header. Sourced from `useGameState`. No interaction required — display only.

### TDD sequence (per Constitution)

1. **Backend**: Write `scoring_rule_test.rs` with failing tests for each variant (correct/incorrect, edge cases) → implement enum → tests green.
2. **Backend**: Write failing integration test for `set_scoring_rule` WebSocket message → implement handler → test green.
3. **Frontend**: Write failing unit tests for `Lobby.tsx` rule selector (renders, sends message) → implement → tests green.
4. **Frontend**: Write failing unit test for `Question.tsx` rule label → implement → test green.
5. **E2E**: Write failing Playwright test (host selects rule, player sees it, score matches) → all above implemented → test green.

### Acceptance test traceability

| Acceptance Scenario | Test location | Verified by |
|---|---|---|
| Host selects Stepped Decay | `scoring_rule_test.rs` + Lobby unit test | Cargo test + Vitest |
| Stepped Decay formula (20s, 1000pts) | `scoring_rule_test.rs` | Cargo test |
| Linear Decay formula (20s, 1000pts, 3s) | `scoring_rule_test.rs` | Cargo test |
| Fixed Score always full | `scoring_rule_test.rs` | Cargo test |
| Wrong answer = 0 (all rules) | `scoring_rule_test.rs` | Cargo test |
| Default to SteppedDecay | `session.rs` default impl + integration test | Cargo test |
| Rule visible to players | `Question.tsx` unit test + E2E | Vitest + Playwright |
| Rule locked after start | WS handler integration test | Cargo test |
