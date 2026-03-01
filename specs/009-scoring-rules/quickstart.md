# Quickstart: Configurable Scoring Rules

**Branch**: `009-scoring-rules` | **Date**: 2026-03-01

## Prerequisites

- Rust toolchain (stable, edition 2024)
- Node.js + pnpm
- Repo cloned and on branch `009-scoring-rules`

## Run the stack

```bash
# Terminal 1 — backend
cd backend
cargo run

# Terminal 2 — frontend
cd frontend
pnpm install
pnpm dev
```

## Test the scoring rules (manual)

1. Open `http://localhost:5173` and create a game (host).
2. On the **Lobby** screen, locate the **Scoring Rule** selector (host-only).
3. Choose one of the three rules:
   - **Stepped Decay** — score drops every 5 s
   - **Linear Decay** — score drops every second
   - **Fixed Score** — full points regardless of time
4. Open a second browser tab / incognito window, join with the game code.
5. Start the quiz.
6. Answer a question slowly — verify the score matches the selected rule.
7. Answer incorrectly — verify the score is 0.

### Expected scores (20s time limit, 1000 max points)

| Rule | Answered at | Expected points |
|---|---|---|
| Stepped Decay | 0–4 s | 1000 |
| Stepped Decay | 5–9 s | 750 |
| Stepped Decay | 10–14 s | 500 |
| Stepped Decay | 15–20 s | 250 |
| Linear Decay | 0 s | 1000 |
| Linear Decay | 3 s | 850 |
| Linear Decay | 10 s | 500 |
| Fixed Score | any | 1000 |
| Any rule | wrong answer | 0 |

## Run automated tests

```bash
# Backend unit tests (scoring rule logic)
cd backend
cargo test scoring_rule

# Backend integration tests (WebSocket message flow)
cargo test

# Frontend unit tests
cd frontend
pnpm test

# End-to-end tests
cd e2e
pnpm exec playwright test --grep "scoring"
```

## Key files changed

| File | Change |
|---|---|
| `backend/src/models/scoring_rule.rs` | NEW — `ScoringRule` enum + formula |
| `backend/src/models/session.rs` | Added `scoring_rule` field |
| `backend/src/services/scoring.rs` | Replaced by `ScoringRule::calculate_points` |
| `backend/src/services/game_engine.rs` | Uses `session.scoring_rule`; handles `set_scoring_rule` msg |
| `backend/src/handlers/ws.rs` | Routes new `set_scoring_rule` message |
| `frontend/src/services/messages.ts` | New message types; extended `QuestionPayload` |
| `frontend/src/hooks/useGameState.ts` | New `scoringRule` state field |
| `frontend/src/components/Lobby.tsx` | Scoring rule selector (host-only) |
| `frontend/src/components/Question.tsx` | Active rule label displayed to players |
