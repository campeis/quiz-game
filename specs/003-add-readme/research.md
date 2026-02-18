# Research: Project README

**Feature**: 003-add-readme | **Date**: 2026-02-18

## R1: README Content Structure

**Decision**: Follow standard open-source README conventions with sections: title/description, features, tech stack, project structure, getting started, testing/linting.

**Rationale**: Standard README structure is immediately familiar to developers. GitHub renders README.md prominently on the repository landing page, making it the primary entry point for new contributors.

**Alternatives considered**:
- Minimal README (title + link to docs) — rejected because the spec requires inline sections for features, tech stack, and structure
- Comprehensive wiki-style README — rejected because the spec explicitly requires referencing the quickstart guide rather than duplicating its content

## R2: Quickstart Guide Reference Strategy

**Decision**: Provide a brief "Getting Started" section in the README with prerequisites and a summary, then link to `specs/001-multiplayer-quiz/quickstart.md` for detailed instructions.

**Rationale**: FR-008 explicitly prohibits duplicating detailed instructions that exist in the quickstart guide. A brief summary with a link satisfies FR-005 (getting started section) without violating FR-008.

**Alternatives considered**:
- Copying quickstart content into README — rejected per FR-008
- Only linking with no summary — rejected because FR-005 requires prerequisites to be listed

## R3: Project Structure Documentation

**Decision**: Document the top-level directories (`backend/`, `frontend/`, `e2e/`, `fixtures/`) with brief descriptions of their purpose and key subdirectories.

**Rationale**: FR-003 requires describing main directories and their purposes. The project follows a standard web application layout that can be documented concisely.

**Alternatives considered**:
- Full recursive tree — rejected as too verbose and hard to maintain
- Only top-level directories without subdirectories — acceptable but including key subdirectories (src/components, src/models, etc.) provides more value per FR-003

## R4: Tech Stack Presentation

**Decision**: Present tech stack as a categorized list (Backend, Frontend, Testing, Tooling) with technology name and brief role description.

**Rationale**: FR-004 requires listing languages, frameworks, and tools. Categorized presentation makes it easy to scan and matches developer expectations.

**Alternatives considered**:
- Badges only — rejected as less informative for evaluation purposes (US2)
- Plain paragraph — rejected as harder to scan than a structured list

## R5: License Section

**Decision**: Omit license section entirely.

**Rationale**: Edge case in spec explicitly states "The README should not reference a license file unless one exists." No LICENSE file exists in the repository.

**Alternatives considered**:
- Placeholder "License TBD" section — rejected per edge case guidance
