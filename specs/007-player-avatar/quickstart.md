# Quickstart: Player Emoji Avatar

## Prerequisites

- `just setup` completed (all dependencies installed)
- `just dev` running (backend on `:3000`, frontend on `:5173`)
- A quiz file for testing (e.g., `fixtures/sample.txt`)

---

## Scenario 1: Player Selects an Avatar (Happy Path)

1. Open two browser windows: one for Host, one for Player.

2. **Host** — go to `http://localhost:5173`, upload a quiz file, and note the join code (e.g., `ABC123`).

3. **Player** — go to `http://localhost:5173`, click "Join Game":
   - Enter the join code `ABC123`
   - Enter display name `Alice`
   - The emoji picker should appear below the name field
   - Click on `🦁` (lion emoji)
   - The selected emoji should be visually highlighted
   - Click "Join"

4. **Verify in Lobby (Player view)**: The player's own entry shows `🦁 Alice`.

5. **Verify in Lobby (Host view)**: The player list shows `🦁 Alice`.

**Expected**: Avatar appears to the left of the name in both views immediately on join.

---

## Scenario 2: Default Avatar (No Selection)

1. Repeat the join flow above but do NOT select any emoji.
2. Submit the join form.

**Expected**: Player appears in the lobby with the default avatar `🙂` to the left of their name (`🙂 Alice`).

---

## Scenario 3: Avatar on Leaderboard

1. Complete Scenario 1 (player joins with `🦁`).
2. Host starts the game.
3. Answer at least one question.
4. When the leaderboard appears (after the question):

   - **Host view**: Each leaderboard row shows `🦁 Alice` (emoji left of name).
   - **Player view** (if applicable): Same format on the results screen.

**Expected**: Avatar is consistent from lobby through to leaderboard.

---

## Scenario 4: Multiple Players, Same Emoji

1. Join with two players (`Alice` and `Bob`), both selecting `🤖`.
2. Verify both appear in the lobby as `🤖 Alice` and `🤖 Bob`.

**Expected**: No error or conflict — same emoji is allowed for multiple players.

---

## Scenario 5: Avatar Survives Reconnection

1. Player joins with avatar `🦊`.
2. Player closes and reopens their browser tab within 120 seconds.
3. Player re-enters the same name and join code.

**Expected**: Player rejoins with `🦊` — avatar is preserved from the stored session.

---

## Automated Test Validation

```bash
# Backend unit + integration tests
just test-backend

# Frontend unit tests
just test-frontend

# E2E tests (requires just dev running in another terminal)
just test-e2e
```

All tests must pass with zero failures. E2E tests should explicitly assert:
- Emoji picker renders on the join screen
- Selected emoji appears in the lobby player list
- Avatar appears to the left of the name in the final leaderboard

---

## WebSocket Validation (Manual)

Using browser DevTools → Network → WS:

1. After a player joins, find the WebSocket connection for `/ws/player/...`.
2. In the Messages tab, find the `player_joined` message.
3. Verify payload: `{ "player_id": "...", "display_name": "Alice", "avatar": "🦁", "player_count": 1 }`.
4. After a question ends, find the `leaderboard` message.
5. Verify each entry has an `"avatar"` field.
