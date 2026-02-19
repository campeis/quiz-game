# Implementation Plan: Expand Dependabot Coverage to All Package Ecosystems

**Branch**: `005-dependabot-expand` | **Date**: 2026-02-19 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-dependabot-expand/spec.md`

## Summary

Update `.github/dependabot.yml` to add Cargo and npm (pnpm) ecosystem entries for `backend/`, `frontend/`, and `e2e/`, and change all schedules from `weekly` to `daily`. Single file change — no application code modifications.

## Technical Context

**Language/Version**: YAML (Dependabot configuration syntax v2)
**Primary Dependencies**: None — modifies existing `.github/dependabot.yml`
**Storage**: N/A
**Testing**: Manual — verify the config file has four ecosystem entries all with `interval: daily`
**Target Platform**: GitHub Dependabot service
**Project Type**: Configuration-only (single YAML file update)
**Performance Goals**: N/A
**Constraints**: Dependabot uses `npm` as the ecosystem type for pnpm projects (pnpm-lock.yaml is detected automatically); Cargo.toml is in `backend/` so directory is `/backend`
**Scale/Scope**: Four ecosystem entries in one file

## Constitution Check

| Principle | Applies? | Status | Notes |
|-----------|----------|--------|-------|
| I. Code Quality | Partially | PASS | YAML is clean, consistent indentation, self-documenting entries |
| II. Testing Standards | No | N/A | No code to test; validation is visual inspection of the config file |
| III. UX Consistency | No | N/A | No user-facing UI |
| IV. Performance | No | N/A | No runtime impact |

**Gate Result**: PASS — no violations.

## Project Structure

### Documentation (this feature)

```text
specs/005-dependabot-expand/
├── plan.md              # This file
├── research.md          # Phase 0 output (minimal — no unknowns)
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
.github/
└── dependabot.yml       # MODIFIED — add cargo, npm×2 entries; all daily
```

No data-model.md or contracts/ needed.

## Dependabot Configuration Design

### Ecosystem Mapping

| Ecosystem | Directory | Lockfile | Interval |
|-----------|-----------|----------|----------|
| `github-actions` | `/` | N/A | `daily` (changed from `weekly`) |
| `cargo` | `/backend` | `Cargo.lock` | `daily` (new) |
| `npm` | `/frontend` | `pnpm-lock.yaml` | `daily` (new) |
| `npm` | `/e2e` | `pnpm-lock.yaml` | `daily` (new) |

**Note**: Dependabot uses `npm` as the package-ecosystem identifier for pnpm projects. It detects pnpm-lock.yaml automatically and generates pnpm-compatible PRs.

**Structure Decision**: Single file at repository root (`.github/dependabot.yml`). All four entries are top-level `updates` array items — no nesting or grouping needed.
