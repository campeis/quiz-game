# Research: Player Emoji Avatar

## R1 — Avatar Transport Mechanism

**Decision**: URL query parameter `?avatar=<emoji>` on the WebSocket upgrade URL.

**Rationale**: The existing join flow already passes the player name as `?name=<displayName>` — the backend `PlayerParams` struct (in `handlers/ws.rs`) is a `Query<PlayerParams>` extractor. Adding `avatar: Option<String>` to that struct requires one line of Rust with zero new infrastructure. The alternative (sending avatar in the first WebSocket message after connection) would require a handshake protocol and asynchronous state, significantly increasing complexity.

**Alternatives considered**:
- First WebSocket message: More complex, requires a join-handshake protocol — rejected.
- Separate REST endpoint before WebSocket: Double-round-trip, no advantage — rejected.

---

## R2 — Emoji Picker Implementation

**Decision**: Custom curated grid component (`EmojiPicker.tsx`) with a hardcoded list of ~30 emojis. No external library.

**Rationale**: The feature requires a small, curated set of game-appropriate emojis — not the full Unicode catalogue. An external emoji picker library (e.g., emoji-mart) would add ~100 KB to the bundle for a use case where 30 static emoji characters suffice. A simple CSS grid of `<button>` elements is accessible, testable, and requires no dependencies.

**Alternatives considered**:
- `emoji-mart` library: Powerful but ~100 KB bundle cost — rejected for this scope.
- Native emoji keyboard / OS picker: Not cross-platform reliable — rejected.
- Free-text emoji input: Allows invalid input, no curated UX — rejected.

---

## R3 — Default Emoji

**Decision**: `🙂` assigned by the backend if the `avatar` query param is absent or empty.

**Rationale**: The spec requires avatars to never be empty. Assigning the default on the backend (not the frontend) ensures consistency even if the frontend fails to transmit the param. `🙂` is universally supported, gender-neutral, and friendly.

---

## R4 — Curated Emoji Set

**Decision**: 30 emojis covering animals, games, and abstract symbols:

```
🦁 🐯 🐻 🦊 🐼 🐨 🦄 🐸 🐙 🦋
🌈 🎮 🚀 ⭐ 🎯 🎲 🏆 🦸 🧙 🤖
👾 🌟 🔥 ⚡ 🌊 🍕 🎪 🎭 🎨 🎸
```

**Rationale**: Mix of animal emojis (recognisable, fun for all ages) and game/activity symbols. All are single-codepoint or widely-supported sequences. Deliberately gender-neutral. 30 emojis fit in a 5×6 or 6×5 grid without scrolling on mobile.

---

## R5 — Leaderboard Avatar Propagation

**Decision**: Add `avatar: String` to the backend `LeaderboardEntry` struct (in `services/leaderboard.rs`) and include it in the JSON broadcast. Add `avatar: string` to `LeaderboardEntryPayload` in the frontend `messages.ts`.

**Rationale**: The leaderboard is computed from `Player` objects in the session — the `avatar` field is already on `Player`, so adding it to `LeaderboardEntry` is a direct field copy with no additional lookup. This is the only way to display avatars on the leaderboard and host standings screens.

---

## R6 — Player Left Message Avatar

**Decision**: Include `avatar` in `player_left` broadcast for consistency, even though the current UI does not display it.

**Rationale**: Future UI improvements (e.g., showing a "player left" toast with their avatar) will be able to use the field without a backend change. Cost is one field in one message — negligible.
