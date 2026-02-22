# Quickstart: Avatar Picker Modal on Join Screen

**Feature**: 008-avatar-picker-modal | **Date**: 2026-02-22

## What changes

This feature replaces the inline emoji grid in the join form with a modal-based interaction. The change is **frontend-only** — no backend code is modified.

| File | Change |
|------|--------|
| `frontend/src/components/AvatarPickerModal.tsx` | **NEW** — blocking modal with EmojiPicker inside |
| `frontend/src/components/JoinForm.tsx` | **MODIFIED** — avatar preview button + `isModalOpen` state |
| `frontend/src/components/EmojiPicker.tsx` | **UNCHANGED** |
| `frontend/tests/unit/components/AvatarPickerModal.test.tsx` | **NEW** |
| `frontend/tests/unit/components/JoinForm.test.tsx` | **MODIFIED** — update broken tests + add modal path tests |
| `e2e/tests/player-flow.spec.ts` | **MODIFIED** — update two tests to use modal interaction |
| `e2e/tests/full-game.spec.ts` | **MODIFIED** — update avatar-selection steps to open modal first |

## TDD Order (per constitution)

1. Write failing `AvatarPickerModal.test.tsx` (all modal unit tests)
2. Write failing updated `JoinForm.test.tsx` (avatar preview + modal interaction tests)
3. Write failing e2e updates in `player-flow.spec.ts`
4. Create `AvatarPickerModal.tsx` and make tests pass
5. Update `JoinForm.tsx` and make tests pass
6. Update `full-game.spec.ts` e2e tests (these pass once implementation is complete)

## Key implementation notes

### AvatarPickerModal structure

```tsx
// Renders null when open=false (clean conditional render)
if (!open) return null;

return (
  <div
    // Backdrop — covers entire screen
    style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)',
             zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    onClick={onClose}               // backdrop click → dismiss
    onKeyDown={handleKeyDown}       // Escape → dismiss
    tabIndex={-1}
  >
    <div
      role="dialog" aria-modal="true" aria-label="Choose your avatar"
      style={{ position: 'relative', maxWidth: '380px', width: '90%', ... }}
      onClick={(e) => e.stopPropagation()} // prevent backdrop click firing
    >
      <button autoFocus aria-label="Close avatar picker" onClick={onClose}>✕</button>
      <h3>Choose Your Avatar</h3>
      <EmojiPicker
        selected={selected}
        onSelect={(emoji) => { onSelect(emoji); onClose(); }}
      />
    </div>
  </div>
);
```

### JoinForm display name row

```tsx
// Avatar preview + name input side by side
<div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg }}>
  <button
    type="button"
    aria-label="Choose avatar"
    onClick={() => setIsModalOpen(true)}
    style={{ fontSize: typography.sizes.xxl, minWidth: '48px', minHeight: '48px', ... }}
  >
    {avatar}
  </button>
  <input
    id="display-name"
    style={{ flex: 1, ... /* same as before, minus marginBottom */ }}
    ...
  />
</div>
```

## Running tests

```bash
# Unit tests
cd frontend && pnpm test

# E2E tests (requires running app)
pnpm -w run dev &
cd e2e && pnpm exec playwright test player-flow.spec.ts
```
