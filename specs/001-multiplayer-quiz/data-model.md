# Data Model: Multiplayer Online Quiz

**Date**: 2026-02-15
**Branch**: `001-multiplayer-quiz`
**Source**: [spec.md](./spec.md) Key Entities + [research.md](./research.md)

## Entities

### Quiz

Represents a parsed quiz loaded from a text file.

| Field       | Type              | Constraints                        |
|-------------|-------------------|------------------------------------|
| title       | String            | Required, extracted from `#` line  |
| questions   | List\<Question\>  | 1–100 items                        |

**Validation rules**:
- Title must be non-empty
- Must contain at least 1 and at most 100 questions
- Each question must be valid (see Question entity)

### Question

A single quiz item with answer options.

| Field          | Type              | Constraints                           |
|----------------|-------------------|---------------------------------------|
| text           | String            | Required, non-empty                   |
| options        | List\<Option\>    | 2–4 items                             |
| correct_index  | Integer           | Index of the correct option (0-based) |
| time_limit_sec | Integer           | Default: 20, range: 5–120            |

**Validation rules**:
- Exactly one option must be marked as correct
- Option count must be between 2 and 4 inclusive
- Question text must be non-empty
- All option texts must be non-empty and unique within the question

### Option

An answer choice for a question.

| Field   | Type    | Constraints          |
|---------|---------|----------------------|
| text    | String  | Required, non-empty  |

### GameSession

A live instance of a quiz being played.

| Field            | Type                   | Constraints                                |
|------------------|------------------------|--------------------------------------------|
| join_code        | String                 | 6 chars, alphanumeric, unique across active |
| quiz             | Quiz                   | Required, immutable once set               |
| players          | Map\<PlayerId, Player\>| 0–50 entries                               |
| host_id          | String                 | Connection identifier for the host         |
| current_question | Integer                | Index into quiz.questions, -1 = not started|
| status           | SessionStatus          | See state machine below                    |
| question_started | Timestamp              | When current question was presented        |
| created_at       | Timestamp              | Session creation time                      |

**Validation rules**:
- Join code must be unique among all active sessions
- Maximum 50 players per session
- Quiz must be valid before session can transition to Active

### Player

A participant in a game session.

| Field              | Type              | Constraints                        |
|--------------------|-------------------|------------------------------------|
| id                 | String            | Unique within session              |
| display_name       | String            | Required, unique within session    |
| score              | Integer           | >= 0, starts at 0                  |
| correct_count      | Integer           | >= 0, starts at 0                  |
| answers            | List\<Answer\>    | One per answered question          |
| connection_status  | ConnectionStatus  | See enum below                     |
| disconnected_at    | Timestamp (opt)   | Set when disconnected              |

**Validation rules**:
- Display name must be non-empty, max 20 characters
- Display name uniqueness enforced by appending number on conflict
- Reconnection allowed within 2 minutes of disconnection

### Answer

A player's response to a single question.

| Field          | Type      | Constraints                         |
|----------------|-----------|-------------------------------------|
| question_index | Integer   | Which question this answers         |
| selected_index | Integer   | Which option was selected (0-based) |
| time_taken_ms  | Integer   | Milliseconds from question display  |
| points_awarded | Integer   | 0, 250, 500, or 1000               |

### Leaderboard

Derived from player scores within a session. Not stored separately — computed on demand.

| Field   | Type                  | Description                              |
|---------|-----------------------|------------------------------------------|
| entries | List\<LeaderboardEntry\>| Sorted by score desc, then name asc    |

### LeaderboardEntry

| Field         | Type    | Description                |
|---------------|---------|----------------------------|
| rank          | Integer | Position (ties share rank) |
| display_name  | String  | Player's display name      |
| score         | Integer | Total accumulated points   |
| correct_count | Integer | Number of correct answers  |
| is_winner     | Boolean | True for rank 1 (final only)|

## Enums

### SessionStatus

```
Lobby → Active → Finished
         ↓
       Paused → Active (host reconnects)
         ↓
       Finished (host timeout: 2 min)
```

| Value    | Description                                       |
|----------|---------------------------------------------------|
| Lobby    | Waiting for players to join, host can start       |
| Active   | Quiz in progress, questions being presented       |
| Paused   | Host disconnected, waiting for reconnection       |
| Finished | Quiz complete or terminated (timeout/no players)  |

### ConnectionStatus

| Value        | Description                          |
|--------------|--------------------------------------|
| Connected    | Player has active WebSocket          |
| Disconnected | WebSocket lost, within rejoin window |
| Left         | Rejoin window expired                |

## Scoring Logic

Tiered speed scoring per question (FR-007):

| Condition               | Points |
|-------------------------|--------|
| Correct, first third    | 1000   |
| Correct, second third   | 500    |
| Correct, last third     | 250    |
| Incorrect or unanswered | 0      |

Where "third" refers to the question's time limit divided into three equal intervals. For a 20-second time limit: 0–6.67s = 1000, 6.67–13.33s = 500, 13.33–20s = 250.

## Relationships

```
Quiz 1──* Question 1──* Option
GameSession 1──1 Quiz
GameSession 1──* Player 1──* Answer
GameSession ──> Leaderboard (computed)
```
