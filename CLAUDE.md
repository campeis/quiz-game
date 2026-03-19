# speckit Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-19

## Project Structure

```text
backend/    Rust/Axum API server and WebSocket handler
frontend/   React SPA
e2e/        Playwright end-to-end tests
fixtures/   Sample quiz files
specs/      Feature specifications and implementation plans
docs/       Architecture documentation and guides
```

## Tech Stack Overview
- **Languages**: Rust (stable, edition 2024) — backend; TypeScript 5.x — frontend
- **Package manager**: pnpm
- **CI/CD**: GitHub Actions — `actions/checkout`, `dtolnay/rust-toolchain`, `pnpm/action-setup`, `actions/setup-node`, `taiki-e/install-action`, `actions/cache`
- **Dependencies**: Dependabot (`.github/dependabot.yml`)
- **Persistence**: In-memory only — no database; all session state lives in `GameSession` in `SessionManager` for the duration of a session
- **YAML linting**: yamllint (`.yamllint.yml`)

## Commands

```bash
just test       # all suites
just lint       # all linters
just lint-fix   # auto-fix
just storybook  # start component browser at http://localhost:6006
```

See `backend/CLAUDE.md`, `frontend/CLAUDE.md`, and `e2e/CLAUDE.md` for subsystem-specific commands.

## Recent Changes
- 014-add-storybook: Added TypeScript 5.7 / React 19 + `storybook` (>=8), `storybook-react-rsbuild` (Rspack-ecosystem Storybook builder), `@rsbuild/core`, `@rsbuild/plugin-react`, `@storybook/addon-essentials`; existing: Rspack 1.7, Biome 2.x, pnpm
- 013-arcade-neon-ui: Added TypeScript 5.x — frontend only; Rust backend unchanged + React 19, Rspack 1.7, Biome (lint/format), Vitest + @testing-library/reac
- 012-position-based-scoring: Position Race scoring rule (1st→1000, 2nd→750, 3rd→500, 4th+→250)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->

## Active Technologies
- TypeScript 5.7 / React 19 + `storybook` (>=8), `storybook-react-rsbuild` (Rspack-ecosystem Storybook builder), `@rsbuild/core`, `@rsbuild/plugin-react`, `@storybook/addon-essentials`; existing: Rspack 1.7, Biome 2.x, pnpm (014-add-storybook)
- N/A — developer-only tooling, no persistence (014-add-storybook)
