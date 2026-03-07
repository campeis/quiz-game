# Feature Specification: Configurable Question Time Limit

**Feature Branch**: `010-question-time-limit`
**Created**: 2026-03-07
**Status**: Draft
**Input**: User description: "an host can setup how many time would be available to answer a question. minimum time that could be set is 10 seconds. validate this input. add a descriptive name for it like 'minimum time has to be greater than 10 seconds'. maximum time that could be set is 60 seconds. add a message that uses a similar tone to the one for the minimum value. default value presented would be 20 seconds. the host would have the possibility to add this value in the same page where the scoring rules are chosen."

## Clarifications

### Session 2026-03-07

- Q: Is the countdown timer server-authoritative (server tracks time and broadcasts the close event) or client-side (each client runs its own countdown)? → A: Server-authoritative: the server tracks elapsed time, broadcasts the close event to all clients, and enforces the answer cutoff.
- Q: Can the host manually close a question before the timer expires? → A: Yes — the host can close a question early at any time; the server immediately broadcasts the close event to all clients.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Set Question Time Limit (Priority: P1)

A quiz host, while setting up a game session, wants to control how long players have to answer each question. On the game setup page — the same page where scoring rules are chosen — the host enters a time limit value (in seconds). The system pre-fills 20 seconds as the default. The host can change this to any value between 10 and 60 seconds. Invalid values are rejected with clear, friendly error messages.

**Why this priority**: This is the core of the feature. Without the ability to set the time limit, nothing else in this feature has value.

**Independent Test**: Can be fully tested by navigating to the game setup page as a host, interacting with the time limit field, and verifying the correct default, validation messages, and accepted values — without needing any other part of the feature.

**Acceptance Scenarios**:

1. **Given** the host is on the game setup page, **When** the page loads, **Then** the time limit field is pre-filled with 20 seconds.
2. **Given** the host is on the game setup page, **When** the host enters 30 and confirms, **Then** the time limit of 30 seconds is saved for the session.
3. **Given** the host enters a value below 10 (e.g., 5), **When** the host confirms or leaves the field, **Then** the system displays an error message such as "Time must be at least 10 seconds."
4. **Given** the host enters a value above 60 (e.g., 90), **When** the host confirms or leaves the field, **Then** the system displays an error message such as "Time must be no more than 60 seconds."
5. **Given** the host enters exactly 10, **When** the host confirms, **Then** the value is accepted and saved.
6. **Given** the host enters exactly 60, **When** the host confirms, **Then** the value is accepted and saved.

---

### User Story 2 - Time Limit Applied During Quiz (Priority: P2)

Once the host has configured the time limit and starts the quiz, each question is presented to players with a countdown matching the configured limit. The server tracks elapsed time and broadcasts the close event when the countdown reaches zero; all connected clients reflect this simultaneously. Answers submitted after the server-issued close event are rejected.

**Why this priority**: The configured value must be enforced during gameplay for the feature to deliver its intended purpose. Without this, the setup step has no effect.

**Independent Test**: Can be tested by setting a time limit (e.g., 15 seconds), starting a quiz session, and verifying that each question's countdown starts at 15 and the question closes automatically at 0 — enforced by the server, not individual clients.

**Acceptance Scenarios**:

1. **Given** the host has set a time limit of 15 seconds and started the quiz, **When** a question is shown, **Then** the server starts a 15-second countdown and notifies all clients to begin displaying it.
2. **Given** a question is active with a 15-second server-side timer, **When** the countdown reaches 0, **Then** the server broadcasts the question-close event; all clients stop the countdown and no further answers are accepted.
3. **Given** a player submits an answer after the server has closed the question, **When** the answer arrives at the server, **Then** it is rejected and not counted.

---

### User Story 3 - Host Closes Question Early (Priority: P3)

While a question is active, the host may decide to close it before the timer expires — for instance, when all players have already answered. The host triggers an early close from the host dashboard, and the server immediately broadcasts the close event to all clients, cancelling the remaining countdown.

**Why this priority**: This is a quality-of-life improvement for the host that keeps sessions moving, but the quiz is fully functional without it — hence lower priority than setup and enforcement.

