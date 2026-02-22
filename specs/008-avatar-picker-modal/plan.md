# Implementation Plan: Avatar Picker Modal on Join Screen

**Branch**: `008-avatar-picker-modal` | **Date**: 2026-02-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-avatar-picker-modal/spec.md`

## Summary

Replace the inline emoji grid in the join form with a modal-based interaction: a clickable avatar preview to the left of the display name input opens a blocking modal overlay containing the existing `EmojiPicker`. Clicking an emoji inside the modal selects it and closes the modal. The modal is dismissible without changing the selection via Escape, ✕ button, or backdrop click. No backend changes are required — this is a pure frontend UI refactor.

## Technical Context

**Language/Version**: TypeScript 5.x + React 19
**Primary Dependencies**: React 19, Vitest + @testing-library/react (unit tests), Playwright (e2e)
**Storage**: N/A — avatar state remains component-local in `JoinForm` (no persistence change)
**Testing**: Vitest (unit), Playwright (e2e)
**Target Platform**: Web browser (same targets as existing app)
**Project Type**: Web application (frontend-only change)
**Performance Goals**: Modal open/close must be imperceptibly fast (React state toggle — no async work)
**Constraints**: No new dependencies; inline styles using existing `tokens.ts` design system
**Scale/Scope**: 3 frontend files changed (JoinForm, new AvatarPickerModal), 3 test files updated/created

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment |
|-----------|-----------|
| **I. Code Quality** — single responsibility, clean naming | PASS — `AvatarPickerModal` is a dedicated component; `JoinForm` only manages open/close state |
| **II. Testing Standards** — TDD, unit + e2e coverage | PASS — failing tests written before implementation; existing unit tests updated, new ones added |
| **III. UX Consistency** — design system, accessibility (WCAG 2.1 AA) | PASS — inline styles from `tokens.ts`, `aria-modal`, `aria-label`, Escape + ✕ + backdrop dismiss, focus management |
| **IV. Performance** — no regressions | PASS — modal is a React state toggle with no async work |

No violations → no Complexity Tracking table required.

## Project Structure

### Documentation (this feature)

```text
specs/008-avatar-picker-modal/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   └── components/
│       ├── AvatarPickerModal.tsx   # NEW — blocking modal wrapping EmojiPicker
│       ├── EmojiPicker.tsx         # UNCHANGED — reused inside AvatarPickerModal
│       └── JoinForm.tsx            # MODIFIED — avatar preview button + modal open state
└── tests/
    └── unit/
        └── components/
            ├── AvatarPickerModal.test.tsx  # NEW — unit tests for modal component
            ├── EmojiPicker.test.tsx        # UNCHANGED
            └── JoinForm.test.tsx           # MODIFIED — update broken inline-picker assertions

e2e/
└── tests/
    └── player-flow.spec.ts    # MODIFIED — update tests to use modal interaction path
```

**Structure Decision**: Web application layout (Option 2). Frontend-only change — no backend files touched.

---

## Phase 0: Research

### R-001: Modal implementation strategy

**Decision**: Custom backdrop `<div>` with React state (`isModalOpen: boolean`), not native `<dialog>`.

**Rationale**:
- Native `<dialog showModal()>` requires a ref + imperative call inside `useEffect` — more complexity for no gain in this React-controlled context.
- Custom overlay gives explicit, readable control over open/close state, Escape key handling, backdrop click, and focus.
- Pattern is idiomatic in React 19 codebases that avoid unnecessary DOM refs.

**Alternatives considered**:
- `<dialog>` element: Provides native focus trap + Escape, but React integration is awkward (ref + effect for showModal). Rejected for complexity.
- Portal (`ReactDOM.createPortal`): Useful when z-index stacking context is problematic. Not needed here — the join form is top-level content with no competing stacking contexts. Rejected (over-engineering).

### R-002: Focus trap approach

**Decision**: Minimal manual focus management — `autoFocus` on ✕ button when modal opens, `onKeyDown` on the modal container catches Tab/Shift+Tab to cycle within focusable modal elements.

**Rationale**: The modal contains a small, known set of focusable elements (✕ button + 30 emoji buttons). A lightweight Tab interceptor is sufficient and requires no external library.

**Alternatives considered**:
- `focus-trap` library: Robust but adds a dependency. Rejected per constitution ("no extra dependencies without justification").
- No focus management: Fails WCAG 2.1 SC 2.1.2 (No Keyboard Trap) and SC-004. Rejected.

### R-003: Escape key handling

**Decision**: `onKeyDown` handler on the modal overlay div (with `tabIndex={-1}`), checking `e.key === 'Escape'`.

**Rationale**: Attaching to the overlay element (which receives focus on open) keeps the handler scoped to the modal's lifecycle — no global event listener cleanup needed.

### R-004: EmojiPicker reuse inside modal

**Decision**: `EmojiPicker` component is reused unchanged. The modal's `onSelect` handler calls `props.onSelect(emoji)` then `props.onClose()` — the `onClose` is wired by `JoinForm`, not by `EmojiPicker` itself.

**Rationale**: Zero changes to `EmojiPicker` keeps existing unit tests green with no modification.

---

## Phase 1: Design & Contracts

### Data Model

See `data-model.md` for full entity table.

**State additions to `JoinForm`**:

```
isModalOpen: boolean   (default: false)
```

Existing state (`joinCode`, `displayName`, `avatar`) is unchanged.

**`AvatarPickerModal` props interface**:

```typescript
interface AvatarPickerModalProps {
  open: boolean;
  selected: string;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}
