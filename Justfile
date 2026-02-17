# Quiz Game — command runner
# Usage: just <recipe>

# Install all dependencies
setup:
    cd backend && cargo build
    cd frontend && npm install
    cd e2e && npm install && npx playwright install chromium

# Start backend + frontend dev servers
dev:
    #!/usr/bin/env bash
    trap 'kill 0' EXIT
    cd backend && cargo watch -x run &
    cd frontend && npm run dev &
    wait

# Production build
build:
    cd frontend && npm run build
    cd backend && cargo build --release

# Run production server
start:
    cd backend && STATIC_DIR=../frontend/dist cargo run --release

# Run all tests
test: test-backend test-frontend test-e2e

# Backend tests only
test-backend:
    cd backend && cargo test

# Frontend tests only
test-frontend:
    cd frontend && npm test

# E2E tests only
test-e2e:
    cd e2e && npx playwright test

# Lint all code
lint:
    cd backend && cargo clippy -- -D warnings
    cd backend && cargo fmt --check
    cd frontend && npx biome check src/

# Auto-fix lint issues
lint-fix:
    cd backend && cargo fmt
    cd frontend && npx biome check --fix src/
