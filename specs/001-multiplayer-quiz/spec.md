# Feature Specification: Multiplayer Online Quiz

**Feature Branch**: `001-multiplayer-quiz`
**Created**: 2026-02-15
**Status**: Draft
**Input**: User description: "Build a multiplayer online quiz. Quizzes can be provided in a text file. Players will access the quizzes through a web interface. A leaderboard would allow to know who won when the game will finish."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host Creates and Runs a Quiz Game (Priority: P1)

A quiz host opens the web interface and loads a quiz from a text file. The system parses the file and displays the quiz contents for review. The host starts a game session and receives a unique join code. Players use this code to join the game lobby. Once enough players have joined, the host starts the quiz. Questions are presented one at a time to all players simultaneously. After the last question, the game ends and the final leaderboard is displayed.

**Why this priority**: This is the core game loop. Without the ability to host a game from a quiz file and have players participate in real time, no other feature has value.

**Independent Test**: Can be fully tested by one person acting as host (loading a file, starting a game) and at least two browser windows acting as players joining via code, answering questions, and seeing the final leaderboard.

**Acceptance Scenarios**:

1. **Given** a host is on the home page, **When** they upload a valid quiz text file, **Then** the system displays the quiz name, number of questions, and a preview of the content for confirmation.
2. **Given** a quiz has been loaded and confirmed, **When** the host clicks "Start Game", **Then** a unique join code (6 characters, alphanumeric) is generated and displayed prominently.
3. **Given** players have joined the lobby, **When** the host starts the quiz, **Then** the first question is displayed simultaneously to all connected players.
4. **Given** a question is displayed, **When** the time limit for that question expires or all players have answered, **Then** the correct answer is revealed and the next question begins.
5. **Given** the last question has been answered, **When** the quiz ends, **Then** the final leaderboard is displayed to all players showing rankings, scores, and the winner.

---

### User Story 2 - Player Joins and Plays a Quiz (Priority: P2)

A player opens the web interface on their device and enters a join code shared by the host. They choose a display name and enter the game lobby. When the host starts the quiz, questions appear on the player's screen one at a time. The player selects an answer within the time limit. After each question, they see whether they were correct and their current ranking. At the end of the game, they see the full leaderboard.

**Why this priority**: The player experience is the second critical piece of the core game loop. While the host creates the game, players are the majority of users and their experience determines engagement.

**Independent Test**: Can be tested by joining an active game session, answering all questions, and verifying scores update correctly and the final leaderboard reflects accurate results.

**Acceptance Scenarios**:

1. **Given** a player is on the home page, **When** they enter a valid join code, **Then** they are prompted to choose a display name.
2. **Given** a player has entered a display name, **When** they submit it, **Then** they enter the game lobby and see other waiting players.
3. **Given** a question is displayed, **When** the player selects an answer before the time limit, **Then** their answer is recorded and they see immediate feedback (correct/incorrect).
4. **Given** a player does not answer within the time limit, **When** time expires, **Then** the question is marked as unanswered (zero points) and the game continues.
5. **Given** the quiz has ended, **When** the leaderboard is displayed, **Then** the player sees their final rank, score, and how they compare to other players.

---

### User Story 3 - Leaderboard and Scoring (Priority: P3)

During the quiz, players earn points for correct answers. Faster correct answers earn more points than slower ones. After each question, a running leaderboard updates to show current standings. At the end of the quiz, the final leaderboard highlights the winner and shows complete rankings for all players. The host can see the leaderboard at any point during the game.

**Why this priority**: Scoring and the leaderboard are what make the quiz competitive and engaging. Without them the quiz is functional but lacks the motivating game element.

**Independent Test**: Can be tested by running a complete quiz with multiple players answering at different speeds and verifying that scores are calculated correctly, faster answers earn more points, and the leaderboard accurately reflects rankings.

**Acceptance Scenarios**:

1. **Given** a player answers a question correctly, **When** the answer is submitted within the first third of the time limit, **Then** 1000 points are awarded; within the second third, 500 points; within the last third, 250 points.
2. **Given** multiple players have answered a question, **When** the question round ends, **Then** the running leaderboard updates to reflect current standings visible to all participants.
3. **Given** the quiz has ended, **When** the final leaderboard is displayed, **Then** it shows each player's rank, display name, total score, and number of correct answers.
4. **Given** the final leaderboard is displayed, **When** a player views it, **Then** the winner (highest score) is visually highlighted.

---

### User Story 4 - Quiz File Loading and Validation (Priority: P4)

A quiz host prepares a quiz by creating a structured text file containing questions, answer options, and correct answers. When uploaded, the system validates the file format, reports any errors with specific line numbers, and allows the host to fix and re-upload. Valid quizzes are ready to use immediately.

**Why this priority**: File-based quiz creation is the specified input mechanism. While essential, it is a supporting feature that enables the core game loop rather than being the game itself.

**Independent Test**: Can be tested by uploading various text files (valid, malformed, empty, oversized) and verifying correct parsing, helpful error messages, and successful quiz preview for valid files.

**Acceptance Scenarios**:

1. **Given** a host selects a quiz text file, **When** the file is a valid quiz format, **Then** the system parses it and displays a preview with quiz name, question count, and first few questions.
2. **Given** a host selects a malformed text file, **When** the file has formatting errors, **Then** the system displays specific error messages indicating what is wrong and where (line numbers).
3. **Given** a host selects an empty file or non-text file, **When** the upload is attempted, **Then** the system displays a clear error message explaining the expected format.
4. **Given** a quiz file contains more than 100 questions, **When** the file is uploaded, **Then** the system warns the host and suggests splitting into shorter quizzes for better player experience.

