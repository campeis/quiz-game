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
- **Persistence**: In-memory only — no database; all session state lives in `GameSession` in `SessionManager` for the duration of a session

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
- 012-position-based-scoring: Position Race scoring rule (1st→1000, 2nd→750, 3rd→500, 4th+→250)
- 011-streak-bonus: Streak multiplier scoring rule (×1.0 + 0.5 per consecutive correct)
- 010-question-time-limit: Configurable per-question time limit (10–60 s)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
