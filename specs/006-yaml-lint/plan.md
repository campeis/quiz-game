# Implementation Plan: YAML Linting

**Branch**: `006-yaml-lint` | **Date**: 2026-02-19 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/006-yaml-lint/spec.md`

## Summary

Add `yamllint` to the project as a YAML syntax and formatting linter. Install via `pip install yamllint` in CI, configure via `.yamllint.yml` at the repository root (with GitHub Actions truthy-key fix and lockfile exclusions), extend the `lint` recipe in `Justfile` with `yamllint .`, add a `pip install yamllint` step to the CI workflow before the lint step, and verify all existing YAML files pass with zero errors.

## Technical Context

**Language/Version**: Python (yamllint is a Python CLI tool, version latest stable)
**Primary Dependencies**: `yamllint` (Python package, installed via pip)
**Storage**: N/A
**Testing**: Run `yamllint .` on current codebase — must exit 0
**Target Platform**: Developer workstation (local lint) + GitHub Actions `ubuntu-latest` runner (CI lint)
**Project Type**: Configuration change (3 files modified/created: `.yamllint.yml`, `Justfile`, `.github/workflows/ci.yml`)
**Performance Goals**: SC-004 — adds no more than 30 seconds to CI runtime (yamllint on 4 files is effectively instant)
**Constraints**: Must not flag `on:` in GitHub Actions workflows as a truthy error; must exclude generated pnpm lockfiles from linting
**Scale/Scope**: 4 YAML files currently; 2 are human-authored and checked, 2 are generated lockfiles and excluded

## Constitution Check

| Principle | Applies? | Status | Notes |
|-----------|----------|--------|-------|
| I. Code Quality | Yes | PASS | yamllint enforces consistent YAML formatting across the project |
| II. Testing Standards | Partially | PASS | No new unit tests needed; validation is `yamllint .` exiting 0 on current codebase |
| III. UX Consistency | No | N/A | No user-facing UI |
| IV. Performance | Yes | PASS | 4 YAML files — linting time is negligible; well within SC-004 30s budget |

**Gate Result**: PASS — no violations.

## Project Structure

### Documentation (this feature)

```text
specs/006-yaml-lint/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
.yamllint.yml            # NEW — yamllint configuration

Justfile                 # MODIFIED — add `yamllint .` to lint recipe

.github/
└── workflows/
    └── ci.yml           # MODIFIED — add `pip install yamllint` step before lint step
```

No data-model.md or contracts/ needed.

**Structure Decision**: `.yamllint.yml` at repository root (auto-detected by yamllint). No subdirectory placement needed.

## yamllint Configuration Design

```yaml
extends: default

ignore: |
  frontend/pnpm-lock.yaml
  e2e/pnpm-lock.yaml

rules:
  truthy:
    allowed-values: ["true", "false"]
    check-keys: false          # prevents false positive on "on:" in GitHub Actions workflows
  line-length:
    max: 120
    allow-non-breakable-words: true
  comments:
    require-starting-space: true
    min-spaces-from-content: 2
```

**Key design choices**:
- `check-keys: false` — suppresses `on:` truthy false positive in `ci.yml` (yamllint issue #430)
- `ignore` block — excludes machine-generated pnpm lockfiles which would fail line-length rules
- `extends: default` — inherits all other sensible defaults (indentation, colons, brackets, etc.)
- `line-length: max: 120` — practical for CI YAML with long `run:` commands and SHA comments

## Justfile Change

Add to the `lint` recipe (after existing checks):

```
yamllint .
```

And to `lint-fix` recipe: yamllint has no auto-fix mode, so no addition needed there.

## CI Workflow Change

Add a step **before** the existing `Lint (just lint)` step:

```yaml
- name: Install yamllint
  run: pip install yamllint
```

This keeps the install co-located with its usage in the lint step, consistent with how `just setup` handles other tool installs.
