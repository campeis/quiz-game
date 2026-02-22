# Research: Avatar Picker Modal on Join Screen

**Feature**: 008-avatar-picker-modal | **Date**: 2026-02-22

## R-001: Modal implementation strategy

**Decision**: Custom backdrop `<div>` with React state (`isModalOpen: boolean`), not native `<dialog>`.

**Rationale**:
- Native `<dialog showModal()>` requires a ref + imperative DOM call inside `useEffect`, which is awkward in a declarative React 19 component.
- Custom overlay gives explicit, readable control: open/close via state, Escape via `onKeyDown`, backdrop click via `onClick` on the outer div, click-through prevention via `stopPropagation` on the inner dialog div.
- No extra library needed; consistent with the codebase's pattern of explicit, zero-dependency UI logic.

**Alternatives considered**:
- `<dialog>` element: Native focus trap + Escape. Rejected — imperative ref dance adds complexity with no UX benefit for this simple use case.
- `ReactDOM.createPortal`: Useful when z-index stacking context is a problem. Not needed — join form is rendered at top level with no competing stacking context. Rejected as over-engineering.

## R-002: Focus trap approach

**Decision**: `autoFocus` on ✕ button when modal opens; `onKeyDown` on the modal container to intercept Tab/Shift+Tab and cycle focus among all focusable children (✕ button + 30 emoji buttons).

**Rationale**: The set of focusable elements inside the modal is small and static (1 close button + 30 emoji buttons = 31 elements). A lightweight Tab interceptor using `document.querySelectorAll` on the modal container is sufficient and transparent.

**Alternatives considered**:
- `focus-trap` npm package: Robust, battle-tested. Rejected — adds a runtime dependency that the constitution requires justifying; the problem is simple enough not to warrant it.
- No focus management: Fails WCAG 2.1 SC 2.1.2 and SC-004 ("keyboard focus remains confined to modal"). Rejected.

## R-003: Escape key handling

**Decision**: `onKeyDown` on the overlay container div (which receives `tabIndex={-1}` and `autoFocus` indirectly via its first child), calling `onClose` when `e.key === 'Escape'`.

**Alternatives considered**:
- `window.addEventListener('keydown', ...)` in `useEffect`: Works but requires explicit cleanup and adds global state. Rejected for locality — the handler belongs on the modal.

## R-004: Inline styles vs. CSS class

**Decision**: Inline styles using `tokens.ts` values, consistent with every other component in the codebase (`JoinForm`, `Card`, `Button`, etc.).

**Rationale**: No `.css` files exist in the project. `EmojiPicker` uses CSS classes (`className="emoji-picker"`) for its grid layout (likely global app CSS). The modal wrapper and dialog box use inline styles exclusively to stay consistent.

## R-005: EmojiPicker reuse

**Decision**: `EmojiPicker.tsx` is **not modified**. It is rendered inside `AvatarPickerModal` as-is.

The modal wires a combined `onSelect` handler:
```typescript
onSelect={(emoji) => { props.onSelect(emoji); props.onClose(); }}
```

This keeps `EmojiPicker`'s existing unit tests green without modification.

## R-006: Tests to update vs. create

Three test files are touched:

| File | Action | Why |
|------|--------|-----|
| `AvatarPickerModal.test.tsx` | CREATE | New component needs unit tests |
| `JoinForm.test.tsx` | UPDATE | Two tests break (inline picker no longer on page); new modal-path interaction tests needed |
| `e2e/tests/player-flow.spec.ts` | UPDATE | Two e2e tests break (`.emoji-picker button` no longer on page at load; direct emoji click no longer works) |
| `EmojiPicker.test.tsx` | UNCHANGED | Component unchanged |
| `e2e/tests/full-game.spec.ts` | UPDATE | Avatar selection in full-game test uses direct `.click()` on emoji — must go through modal now |
