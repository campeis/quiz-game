# Feature Specification: Configurable Scoring Rules

**Feature Branch**: `009-scoring-rules`
**Created**: 2026-03-01
**Status**: Draft
**Input**: User description: "the host can choose different scoring rules. the rules can be the actual one where the score decreases every 5 seconds. one where it decreases as each second and one where one gets the whole score no matter how much time passed. wrong answer always score 0. implement the scoring rules a strategy to make it easier to add more in the future."

## Clarifications

### Session 2026-03-01

- Q: How is the per-interval score deduction determined for decay rules? → A: Equal-parts — the question time limit divided by the interval length gives the number of steps; the maximum score is divided equally across those steps.
- Q: Is the host's scoring rule choice saved beyond the current game session? → A: Session-only — not persisted; the host selects fresh for each game.
- Q: How should fractional scores from the equal-parts formula be handled? → A: Floor (round down) — always round to the nearest whole point below.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host Selects Scoring Rule Before Game Starts (Priority: P1)

Before starting a quiz session, the host opens the game configuration and selects one of the available scoring rules. The chosen rule is saved and applied to all questions in that session. If the host does not explicitly select a rule, the game defaults to the existing stepped-decay rule (score decreases every 5 seconds).

**Why this priority**: This is the core of the feature — without the ability to choose a rule, all other stories have no value. It directly controls the competitive dynamics of every game.

**Independent Test**: Can be tested by creating a game, selecting each of the three rules one at a time, starting the game, answering a question correctly at different times, and verifying the score matches the selected rule's behaviour.

**Acceptance Scenarios**:

1. **Given** the host is on the game configuration screen, **When** the host selects "Stepped Decay (every 5 seconds)", **Then** the game session is configured with that rule and all questions are scored accordingly.
2. **Given** the host is on the game configuration screen, **When** the host selects "Linear Decay (every second)", **Then** the game session is configured with that rule.
3. **Given** the host is on the game configuration screen, **When** the host selects "Fixed Score", **Then** the game session is configured with that rule.
4. **Given** the host does not explicitly select a rule, **When** the game starts, **Then** the system defaults to "Stepped Decay (every 5 seconds)".

---

### User Story 2 - Players' Scores Are Calculated by the Active Rule (Priority: P2)

During a quiz session, each player's score for a question is calculated according to the scoring rule the host selected. Players who answer correctly receive more or fewer points depending on how quickly they answered and the active rule. Players who answer incorrectly always receive 0 points.

**Why this priority**: The scoring calculation is the observable outcome of the feature. Players and hosts need to trust the scores are correct.

**Independent Test**: Can be tested by running a game with a specific rule selected, submitting correct answers at known times, and verifying the awarded points match the rule's formula. Separately, submitting a wrong answer must always yield 0 points regardless of the rule in effect.

**Acceptance Scenarios**:

1. **Given** the active rule is "Stepped Decay" with a 20-second time limit and maximum score of 100, **When** a player answers correctly within the first 5 seconds, **Then** the player receives 100 points (full score, step 0).
2. **Given** the active rule is "Stepped Decay" with a 20-second time limit and maximum score of 100, **When** a player answers correctly between 5 and 10 seconds, **Then** the player receives 75 points (one step deducted; step size = 100 ÷ 4 steps = 25).
3. **Given** the active rule is "Linear Decay" with a 20-second time limit and maximum score of 100, **When** a player answers correctly after 3 seconds, **Then** the player receives 85 points (3 steps deducted; step size = 100 ÷ 20 steps = 5).
4. **Given** the active rule is "Fixed Score", **When** a player answers correctly at any time, **Then** the player receives the full maximum score.
5. **Given** any scoring rule is active, **When** a player answers incorrectly, **Then** the player receives 0 points.

---

### User Story 3 - Scoring Rule Is Visible to Players During the Game (Priority: P3)

Players can see which scoring rule is active during the game so they can adjust their strategy — for example, prioritising speed under the decay rules but focusing purely on accuracy under the fixed-score rule.

**Why this priority**: Transparency in scoring helps players make informed decisions and prevents confusion or disputes after seeing their scores. It enhances the experience but does not block the feature from working.

**Independent Test**: Can be tested by joining a game as a player, noting the scoring rule displayed, and confirming it matches what the host selected.

