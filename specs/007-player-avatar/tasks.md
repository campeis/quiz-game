# Tasks: Player Emoji Avatar

**Input**: Design documents from `/specs/007-player-avatar/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/websocket-messages.md, research.md, quickstart.md

**Tests**: TDD approach mandated by constitution — backend and frontend tests are written/updated to fail before implementation makes them pass. Backend struct changes are foundational (must compile before tests can run); all other changes follow test-first order.

**Organization**: Tasks grouped by phase and user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on each other)
- **[Story]**: Which user story this task belongs to
- Exact file paths included in all descriptions

---

## Phase 1: Backend Foundation (Shared — Blocks All Other Work)

**Purpose**: Extend the `Player` struct and join handler with the `avatar` field. This must compile before any tests can run.

**⚠️ CRITICAL**: All subsequent phases depend on this phase being complete.

- [X] T001 Add `avatar: String` field to `Player` struct in `backend/src/models/player.rs`; update `Player::new(id, display_name, avatar)` constructor signature; add constant `DEFAULT_AVATAR: &str = "🙂"` (or equivalent) at the top of the file
- [X] T002 Add `avatar: Option<String>` to `PlayerParams` struct in `backend/src/handlers/ws.rs`; assign default avatar when `avatar` is `None` or empty before creating the player; pass `avatar` to `Player::new()`

**Checkpoint**: `cargo build` succeeds — foundation compiles

---

## Phase 2: Backend Tests (TDD — Write Failing Tests Before Implementing Broadcasts)

**Purpose**: Encode the expected behaviour in tests before implementing it.

**⚠️ NOTE**: These tests MUST fail after this phase and before Phase 3.

- [X] T003 [P] Update `backend/tests/game_flow_test.rs`: add `?avatar=🦁` to the player WebSocket URL; assert that the `player_joined` message payload includes `"avatar": "🦁"`
- [X] T004 [P] Update `backend/tests/leaderboard_test.rs`: update `make_player()` helper to accept/store an `avatar` field; add assertions that leaderboard entries include the `avatar` field from the player

**Checkpoint**: `cargo test` fails on T003 and T004 (avatar missing from broadcasts/leaderboard) — expected

---

## Phase 3: Backend Implementation (Make Phase 2 Tests Pass)

**Purpose**: Include `avatar` in all WebSocket broadcasts and leaderboard entries.

- [X] T005 In `backend/src/handlers/ws.rs`: add `"avatar": avatar` to the `player_joined` broadcast JSON; add `"avatar": avatar` to the `player_reconnected` broadcast JSON (read from stored `Player.avatar`); add `"avatar": player.avatar` to the `player_left` broadcast JSON
- [X] T006 In the leaderboard service (`backend/src/services/leaderboard.rs` — identify exact file during implementation): add `avatar: String` field to the leaderboard entry struct; copy `player.avatar` into each entry during computation; add `avatar` to the serialized JSON output

**Checkpoint**: `cargo test` passes — all backend tests green

---

## Phase 4: Frontend Types Foundation (Shared — Blocks US1 and US2)

**Purpose**: Update TypeScript interfaces so the compiler enforces avatar presence across all frontend code.

- [X] T007 In `frontend/src/services/messages.ts`: add `avatar: string` to `PlayerJoinedPayload`, `PlayerReconnectedPayload`, `PlayerLeftPayload`, and `LeaderboardEntryPayload`
- [X] T008 [US1+US2] Write failing unit test for `useGameState.ts` hook in `frontend/tests/unit/hooks/useGameState.test.ts` (create file): assert that dispatching a `player_joined` message with `{ player_id, display_name, avatar, player_count }` adds `{ id, name, avatar }` to `state.players`; assert that dispatching `player_reconnected` updates the existing player entry with the stored avatar; tests MUST fail before T009 is implemented
- [X] T009 In `frontend/src/hooks/useGameState.ts`: change the player object type from `{ id: string; name: string }` to `{ id: string; name: string; avatar: string }`; populate `avatar` from `p.avatar` in the `player_joined` and `player_reconnected` case handlers

**Checkpoint**: `pnpm --filter frontend tsc --noEmit` succeeds; T008 tests pass after T009 implementation

---

## Phase 5: User Story 1 — Avatar Selection at Join (Priority: P1) 🎯 MVP

**Goal**: Player selects an emoji on the join screen; it is transmitted to the backend when joining.

**Independent Test**: Open join screen, select an emoji, submit — player enters lobby with the selected emoji visible.

### Tests for US1 (TDD — write before implementing)

> **Write these tests FIRST — they must FAIL before Phase 5 implementation**

- [X] T009 [P] [US1] Create `frontend/tests/unit/components/EmojiPicker.test.tsx`: test that the component renders all 30 curated emojis as buttons; test that clicking an emoji calls `onSelect` with that emoji; test that the selected emoji has a visual highlight (e.g., aria-pressed or a CSS class)
- [X] T010 [P] [US1] Update `frontend/tests/unit/components/JoinForm.test.tsx`: add test that the emoji picker renders below the name field; add test that submitting the form calls `onJoined` with the selected avatar emoji; add test that a default avatar is used if no emoji is selected

### Implementation for US1

- [X] T011 [US1] Create `frontend/src/components/EmojiPicker.tsx`: renders a grid of 30 curated emojis (`🦁 🐯 🐻 🦊 🐼 🐨 🦄 🐸 🐙 🦋 🌈 🎮 🚀 ⭐ 🎯 🎲 🏆 🦸 🧙 🤖 👾 🌟 🔥 ⚡ 🌊 🍕 🎪 🎭 🎨 🎸`); accepts `onSelect: (emoji: string) => void` and `selected: string` props; highlights the currently selected emoji; defines the emoji list as a constant in the file
- [X] T012 [US1] Update `frontend/src/components/JoinForm.tsx`: add `avatar` state (default `"🙂"`); render `<EmojiPicker>` below the display name field; pass `avatar` as a third argument to `onJoined(info, displayName, avatar)` (update `JoinFormProps` callback signature accordingly)
- [X] T013 [US1] Update `frontend/src/pages/PlayerPage.tsx`: receive `avatar` from the `onJoined` callback; append `&avatar=${encodeURIComponent(avatar)}` to the WebSocket URL query string alongside `?name=...`

**Checkpoint**: `pnpm --filter frontend test` passes (T009 + T010 green); player joins lobby with emoji visible

---

## Phase 6: User Story 2 — Avatar Displayed Everywhere (Priority: P2)

**Goal**: Avatar appears to the left of the player name in every location names are shown.

**Independent Test**: After joining with an avatar, navigate lobby → leaderboard → final results; verify `[emoji] [name]` format in all views and host view.

### Tests for US2 (TDD — write before implementing)

> **Write these tests FIRST — they must FAIL before Phase 6 implementation**

- [X] T014 [P] [US2] Update `frontend/tests/unit/components/Leaderboard.test.tsx`: update mock data to include `avatar` on each entry; add assertions that each player row renders the avatar to the left of `display_name` (e.g., `expect(screen.getByText("🦁 Alice")).toBeInTheDocument()` or equivalent structure)
- [X] T015 [P] [US2] Update `frontend/tests/unit/components/HostDashboard.test.tsx`: update mock leaderboard data to include `avatar`; add assertions that standings rows render `{avatar} {display_name}` format

### Implementation for US2

- [X] T016 [P] [US2] Update `frontend/src/components/Lobby.tsx`: change player list item from `{p.name}` to `{p.avatar} {p.name}`
- [X] T017 [P] [US2] Update `frontend/src/components/Leaderboard.tsx`: change display name paragraph from `{entry.display_name}` to `{entry.avatar} {entry.display_name}`
- [X] T018 [P] [US2] Update `frontend/src/components/HostDashboard.tsx`: change standings span from `#{entry.rank} {entry.display_name}` to `#{entry.rank} {entry.avatar} {entry.display_name}`

