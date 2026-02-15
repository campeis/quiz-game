# Research: Multiplayer Online Quiz

**Date**: 2026-02-15
**Branch**: `001-multiplayer-quiz`

## 1. WebSocket Support in Axum

**Decision**: Use Axum's built-in WebSocket support (`axum::extract::ws`)
**Rationale**: Axum provides first-class WebSocket support through its `ws` feature flag, built on top of `tokio-tungstenite`. No additional dependency needed. It integrates directly with Axum's extractor pattern and routing, making it idiomatic. Handles upgrade, message send/receive, and close events natively.
**Alternatives considered**:
- `tokio-tungstenite` directly: Lower-level, more boilerplate, no benefit over Axum's wrapper
- `socketioxide` (Socket.IO for Rust): Adds complexity and a protocol layer not needed for this use case

## 2. Concurrent Session State Management

**Decision**: Use `DashMap<String, GameSession>` for the session registry, wrapped in an Axum `State` extension
**Rationale**: DashMap provides a concurrent hash map with fine-grained locking (per-shard), which is ideal for multiple game sessions being accessed independently. It avoids the contention of a single `RwLock<HashMap>` when multiple games run simultaneously. Each session's internal state uses `tokio::sync::RwLock` for per-session synchronization.
**Alternatives considered**:
- `Arc<RwLock<HashMap>>`: Simpler but creates contention across unrelated sessions
- Actor model (tokio task per session): More complex; warranted at larger scale but overkill for the configurable-cap design here. Could be adopted later if needed.

## 3. Frontend WebSocket Approach

**Decision**: Use the native browser `WebSocket` API wrapped in a custom React hook (`useWebSocket`)
**Rationale**: The native WebSocket API is sufficient for this use case (JSON messages, reconnection logic). A custom hook provides clean integration with React state and handles reconnection with exponential backoff. No additional dependency needed.
**Alternatives considered**:
- `socket.io-client`: Adds Socket.IO protocol overhead; backend would need a compatible server
- `reconnecting-websocket` npm package: Lightweight but the reconnection logic is simple enough to implement in-hook

## 4. Rspack Configuration

**Decision**: Use `@rspack/cli` with built-in TypeScript and React support
**Rationale**: Rspack supports TypeScript and JSX/TSX out of the box via its built-in SWC integration. Minimal configuration needed: set entry point, output, and enable the React refresh plugin for HMR. Dev server with hot module replacement is included via `@rspack/dev-server`.
**Alternatives considered**:
- Webpack: Slower build times, Rspack is a drop-in replacement with better performance
- Vite: Good alternative but user specified Rspack

## 5. Biome Configuration

**Decision**: Use Biome for both linting and formatting of TypeScript/React code
**Rationale**: Biome handles linting (ESLint-equivalent rules) and formatting (Prettier-equivalent) in a single tool with a single config file (`biome.json`). Significantly faster than ESLint+Prettier due to its Rust implementation. Supports TypeScript and JSX natively.
**Alternatives considered**:
- ESLint + Prettier: Two tools, two configs, slower; Biome consolidates both
- dprint: Formatting only, no linting

## 6. Single-Command Development

**Decision**: Use a `Justfile` (just command runner) with a `dev` recipe that starts backend and frontend in parallel
**Rationale**: `just` is a modern, cross-platform command runner. The `dev` recipe spawns `cargo watch -x run` (backend with auto-reload) and `rspack serve` (frontend dev server) concurrently. Simple, readable, and does not require Node.js for orchestration. In production, a `build` recipe compiles the frontend to static assets and builds the Rust binary, which serves them directly.
**Alternatives considered**:
- Makefile: Works but `just` has better ergonomics (variables, cross-platform)
- `cargo-make`: Rust-specific, less familiar to frontend developers
- npm `concurrently`: Requires Node.js for orchestration layer

## 7. Frontend Testing

**Decision**: Use Vitest for frontend unit/component tests
**Rationale**: Vitest provides fast test execution with native TypeScript support and a Jest-compatible API. It works well with React Testing Library for component tests. Rspack compatibility is not an issue since Vitest uses its own transform pipeline (esbuild/SWC-based).
**Alternatives considered**:
- Jest: Slower, requires more configuration for TypeScript/React
- Rspack test runner: No mature built-in test runner

## 8. End-to-End Testing

**Decision**: Use Playwright as specified by user
**Rationale**: Playwright provides multi-browser support, auto-waiting, and excellent WebSocket inspection capabilities. Ideal for testing the full multiplayer flow across multiple browser contexts (host + players). The `e2e/` directory sits at root level since tests span both backend and frontend.
**Alternatives considered**: None (user requirement)

## 9. Quiz File Format

**Decision**: Simple line-based text format with `#` for title, `?` for questions, `-` for options, `*` for correct answer
**Rationale**: Designed to be trivially writable by hand in any text editor. No special syntax knowledge required. The markers are intuitive: question mark for questions, asterisk (star) for the correct answer. Easy to parse line-by-line in Rust.

**Format specification**:
```text
# My Quiz Title

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

**Rules**:
- Lines starting with `#` define the quiz title (first occurrence only)
- Lines starting with `?` begin a new question
- Lines starting with `-` define an incorrect answer option
- Lines starting with `*` define the correct answer option (exactly one per question)
- Blank lines are ignored (used for readability)
- Lines starting with `//` are comments (ignored)
- Each question must have 2-4 answer options total (combining `-` and `*`)
- File encoding: UTF-8

## 10. Production Deployment Model

**Decision**: Single binary serves both API and static frontend assets
**Rationale**: The Rust backend serves the built frontend assets from a configured static directory (or embedded via `include_dir` / `rust-embed`). This simplifies deployment to a single binary with no separate web server needed. The WebSocket endpoint and REST API share the same server.
**Alternatives considered**:
- Separate frontend hosting (CDN/Nginx): More complex deployment for no clear benefit at this scale
- Docker compose with two services: Unnecessary overhead for a single-binary approach