**Acceptance Scenarios**:

1. **Given** the host selected "Stepped Decay", **When** a player views the game screen, **Then** the player sees a label indicating "Stepped Decay" scoring is active.
2. **Given** the host selected "Fixed Score", **When** a player views the game screen, **Then** the player sees a label indicating "Fixed Score" scoring is active.

---

### Edge Cases

- What happens when a player does not answer before the question timer expires? The player receives 0 points regardless of the active scoring rule.
- What happens when two players answer at the same elapsed second under Linear Decay? Both receive the same score for that question.
- What happens when the score would mathematically drop below 0 due to decay? The minimum awarded score for a correct answer is 1 point (never negative); 0 is reserved for wrong answers.
- What happens if a host changes the scoring rule mid-game? The rule is locked once the game session starts; it cannot be changed while the session is active.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The host MUST be able to select a scoring rule from a list of available rules before starting the game session.
- **FR-002**: The system MUST provide a "Stepped Decay" scoring rule: the score for a correct answer decreases by one equal step for every 5 seconds elapsed, where step size = maximum score ÷ (question time limit ÷ 5).
- **FR-003**: The system MUST provide a "Linear Decay" scoring rule: the score for a correct answer decreases by one equal step for every 1 second elapsed, where step size = maximum score ÷ question time limit.
- **FR-004**: The system MUST provide a "Fixed Score" scoring rule: the score for a correct answer is always the full maximum points, regardless of time elapsed.
- **FR-005**: The system MUST award 0 points for any incorrect answer, regardless of the active scoring rule.
- **FR-006**: The system MUST apply the selected scoring rule uniformly to every question in a game session.
- **FR-007**: The system MUST default to "Stepped Decay (every 5 seconds)" when the host does not explicitly select a rule.
- **FR-008**: The active scoring rule MUST be visible to players at all times during a game session.
- **FR-009**: The scoring rule MUST be locked once the game session starts and cannot be changed mid-session.
- **FR-010**: The scoring system MUST be structured so that new scoring rules can be added without modifying the logic of any existing rule.
- **FR-011**: The minimum score awarded for a correct answer MUST be 1 point (not 0, to distinguish from a wrong answer); 0 is reserved exclusively for incorrect answers.
- **FR-012**: When the decay formula produces a fractional result, the system MUST floor the value to the nearest whole point before awarding it.

### Key Entities

- **Scoring Rule**: A named policy that computes how many points a player earns for a correct answer given the time elapsed since the question was displayed. Defined by a name, a human-readable description, and an equal-parts decay formula (or no decay for Fixed Score).
- **Game Session**: An instance of a running quiz bound to exactly one scoring rule for its entire duration.
- **Question Score**: The outcome of applying the active scoring rule to a player's answer — capturing correctness, elapsed time, and the resulting points awarded.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Hosts can select a scoring rule within 30 seconds during game setup without requiring additional guidance.
- **SC-002**: 100% of correct answers are scored according to the active rule; fractional results are always floored to whole points, with no rounding inconsistencies that alter the ranking.
- **SC-003**: 100% of incorrect answers result in exactly 0 points, verifiable across all three scoring rules.
- **SC-004**: A new scoring rule can be introduced by a developer and deployed without any change to the existing three rules' behaviour.
- **SC-005**: The active scoring rule name is visible to every connected player on the game screen within 2 seconds of the game starting.

## Assumptions

- The maximum score per question is fixed and determined by existing game configuration (not introduced by this feature).
- Time is measured from the moment the question is displayed to the player until the player submits their answer.
- The three scoring rules described are the initial set; the feature must accommodate future additions without redesign.
- Scoring rule selection is at the game-session level (one rule applies to all questions); per-question rule selection is out of scope. The selection is not persisted — the host chooses fresh for each game session.
- The host interface already has a game-setup / configuration screen where the rule selector can be added.
- Elapsed time is tracked server-side to prevent client-side manipulation.
- The question time limit is known at score calculation time and is uniform across all questions in a session.

## Out of Scope

- Per-question scoring rule overrides.
- Creating custom scoring formulas via a UI.
- Retroactively changing the scoring rule for past game sessions.
- Score bonuses or multipliers beyond what the three rules define.
