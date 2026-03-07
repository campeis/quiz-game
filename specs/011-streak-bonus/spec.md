# Feature Specification: Streak Bonus Scoring Rule

**Feature Branch**: `011-streak-bonus`
**Created**: 2026-03-07
**Status**: Draft
**Input**: User description: "add a streak bonus scoring rule where at every consecutive correct answer the scoring point is multiplied by an increasing percentage. first correct answer is x1.0. second multiplied x1.5 third x2.0 and so on. the base score is a fixed amount like the base of other scoring rules. an incorrect answer reset the multiplier to x1.0"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Select Streak Bonus in Lobby (Priority: P1)

As a host, I want to select "Streak Bonus" as the scoring rule in the lobby so that players are rewarded for building correct-answer streaks during the quiz.

**Why this priority**: This is the entry point for the feature — without the ability to select it, nothing else matters. It mirrors the existing scoring rule selection and is independently demonstrable.

**Independent Test**: Host uploads a quiz, opens the lobby, sees "Streak Bonus" listed alongside existing rules, selects it, and the selection is reflected back to all connected players.

**Acceptance Scenarios**:

1. **Given** a host is in the lobby, **When** they view the scoring rule options, **Then** "Streak Bonus" appears as a selectable option with a short description of how it works.
2. **Given** a host selects Streak Bonus, **When** the selection is confirmed, **Then** all connected players see the updated scoring rule displayed on their screen.
3. **Given** Streak Bonus is selected, **When** the game starts, **Then** the rule is locked and cannot be changed.

---

### User Story 2 — Points Multiply on Consecutive Correct Answers (Priority: P1)

As a player, I want my score to increase faster the more consecutive questions I answer correctly, so that maintaining a streak is rewarded beyond just answering correctly.

**Why this priority**: This is the core behaviour of the feature. Without it, the rule is indistinguishable from Fixed Score.

**Independent Test**: With Streak Bonus selected, a player who answers questions 1, 2, and 3 correctly receives points scaled by ×1.0, ×1.5, and ×2.0 respectively. The total is visibly higher than Fixed Score would give.

**Acceptance Scenarios**:

1. **Given** Streak Bonus is active and a player has no previous answers, **When** they answer question 1 correctly, **Then** they receive base score × 1.0 points.
2. **Given** a player answered question 1 correctly, **When** they answer question 2 correctly, **Then** they receive base score × 1.5 points.
3. **Given** a player answered questions 1 and 2 correctly, **When** they answer question 3 correctly, **Then** they receive base score × 2.0 points.
4. **Given** a player has a streak of N consecutive correct answers, **When** they answer the next question correctly, **Then** they receive base score × (1.0 + (N × 0.5)) points.

---

### User Story 3 — Incorrect Answer Resets the Multiplier (Priority: P1)

As a player, I want an incorrect answer to reset my streak so that the rule stays fair and skill-based.

**Why this priority**: Without the reset mechanic, the rule loses its strategic tension. It is tightly coupled to User Story 2 and equally essential.

**Independent Test**: A player with a ×2.0 streak multiplier answers incorrectly and then correctly on the next question — they receive base score × 1.0 (not ×2.5).

**Acceptance Scenarios**:

1. **Given** a player has built a streak of 3 (multiplier ×2.0), **When** they answer a question incorrectly, **Then** they receive 0 points and their multiplier resets to ×1.0.
2. **Given** a player's multiplier was just reset to ×1.0, **When** they answer the next question correctly, **Then** they receive base score × 1.0 (streak of 1).
3. **Given** a player does not answer before the question timer expires, **When** the question ends, **Then** their multiplier resets to ×1.0 as though they answered incorrectly.

---

### User Story 4 — Multiplier Shown in Answer Result (Priority: P2)

As a player, I want to see the multiplier applied to my score after each answer so that I understand the effect of my streak and am motivated to maintain it.

**Why this priority**: Enhances engagement and transparency, but the scoring mechanics are complete without it. Delivery can be deferred without breaking the core feature.

