# Implementation Plan: Multiplayer Online Quiz

**Branch**: `001-multiplayer-quiz` | **Date**: 2026-02-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-multiplayer-quiz/spec.md`

## Summary

Build a real-time multiplayer quiz application where a host uploads a quiz text file, starts a game session with a join code, and players answer timed questions through a web interface. Scoring uses a tiered speed model (1000/500/250 points). A live leaderboard updates after each question and a final leaderboard declares the winner. The backend is Rust/Axum with WebSocket-based real-time communication; the frontend is TypeScript/React bundled with Rspack. A single command starts both services for development.

## Technical Context

**Language/Version**: Rust (stable, latest edition 2024) for backend; TypeScript 5.x for frontend
**Primary Dependencies**: Axum (backend web framework + WebSocket support), React 19 (frontend UI), Rspack (frontend bundler), Biome (frontend linting + formatting)
**Storage**: In-memory only (game sessions are ephemeral per spec)
**Testing**: `cargo test` (backend unit/integration), Vitest (frontend unit), Playwright (end-to-end)
**Target Platform**: Web browsers (players: mobile-first, host: desktop-friendly); server: Linux/macOS
**Project Type**: Web application (frontend + backend)
**Performance Goals**: Question delivery to all players <1s; leaderboard update <2s; 50 concurrent players per session
**Constraints**: WebSocket latency <200ms p95 for real-time sync; configurable max concurrent sessions
**Scale/Scope**: Up to 50 players per session, multiple concurrent sessions (configurable cap), quizzes up to 100 questions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Code Quality | Automated linting/formatting enforced: `cargo clippy` + `cargo fmt` (Rust), Biome (TypeScript/React) | PASS |
| I. Code Quality | Single responsibility: backend modules (quiz parsing, session management, WebSocket handling) are separated; frontend components are isolated | PASS |
| II. Testing Standards | TDD workflow: `cargo test` for backend, Vitest for frontend unit tests, Playwright for E2E | PASS |
| II. Testing Standards | Contract tests validate WebSocket message schemas and REST endpoints | PASS |
| II. Testing Standards | Tests are deterministic: no shared mutable state; each test creates its own session | PASS |
| III. UX Consistency | Consistent design system: single component library with shared tokens (colors, spacing, typography) | PASS |
| III. UX Consistency | All states covered: loading, empty lobby, error, disconnection, quiz complete | PASS |
| III. UX Consistency | Accessibility: WCAG 2.1 AA — keyboard navigation, screen reader labels, color contrast | PASS |
| IV. Performance | Response time budgets defined: <1s question delivery (SC-003), <2s leaderboard (SC-004) | PASS |
| IV. Performance | Performance-critical path identified: WebSocket broadcast to 50 clients | PASS |

All gates pass. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/001-multiplayer-quiz/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── rest-api.md
│   └── websocket-messages.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
├── Cargo.toml
├── src/
│   ├── main.rs              # Entry point, router setup, static file serving
│   ├── config.rs            # App configuration (max sessions, timeouts)
│   ├── models/
│   │   ├── mod.rs
│   │   ├── quiz.rs          # Quiz, Question structs + file parser
│   │   ├── session.rs       # GameSession, SessionStatus
│   │   ├── player.rs        # Player, ConnectionStatus
│   │   └── leaderboard.rs   # Leaderboard, scoring logic
│   ├── handlers/
│   │   ├── mod.rs
│   │   ├── quiz_upload.rs   # POST /api/quiz — file upload + validation
│   │   ├── session.rs       # POST/GET /api/sessions — create, join
│   │   └── ws.rs            # WebSocket upgrade + message routing
│   ├── services/
│   │   ├── mod.rs
│   │   ├── session_manager.rs  # Concurrent session registry (DashMap)
│   │   ├── game_engine.rs      # Game loop: question timing, state transitions
│   │   └── scoring.rs          # Tiered scoring calculation
│   └── errors.rs            # Unified error types
└── tests/
    ├── unit/
    │   ├── quiz_parser_test.rs
    │   ├── scoring_test.rs
    │   └── session_test.rs
    ├── integration/
    │   ├── game_flow_test.rs
    │   └── ws_test.rs
    └── contract/
        └── api_contract_test.rs

frontend/
├── package.json
├── rspack.config.ts
├── biome.json
├── tsconfig.json
├── src/
│   ├── main.tsx             # React entry point
│   ├── App.tsx              # Router setup
│   ├── components/
│   │   ├── JoinForm.tsx     # Join code + display name input
│   │   ├── QuizUpload.tsx   # File upload + preview for host
│   │   ├── Lobby.tsx        # Waiting room (host + player views)
│   │   ├── Question.tsx     # Question display + answer buttons + timer
│   │   ├── HostDashboard.tsx  # Host view during rounds
│   │   ├── Leaderboard.tsx  # Running + final leaderboard
│   │   └── ui/              # Shared design system primitives
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Timer.tsx
│   │       └── tokens.ts    # Design tokens (colors, spacing, typography)
│   ├── hooks/
│   │   ├── useWebSocket.ts  # WebSocket connection + reconnection logic
│   │   └── useGameState.ts  # Game state reducer from WS messages
│   ├── pages/
│   │   ├── HomePage.tsx     # Landing: host or join
│   │   ├── HostPage.tsx     # Host flow: upload → lobby → dashboard → results
│   │   └── PlayerPage.tsx   # Player flow: join → lobby → play → results
│   └── services/
│       ├── api.ts           # REST API client (quiz upload)
│       └── messages.ts      # WebSocket message type definitions
└── tests/
    └── unit/
        ├── scoring.test.ts
        └── components/
            ├── JoinForm.test.tsx
            ├── Question.test.tsx
            └── Leaderboard.test.tsx

e2e/
├── package.json
├── playwright.config.ts
└── tests/
    ├── host-flow.spec.ts    # Host: upload → start → run quiz → see results
    ├── player-flow.spec.ts  # Player: join → answer → see results
    └── full-game.spec.ts    # Multi-player game from start to finish

Justfile                     # Single-command dev/build/test runner
```

**Structure Decision**: Web application layout (Option 2) with separate `backend/` and `frontend/` directories. A `Justfile` at the repo root provides the single-command interface for building and starting both services. The `e2e/` directory is at root level since Playwright tests span both services. In production mode, the Rust backend serves the built frontend static assets directly.

## Complexity Tracking

No constitution violations detected. No complexity justifications needed.
