# speckit Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-15

## Active Technologies
- Rust (stable, edition 2024) for backend; TypeScript 5.x for frontend + pnpm (replacing npm) as the JavaScript package manager (002-pnpm-migration)
- Markdown (GitHub-Flavored Markdown) + None (static documentation file) (003-add-readme)
- YAML (GitHub Actions workflow syntax) + GitHub Actions — `actions/checkout`, `dtolnay/rust-toolchain`, `pnpm/action-setup`, `actions/setup-node`, `taiki-e/install-action`, `actions/cache` (004-github-actions-ci)
- YAML (Dependabot configuration syntax v2) + None — modifies existing `.github/dependabot.yml` (005-dependabot-expand)
- Python (yamllint is a Python CLI tool, version latest stable) + `yamllint` (Python package, installed via pip) (006-yaml-lint)
- Rust (stable, edition 2024) — backend; TypeScript 5.x — frontend + Axum (WebSocket handler) — backend; React 19 — frontend; Vitest — frontend unit tests; Playwright — e2e tests (007-player-avatar)
- In-memory only (session-scoped `HashMap<String, Player>` — no persistence change) (007-player-avatar)
- TypeScript 5.x + React 19 + React 19, Vitest + @testing-library/react (unit tests), Playwright (e2e) (008-avatar-picker-modal)
- N/A — avatar state remains component-local in `JoinForm` (no persistence change) (008-avatar-picker-modal)
- Rust (stable, edition 2024) — backend; TypeScript 5.x — frontend + Axum (WebSocket) — backend; React 19 — frontend; Biome — linting/formatting (009-scoring-rules)
- In-memory session state only (`GameSession` in `HashMap`); no persistence (009-scoring-rules)

- Rust (stable, latest edition 2024) for backend; TypeScript 5.x for frontend + Axum (backend web framework + WebSocket support), React 19 (frontend UI), Rspack (frontend bundler), Biome (frontend linting + formatting) (001-multiplayer-quiz)

## Project Structure

```text
src/
tests/
```

## Commands

cargo test [ONLY COMMANDS FOR ACTIVE TECHNOLOGIES][ONLY COMMANDS FOR ACTIVE TECHNOLOGIES] cargo clippy

## Code Style

Rust (stable, latest edition 2024) for backend; TypeScript 5.x for frontend: Follow standard conventions

## Recent Changes
- 009-scoring-rules: Added Rust (stable, edition 2024) — backend; TypeScript 5.x — frontend + Axum (WebSocket) — backend; React 19 — frontend; Biome — linting/formatting
- 008-avatar-picker-modal: Added TypeScript 5.x + React 19 + React 19, Vitest + @testing-library/react (unit tests), Playwright (e2e)
- 007-player-avatar: Added Rust (stable, edition 2024) — backend; TypeScript 5.x — frontend + Axum (WebSocket handler) — backend; React 19 — frontend; Vitest — frontend unit tests; Playwright — e2e tests


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