**Checkpoint**: `pnpm --filter frontend test` passes (T014 + T015 green); all four display locations show avatar

---

## Phase 7: E2E Tests

**Purpose**: End-to-end verification that the avatar is visible in the UI at every stage.

> **Write these tests FIRST — they must FAIL before the full stack is wired**

- [X] T019 [US1] Update `e2e/tests/player-flow.spec.ts`: add step to select an emoji from the picker (click on `🦁` by its text content or role); assert the selected emoji is highlighted; after joining, assert the lobby player list contains `🦁` alongside the player name
- [X] T020 [US1+US2] Update `e2e/tests/full-game.spec.ts`: have Alice select `🦁` and Bob select `🤖` during join; assert both emojis appear in the lobby player list; after the game ends, assert the final leaderboard rows contain `🦁 Alice` and `🤖 Bob`; add a second scenario where both Alice and Bob select `🦁` (same emoji) — assert both appear in the lobby without error, verifying FR-006 (duplicate avatars allowed)

**Checkpoint**: `pnpm --filter e2e test` (or `just test-e2e`) passes with all avatar assertions green

---

## Phase 8: Polish & Validation

**Purpose**: Full end-to-end verification and quickstart scenario validation.

- [X] T021 [P] Run `just test` — all backend unit, backend integration, frontend unit, and e2e tests pass with zero failures; confirm no regressions in existing tests

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Backend Foundation)**: No dependencies — start immediately; BLOCKS all phases
- **Phase 2 (Backend Tests)**: Depends on Phase 1 (must compile)
- **Phase 3 (Backend Implementation)**: Depends on Phase 2 (make failing tests pass)
- **Phase 4 (Frontend Foundation)**: Depends on Phase 1; can run in parallel with Phases 2–3
- **Phase 5 (US1)**: Depends on Phase 4
- **Phase 6 (US2)**: Depends on Phase 4; can run in parallel with Phase 5
- **Phase 7 (E2E)**: Depends on Phases 3, 5, and 6 all complete
- **Phase 8 (Polish)**: Depends on all phases complete

