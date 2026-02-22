# Data Model: Player Emoji Avatar

## Backend Changes

### Player Struct (`backend/src/models/player.rs`)

**Before:**
```rust
pub struct Player {
    pub id: String,
    pub display_name: String,
    pub score: u32,
    pub correct_count: u32,
    pub answers: Vec<Answer>,
    pub connection_status: ConnectionStatus,
    pub disconnected_at: Option<Instant>,
}

impl Player {
    pub fn new(id: String, display_name: String) -> Self { ... }
}
```

**After:**
```rust
pub struct Player {
    pub id: String,
    pub display_name: String,
    pub avatar: String,              // NEW — emoji character, never empty
    pub score: u32,
    pub correct_count: u32,
    pub answers: Vec<Answer>,
    pub connection_status: ConnectionStatus,
    pub disconnected_at: Option<Instant>,
}

impl Player {
    pub fn new(id: String, display_name: String, avatar: String) -> Self { ... }
}
```

**Invariant**: `avatar` is never empty. The backend assigns `DEFAULT_AVATAR = "🙂"` if the client sends an empty or absent value.

---

### LeaderboardEntry (inferred: `backend/src/services/leaderboard.rs`)

**Before:**
```rust
pub struct LeaderboardEntry {
    pub rank: u32,
    pub display_name: String,
    pub score: u32,
    pub correct_count: u32,
    pub is_winner: bool,
}
```

**After:**
```rust
pub struct LeaderboardEntry {
    pub rank: u32,
    pub display_name: String,
    pub avatar: String,              // NEW — copied from Player.avatar
    pub score: u32,
    pub correct_count: u32,
    pub is_winner: bool,
}
```

---

### PlayerParams (`backend/src/handlers/ws.rs`)

**Before:**
```rust
struct PlayerParams {
    name: Option<String>,
}
```

**After:**
```rust
struct PlayerParams {
    name: Option<String>,
    avatar: Option<String>,          // NEW — emoji query param; defaults to DEFAULT_AVATAR if absent
}
```

---

## Frontend Type Changes

### `frontend/src/services/messages.ts`

**PlayerJoinedPayload — before:**
```typescript
export interface PlayerJoinedPayload {
    player_id: string;
    display_name: string;
    player_count: number;
}
```

**PlayerJoinedPayload — after:**
```typescript
export interface PlayerJoinedPayload {
    player_id: string;
    display_name: string;
    avatar: string;                  // NEW
    player_count: number;
}
```

Same addition applies to:
- `PlayerReconnectedPayload` — add `avatar: string`
- `PlayerLeftPayload` — add `avatar: string`
- `LeaderboardEntryPayload` — add `avatar: string`

---

### `frontend/src/hooks/useGameState.ts`

**GameState.players — before:**
```typescript
players: { id: string; name: string }[];
```

**GameState.players — after:**
```typescript
players: { id: string; name: string; avatar: string }[];
```

**player_joined handler — before:**
```typescript
case MSG.PLAYER_JOINED: {
    const p = message.payload as PlayerJoinedPayload;
    return {
        ...state,
        players: [...state.players, { id: p.player_id, name: p.display_name }],
        playerCount: p.player_count,
    };
}
```

**player_joined handler — after:**
```typescript
case MSG.PLAYER_JOINED: {
    const p = message.payload as PlayerJoinedPayload;
    return {
        ...state,
        players: [...state.players, { id: p.player_id, name: p.display_name, avatar: p.avatar }],
        playerCount: p.player_count,
    };
}
```

Same `avatar` addition applies to the `player_reconnected` handler.

---

## Display Format

Everywhere `player.name` or `entry.display_name` is rendered, the output changes to:

```
{player.avatar} {player.name}
```

Applied in:
- `Lobby.tsx` — `{p.avatar} {p.name}`
- `Leaderboard.tsx` — `{entry.avatar} {entry.display_name}`
- `HostDashboard.tsx` — `{entry.avatar} {entry.display_name}` in standings
