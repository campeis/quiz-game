# Data Model: Avatar Picker Modal on Join Screen

**Feature**: 008-avatar-picker-modal | **Date**: 2026-02-22

## Entities

### 1. JoinForm (component state)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `joinCode` | `string` | `""` | 6-character room code (existing) |
| `displayName` | `string` | `""` | Player display name (existing) |
| `avatar` | `string` | `"🙂"` | Selected emoji (existing) |
| `loading` | `boolean` | `false` | API call in progress (existing) |
| `error` | `string \| null` | `null` | Validation/API error message (existing) |
| `isModalOpen` | `boolean` | `false` | **NEW** — controls AvatarPickerModal visibility |

### 2. AvatarPickerModal (component props)

| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | Whether the modal is shown |
| `selected` | `string` | Currently selected avatar (for EmojiPicker highlight) |
| `onSelect` | `(emoji: string) => void` | Called when player clicks an emoji; caller is responsible for closing |
| `onClose` | `() => void` | Called on ✕ click, backdrop click, or Escape key |

### 3. EmojiPicker (unchanged)

| Prop | Type | Description |
|------|------|-------------|
| `selected` | `string` | Highlighted emoji (aria-pressed=true) |
| `onSelect` | `(emoji: string) => void` | Called when an emoji button is clicked |

## State Transitions

```
JoinForm mounts
  → isModalOpen = false, avatar = "🙂"

Player clicks avatar preview button
  → isModalOpen = true

[Modal open]
  Player clicks emoji in modal
    → onSelect(emoji) called by JoinForm
    → avatar = emoji, isModalOpen = false

  Player clicks ✕ button
    → onClose() called
    → isModalOpen = false, avatar unchanged

  Player clicks backdrop (outside modal box)
    → onClose() called
    → isModalOpen = false, avatar unchanged

  Player presses Escape
    → onClose() called
    → isModalOpen = false, avatar unchanged

Player submits form
  → avatar (whatever is currently selected) passed to onJoined()
```

## Interaction Contract (JoinForm ↔ AvatarPickerModal)

```typescript
// In JoinForm:
const handleAvatarSelect = (emoji: string) => {
  setAvatar(emoji);
  setIsModalOpen(false);
};

<AvatarPickerModal
  open={isModalOpen}
  selected={avatar}
  onSelect={handleAvatarSelect}
  onClose={() => setIsModalOpen(false)}
/>
```

## No Backend Changes

The avatar flows to the backend identically to the 007-player-avatar implementation:
- Avatar is stored as `string` on `Player` struct (backend)
- Passed via URL query param: `?avatar=<encodeURIComponent(emoji)>`
- `LeaderboardEntry.avatar` field unchanged
- No WebSocket message format changes