**Independent Test**: After answering a question in a Streak Bonus game, the result shown to the player includes the multiplier that was applied (e.g., "×2.0") alongside the points awarded.

**Acceptance Scenarios**:

1. **Given** Streak Bonus is active, **When** a player views the answer result, **Then** the result displays the multiplier applied for that question.
2. **Given** a player's streak was reset, **When** the result is shown, **Then** the displayed multiplier is ×1.0.

---

### Edge Cases

- What happens when the multiplier grows very large (very long streaks)? The multiplier is uncapped — it increases by +0.5 per consecutive correct answer indefinitely, consistent with the feature description specifying no upper limit.
- What happens if a player does not submit an answer before the timer expires? Treated the same as an incorrect answer: 0 points and streak reset to ×1.0.
- What happens when a player reconnects mid-game? Their streak counter is preserved server-side alongside their score, consistent with how existing player state survives reconnection.
- What happens in a single-question game? The first (and only) correct answer always uses ×1.0 — no compounding occurs.
- What streak state does a player start with if they join after the game has already begun? Their streak starts at ×1.0 (streak count = 0), the same as every other player at game start.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide "Streak Bonus" as a selectable scoring rule in the lobby, alongside Stepped Decay, Linear Decay, and Fixed Score.
- **FR-002**: The Streak Bonus rule MUST award base score × streak multiplier points for each correct answer.
- **FR-003**: The streak multiplier MUST start at ×1.0 for a player's first correct answer in a game.
- **FR-004**: The streak multiplier MUST increase by +0.5 for each additional consecutive correct answer (×1.0 → ×1.5 → ×2.0 → ×2.5, etc.), with no upper cap.
- **FR-005**: An incorrect answer MUST reset the player's streak multiplier to ×1.0 and award 0 points.
- **FR-006**: A timed-out (unanswered) question MUST reset the player's streak multiplier to ×1.0, treating the missed answer the same as an incorrect one.
- **FR-007**: The base score for Streak Bonus MUST be 1000 points — the same fixed value used by the Fixed Score rule — so scores remain comparable across rules.
- **FR-008**: Each player's streak state MUST be tracked independently; one player's streak has no effect on another's.
- **FR-009**: The multiplier applied to a player's answer MUST be included in the answer result communicated back to that player.
- **FR-010**: The Streak Bonus rule MUST be selectable only in the lobby and locked once the game starts, consistent with all existing scoring rules.

### Key Entities

- **Player Streak**: A per-player counter tracking the number of consecutive correct answers in the current game session. Resets to 0 on any incorrect or missed answer. Determines the active multiplier.
- **Streak Multiplier**: Derived value = 1.0 + (streak_count × 0.5). Applied to the base score to calculate the points awarded for a correct answer.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player who answers all 5 questions correctly under Streak Bonus earns at least 2× the total points compared to a player who answers identically under Fixed Score, confirming streak compounding delivers meaningful reward.
- **SC-002**: After any incorrect or missed answer, the player's next correct answer awards exactly base score × 1.0 in 100% of cases, confirming the reset is reliable.
- **SC-003**: "Streak Bonus" appears as a selectable option in the lobby for 100% of sessions, with no additional host configuration required beyond selecting it.
- **SC-004**: The multiplier applied to each answer is visible to the player in the result screen without requiring any additional action or navigation.

## Clarifications

### Session 2026-03-07

- Q: What streak state does a player have if they join mid-game (after game start)? → A: Streak starts at ×1.0 (streak count = 0), identical to every other player at game start.

## Assumptions

- The multiplier is uncapped — no maximum streak multiplier is imposed, matching the feature description which specifies no limit.
- A missed (timed-out) answer is treated as incorrect for streak purposes, since it is behaviourally equivalent from a fairness standpoint.
- The base score is 1000 points, identical to the Fixed Score rule, making cross-rule comparison straightforward.
- Streak state is stored server-side and persists through a temporary disconnection within the reconnection window, consistent with how player scores are already preserved.
- The multiplier is shown in the answer result (after answering), not as a real-time overlay during the countdown.