---

### Edge Cases

- What happens when a player disconnects mid-quiz? The system preserves their score up to that point and marks them as disconnected. They can rejoin using the same name and code within 2 minutes.
- What happens when the host disconnects? The game pauses for up to 2 minutes awaiting reconnection. If the host does not return, the game ends and the current leaderboard is shown as final.
- What happens when all players leave before the quiz ends? The host is notified that no players remain and can choose to end or wait.
- What happens when two players have the same display name? The system appends a number to make names unique (e.g., "Alex", "Alex 2").
- What happens when two players have the same final score? They share the same rank and are ordered alphabetically by display name.
- What happens when only one player joins? The host can still start the quiz; it functions as a single-player experience.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a host to upload a structured text file containing quiz questions, answer options (2-4 per question), and correct answer indicators.
- **FR-002**: System MUST validate uploaded quiz files and provide specific, actionable error messages for malformed content.
- **FR-003**: System MUST generate a unique 6-character alphanumeric join code for each game session.
- **FR-004**: System MUST allow players to join a game session by entering a valid join code and choosing a display name.
- **FR-005**: System MUST present questions to all connected players simultaneously, one question at a time.
- **FR-006**: System MUST enforce a time limit per question (default: 20 seconds) after which unanswered questions score zero points.
- **FR-007**: System MUST calculate scores using tiered speed scoring: correct answers in the first third of the time limit earn full points (1000), second third earns half points (500), last third earns quarter points (250). Incorrect or unanswered questions earn 0 points.
- **FR-008**: System MUST update and display a running leaderboard after each question.
- **FR-009**: System MUST display a final leaderboard at quiz completion showing rank, display name, total score, correct answer count, and winner highlight.
- **FR-010**: System MUST handle player disconnections gracefully, preserving scores and allowing rejoining within a 2-minute window.
- **FR-011**: System MUST ensure display names within a game session are unique, automatically resolving conflicts.
- **FR-012**: System MUST support quizzes with 1 to 100 questions, each with 2 to 4 answer options.
- **FR-013**: System MUST allow the host to control game flow: start the quiz, see connected players in the lobby, and view the leaderboard at any time.
- **FR-014**: System MUST support multiple concurrent game sessions, each operating independently with its own join code, players, and leaderboard.
- **FR-015**: System MUST enforce a configurable maximum number of concurrent active game sessions. When the limit is reached, new game creation attempts MUST be rejected with a clear message.
- **FR-016**: System MUST display a host dashboard during active question rounds showing: the current question text, number of players who have answered vs. total, time remaining, and running standings.
- **FR-017**: The player and host web interfaces MUST fully responsive. They musts be fully usable on smartphone screens without horizontal scrolling or zoom. They MUST be desktop-friendly.

### Key Entities

- **Quiz**: A collection of questions loaded from a text file. Attributes: name/title, list of questions, author (optional).
- **Question**: A single quiz item. Attributes: question text, list of answer options (2-4), correct answer indicator, time limit.
- **Game Session**: A live instance of a quiz being played. Attributes: join code, host, connected players, current question index, status (lobby/active/finished).
- **Player**: A participant in a game session. Attributes: display name, connection status, score, answer history.
- **Leaderboard**: Rankings for a game session. Attributes: ordered list of players with scores, correct answer counts, and ranks.

### Assumptions

- The quiz text file uses a simple, human-readable structured format (details defined during planning).
- Games are synchronous: all players see the same question at the same time, controlled by the host.
- No user accounts or authentication required; players join via code and display name only.
- Game data is ephemeral; sessions and scores are not persisted after the game ends.
- The host and players use the same web interface but see different views based on their role. During active rounds, the host sees a dashboard (question, answer progress, timer, standings) rather than a player answer view.
- A single game session supports up to 50 concurrent players.
- The system supports multiple concurrent game sessions with a configurable maximum (default to be determined during planning).
- The default time limit per question is 20 seconds.

## Clarifications

### Session 2026-02-15

- Q: What scoring model should be used for speed-based points? → A: Tiered scoring — full points in first third of time, half points in second third, quarter points in last third.
- Q: Should the system support multiple concurrent game sessions? → A: Yes, multiple concurrent sessions with a configurable maximum limit.
- Q: What does the host see during active question rounds? → A: A dashboard showing current question, answer count/progress, time remaining, and running standings.
- Q: What device targeting is required for the web interface? → A: Mobile-first for the player view, desktop-friendly for the host view.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A host can load a quiz file and start a game session within 1 minute.
- **SC-002**: Players can join a game session using a code in under 30 seconds.
- **SC-003**: All connected players see each new question within 1 second of it being presented.
- **SC-004**: The leaderboard updates and is visible to all players within 2 seconds of a question round ending.
- **SC-005**: The system supports at least 50 concurrent players in a single game session without degradation.
- **SC-006**: 95% of users (hosts and players) can complete their first game without external help or instructions.
- **SC-007**: Player reconnection after a brief disconnection succeeds within 2 minutes without losing accumulated score.
- **SC-008**: Invalid quiz files produce error messages that allow the host to fix the issue on the first attempt in 90% of cases.
