# Quickstart: Multiplayer Online Quiz

## Prerequisites

- **Rust** (stable, latest) — [rustup.rs](https://rustup.rs)
- **Node.js** 20+ — [nodejs.org](https://nodejs.org)
- **pnpm** (v9+) — `npm install -g pnpm` or `corepack enable && corepack prepare pnpm@latest --activate`
- **just** (command runner) — `cargo install just` or `brew install just`
- **Playwright browsers** — installed via `pnpm exec playwright install chromium` (in `e2e/`)

## Setup

```bash
# Clone the repository
git clone <repo-url>
cd quiz-game

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
- **Frontend**: `rspack serve` on `http://localhost:5173` (HMR enabled, proxies `/api` to backend)

Open `http://localhost:5173` in your browser.

## Testing

```bash
# Run all tests
just test

# Individual suites
just test-backend    # Rust unit and integration tests
just test-frontend   # Vitest unit tests
just test-e2e        # Playwright end-to-end tests (starts servers automatically)
```

### Individual commands

```bash
cd backend && cargo test
cd frontend && pnpm exec vitest run
cd e2e && pnpm exec playwright test
```

## Linting & Formatting

```bash
just lint      # Check all (cargo clippy + rustfmt + biome + yamllint)
just lint-fix  # Auto-fix where possible
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
just build   # Optimized backend binary + frontend static assets
just start   # Run production server on http://localhost:3000
```

Produces:
- `backend/target/release/quiz-server` — single binary that serves API + static frontend
- `frontend/dist/` — built static assets (served by the binary when `STATIC_DIR` is set)

## Try a Game

1. Open `http://localhost:5173` (dev) or `http://localhost:3000` (prod)
2. Click **"Host a Quiz"** and upload a quiz file (see format below or use `fixtures/sample.txt`)
3. Note the **join code** shown in the lobby
4. Open another browser tab, click **"Join a Game"**
5. Enter the join code; optionally click the avatar preview to pick an emoji, then enter a display name
6. Click **"Join Game"**
7. Back on the host tab, click **"Start Quiz"**
8. Answer questions and watch the leaderboard update live

### Sample Quiz File (`fixtures/sample.txt`)

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

File format:
- `#` — Quiz title (first line only)
- `?` — Question text
- `-` — Incorrect answer option
- `*` — Correct answer option (exactly one per question)
- `//` — Comment (ignored)
- Blank lines are ignored

## Environment Configuration

| Variable            | Default    | Description                                               |
|---------------------|------------|-----------------------------------------------------------|
| `PORT`              | `3000`     | Server listen port                                        |
| `MAX_SESSIONS`      | `10`       | Maximum concurrent game sessions                          |
| `MAX_PLAYERS`       | `50`       | Maximum players per session                               |
| `QUESTION_TIME_SEC` | `20`       | Default time limit per question (seconds)                 |
| `RECONNECT_TIMEOUT` | `120`      | Seconds before a disconnected player/host is dropped      |
| `STATIC_DIR`        | _(unset)_  | Path to frontend build output (e.g. `../frontend/dist`)   |

## Justfile Reference

| Recipe               | Description                                      |
|----------------------|--------------------------------------------------|
| `just setup`         | Install all dependencies                         |
| `just dev`           | Start backend + frontend dev servers             |
| `just build`         | Production build (backend + frontend)            |
| `just start`         | Run production server                            |
| `just test`          | Run all tests (backend + frontend + e2e)         |
| `just test-backend`  | Backend tests only                               |
| `just test-frontend` | Frontend unit tests only                         |
| `just test-e2e`      | Playwright e2e tests                             |
| `just lint`          | Check linting (clippy + rustfmt + biome + yamllint) |
| `just lint-fix`      | Auto-fix linting issues                          |
