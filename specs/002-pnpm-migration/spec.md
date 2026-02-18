# Feature Specification: pnpm Migration

**Feature Branch**: `002-pnpm-migration`
**Created**: 2026-02-18
**Status**: Draft
**Input**: User description: "update the project to use pnpm instead of npm"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Installs Dependencies with pnpm (Priority: P1)

A developer clones the repository and runs `pnpm install` in the frontend and e2e directories to install all dependencies. The process completes successfully and the application builds and runs correctly.

**Why this priority**: Without working dependency installation, no other development workflow is possible.

**Independent Test**: Can be fully tested by running `pnpm install` in each package directory, then building the frontend and running the test suites.

**Acceptance Scenarios**:

1. **Given** a fresh clone of the repository, **When** the developer runs `pnpm install` in the `frontend/` directory, **Then** all dependencies are installed and a `pnpm-lock.yaml` lockfile is present.
2. **Given** a fresh clone of the repository, **When** the developer runs `pnpm install` in the `e2e/` directory, **Then** all dependencies are installed and a `pnpm-lock.yaml` lockfile is present.
3. **Given** dependencies are installed via pnpm, **When** the developer builds the frontend, **Then** the build completes without errors.
4. **Given** dependencies are installed via pnpm, **When** the developer runs the test suites (backend, frontend, e2e), **Then** all tests pass.

---

### User Story 2 - Developer Uses Project Commands (Priority: P1)

A developer uses the project's Justfile commands (e.g., `just dev`, `just test`) and all commands work correctly with pnpm replacing npm/npx.

**Why this priority**: Developers rely on Justfile commands for daily workflow; broken commands block all development.

**Independent Test**: Can be tested by running each Justfile recipe and verifying it completes successfully.

**Acceptance Scenarios**:

1. **Given** pnpm is installed and dependencies are set up, **When** the developer runs any Justfile recipe that previously used npm/npx, **Then** the recipe executes correctly using pnpm/pnpx equivalents.
2. **Given** the project documentation references npm commands, **When** a developer reads the quickstart guide, **Then** all commands reference pnpm instead of npm.

---

### User Story 3 - No npm Artifacts Remain (Priority: P2)

After migration, no npm-specific lockfiles or references remain in the project, ensuring developers don't accidentally mix package managers.

**Why this priority**: Mixed package manager usage causes dependency resolution conflicts and confusing errors.

**Independent Test**: Can be tested by searching the repository for npm-specific artifacts and verifying none exist.

**Acceptance Scenarios**:

1. **Given** the migration is complete, **When** searching the repository for `package-lock.json` files, **Then** none are found (outside `node_modules/`).
2. **Given** the migration is complete, **When** searching project scripts and documentation for `npm install` or `npm run` commands, **Then** none are found — all have been replaced with pnpm equivalents.

---

### Edge Cases

- What happens when a developer who only has npm installed tries to run project commands? The documentation should list pnpm as a prerequisite.
- What happens if pnpm is not globally installed? The quickstart guide should include pnpm installation instructions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All `package-lock.json` files MUST be replaced with `pnpm-lock.yaml` lockfiles.
- **FR-002**: All project scripts (Justfile recipes) MUST use `pnpm` or `pnpm exec` instead of `npm` or `npx`.
- **FR-003**: All project documentation MUST reference pnpm commands instead of npm commands.
- **FR-004**: The frontend MUST build successfully using pnpm-installed dependencies.
- **FR-005**: All test suites (backend unit tests, frontend unit tests, e2e tests) MUST pass after migration.
- **FR-006**: The `.gitignore` MUST remain valid for pnpm's `node_modules` structure.
- **FR-007**: The project MUST list pnpm as a prerequisite in developer documentation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All existing test suites pass after migration (backend, frontend, e2e — 43 total tests).
- **SC-002**: Zero references to `npm install`, `npm run`, or `npx` remain in project scripts and documentation.
- **SC-003**: The frontend builds without errors using pnpm-installed dependencies.
- **SC-004**: A developer can set up the project from scratch following the updated quickstart guide using only pnpm.

## Assumptions

- pnpm is available on the developer's machine (will be documented as a prerequisite).
- The `pnpm exec` command serves as the equivalent of `npx` for running package binaries.
- No workspace-level pnpm configuration (e.g., `pnpm-workspace.yaml`) is needed since `frontend/` and `e2e/` are independent directories, not a monorepo workspace.
- No custom npm registry or `.npmrc` configuration is in use that would need to be carried over.
