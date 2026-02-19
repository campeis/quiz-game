# Research: Expand Dependabot Coverage

**Feature**: 005-dependabot-expand | **Date**: 2026-02-19

## R1: pnpm Ecosystem Type in Dependabot

**Decision**: Use `npm` as the `package-ecosystem` value for pnpm-managed directories.

**Rationale**: Dependabot does not have a dedicated `pnpm` ecosystem type. It detects `pnpm-lock.yaml` files automatically when `npm` is specified and generates pnpm-compatible update PRs. This is the official supported approach documented by GitHub.

**Alternatives considered**:
- `pnpm` as ecosystem type — does not exist in Dependabot's supported ecosystems list. Rejected.

## R2: Cargo Directory

**Decision**: Set directory to `/backend` for the Cargo ecosystem entry.

**Rationale**: The project's `Cargo.toml` and `Cargo.lock` are located in `backend/`, not at the repository root. Dependabot requires the directory containing the manifest file.

**Alternatives considered**:
- `/` (root) — no `Cargo.toml` at root; Dependabot would find nothing. Rejected.

## R3: Daily Schedule Timing

**Decision**: Use `interval: daily` with no explicit `time` or `timezone` setting.

**Rationale**: GitHub schedules daily runs at a default time (typically early UTC morning). No specific timing requirement exists in the spec. Adding `time`/`timezone` is unnecessary complexity for this feature.

**Alternatives considered**:
- Specifying `time: "09:00"` with a timezone — provides control over when PRs appear but adds configuration complexity without clear benefit. Deferred.
