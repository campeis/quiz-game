# Feature Specification: Position-Based Scoring Rule

**Feature Branch**: `012-position-based-scoring`
**Created**: 2026-03-08
**Status**: Draft
**Input**: User description: "Position-based scoring rule where points are awarded by answer order among players. Wrong answers or unanswered questions get 0 points. This scoring rule should integrate with the existing ScoringRule enum alongside SteppedDecay, LinearDecay, FixedScore, and StreakBonus. The backend needs to track per-question answer order across players. The frontend should display the scoring rule label on the question screen and show position-based points in the answer result feedback."
*(Note: the original description specified a linear −100 decay formula. This was revised via `/speckit.clarify` to the fixed schedule 1st→1000, 2nd→750, 3rd→500, 4th+→250. See Clarifications section.)*

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host Selects Position Race and Starts Game (Priority: P1)

A host uploads a quiz, selects "Position Race" as the scoring rule from the lobby settings, and starts the game. Players who answer correctly before others receive more points than those who answer later.

**Why this priority**: This is the core feature — without the scoring rule being selectable and functional, nothing else works.

**Independent Test**: Host selects Position Race, starts game, two players answer the same question at different times; the earlier responder receives more points. Delivers the full value of the feature.

**Acceptance Scenarios**:

1. **Given** a host is in the lobby, **When** they select "Position Race" as the scoring rule, **Then** the option is highlighted/checked and persists when the game starts.
2. **Given** Position Race is active and two players answer correctly, **When** player A answers before player B, **Then** player A receives more points than player B.
3. **Given** Position Race is active and a player answers correctly as the 1st player, **When** the answer result is shown, **Then** they receive 1000 points.
4. **Given** Position Race is active and a player answers correctly as the 2nd player, **When** the answer result is shown, **Then** they receive 750 points.
5. **Given** Position Race is active and a player answers correctly as the 3rd player, **When** the answer result is shown, **Then** they receive 500 points.
6. **Given** Position Race is active and a player answers correctly in 4th place or beyond, **When** the answer result is shown, **Then** they receive 250 points.

---

### User Story 2 - Player Sees Scoring Rule Label During Question (Priority: P2)

During an active question under Position Race, each player can see a "Position Race" label on the question screen, helping them understand why answering quickly matters.

**Why this priority**: Visibility of the rule is essential for player strategy and fairness — players must know they are competing on speed order.

**Independent Test**: Start a game with Position Race; a player sees the "Position Race" label on the question screen before answering.

**Acceptance Scenarios**:

1. **Given** a game is started with Position Race selected, **When** a player navigates to the question screen, **Then** the label "Position Race" is visible.
2. **Given** Position Race label is shown, **When** the player answers correctly, **Then** the answer result feedback shows both their position rank and points earned (e.g., "2nd place · +750 points").

---

### User Story 3 - Wrong Answer or No Answer Earns Zero Points (Priority: P2)

Players who answer incorrectly or do not answer before the time limit receive 0 points, regardless of their answer position.

**Why this priority**: Zero-points for wrong/unanswered is a core rule constraint that distinguishes correctness from speed.

**Independent Test**: A player answers incorrectly; the result shows "Incorrect" and "+0 points". A player does not answer; after question ends they see no points awarded.

**Acceptance Scenarios**:

1. **Given** Position Race is active, **When** a player submits a wrong answer, **Then** they receive 0 points regardless of their answer order.
2. **Given** Position Race is active, **When** a player does not answer before the timer expires, **Then** they receive 0 points.
3. **Given** Position Race is active and a player answers incorrectly, **When** the result is shown, **Then** no position rank is displayed for that player.

---

### User Story 4 - Final Leaderboard Reflects Position-Based Scores (Priority: P3)

After all questions, the final leaderboard accurately reflects the cumulative points from position-based scoring across all questions.

**Why this priority**: End-game visibility validates the full scoring flow; lower priority because it depends on P1 working correctly.

**Independent Test**: Complete a game with Position Race and multiple players; the leaderboard shows different totals correlated with who answered fastest across questions.

