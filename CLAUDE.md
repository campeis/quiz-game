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
- 009-scoring-rules: Configurable scoring rules (SteppedDecay / LinearDecay / FixedScore) via strategy enum; new WS messages `set_scoring_rule` / `scoring_rule_set`
- 008-avatar-picker-modal: Avatar picker modal with 30-emoji grid; `AvatarPickerModal` component; Vitest + @testing-library/react unit tests
- 007-player-avatar: Player avatar support (emoji, URL param, default fallback); leaderboard avatar display


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
