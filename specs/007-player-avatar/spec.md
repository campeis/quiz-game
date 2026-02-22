# Feature Specification: Player Emoji Avatar

**Feature Branch**: `007-player-avatar`
**Created**: 2026-02-22
**Status**: Draft
**Input**: User description: "the players can select an avatar when joining a game. the avatar will be an emoji and the player can select it from a picker. the avatar will be shown everywhere the player name will be shown. show it on the left of the name. create and update all needed tests. also make sure e2e tests check the emoji is shown."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Select an Emoji Avatar When Joining (Priority: P1)

A player entering a game join code and display name is presented with an emoji picker. They choose an emoji that will represent them throughout the game. Once they confirm their selection, they enter the game lobby with their chosen avatar visibly attached to their name.

**Why this priority**: This is the core of the feature — without it, no avatar is collected and nothing else can work. It's the join-time entry point that every subsequent display depends on.

**Independent Test**: Navigate to the join screen, enter a name and game code, select an emoji from the picker, and confirm. The player lands in the lobby with `[emoji] [name]` shown. This delivers the full avatar selection experience independently.

**Acceptance Scenarios**:

1. **Given** a player is on the join screen, **When** they open the emoji picker, **Then** a grid of selectable emojis is displayed
2. **Given** the emoji picker is open, **When** the player taps/clicks an emoji, **Then** that emoji is selected and visually highlighted as the current choice
3. **Given** an emoji is selected, **When** the player submits the join form, **Then** their avatar is locked in and they enter the lobby with the emoji shown to the left of their name
4. **Given** a player has not selected an emoji, **When** they submit the join form, **Then** a default emoji is automatically assigned so the avatar slot is never empty

---

### User Story 2 — Avatar Displayed Consistently Everywhere the Name Appears (Priority: P2)

Once a player has joined with an avatar, that emoji appears to the left of their name in every location it is shown during the game: the lobby waiting room, the leaderboard after each question, and the final results screen. The host also sees all player avatars in their view.

**Why this priority**: Consistency is the primary value proposition — the avatar must feel like an integral part of the player's identity across the whole game, not just on one screen. Builds on US1.

**Independent Test**: With a player joined and an avatar selected, progress through a complete game (lobby → question → leaderboard → results). Verify `[emoji] [name]` format in each screen for both the player's own view and the host's view.

**Acceptance Scenarios**:

1. **Given** a player has joined with an avatar, **When** the lobby screen is shown, **Then** their emoji appears immediately to the left of their name in the player list
2. **Given** a question ends and scores are shown, **When** the leaderboard is displayed, **Then** every player's emoji appears to the left of their name in the ranking
3. **Given** the game ends and final results are displayed, **When** the results screen is shown, **Then** every player's emoji appears to the left of their name
4. **Given** the host views any screen that lists players, **When** that screen is rendered, **Then** all player avatars are visible to the left of their names
5. **Given** multiple players have chosen the same emoji, **When** any list is shown, **Then** each player shows their own emoji without conflict (same emoji is allowed for multiple players)

---

### Edge Cases

- What happens when a player joins without explicitly selecting an avatar? → A default emoji is assigned automatically; no player can appear without an avatar.
- What if two or more players choose the same emoji? → Permitted; no uniqueness constraint is enforced.
- What if the player's device cannot render a specific emoji? → The emoji falls back to the device's native emoji rendering; no special handling required.
- What if the player reconnects mid-game? → Their previously selected avatar is retained and continues to display correctly.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The join flow MUST include an emoji picker that allows the player to select one emoji as their avatar before entering the game
- **FR-002**: The system MUST assign a default emoji avatar to any player who does not explicitly make a selection, so the avatar field is never empty
- **FR-003**: The selected avatar MUST be transmitted to all participants (host and other players) when the player joins, without requiring a page refresh
- **FR-004**: The player's avatar MUST appear immediately to the left of their name in every location where the player's name is displayed during the game session (lobby, leaderboard, question results, final results)
- **FR-005**: The emoji picker MUST display a curated, predefined set of emojis large enough to feel personal but small enough to be easily scannable
- **FR-006**: Two or more players MUST be allowed to select the same emoji; avatar uniqueness is NOT enforced
- **FR-007**: The avatar MUST persist for the entire game session and survive reconnection — if a player disconnects and reconnects, their avatar is restored
- **FR-008**: All existing automated tests MUST be updated to include the avatar field where player name is used, and new tests MUST verify avatar display in the e2e suite

### Key Entities

- **Player Avatar**: An emoji character chosen by the player at join time; associated with the player for the duration of their game session; displayed as a prefix to the player's display name in all views

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can open the emoji picker, select an avatar, and complete the join flow in under 60 seconds total (including entering name and game code)
- **SC-002**: The player avatar appears to the left of the player name in 100% of the locations where the name is displayed (lobby, leaderboard, question results, final results) — verified by automated e2e tests
- **SC-003**: The avatar is visible to all participants (host + all connected players) within 2 seconds of the player joining, without any manual refresh
- **SC-004**: All automated tests (unit, integration, e2e) pass with avatar coverage; e2e tests explicitly assert emoji visibility on each screen where names appear

## Assumptions

- The emoji picker shows a curated list of 20–40 fun, game-appropriate emojis rather than the full Unicode emoji catalogue
- Avatar data is session-scoped: it is not stored beyond the current game session
- The avatar is a single emoji character (no custom images or multi-codepoint sequences beyond standard emoji)
- The format `[emoji] [name]` is applied uniformly everywhere — no per-screen formatting variation
- Players cannot change their avatar after joining; the selection is locked at join time

## Dependencies & Constraints

- Depends on the existing player join flow and the data structure that carries player information to all participants
- The avatar must propagate via the same real-time channel already used for player state updates (no new infrastructure required)
- Must not break existing name-display behaviour for any participant who joins without an avatar (default emoji handles this)
