# Feature Specification: GitHub Actions CI Workflow

**Feature Branch**: `004-github-actions-ci`
**Created**: 2026-02-19
**Status**: Draft
**Input**: User description: "add github actions workflow that check tests, linting and build all succeeds. make it setup dependencies using the just command. make sure it is secure. just run the workflow when something is committed to the main branch."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automated Quality Gate on Push to Main (Priority: P1)

A developer pushes a commit to the `main` branch. The CI workflow automatically runs, installs all project dependencies using `just setup`, then executes tests, linting, and a production build. If any step fails, the workflow reports a failure with clear details about what went wrong. If all steps pass, the workflow reports success.

**Why this priority**: This is the core value of the feature — preventing broken code from reaching the main branch and providing immediate feedback to developers.

**Independent Test**: Push a commit with a deliberate test failure to `main` and verify the workflow triggers, runs, and reports a failure. Then push a clean commit and verify it reports success.

**Acceptance Scenarios**:

1. **Given** a commit is pushed to `main`, **When** the workflow triggers, **Then** it installs all project dependencies using the `just setup` command before running any checks
2. **Given** dependencies are installed, **When** the workflow runs checks, **Then** it executes backend tests, frontend tests, and E2E tests
3. **Given** dependencies are installed, **When** the workflow runs checks, **Then** it executes linting for both backend and frontend
4. **Given** dependencies are installed, **When** the workflow runs checks, **Then** it executes a production build
5. **Given** any check fails, **When** the workflow completes, **Then** it reports a failure with details identifying which step failed
6. **Given** all checks pass, **When** the workflow completes, **Then** it reports success

---

### User Story 2 - Workflow Scoped to Main Branch Only (Priority: P2)

A developer pushes commits to a feature branch or opens a pull request. The CI workflow does NOT trigger for those events — it only fires on direct commits to `main`.

**Why this priority**: The user explicitly scoped the workflow to main-branch pushes only. Unwanted triggers on other branches waste CI minutes and clutter run history.

**Independent Test**: Push a commit to a non-main branch and verify the workflow does not appear in the Actions run history.

**Acceptance Scenarios**:

1. **Given** a commit is pushed to a non-main branch, **When** GitHub evaluates the workflow triggers, **Then** the workflow does not run
2. **Given** a pull request is opened or updated, **When** GitHub evaluates the workflow triggers, **Then** the workflow does not run

---

### Edge Cases

- What if `just setup` fails (e.g., a dependency cannot be downloaded)? The workflow must fail at the setup step and not proceed to subsequent steps.
- What if a step hangs indefinitely? The workflow must enforce a maximum execution time to prevent unbounded resource consumption.
- What if secrets or environment variables are needed in the future? They must be injected via the CI platform's secrets mechanism — never hardcoded in the workflow file.
- What if a third-party action used in the workflow has a supply-chain compromise? All third-party actions must be pinned to a specific immutable version to prevent unexpected changes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The workflow MUST trigger automatically on every push to the `main` branch
- **FR-002**: The workflow MUST NOT trigger on pushes to branches other than `main` or on pull request events
- **FR-003**: The workflow MUST install all project dependencies by running `just setup` as the first substantive step
- **FR-004**: The workflow MUST run the full test suite using `just test`
- **FR-005**: The workflow MUST run linting using `just lint`
- **FR-006**: The workflow MUST run a production build using `just build`
- **FR-007**: The workflow MUST fail and halt immediately if any step exits with a non-zero status, reporting which step failed
- **FR-008**: The workflow MUST enforce a maximum total execution time to prevent indefinite hangs
- **FR-009**: All third-party actions used in the workflow MUST be pinned to a specific immutable version (not a floating tag)
- **FR-010**: The workflow MUST grant only the minimum permissions required — read-only access to repository contents unless a specific step requires more

### Assumptions

- The CI runner is a standard Linux (Ubuntu) environment
- Rust (stable), Node.js 20+, pnpm, and `just` are not pre-installed on the runner and must be set up as part of the workflow
- E2E tests require a browser runtime, which is already handled by `just setup` (`pnpm exec playwright install chromium`)
- No deployment step is in scope — this is CI only
- No environment secrets are required for tests, linting, or build to pass in the current codebase
- Dependency caching (Rust build artifacts, pnpm package store) is a plan-level optimization to meet SC-003; it is not a functional requirement but is expected to be part of any production-ready CI implementation

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every push to `main` triggers the workflow — zero pushes to `main` go unchecked
- **SC-002**: A push containing a test failure, lint error, or build error causes the workflow to report failure — broken commits are never silently accepted
- **SC-003**: The workflow completes a full run (setup + test + lint + build) on a clean codebase within 15 minutes
- **SC-004**: Zero third-party actions are used without being pinned to a specific immutable version
- **SC-005**: The workflow file grants no write permissions to repository contents unless explicitly required and documented
