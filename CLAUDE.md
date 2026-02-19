# speckit Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-15

## Active Technologies
- Rust (stable, edition 2024) for backend; TypeScript 5.x for frontend + pnpm (replacing npm) as the JavaScript package manager (002-pnpm-migration)
- Markdown (GitHub-Flavored Markdown) + None (static documentation file) (003-add-readme)
- YAML (GitHub Actions workflow syntax) + GitHub Actions — `actions/checkout`, `dtolnay/rust-toolchain`, `pnpm/action-setup`, `actions/setup-node`, `taiki-e/install-action`, `actions/cache` (004-github-actions-ci)

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
- 004-github-actions-ci: Added YAML (GitHub Actions workflow syntax) + GitHub Actions — `actions/checkout`, `dtolnay/rust-toolchain`, `pnpm/action-setup`, `actions/setup-node`, `taiki-e/install-action`, `actions/cache`
- 003-add-readme: Added Markdown (GitHub-Flavored Markdown) + None (static documentation file)
- 002-pnpm-migration: Added Rust (stable, edition 2024) for backend; TypeScript 5.x for frontend + pnpm (replacing npm) as the JavaScript package manager


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
