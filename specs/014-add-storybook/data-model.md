# Data Model: Add Storybook Component Showcase

**Date**: 2026-03-14
**Branch**: `014-add-storybook`

> This feature introduces no persistent data entities or backend state. The "data model" below documents the shapes of mock data used in story files to render feature components in isolation, and the prop interfaces for all components receiving stories.

---

## Mock Data: LeaderboardEntryPayload

Used by: `Leaderboard.stories.tsx`, `Podium.stories.tsx`

Matches the existing `LeaderboardEntryPayload` interface from `src/services/messages.ts`:

| Field | Type | Required | Example | Description |
|-------|------|----------|---------|-------------|
| `rank` | `number` | yes | `1` | 1-based ranking position |
| `display_name` | `string` | yes | `"Alice"` | Player display name |
| `avatar` | `string` | yes | `"🦁"` | Single emoji character |
| `score` | `number` | yes | `2500` | Cumulative score |
| `correct_count` | `number` | yes | `3` | Number of correct answers |
| `is_winner` | `boolean` | no | `true` | Set only on rank-1 in final results |

**Canonical mock dataset** (reused across Leaderboard + Podium stories):

```ts
const mockPlayers = [
  { rank: 1, display_name: "Alice",   avatar: "🦁", score: 2500, correct_count: 3, is_winner: true  },
  { rank: 2, display_name: "Bob",     avatar: "🤖", score: 1500, correct_count: 2, is_winner: false },
  { rank: 3, display_name: "Charlie", avatar: "🐸", score: 500,  correct_count: 1, is_winner: false },
]
```

---

## Component Prop Interfaces (Story Args)

### Button

| Prop | Type | Default | Story Variants |
|------|------|---------|----------------|
| `variant` | `"primary" \| "secondary"` | `"primary"` | Primary, Secondary |
| `loading` | `boolean` | `false` | Loading |
| `disabled` | `boolean` | `false` | Disabled |
| `children` | `ReactNode` | — | "Click me" (all stories) |

**Stories**: Primary · Secondary · Disabled · Loading

---

### Card

| Prop | Type | Default | Story Variants |
|------|------|---------|----------------|
| `padding` | `string` | `spacing.lg` | Default, Compact |
| `children` | `ReactNode` | — | Text content or empty |

**Stories**: Default (with content) · Empty · Compact Padding

---

### Timer

| Prop | Type | Default | Story Variants |
|------|------|---------|----------------|
| `totalSeconds` | `number` | — | 30 (running), 30 (paused), 5 (urgent) |
| `running` | `boolean` | — | true / false |
| `onExpired` | `() => void` | — | action callback |

**Stories**: Running · Paused · Urgent (≤15% remaining)

---

### EmojiPicker

| Prop | Type | Story Value |
|------|------|-------------|
| `selected` | `string` | `"🦁"` (Default) / `""` (No Selection) |
| `onSelect` | `(emoji: string) => void` | action callback |

**Stories**: Default Selection · No Selection

---

### Leaderboard

| Prop | Type | Story Variants |
|------|------|----------------|
| `entries` | `LeaderboardEntryPayload[]` | mockPlayers (3 entries) / `[]` |
| `isFinal` | `boolean` | `false` (Mid-game) / `true` (Final) |

**Stories**: Mid-game · Final Results · Empty

---

### Podium

| Prop | Type | Story Variants |
|------|------|----------------|
| `entries` | `LeaderboardEntryPayload[]` | mockPlayers / single entry / `[]` |

**Stories**: Full (3 players) · Single Winner · Empty
