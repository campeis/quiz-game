# Implementation Plan: GitHub Actions CI Workflow

**Branch**: `004-github-actions-ci` | **Date**: 2026-02-19 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-github-actions-ci/spec.md`

## Summary

Create a single GitHub Actions workflow file at `.github/workflows/ci.yml` that triggers on pushes to `main` only, installs all project toolchain and dependencies via `just setup`, then runs `just test`, `just lint`, and `just build`. All third-party actions are pinned to immutable SHA refs. The workflow grants only `contents: read` permission. A `playwright.config.ts` tweak makes the `reuseExistingServer` setting CI-aware. An optional Dependabot config keeps action SHAs automatically up to date.

## Technical Context

**Language/Version**: YAML (GitHub Actions workflow syntax)
**Primary Dependencies**: GitHub Actions — `actions/checkout`, `dtolnay/rust-toolchain`, `pnpm/action-setup`, `actions/setup-node`, `taiki-e/install-action`, `actions/cache`
**Storage**: N/A
**Testing**: Manual — push a commit to `main` and verify workflow runs and reports success; push a breaking commit and verify failure is reported
**Target Platform**: GitHub Actions, `ubuntu-latest` runner
**Project Type**: CI configuration (single YAML file + optional Dependabot config + minor playwright.config.ts update)
**Performance Goals**: Full run (setup + test + lint + build) completes within 15 minutes (SC-003)
**Constraints**: Must not trigger on non-main branches or PRs (FR-002); all third-party actions pinned to SHA (FR-009); `contents: read` permissions only (FR-010)
**Scale/Scope**: One workflow file, one job, sequential steps

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applies? | Status | Notes |
|-----------|----------|--------|-------|
| I. Code Quality | Partially | PASS | YAML workflow is readable; step names are descriptive; SHA pins have version comments |
| II. Testing Standards | Partially | PASS | No new code to unit-test; validation is via actual CI run. Manual test criteria defined in spec. |
| III. UX Consistency | No | N/A | No user-facing UI |
| IV. Performance | Yes | PASS | 15-minute timeout enforced (SC-003); caching for Rust + pnpm reduces redundant downloads |

**Quality Gates**:
1. Automated Checks — linting of YAML is implicit via GitHub Actions parse errors on push
2. Test Suite — N/A (no new unit tests)
3. Performance Validation — workflow timeout set to 15 min (FR-008)
4. UX Review — N/A
5. Code Review — workflow file should be reviewed before merge

**Gate Result**: PASS — no violations.

## Project Structure

### Documentation (this feature)

```text
specs/004-github-actions-ci/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
.github/
└── workflows/
    └── ci.yml           # NEW — the GitHub Actions CI workflow

.github/
└── dependabot.yml       # NEW (optional) — keeps action SHAs auto-updated

e2e/
└── playwright.config.ts # MODIFIED — reuseExistingServer: !process.env.CI
```

No data-model.md or contracts/ needed — this is a CI configuration feature.

**Structure Decision**: Single YAML file at `.github/workflows/ci.yml`. The project is a web application (`backend/` + `frontend/` + `e2e/`), but the CI workflow is a repository-level concern that lives in `.github/workflows/`.

## Workflow Design

### Trigger

```yaml
on:
  push:
    branches: [main]
```

No `pull_request` trigger — satisfies FR-001 and FR-002.

### Permissions

```yaml
permissions:
  contents: read
```

Minimal read-only permission — satisfies FR-010.

### Job Timeout

```yaml
jobs:
  ci:
    timeout-minutes: 15
```

Satisfies FR-008 and SC-003.

### Step Order

1. **Checkout** — `actions/checkout` (SHA-pinned)
2. **Install Rust stable** — `dtolnay/rust-toolchain` (SHA-pinned)
3. **Install pnpm** — `pnpm/action-setup` (SHA-pinned, version 10)
4. **Install Node.js** — `actions/setup-node` (SHA-pinned, Node 20)
5. **Install `just`** — `taiki-e/install-action` (SHA-pinned)
6. **Restore Cargo cache** — `actions/cache` keyed on `Cargo.lock`
7. **Restore pnpm store cache** — `actions/cache` keyed on all `pnpm-lock.yaml` files
8. **Install Playwright system dependencies** — `apt-get` for libaries Chromium needs that are absent from `ubuntu-latest` (not handled by `just setup`)
9. **Setup — `just setup`** — satisfies FR-003
10. **Test — `just test`** — satisfies FR-004
11. **Lint — `just lint`** — satisfies FR-005
12. **Build — `just build`** — satisfies FR-006

Each step fails fast by default (bash `set -e` equivalent via GitHub Actions), satisfying FR-007.

### SHA-Pinned Actions (as of 2026-02-19)

| Action | Version | SHA |
|--------|---------|-----|
| `actions/checkout` | v4.2.2 | `11bd71901bbe5b1630ceea73d27597364c9af683` |
| `dtolnay/rust-toolchain` | 2026-02-13 | `efa25f7f19611383d5b0ccf2d1c8914531636bf9` |
| `pnpm/action-setup` | v4.2.0 | `41ff72655975bd51cab0327fa583b6e92b6d3061` |
| `actions/setup-node` | v4.4.0 | `49933ea5288caeca8642d1e84afbd3f7d6820020` |
| `taiki-e/install-action` | v2.68.2 | `70e00552f3196d9a4c7dde7c57ef4c4830d422dd` |
| `actions/cache` | v5.0.3 | `cdf6c1fa76f9f475f3d7449005a359c84ca0f306` |

Satisfies FR-009 and SC-004.

### Playwright System Dependencies

The `ubuntu-latest` runner is missing these Chromium runtime libraries:
- `libnss3`, `libatk-bridge2.0-0`, `libdrm2`, `libxcomposite1`, `libxdamage1`, `libxrandr2`, `libgbm1`

These must be installed before `just setup` (which runs `pnpm exec playwright install chromium`). The explicit apt-get approach is used instead of `playwright install --with-deps` to avoid known apt lock contention issues on GitHub-hosted runners.

### playwright.config.ts Change

Change `reuseExistingServer: true` to `reuseExistingServer: !process.env.CI` in both `webServer` entries. This makes the intent explicit: always start fresh servers in CI. Functionally equivalent since no servers are pre-running in CI, but follows established convention.

### Dependabot Configuration (optional but recommended)

Add `.github/dependabot.yml` to keep action SHAs auto-updated via Dependabot PRs. This addresses the "re-check SHAs periodically" requirement that comes with SHA pinning.

## Complexity Tracking

No violations — the workflow follows the simplest viable approach (single job, sequential steps, minimal permissions).