### Parallel Opportunities

- T003 and T004 (backend tests) — different files, can run in parallel
- T007 and T008 (frontend types) — sequential dependency (T007 types used in T008)
- T009 and T010 (US1 tests) — different files, can run in parallel
- T011, T012, T013 (US1 impl) — sequential (EmojiPicker → JoinForm → PlayerPage)
- T014 and T015 (US2 tests) — different files, can run in parallel
- T016, T017, T018 (US2 display impl) — different files, can run in parallel

### Critical Path

T001 → T002 → T003/T004 → T005/T006 → T007 → T008 → T009/T010 → T011 → T012 → T013 → T014/T015 → T016/T017/T018 → T019/T020 → T021

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phases 1–3 (backend with avatar support)
2. Complete Phase 4 (frontend types)
3. Complete Phase 5 (US1: join with emoji picker)
4. **STOP and VALIDATE**: Player joins with emoji; lobby shows `[emoji] [name]`

### Incremental Delivery

1. Phases 1–4 → Backend + frontend types ready
2. Phase 5 → US1 complete (join + lobby avatar) — MVP!
3. Phase 6 → US2 complete (leaderboard + host standings avatar)
4. Phase 7 → E2E coverage complete
5. Phase 8 → Full test suite green

---

## Notes

- [P] tasks = different files, no sequential dependency between them
- Tests MUST be written before implementation for US1 and US2 (constitution requirement)
- Backend struct changes (Phase 1) cannot follow TDD strictly — struct must compile before tests run
- `DEFAULT_AVATAR = "🙂"` is the backend fallback; frontend default state should also be `"🙂"` for consistency
- Avatar uniqueness is NOT enforced — two players may pick the same emoji (FR-006)
- T013 (`PlayerPage.tsx`) must use `encodeURIComponent()` — emojis are multi-byte and must be URL-encoded
