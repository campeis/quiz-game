# speckit Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-15

## Active Technologies
- **Languages**: Rust (stable, edition 2024) — backend; TypeScript 5.x — frontend
- **Package manager**: pnpm
- **Backend**: Axum (web framework + WebSocket), Tokio
- **Frontend**: React 19, Rspack (bundler)
- **Linting / Formatting**: Biome (frontend), Clippy + rustfmt (backend), yamllint (YAML)
- **Testing**: cargo test (backend), Vitest + @testing-library/react (frontend unit), Playwright (e2e)
- **CI/CD**: GitHub Actions — `actions/checkout`, `dtolnay/rust-toolchain`, `pnpm/action-setup`, `actions/setup-node`, `taiki-e/install-action`, `actions/cache`
- **Dependencies**: Dependabot (`.github/dependabot.yml`)
- **Persistence**: In-memory only — no database; all session state lives in `HashMap` for the duration of a session
- Rust (stable, edition 2024) — backend; TypeScript 5.x — frontend + Axum + Tokio (backend); React 19 + Rspack (frontend); Vitest + @testing-library/react (unit); Playwright (e2e) (010-question-time-limit)
- In-memory only — `GameSession` in `HashMap`; no persistence (010-question-time-limit)
- Rust (stable, edition 2024) — backend; TypeScript 5.x — frontend + Axum + Tokio (backend), React 19 + Vitest (frontend), Playwright (e2e) (011-streak-bonus)
- In-memory only (no database); streak counter lives on `Player` struct in `HashMap` (011-streak-bonus)
- Rust stable (edition 2024) — backend; TypeScript 5.x — frontend + Axum + Tokio + Serde (backend); React 19 + Rspack (frontend) (012-position-based-scoring)
- In-memory only — `GameSession` in `DashMap` via `SessionManager`; no persistence (012-position-based-scoring)

## Project Structure

```text
backend/    Rust/Axum API server and WebSocket handler
frontend/   React SPA
e2e/        Playwright end-to-end tests
fixtures/   Sample quiz files
specs/      Feature specifications and implementation plans
docs/       Architecture documentation and guides
```

## Commands

```bash
cargo test
cargo clippy -- -D warnings
cargo fmt --check
pnpm test
pnpm exec biome check src/
just test       # all suites
just lint       # all linters
just lint-fix   # auto-fix
```

## Code Style

Rust: follow standard rustfmt + Clippy conventions.
TypeScript/React: follow Biome rules (no separate Prettier/ESLint config).

## Recent Changes
- 012-position-based-scoring: Added Rust stable (edition 2024) — backend; TypeScript 5.x — frontend + Axum + Tokio + Serde (backend); React 19 + Rspack (frontend)
- 011-streak-bonus: Added Rust (stable, edition 2024) — backend; TypeScript 5.x — frontend + Axum + Tokio (backend), React 19 + Vitest (frontend), Playwright (e2e)
- 010-question-time-limit: Added Rust (stable, edition 2024) — backend; TypeScript 5.x — frontend + Axum + Tokio (backend); React 19 + Rspack (frontend); Vitest + @testing-library/react (unit); Playwright (e2e)


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
