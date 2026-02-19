# Feature Specification: YAML Linting

**Feature Branch**: `006-yaml-lint`
**Created**: 2026-02-19
**Status**: Draft
**Input**: User description: "add yaml linting checks. add this to just file. add this to github actions ci workflow. it should check all yaml files. make sure all present yaml files pass the test."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Catches YAML Errors Locally (Priority: P1)

A developer edits a YAML file in the project (e.g., the CI workflow or Dependabot config) and introduces a syntax or formatting error. They run the YAML linting command locally via the project's task runner. The linter reports the error with the file name and line number so the developer can fix it before committing.

**Why this priority**: Local feedback is faster than waiting for CI. Catching YAML errors before a push prevents failed CI runs and reduces iteration time.

**Independent Test**: Introduce a deliberate YAML syntax error in any project YAML file, run the lint command locally, and verify it reports the error. Fix the error, re-run, and verify it reports success.

**Acceptance Scenarios**:

1. **Given** all YAML files in the project are valid, **When** the developer runs the YAML lint command, **Then** the command exits successfully with no errors reported
2. **Given** a YAML file contains a syntax error, **When** the developer runs the YAML lint command, **Then** the command exits with a non-zero status and reports which file and line contain the error
3. **Given** the YAML lint command is available, **When** the developer runs it, **Then** it checks every `.yml` and `.yaml` file in the repository

---

### User Story 2 - CI Blocks Merges with Invalid YAML (Priority: P2)

A developer pushes a commit to `main` that contains a YAML file with an error. The CI workflow automatically runs YAML linting as part of the lint step and fails, preventing the broken configuration from being accepted.

**Why this priority**: CI enforcement ensures the linting check cannot be skipped, even if a developer forgets to run it locally.

**Independent Test**: Push a commit to `main` with a YAML syntax error and verify the CI lint step fails and reports the error.

**Acceptance Scenarios**:

1. **Given** a push to `main` contains a YAML file with an error, **When** the CI workflow runs linting, **Then** the lint step fails and the run is marked as failed
2. **Given** all YAML files are valid, **When** the CI workflow runs linting, **Then** the lint step passes and the workflow continues

---

### Edge Cases

- What if new YAML files are added to the repository in the future? The linting command must check all YAML files by pattern, not a hardcoded list, so new files are checked automatically.
- What if a YAML file uses advanced features that a strict linter rejects but that the consuming tool accepts? The linting rules must be aligned with the project's actual YAML usage (no false positives for valid constructs).
- What if no YAML files exist matching the pattern? The linter should exit successfully rather than erroring on an empty file set.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The project MUST provide a command using `yamllint` that checks all YAML files (`.yml` and `.yaml`) in the repository for syntax and formatting errors, configured to handle GitHub Actions-specific constructs without false positives
- **FR-002**: The YAML lint command MUST be accessible via the project's existing task runner (the same way other lint commands are run)
- **FR-003**: The YAML lint command MUST be integrated into the existing CI workflow's lint step so it runs automatically on every push to `main`
- **FR-004**: The YAML lint command MUST exit with a non-zero status code when any YAML file contains an error, and with zero when all files are valid
- **FR-005**: All YAML files currently present in the repository MUST pass the linter with zero errors before this feature is complete
- **FR-006**: The linting check MUST cover files recursively across the entire repository (not limited to a specific directory)

### Assumptions

- The project already has a task runner (`just`) and a CI workflow — this feature extends both rather than replacing them
- YAML linting is added to the existing `lint` task in the task runner (not a separate task), consistent with how other linters are integrated
- YAML linting is added to the existing CI lint step (not a new CI job), keeping CI configuration minimal
- The linter will be run without auto-fix capability in CI (check-only mode); auto-fix may be available locally
- All existing project YAML files are well-formed and expected to pass linting with minimal or no changes required
- The linting tool is `yamllint`, configured to avoid false positives for GitHub Actions expression syntax (`${{ }}`) and the bare `on:` key

## Clarifications

### Session 2026-02-19

- Q: Which YAML linting tool should be used? → A: `yamllint`

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Running the lint command locally checks all YAML files and exits with zero on the current codebase — zero YAML errors in the repository at time of delivery
- **SC-002**: The CI workflow lint step includes YAML checking — a push containing a YAML syntax error causes the CI lint step to fail within the existing run
- **SC-003**: The lint command covers YAML files across the entire repository — zero YAML files are excluded from checking
- **SC-004**: The YAML lint check adds no more than 30 seconds to the total CI runtime on a clean codebase
