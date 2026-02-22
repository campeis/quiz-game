# Implementation Plan: Player Emoji Avatar

**Branch**: `007-player-avatar` | **Date**: 2026-02-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/007-player-avatar/spec.md`

## Summary

Add emoji avatar selection to the player join flow. Players pick one emoji from a curated grid before entering the game; if none is chosen a default is assigned. The avatar is stored on the backend `Player` struct as a `String`, transmitted via the existing WebSocket URL query-param pattern (`?avatar=<emoji>`), included in all broadcast messages that carry player identity (`player_joined`, `player_reconnected`, leaderboard entries), and displayed immediately to the left of the player name in every location it appears: lobby, leaderboard, host standings, and final results.

## Technical Context

**Language/Version**: Rust (stable, edition 2024) — backend; TypeScript 5.x — frontend
**Primary Dependencies**: Axum (WebSocket handler) — backend; React 19 — frontend; Vitest — frontend unit tests; Playwright — e2e tests
**Storage**: In-memory only (session-scoped `HashMap<String, Player>` — no persistence change)
**Testing**: `cargo test` (backend unit + integration); Vitest (frontend unit); Playwright (e2e)
**Target Platform**: Browser (desktop + mobile) + GitHub Actions CI (`ubuntu-latest`)
**Performance Goals**: Avatar is a single emoji string — negligible payload overhead; no performance impact
**Constraints**: Must not break existing player join flow; default emoji handles players who skip selection
**Scale/Scope**: Touches 3 backend files, 6 frontend source files, 4 frontend test files, 2 e2e test files; 1 new component (`EmojiPicker`)

## Constitution Check

| Principle | Applies? | Status | Notes |
|-----------|----------|--------|-------|
| I. Code Quality | Yes | PASS | `avatar` is a clean single-field addition to Player; `EmojiPicker` has one responsibility |
| II. Testing Standards | Yes | PASS | Tests explicitly requested in spec; TDD: write failing tests first, then implement; backend unit + integration + frontend unit + e2e all updated |
| III. UX Consistency | Yes | PASS | `[emoji] [name]` format applied uniformly in all four display locations |
| IV. Performance | Yes | PASS | Emoji string adds ~4 bytes to payloads; well within all performance budgets |

**Gate Result**: PASS — no violations.

## Project Structure

### Documentation (this feature)

```text
specs/007-player-avatar/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── websocket-messages.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code

```text
backend/
├── src/
│   ├── models/
│   │   └── player.rs             # MODIFIED — add avatar: String field + update new()
│   ├── services/
│   │   └── leaderboard.rs        # MODIFIED — add avatar to LeaderboardEntry + computation
│   └── handlers/
│       └── ws.rs                 # MODIFIED — add avatar to PlayerParams, Player::new(), all WS broadcasts
└── tests/
    ├── game_flow_test.rs          # MODIFIED — add ?avatar= to WS URL, assert avatar in player_joined
    └── leaderboard_test.rs       # MODIFIED — add avatar to make_player() helper + assertions

frontend/
├── src/
│   ├── components/
│   │   ├── EmojiPicker.tsx       # NEW — curated emoji grid with single-select
│   │   ├── JoinForm.tsx          # MODIFIED — add avatar state + EmojiPicker
│   │   ├── Lobby.tsx             # MODIFIED — render {p.avatar} {p.name}
│   │   ├── Leaderboard.tsx       # MODIFIED — render {entry.avatar} {entry.display_name}
│   │   └── HostDashboard.tsx     # MODIFIED — render {entry.avatar} {entry.display_name} in standings
│   ├── hooks/
│   │   └── useGameState.ts       # MODIFIED — add avatar to player state; populate from WS payloads
│   ├── pages/
│   │   └── PlayerPage.tsx        # MODIFIED — pass avatar as ?avatar= URL query param to WS
│   └── services/
│       └── messages.ts           # MODIFIED — add avatar: string to payload interfaces
└── tests/
    └── unit/
        └── components/
            ├── EmojiPicker.test.tsx    # NEW — renders grid, calls onSelect
            ├── JoinForm.test.tsx       # MODIFIED — avatar picker renders and submits
            ├── Leaderboard.test.tsx    # MODIFIED — avatar appears left of name
            └── HostDashboard.test.tsx  # MODIFIED — avatar appears in standings

e2e/
└── tests/
    ├── player-flow.spec.ts    # MODIFIED — select emoji, verify in lobby
    └── full-game.spec.ts      # MODIFIED — select emojis for Alice + Bob; assert in lobby + leaderboard
```

**Structure Decision**: Web application layout (backend/ + frontend/). No new projects or layers — avatar is a field addition propagated through existing data paths.

## Key Design Decisions

### 1. Avatar Transport: URL Query Param
Avatar is passed as `?avatar=<emoji>` in the WebSocket upgrade URL — the same pattern already used for `?name=<displayName>`. This requires zero new infrastructure; the backend `PlayerParams` struct gains one optional field.

### 2. Default Avatar Assignment: Backend
If `avatar` is absent or empty in the query params, the backend assigns a default (`🙂`). This ensures the avatar field is never null/empty in any downstream message or display.

### 3. Emoji Picker: Curated Grid, No External Library
A simple `EmojiPicker` component renders a fixed list of ~30 curated emojis as clickable buttons in a CSS grid. No emoji library dependency — keeps bundle size small. The list is defined as a constant inside the component.

### 4. Curated Emoji Set (30 emojis)
`🦁 🐯 🐻 🦊 🐼 🐨 🦄 🐸 🐙 🦋 🌈 🎮 🚀 ⭐ 🎯 🎲 🏆 🦸 🧙 🤖 👾 🌟 🔥 ⚡ 🌊 🍕 🎪 🎭 🎨 🎸`

### 5. Avatar Included in All Player Identity Broadcasts
All four WebSocket messages that carry player identity are updated to include `avatar`:
- `player_joined` (broadcast)
- `player_reconnected` (broadcast)
- `player_left` (broadcast — for completeness / future UI)
- Leaderboard entries (broadcast after each question and at game end)

### 6. Reconnection Avatar Preservation
The avatar is stored on the `Player` struct alongside `display_name`. Reconnection uses `display_name` to match the player — the existing avatar on the stored struct is preserved and re-broadcast in `player_reconnected`.

### 7. Frontend State: Add Avatar to Player Object
`GameState.players` changes from `{ id: string; name: string }[]` to `{ id: string; name: string; avatar: string }[]`. The `useGameState` hook populates `avatar` from the `player_joined` and `player_reconnected` payloads.
