# WebSocket Message Contract: Multiplayer Online Quiz

**Date**: 2026-02-15
**Protocol**: JSON over WebSocket (text frames)

All messages follow a common envelope:

```json
{
  "type": "message_type",
  "payload": { ... }
}
```

## Connection Endpoints

- **Host**: `GET /ws/host/:join_code`
- **Player**: `GET /ws/player/:join_code?name=DisplayName`

On connection, the server validates the join code and (for players) the display name. If invalid, the connection is closed with an appropriate close code and reason.

## Server → Client Messages

### `player_joined`

Sent to host and all players when a new player joins the lobby.

```json
{
  "type": "player_joined",
  "payload": {
    "player_id": "p-abc123",
    "display_name": "Alice",
    "player_count": 5
  }
}
```

### `player_left`

Sent to host and all players when a player disconnects or leaves.

```json
{
  "type": "player_left",
  "payload": {
    "player_id": "p-abc123",
    "display_name": "Alice",
    "player_count": 4,
    "reason": "disconnected"
  }
}
```

### `player_reconnected`

Sent to host and all players when a disconnected player rejoins.

```json
{
  "type": "player_reconnected",
  "payload": {
    "player_id": "p-abc123",
    "display_name": "Alice",
    "player_count": 5
  }
}
```

### `game_starting`

Sent to all when host starts the quiz. Brief countdown before first question.

```json
{
  "type": "game_starting",
  "payload": {
    "countdown_sec": 3,
    "total_questions": 10
  }
}
```

### `question`

Sent to all players and host when a new question begins.

```json
{
  "type": "question",
  "payload": {
    "question_index": 0,
    "total_questions": 10,
    "text": "What is the capital of France?",
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "time_limit_sec": 20
  }
}
```

### `answer_count` (host only)

Sent to host as players submit answers (real-time progress).

```json
{
  "type": "answer_count",
  "payload": {
    "answered": 12,
    "total": 20
  }
}
```

### `answer_result` (player only)

Sent to the individual player after they submit an answer.

```json
{
  "type": "answer_result",
  "payload": {
    "correct": true,
    "points_awarded": 1000,
    "correct_index": 2
  }
}
```

### `question_ended`

Sent to all when time expires or all players have answered.

```json
{
  "type": "question_ended",
  "payload": {
    "correct_index": 2,
    "correct_text": "Paris",
    "leaderboard": [
      { "rank": 1, "display_name": "Alice", "score": 2500, "correct_count": 3 },
      { "rank": 2, "display_name": "Bob", "score": 2000, "correct_count": 2 },
      { "rank": 2, "display_name": "Charlie", "score": 2000, "correct_count": 3 }
    ]
  }
}
```

### `game_finished`

Sent to all when the quiz is complete.

```json
{
  "type": "game_finished",
  "payload": {
    "leaderboard": [
      {
        "rank": 1,
        "display_name": "Alice",
        "score": 8500,
        "correct_count": 9,
        "is_winner": true
      },
      {
        "rank": 2,
        "display_name": "Bob",
        "score": 7000,
        "correct_count": 8,
        "is_winner": false
      }
    ],
    "total_questions": 10
  }
}
```

### `game_paused`

Sent to all players when host disconnects.

```json
{
  "type": "game_paused",
  "payload": {
    "reason": "host_disconnected",
    "timeout_sec": 120
  }
}
```

### `game_resumed`

Sent to all when host reconnects during pause.

```json
{
  "type": "game_resumed",
  "payload": {}
}
```

### `game_terminated`

Sent to all when game ends abnormally (host timeout, no players).

```json
{
  "type": "game_terminated",
  "payload": {
    "reason": "host_timeout",
    "final_leaderboard": [ ... ]
  }
}
```

### `error`

Sent to a specific client on invalid action.

```json
{
  "type": "error",
  "payload": {
    "code": "already_answered",
    "message": "You have already submitted an answer for this question"
  }
}
```

### `name_assigned`

Sent to a player on join if their name was modified for uniqueness.

```json
{
  "type": "name_assigned",
  "payload": {
    "requested_name": "Alex",
    "assigned_name": "Alex 2"
  }
}
```

## Client → Server Messages

### `submit_answer` (player → server)

Player selects an answer for the current question.

```json
{
  "type": "submit_answer",
  "payload": {
    "question_index": 0,
    "selected_index": 2
  }
}
```

**Validation**:
- `question_index` must match current active question
- `selected_index` must be valid option index (0-based)
- Player must not have already answered this question
- Must be within time limit

### `start_game` (host → server)

Host triggers quiz start from lobby.

```json
{
  "type": "start_game",
  "payload": {}
}
```

**Validation**:
- Session must be in `Lobby` status
- At least 1 player must be connected

### `next_question` (host → server)

Host advances to next question (optional; auto-advance is default after `question_ended`).

```json
{
  "type": "next_question",
  "payload": {}
}
```

### `end_game` (host → server)

Host manually ends the game early.

```json
{
  "type": "end_game",
  "payload": {}
}
```

## WebSocket Close Codes

| Code | Reason                                    |
|------|-------------------------------------------|
| 1000 | Normal close (game ended, player left)    |
| 4001 | Invalid join code                         |
| 4002 | Session not joinable (already started)    |
| 4003 | Session full (50 players)                 |
| 4004 | Invalid display name                      |
| 4005 | Duplicate connection (same player ID)     |

## Message Flow: Typical Game

```
Host connects → /ws/host/A1B2C3
Player 1 connects → /ws/player/A1B2C3?name=Alice
  ← player_joined (to host + all players)
Player 2 connects → /ws/player/A1B2C3?name=Bob
  ← player_joined (to host + all players)
Host → start_game
  ← game_starting (to all)
  ← question (to all)
Player 1 → submit_answer
  ← answer_result (to Player 1)
  ← answer_count (to host)
Player 2 → submit_answer
  ← answer_result (to Player 2)
  ← answer_count (to host)
  ← question_ended (to all, with leaderboard)
  ← question (next question, to all)
  ... repeat for all questions ...
  ← game_finished (to all, with final leaderboard)
```