**Acceptance Scenarios**:

1. **Given** a game with Position Race completes, **When** the final results screen appears, **Then** player scores reflect the sum of position-based points earned per question.
2. **Given** two players competed, **When** one consistently answered first, **Then** that player appears higher on the final leaderboard.

---

### Edge Cases

- What happens when only one player answers a question correctly? They receive 1000 points (1st place).
- What happens when no player answers a question? No points are awarded to anyone.
- What happens when all players answer at exactly the same instant (ties)? The first answer registered by the server wins the earlier position — ordering is determined by server receipt time.
- What happens when 4th place or beyond is reached? All players from 4th position onward receive 250 points (¼ of maximum).
- What happens when the host switches from a different scoring rule to Position Race mid-session? Scoring rules are set before the game starts and cannot change during a game.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a "Position Race" scoring rule option in the lobby settings alongside existing scoring rules.
- **FR-002**: When Position Race is selected, the system MUST award points based strictly on the order in which players submit a correct answer for each question.
- **FR-003**: The system MUST award points to correct responders according to this fixed schedule: 1st → 1000 pts, 2nd → 750 pts, 3rd → 500 pts, 4th and beyond → 250 pts.
- **FR-005**: The system MUST award 0 points for wrong answers and for players who do not respond before the question closes.
- **FR-006**: The system MUST track the per-question answer arrival order across all players for the duration of that question, resetting the counter at the start of each new question. Rank and points MUST be assigned immediately when a correct answer is received — not deferred until question close.
- **FR-007**: The system MUST display the "Position Race" label on the player's question screen when this rule is active.
- **FR-008**: The system MUST show both the position rank and points earned (e.g., "1st place · +1000 points", "2nd place · +750 points") in the answer result feedback after each correct answer.
- **FR-009**: The system MUST NOT display a position rank in the answer result feedback for wrong answers or unanswered questions.

### Key Entities

- **ScoringRule**: Enumeration of available scoring modes; extended with a new `PositionRace` variant.
- **Question Answer Record**: Tracks the order in which correct answers arrive for a single question; resets each question.
- **Answer Result**: Per-player outcome for a question — includes points awarded and correctness.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A host can select "Position Race" in the lobby without additional steps compared to selecting any other scoring rule.
- **SC-002**: In a game with 2+ players, the first correct responder consistently receives more points than later correct responders across all questions.
- **SC-003**: All existing scoring rules (SteppedDecay, LinearDecay, FixedScore, StreakBonus) continue to function correctly after the Position Race rule is added.
- **SC-004**: The "Position Race" label is visible to players on the question screen within the same time frame as other rule labels.
- **SC-005**: Points displayed in the answer result feedback exactly match the fixed schedule: 1st → 1000, 2nd → 750, 3rd → 500, 4th+ → 250.
- **SC-006**: The position rank shown to a correct responder matches their actual server-determined arrival order for that question.

## Clarifications

### Session 2026-03-08

- Q: Should players be shown their position rank alongside the points, or only the points? → A: Show rank + points (e.g., "2nd place · +750 points"); rank is hidden for wrong/unanswered.
- Q: What is the scoring formula? → A: Fixed schedule — 1st: 1000, 2nd: 750 (¾), 3rd: 500 (½), 4th+: 250 (¼), wrong/unanswered: 0.
- Q: When is a correct answer counted for position purposes — immediately on submission or at question close? → A: Immediately on submission — rank and points are assigned the moment the correct answer arrives at the server.

## Assumptions

- Position is determined by server-side receipt order (not client-side submission time), which is the simplest and most fair approach given network variance. Rank and points are assigned immediately when the correct answer arrives — not deferred until question close.
- The position counter resets to 1 at the start of every new question; it does not carry across questions.
- Only correct answers consume a position slot; wrong answers do not increment the counter.
- The scoring rule is chosen by the host before starting the game and cannot be changed while the game is in progress.
- The UI treatment (label, points feedback) follows the same pattern already established for StreakBonus and LinearDecay.
