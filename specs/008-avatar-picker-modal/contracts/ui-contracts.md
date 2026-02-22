# UI Contracts: Avatar Picker Modal on Join Screen

**Feature**: 008-avatar-picker-modal | **Date**: 2026-02-22

## No API changes

This feature has no new API endpoints or WebSocket messages. Avatar continues to flow to backend via existing URL query parameter:

```
GET /ws/player/{join_code}?name={displayName}&avatar={encodeURIComponent(emoji)}
```

## AvatarPickerModal component contract

### Props

```typescript
interface AvatarPickerModalProps {
  open: boolean;               // When false, component renders null
  selected: string;            // Current avatar emoji (passed to EmojiPicker for highlight)
  onSelect: (emoji: string) => void;  // Called with chosen emoji; caller handles close
  onClose: () => void;         // Called on ✕, backdrop, or Escape — no emoji arg
}
```

### ARIA contract

| Attribute | Value | Where |
|-----------|-------|-------|
| `role` | `"dialog"` | Modal container div |
| `aria-modal` | `"true"` | Modal container div |
| `aria-label` | `"Choose your avatar"` | Modal container div |
| `aria-label` | `"Choose avatar"` | Avatar preview button (in JoinForm) |
| `aria-label` | `"Close avatar picker"` | ✕ close button |
| `aria-pressed` | `"true"` / `"false"` | Each emoji button (from EmojiPicker, unchanged) |

### Dismiss contract

| Trigger | Outcome |
|---------|---------|
| Click emoji | `onSelect(emoji)` called, then `onClose()` called |
| Click ✕ button | `onClose()` called; `onSelect` NOT called |
| Click backdrop (outside modal box) | `onClose()` called; `onSelect` NOT called |
| Press Escape | `onClose()` called; `onSelect` NOT called |

### Focus contract

- When modal opens: focus moves to ✕ button (`autoFocus`)
- While modal open: Tab/Shift+Tab cycles through ✕ button + 30 emoji buttons only
- When modal closes: focus returns to avatar preview button in JoinForm

## JoinForm layout contract

The display name row changes from:

```
[ display name input (full width) ]
[ emoji grid (30 buttons, inline) ]
```

To:

```
[ avatar preview btn ] [ display name input (flex: 1) ]
[ (no inline emoji grid) ]
[ AvatarPickerModal (conditionally rendered, modal overlay) ]
```
