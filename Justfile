# Quiz Game — command runner
# Usage: just <recipe>

# Install all dependencies
setup:
    cd backend && cargo build
    cd frontend && pnpm install
    cd e2e && pnpm install && pnpm exec playwright install chromium

# Start backend + frontend dev servers
dev:
    #!/usr/bin/env bash
    trap 'kill 0' EXIT
    cd backend && cargo run &
    cd frontend && pnpm run dev &
    wait

# Production build
build:
    cd frontend && pnpm run build
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
    cd frontend && pnpm test

# E2E tests only
test-e2e:
    cd e2e && pnpm exec playwright test

# Lint all code
lint:
    cd backend && cargo clippy -- -D warnings
    cd backend && cargo fmt --check
    cd frontend && pnpm exec biome check src/
    yamllint .

# Auto-fix lint issues
lint-fix:
    cd backend && cargo fmt
    cd frontend && pnpm exec biome check --fix src/

# Regenerate PNG files from Mermaid diagram sources in docs/
update-docs:
    #!/usr/bin/env bash
    set -euo pipefail
    mkdir -p docs/images
    for f in docs/diagrams/*.mmd; do
        name=$(basename "$f" .mmd)
        echo "Generating docs/images/${name}.png from ${f}"
        pnpm dlx @mermaid-js/mermaid-cli -i "$f" -o "docs/images/${name}.png" -t dark -b transparent --width 1600
    done
    echo "Done."