**Independent Test**: Can be tested by starting a question, waiting a few seconds, triggering an early close from the host view, and verifying that all clients stop the countdown and no further answers are accepted before the timer would have naturally expired.

**Acceptance Scenarios**:

1. **Given** a question is active with time remaining on the countdown, **When** the host triggers an early close, **Then** the server immediately broadcasts the question-close event to all clients.
2. **Given** the host has triggered an early close, **When** a player attempts to submit an answer, **Then** it is rejected by the server.
3. **Given** the host triggers an early close, **When** the close event is broadcast, **Then** the remaining countdown is cancelled on all clients.

---

### Edge Cases

- What happens when the host clears the time limit field and submits? The field should be treated as invalid and an error should prompt the host to provide a value.
- What happens if the host enters a non-numeric value (e.g., letters or symbols)? The system should reject the input and display a validation message.
- What happens at boundary values 10 and 60? Both must be accepted as valid.
- What happens if the host enters 9 or 61? Both must be rejected with appropriate messages.
- What happens if a player's answer arrives at the server in the same instant the server closes the question? The server's close event is authoritative; answers arriving after it are rejected.
- What happens if the host triggers an early close and the timer expires at nearly the same moment? The first close event received by the server wins; the second is a no-op.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The game setup page MUST include a field for the host to enter the question time limit, co-located with the scoring rules configuration.
- **FR-002**: The time limit field MUST be pre-filled with a default value of 20 seconds when the page is loaded.
- **FR-003**: The system MUST reject any time limit value below 10 seconds and display the message: "Time must be at least 10 seconds."
- **FR-004**: The system MUST reject any time limit value above 60 seconds and display the message: "Time must be no more than 60 seconds."
- **FR-005**: The system MUST reject non-numeric or empty time limit values and prompt the host to enter a valid number.
- **FR-006**: The system MUST accept values of exactly 10 and exactly 60 seconds as valid inputs.
- **FR-007**: The configured time limit MUST be applied as the countdown duration for every question during the quiz session.
- **FR-008**: The server MUST track elapsed time for each active question and broadcast a close event to all clients when the countdown expires.
- **FR-009**: The server MUST reject any answer received after the question's server-side close event, regardless of client-side state.
- **FR-010**: The host MUST be able to close an active question early at any time before the timer expires; the server MUST immediately broadcast the close event to all clients upon receiving an early-close request.
- **FR-011**: Once a question is closed (by timer expiry or host early close), any subsequent close signal for the same question MUST be treated as a no-op.

### Key Entities

- **Game Session Settings**: The set of configuration values a host applies before starting a quiz session, including the time limit and scoring rules. The time limit is stored as a whole number of seconds.
- **Question Timer**: The per-question server-side countdown during an active quiz session, initialized from the game session's configured time limit. The server is the sole authority on when the timer expires. A question can be closed by timer expiry or by the host; only the first close event takes effect.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of game sessions use the host-configured time limit as the question countdown duration, with no session using a hardcoded or default override at runtime.
- **SC-002**: Invalid time limit inputs (below 10, above 60, non-numeric, empty) are rejected 100% of the time with a descriptive error message before the session can start.
- **SC-003**: The time limit field is visible and co-located with the scoring rules section on the setup page, requiring no additional navigation steps.
- **SC-004**: Hosts can complete the time limit configuration in under 30 seconds without consulting documentation, measured by usability observation.
- **SC-005**: All connected clients receive the question-close event within 1 second of the server-side timer expiring or the host triggering an early close.

## Assumptions

- The time limit applies uniformly to all questions in a session; per-question overrides are out of scope for this feature.
- The time limit is expressed in whole seconds only (no decimal values).
- The validation messages follow the same friendly tone as the existing scoring rules validation (e.g., "Time must be at least 10 seconds." and "Time must be no more than 60 seconds.").
- The question timer is visible to both the host and all players during the quiz.
- Only the host can configure the time limit; players have no input on this setting.
- The server is the sole authority for timer enforcement; client-side countdown display is cosmetic only.
- The host early-close capability applies during active questions only; it is not available between questions or before the quiz starts.
