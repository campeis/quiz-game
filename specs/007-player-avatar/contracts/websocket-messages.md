# WebSocket Message Contracts: Player Emoji Avatar

All changes are **additive** — existing fields are unchanged; `avatar` is added to relevant messages.

---

## Join URL

```
GET /ws/player/{join_code}?name=<displayName>&avatar=<emoji>
```

| Param | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `name` | string | no | "Player" | Display name, auto-suffixed on collision |
| `avatar` | string | no | "🙂" | Single emoji character; backend assigns default if absent/empty |

---

## player_joined (Broadcast → All)

Sent when a new player successfully joins the session.

```json
{
  "type": "player_joined",
  "payload": {
    "player_id": "uuid-v4",
    "display_name": "Alice",
    "avatar": "🦁",
    "player_count": 3
  }
}
```

**Change**: `avatar` field added.

---

## player_reconnected (Broadcast → All)

Sent when a previously disconnected player reconnects within 120 seconds.

```json
{
  "type": "player_reconnected",
  "payload": {
    "player_id": "uuid-v4",
    "display_name": "Alice",
    "avatar": "🦁",
    "player_count": 3
  }
}
```

**Change**: `avatar` field added. Avatar is read from the stored `Player` struct (preserved across disconnection).

---

## player_left (Broadcast → All)

Sent when a player disconnects or times out.

```json
{
  "type": "player_left",
  "payload": {
    "player_id": "uuid-v4",
    "display_name": "Alice",
    "avatar": "🦁",
    "player_count": 2,
    "reason": "disconnected"
  }
}
```

**Change**: `avatar` field added for completeness.

---

## leaderboard (Broadcast → All)

Sent after each question and at game end. Each entry gains an `avatar` field.

```json
{
  "type": "leaderboard",
  "payload": [
    {
      "rank": 1,
      "display_name": "Alice",
      "avatar": "🦁",
      "score": 2500,
      "correct_count": 3,
      "is_winner": true
    },
    {
      "rank": 2,
      "display_name": "Bob",
      "avatar": "🤖",
      "score": 1500,
      "correct_count": 2,
      "is_winner": false
    }
  ]
}
```

**Change**: `avatar` field added to each leaderboard entry.

---

## name_assigned (PlayerOnly → joining player)

Unchanged — no avatar in this message (avatar is not reassigned on name collision).

```json
{
  "type": "name_assigned",
  "payload": {
    "requested_name": "Alice",
    "assigned_name": "Alice 2"
  }
}
```
