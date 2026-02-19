# Feature Specification: Expand Dependabot Coverage to All Package Ecosystems

**Feature Branch**: `005-dependabot-expand`
**Created**: 2026-02-19
**Status**: Draft
**Input**: User description: "add dependabot checks for cargo and pnpm. make it check daily. updated github actions check to be run daily too."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Daily Alerts for Outdated Rust Dependencies (Priority: P1)

A maintainer wants to be notified daily when Rust (Cargo) dependencies have available updates, so that security patches and new versions are surfaced quickly. Dependabot scans the Cargo dependency manifest every day and opens pull requests for available updates automatically.

**Why this priority**: Rust dependencies (including transitive ones) can have security vulnerabilities. Daily scanning minimises the window between a patch being released and the maintainer being notified.

**Independent Test**: Verify the Dependabot configuration includes a Cargo ecosystem entry with a daily schedule. Confirm no Cargo update PRs were previously created by Dependabot (since it was unconfigured).

**Acceptance Scenarios**:

1. **Given** the project has a Cargo dependency manifest, **When** a new version of a dependency is published, **Then** Dependabot opens a pull request within 24 hours of the next daily scan
2. **Given** Dependabot is configured for Cargo, **When** all dependencies are up to date, **Then** no pull request is opened

---

### User Story 2 - Daily Alerts for Outdated Node.js (pnpm) Dependencies (Priority: P1)

A maintainer wants to be notified daily when Node.js dependencies (managed with pnpm) have available updates, covering both the frontend and end-to-end test packages.

**Why this priority**: Same urgency as Cargo — npm ecosystem has a high volume of security advisories and frequent patch releases.

**Independent Test**: Verify the Dependabot configuration includes npm ecosystem entries (covering pnpm lockfiles) with a daily schedule for both the `frontend/` and `e2e/` directories.

**Acceptance Scenarios**:

1. **Given** the project has pnpm lockfiles in `frontend/` and `e2e/`, **When** a dependency update is available, **Then** Dependabot opens a pull request within 24 hours of the next daily scan for the relevant directory
2. **Given** both directories are configured, **When** an update exists in `frontend/` but not in `e2e/`, **Then** only a `frontend/` pull request is opened

---

### User Story 3 - Daily Alerts for Outdated GitHub Actions (Priority: P2)

A maintainer wants Dependabot to check for new versions of the pinned GitHub Actions used in the CI workflow on a daily basis, updated from the current weekly schedule.

**Why this priority**: Slightly lower priority than package ecosystems since the Actions dependency surface is smaller, but daily scanning ensures SHA pins are kept current and supply-chain risks are minimised.

**Independent Test**: Verify the Dependabot configuration for the `github-actions` ecosystem has `interval: daily` instead of `weekly`.

**Acceptance Scenarios**:

1. **Given** the CI workflow uses SHA-pinned third-party actions, **When** a new release is published for a pinned action, **Then** Dependabot opens a pull request within 24 hours of the next daily scan
2. **Given** all pinned actions are already at their latest versions, **Then** no pull request is opened

---

### Edge Cases

- What if Dependabot opens many PRs at once (e.g., on first enable)? Each ecosystem will generate individual PRs per outdated package — this is expected behaviour on initial activation.
- What if a pnpm-managed directory has no lockfile yet? Dependabot requires a lockfile to detect npm-ecosystem dependencies; directories without one will be silently skipped.
- What if the same package has updates in both `frontend/` and `e2e/`? Dependabot opens separate PRs per directory — this is expected.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The dependency update system MUST scan Cargo dependencies daily and open pull requests for available updates
- **FR-002**: The dependency update system MUST scan Node.js dependencies in the `frontend/` directory daily and open pull requests for available updates
- **FR-003**: The dependency update system MUST scan Node.js dependencies in the `e2e/` directory daily and open pull requests for available updates
- **FR-004**: The dependency update system MUST scan GitHub Actions dependencies daily (updated from weekly) and open pull requests for available updates
- **FR-005**: All three package ecosystems (Cargo, npm/pnpm, GitHub Actions) MUST share the same daily scanning schedule

### Assumptions

- Dependabot uses the `npm` ecosystem type to detect dependencies from pnpm lockfiles (`pnpm-lock.yaml`) — this is Dependabot's supported approach for pnpm projects
- The existing `.github/dependabot.yml` file will be updated in place, not replaced
- No PR limits or ignore rules are needed at this time — all dependency updates should generate PRs
- Daily scans run at a time determined by GitHub's infrastructure (not user-configurable beyond day/time hints)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The dependency update configuration covers all three ecosystems (Cargo, npm/pnpm, GitHub Actions) — zero package ecosystems left unmonitored
- **SC-002**: All configured ecosystems use a daily check interval — zero ecosystems on a weekly or slower schedule
- **SC-003**: Both Node.js directories (`frontend/` and `e2e/`) are individually configured — a dependency update in either directory generates a pull request within 24 hours of the next scan
- **SC-004**: Dependabot pull requests are opened automatically without any manual intervention from the maintainer
