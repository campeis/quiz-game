# Quickstart: Multiplayer Online Quiz

**Branch**: `001-multiplayer-quiz`

## Prerequisites

- **Rust** (stable, latest) — [rustup.rs](https://rustup.rs)
- **Node.js** 20+ — [nodejs.org](https://nodejs.org)
- **pnpm** (v9+) — `npm install -g pnpm` or `corepack enable && corepack prepare pnpm@latest --activate`
- **just** (command runner) — `cargo install just` or `brew install just`
- **Playwright browsers** — installed via `pnpm exec playwright install chromium` (in e2e/)

## Setup

```bash
# Clone and checkout feature branch
git checkout 001-multiplayer-quiz

# Install all dependencies (backend + frontend + e2e)
just setup
```

The `just setup` command runs:
1. `cargo build` in `backend/`
2. `pnpm install` in `frontend/`
3. `pnpm install && pnpm exec playwright install chromium` in `e2e/`

## Development

```bash
# Start both backend and frontend dev servers (single command)
just dev
```

This runs concurrently:
- **Backend**: `cargo run` on `http://localhost:3000`
- **Frontend**: `rspack serve` on `http://localhost:5173` (HMR enabled, proxies `/api` to backend; WebSocket connects directly to backend)

Open `http://localhost:5173` in your browser.

## Testing

```bash
# Run all tests
just test

# Run only backend tests
just test-backend

# Run only frontend tests
just test-frontend

# Run end-to-end tests (starts backend + frontend automatically)
just test-e2e
```

### Individual test commands

```bash
# Backend unit + integration tests
cd backend && cargo test

# Frontend unit tests
cd frontend && pnpm exec vitest run

# E2E tests
cd e2e && pnpm exec playwright test
```

## Linting & Formatting

```bash
# Check all (backend + frontend)
just lint

# Auto-fix
just lint-fix
```

### Individual commands

```bash
# Backend
cd backend && cargo clippy -- -D warnings
cd backend && cargo fmt --check

# Frontend
cd frontend && pnpm exec biome check src/
cd frontend && pnpm exec biome check --fix src/
```

## Build for Production

```bash
# Build optimized backend binary + frontend static assets
just build
```

This produces:
- `backend/target/release/quiz-server` — single binary that serves the API + static frontend
- `frontend/dist/` — built static assets (embedded by the server)

## Run Production Build

```bash
# Start the production server
just start
```

The server runs on `http://localhost:3000` serving both the API and the frontend.

## Try a Game

1. Open `http://localhost:5173` (dev) or `http://localhost:3000` (prod)
2. Click **"Host a Quiz"**
3. Upload a quiz file (see sample below or use `fixtures/sample.txt`)
4. Note the **join code** shown in the lobby
5. Open another browser tab/window, click **"Join a Game"**
6. Enter the join code and a display name, click **"Join Game"**
7. Back on the host tab, click **"Start Quiz"**
8. Answer questions and watch the leaderboard update

### Sample Quiz File (`sample.txt`)

```text
# General Knowledge

? What is the capital of France?
- London
- Berlin
* Paris
- Madrid

? How many continents are there?
- 5
* 7
- 9

? Which planet is closest to the Sun?
* Mercury
- Venus
- Earth
```

File format rules:
- `#` — Quiz title (first line only)
- `?` — Question text
- `-` — Incorrect answer option
- `*` — Correct answer option (exactly one per question)
- `//` — Comment (ignored)
- Blank lines are ignored

## Environment Configuration

| Variable              | Default | Description                              |
|-----------------------|---------|------------------------------------------|
| `PORT`                | 3000    | Server listen port                       |
| `MAX_SESSIONS`        | 10      | Maximum concurrent game sessions         |
| `MAX_PLAYERS`         | 50      | Maximum players per session              |
| `QUESTION_TIME_SEC`   | 20      | Default time limit per question          |
| `RECONNECT_TIMEOUT`   | 120     | Seconds before disconnected player/host is dropped |
| `STATIC_DIR`          | _(none)_| Path to frontend build output (set to `../frontend/dist` for production) |

## Justfile Recipes Summary

| Recipe          | Description                                  |
|-----------------|----------------------------------------------|
| `just setup`    | Install all dependencies                     |
| `just dev`      | Start backend + frontend dev servers         |
| `just build`    | Production build (backend + frontend)        |
| `just start`    | Run production server                        |
| `just test`     | Run all tests (backend + frontend + e2e)     |
| `just test-backend`  | Run backend tests only                  |
| `just test-frontend` | Run frontend tests only                 |
| `just test-e2e`      | Run Playwright e2e tests                |
| `just lint`     | Check linting (clippy + biome)               |
| `just lint-fix` | Auto-fix linting issues                      |
