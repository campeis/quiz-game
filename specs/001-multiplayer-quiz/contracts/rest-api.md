# REST API Contract: Multiplayer Online Quiz

**Date**: 2026-02-15
**Base URL**: `/api`

## Endpoints

### POST /api/quiz

Upload and validate a quiz file.

**Request**:
- Content-Type: `multipart/form-data`
- Body: file field named `quiz_file` (text file, UTF-8)

**Response 200** (valid quiz):
```json
{
  "title": "My Quiz Title",
  "question_count": 10,
  "preview": [
    {
      "text": "What is the capital of France?",
      "option_count": 4
    },
    {
      "text": "How many continents are there?",
      "option_count": 3
    }
  ],
  "quiz_id": "abc123"
}
```

**Response 400** (invalid quiz file):
```json
{
  "error": "invalid_quiz_file",
  "messages": [
    { "line": 5, "message": "Question has no correct answer (no line starting with *)" },
    { "line": 12, "message": "Question has 5 options, maximum is 4" }
  ]
}
```

**Response 400** (no file / wrong type):
```json
{
  "error": "invalid_upload",
  "message": "Expected a text file upload in the 'quiz_file' field"
}
```

---

### POST /api/sessions

Create a new game session from an uploaded quiz.

**Request**:
```json
{
  "quiz_id": "abc123"
}
```

**Response 201**:
```json
{
  "join_code": "A1B2C3",
  "session_status": "lobby",
  "ws_url": "/ws/host/A1B2C3"
}
```

**Response 409** (max sessions reached):
```json
{
  "error": "max_sessions_reached",
  "message": "Maximum number of concurrent game sessions reached. Please try again later."
}
```

**Response 404** (quiz_id not found):
```json
{
  "error": "quiz_not_found",
  "message": "No uploaded quiz found with the given ID. Please re-upload."
}
```

---

### GET /api/sessions/:join_code

Check if a session exists and is joinable (used by player before WebSocket connect).

**Response 200**:
```json
{
  "join_code": "A1B2C3",
  "session_status": "lobby",
  "player_count": 3,
  "quiz_title": "My Quiz Title",
  "ws_url": "/ws/player/A1B2C3"
}
```

**Response 404**:
```json
{
  "error": "session_not_found",
  "message": "No active game session found with code 'XXXXXX'"
}
```

**Response 409** (game already started):
```json
{
  "error": "session_not_joinable",
  "message": "This game has already started and is no longer accepting new players."
}
```

---

### WebSocket Upgrade Endpoints

- `GET /ws/host/:join_code` — Host WebSocket connection (see websocket-messages.md)
- `GET /ws/player/:join_code?name=DisplayName` — Player WebSocket connection (see websocket-messages.md)

## Common Error Format

All error responses follow this shape:

```json
{
  "error": "error_code_snake_case",
  "message": "Human-readable description of the error"
}
```

Optional additional fields per endpoint (e.g., `messages` array for validation errors).

## HTTP Status Code Usage

| Code | Meaning                                   |
|------|-------------------------------------------|
| 200  | Success                                   |
| 201  | Resource created (session)                |
| 400  | Invalid input (bad file, missing fields)  |
| 404  | Resource not found (session, quiz)        |
| 409  | Conflict (max sessions, game started)     |
| 500  | Internal server error                     |