```

**`JoinForm` wiring**:
- Avatar preview button `onClick` → `setIsModalOpen(true)`
- `AvatarPickerModal.onSelect` → `setAvatar(emoji)` then `setIsModalOpen(false)` (via a combined handler passed to modal)
- `AvatarPickerModal.onClose` → `setIsModalOpen(false)`

### UI Layout

**Join form — Display Name row** (new layout):

```
[ avatar preview btn ] [ display name input (flex: 1)         ]
  "🙂" (large emoji,
   clickable, aria-label=
   "Choose avatar")
```

Implementation: wrap the avatar button and input in a `display: flex, alignItems: center, gap: spacing.sm` div. The input gets no width style — it fills remaining space via `flex: 1`.

**Avatar preview button styling**:
- `fontSize: typography.sizes.xxl` (2rem) to display emoji at comfortable touch target
- `minWidth: "48px", minHeight: "48px"` (WCAG minimum 44×44 px touch target)
- `backgroundColor: colors.surface`, `border: 2px solid colors.border`, `borderRadius: borderRadius.md`
- `cursor: pointer`
- `aria-label="Choose avatar"`, `type="button"`

**`AvatarPickerModal` structure**:

```
<div>  ← backdrop: position: fixed, inset: 0, backgroundColor: rgba(0,0,0,0.75)
        z-index: 1000, display: flex, alignItems: center, justifyContent: center
        onClick (on backdrop only) → onClose
  <div role="dialog" aria-modal="true" aria-label="Choose your avatar">
    ← Card styling: surface, border, borderRadius.lg, padding: spacing.lg
    ← max-width: "380px", width: "90%", position: "relative"
    ← onClick (stop propagation — prevent backdrop click from firing)
    ← onKeyDown: Escape → onClose; Tab cycling

    [ ✕ button ]  ← position: absolute, top: spacing.sm, right: spacing.sm
                     aria-label="Close avatar picker", autoFocus

    <h3>Choose Your Avatar</h3>

    <EmojiPicker
      selected={props.selected}
      onSelect={(emoji) => { props.onSelect(emoji); props.onClose(); }}
    />
  </div>
</div>
```

### API Contracts

No API changes. The avatar flows to the backend identically (URL query parameter on WebSocket connect). See existing contract: `?avatar=<encodeURIComponent(emoji)>`.

### Test Contract

**New unit tests — `AvatarPickerModal.test.tsx`**:

| Test | Assertion |
|------|-----------|
| does not render when `open=false` | dialog element absent from DOM |
| renders dialog when `open=true` | `role="dialog"` present, aria-modal=true |
| renders all 30 emoji buttons | 30 buttons in picker |
| clicking an emoji calls onSelect + onClose | both callbacks fired |
| clicking ✕ calls onClose without onSelect | only onClose fired |
| clicking backdrop calls onClose without onSelect | only onClose fired |
| Escape key calls onClose without onSelect | only onClose fired |
| currently selected emoji is highlighted | `aria-pressed=true` on correct button |

**Updated unit tests — `JoinForm.test.tsx`** (changes from current):

| Old test | New behaviour |
|----------|---------------|
| "renders the emoji picker below the name field" (counts 30 non-Join-Game buttons) | REPLACE with: "renders avatar preview button to left of name input" — asserts button with `aria-label="Choose avatar"` exists |
| (new) "opens avatar picker modal when preview is clicked" | clicks avatar preview → `role="dialog"` appears |
| (new) "closes modal and updates preview after emoji selection" | clicks preview → clicks 🦁 in modal → modal gone → avatar state is 🦁 |
| (new) "closes modal without changing avatar on ✕ click" | clicks preview → clicks ✕ → modal gone → original avatar unchanged |
| "calls onJoined with selected avatar emoji" | still passes 🦁, but interaction path: click preview → click 🦁 in modal |

**Updated e2e tests — `player-flow.spec.ts`** (changes from current):

| Old test | Change |
|----------|--------|
| "player sees join form with emoji picker" — asserts `.emoji-picker button` count = 30 | REPLACE with: asserts avatar preview button visible; emoji grid not visible on page load |
| "player can select emoji and it gets highlighted" — clicks 🦁 directly on page | REPLACE with: clicks avatar preview → modal opens → clicks 🦁 → modal closes → preview shows 🦁 |

### Quickstart

See `quickstart.md` for developer-focused summary.
