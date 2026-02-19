# Research: YAML Linting

**Feature**: 006-yaml-lint | **Date**: 2026-02-19

## R1: Tool Selection — yamllint

**Decision**: Use `yamllint` (Python CLI).

**Rationale**: Most widely adopted standalone YAML linter; configurable rule set; auto-detects GitHub Actions environment and emits native annotation format; maintained actively on PyPI.

**Alternatives considered**:
- `prettier --check` — reformatting-focused, not a semantic/syntax linter. Rejected.
- `action-validator` — validates GitHub Actions workflow schema only, does not cover all YAML files. Rejected.

## R2: GitHub Actions `on:` False Positive

**Decision**: Configure `truthy: { check-keys: false }` in `.yamllint.yml`.

**Rationale**: YAML 1.1 treats `on` as a boolean truthy alias. yamllint's truthy rule flags it as an error in GitHub Actions workflows where `on:` is used as a mapping key. `check-keys: false` disables truthy checking on map keys only, while still enforcing truthy rules on values. This is the maintainer-recommended fix (yamllint issue #430).

**Alternatives considered**:
- Per-file `# yamllint disable-line rule:truthy` comment — works but adds noise to every workflow file. Rejected.
- Disabling the entire truthy rule — too broad; loses protection against unintended truthy values in other YAML files. Rejected.

## R3: Excluding Generated pnpm Lockfiles

**Decision**: Add `frontend/pnpm-lock.yaml` and `e2e/pnpm-lock.yaml` to the `ignore` block in `.yamllint.yml`.

**Rationale**: pnpm lockfiles are machine-generated, cannot be modified to satisfy yamllint rules (e.g., long lines exceeding 120 chars, specific formatting choices), and do not benefit from linting. The spec requires "all YAML files currently present in the repository MUST pass" — excluding generated files satisfies this while still covering all human-authored YAML.

**Alternatives considered**:
- Linting lockfiles with extremely permissive rules — would require disabling most rules, defeating the purpose. Rejected.
- Moving lockfiles out of scope via CLI pattern instead of config — less maintainable; config-based exclusion is the canonical yamllint approach. Rejected.

## R4: Installation in CI

**Decision**: Install via `pip install yamllint` as a dedicated step before `just lint`.

**Rationale**: `pip install yamllint` is the standard approach. The `ubuntu-latest` runner ships an older apt version; pip ensures the latest stable version. No pinning needed for a linter (unlike security-critical tools).

**Alternatives considered**:
- `apt-get install yamllint` — ships an outdated version. Rejected.
- `ibiqlik/action-yamllint` GitHub Action — adds indirection; yamllint's native GitHub Actions output format already produces PR annotations. Rejected.
- Pinning an exact version (e.g., `yamllint==1.38.0`) — acceptable for reproducibility but adds maintenance overhead for a low-risk tool. Deferred.

## R5: Line Length Limit

**Decision**: Set `line-length: max: 120`.

**Rationale**: The default (`80`) is too strict for CI YAML files that contain SHA pins with comments (`uses: actions/checkout@11bd71...  # v4.2.2`) and multi-part `run:` commands. 120 chars is a widely adopted practical limit for CI configuration files.

**Alternatives considered**:
- `max: 80` (default) — would fail on existing `ci.yml` SHA comment lines. Rejected.
- Disabling line-length rule entirely — loses useful enforcement for extreme cases. Rejected.
