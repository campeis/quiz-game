# Multiplayer Online Quiz

A real-time multiplayer quiz game where a host uploads questions, players join via a code, and everyone competes live with instant scoring and leaderboards. Built with a Rust backend and React frontend communicating over WebSockets.

## Features

- **Host a quiz**: Upload a text-based quiz file, get a join code, and control the game flow
- **Join and play**: Enter a join code and display name to compete in real time
- **Live questions with countdown**: Timed questions with instant feedback on answers
- **Real-time leaderboard**: Scores update live after each question with ranked standings
- **WebSocket communication**: Low-latency game state synchronization between host and players
- **Reconnection support**: Players and hosts can reconnect if disconnected mid-game

## Project Structure

```text
backend/           Rust/Axum API server and WebSocket handler
├── src/
│   ├── handlers/  HTTP and WebSocket route handlers
│   ├── models/    Game, session, quiz, and player data structures
│   └── services/  Session management, scoring, and quiz parsing
│
frontend/          React single-page application
├── src/
│   ├── components/  UI components (Lobby, Question, Leaderboard, etc.)
│   ├── hooks/       Custom hooks for game state and WebSocket connection
│   ├── pages/       Page-level components (Home, Host, Player)
│   └── services/    API client utilities
│
e2e/               Playwright end-to-end tests
fixtures/          Sample quiz files for testing and demos
specs/             Feature specifications and implementation plans
```

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Backend** | Rust (stable) with Axum web framework |
| **Frontend** | React 19, TypeScript 5.x |
| **Bundler** | Rspack |
| **Linting** | Biome (frontend), Clippy + rustfmt (backend) |
| **Testing** | cargo test (backend), Vitest (frontend), Playwright (E2E) |
| **Package Manager** | pnpm |
| **Task Runner** | just |

## Getting Started

### Prerequisites

- [Rust](https://rustup.rs) (stable, latest)
- [Node.js](https://nodejs.org) 20+
- [pnpm](https://pnpm.io) v9+ — `npm install -g pnpm`
- [just](https://github.com/casey/just) — `cargo install just` or `brew install just`

### Quick Setup

```bash
just setup    # Installs all dependencies (backend + frontend + e2e)
just dev      # Starts backend and frontend dev servers
```

Open `http://localhost:5173` to access the application.

For detailed setup instructions, game walkthrough, environment configuration, and production builds, see the [Quickstart Guide](specs/001-multiplayer-quiz/quickstart.md).

## Testing and Linting

```bash
just test     # Run all tests (backend + frontend + e2e)
just lint     # Check linting (clippy + biome + rustfmt)
just lint-fix # Auto-fix lint issues
```

Individual test suites:

```bash
just test-backend    # Rust unit and integration tests
just test-frontend   # Vitest unit tests
just test-e2e        # Playwright end-to-end tests
```
