# Tasks: Avatar Picker Modal on Join Screen

**Input**: Design documents from `/specs/008-avatar-picker-modal/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: TDD is mandated by the project constitution — test tasks are included and MUST be written and confirmed to FAIL before implementation begins.

**Organization**: Single user story (US1 P1 — entire feature). Tasks grouped into TDD-first order: baseline → tests → implementation → polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Paths are relative to repository root

---

## Phase 1: Setup (Baseline Verification)

**Purpose**: Confirm all existing tests pass before any changes are made, establishing a clean baseline.

- [X] T001 Run full unit and e2e test suites to verify baseline: `cd frontend && pnpm test` and `cd e2e && pnpm exec playwright test` — all must pass before proceeding

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No new infrastructure or dependencies are required — this feature is frontend-only and reuses existing components (`EmojiPicker`, `Card`, design tokens). Phase 2 is a pass-through.

**⚠️ CRITICAL**: No user story work can begin until Phase 1 baseline passes.

---

## Phase 3: User Story 1 — Avatar Preview and Modal Selection (Priority: P1) 🎯 MVP

**Goal**: Replace the inline emoji grid on the join form with a clickable avatar preview that opens a blocking modal. Clicking an emoji in the modal selects it and closes the modal. The modal is dismissible (Escape, ✕, backdrop) without changing the selection. Focus returns to the preview button on dismiss.

**Independent Test**: Navigate to `/play`, observe the avatar preview (🙂) to the left of the name input — no inline emoji grid visible. Click the avatar preview → modal opens with all 30 emojis, current emoji highlighted. Click 🦁 → modal closes, preview now shows 🦁. Reopen modal → click ✕ → modal closes, preview still shows 🦁.

### Tests for User Story 1 (TDD — write FIRST, confirm FAIL before T006)

> **NOTE: Write ALL tests below (T002–T005) FIRST and confirm they FAIL before writing any implementation code (T006–T007).**

- [X] T002 [P] [US1] Write unit tests for new `AvatarPickerModal` component in `frontend/tests/unit/components/AvatarPickerModal.test.tsx` covering: does not render when `open=false`; renders `role="dialog"` with `aria-modal="true"` when `open=true`; renders all 30 emoji buttons; clicking an emoji calls `onSelect(emoji)` then `onClose()`; clicking ✕ calls `onClose()` only (not `onSelect`); clicking the backdrop calls `onClose()` only; pressing Escape calls `onClose()` only; selected emoji has `aria-pressed="true"`
- [X] T003 [P] [US1] Update unit tests in `frontend/tests/unit/components/JoinForm.test.tsx`: replace "renders the emoji picker below the name field" with "renders avatar preview button to the left of the name input" (asserts `aria-label="Choose avatar"` button present, 30 inline emoji buttons absent); add "opens avatar picker modal when avatar preview is clicked" (click preview → `role="dialog"` appears); add "closes modal and updates preview after emoji selection" (click preview → click 🦁 in modal → modal gone → `onJoined` receives 🦁); add "closes modal without changing avatar when ✕ is clicked" (click preview → click ✕ → modal gone → avatar unchanged); update "calls onJoined with selected avatar emoji" to use modal interaction path (open modal → select 🦁 → submit)
- [X] T004 [P] [US1] Update e2e tests in `e2e/tests/player-flow.spec.ts`: replace "player sees join form with emoji picker" with assertion that avatar preview button (`aria-label="Choose avatar"`) is visible and `.emoji-picker button` count is 0 on page load; replace "player can select emoji and it gets highlighted" with: click avatar preview → modal opens → click 🦁 → modal closes → preview button shows 🦁
- [X] T005 [P] [US1] Update e2e avatar selection steps in `e2e/tests/full-game.spec.ts`: for Player 1, replace direct `getByText("🦁").click()` with click avatar preview → wait for modal → click 🦁 in modal; for Player 2, replace direct `getByText("🤖").click()` with same modal-based interaction

### Implementation for User Story 1

- [X] T006 [US1] Create `frontend/src/components/AvatarPickerModal.tsx` — returns `null` when `open=false`; when open: renders fixed backdrop (`position: fixed, inset: 0, backgroundColor: rgba(0,0,0,0.75), zIndex: 1000, display: flex, alignItems: center, justifyContent: center`) with `onClick={onClose}`; inner dialog div has `role="dialog"`, `aria-modal="true"`, `aria-label="Choose your avatar"`, `onClick` stopPropagation, `maxHeight: '90vh'`, `overflow: 'hidden'`, `position: 'relative'`, `width: '90%'`, `maxWidth: '380px'`, Card-style background/border; ✕ button with `autoFocus`, `aria-label="Close avatar picker"`, `onClick={onClose}`, positioned top-right; heading "Choose Your Avatar"; emoji grid wrapper with `overflowY: 'auto'`; `<EmojiPicker selected={selected} onSelect={(emoji) => { onSelect(emoji); onClose(); }} />`; Escape key handled via `onKeyDown` on backdrop (`e.key === 'Escape'` → `onClose()`); Tab trap via `onKeyDown` on inner dialog div cycling through all focusable children
- [X] T007 [US1] Update `frontend/src/components/JoinForm.tsx` (depends on T006): add `isModalOpen` boolean state (default `false`); add `avatarPreviewRef = useRef<HTMLButtonElement>(null)`; remove `<EmojiPicker>` and its import; add `import { AvatarPickerModal }` from `./AvatarPickerModal`; wrap display name label+input in a flex row div (`display: flex, alignItems: flex-end, gap: spacing.sm, marginBottom: spacing.lg`) with avatar preview button on the left (`ref={avatarPreviewRef}`, `type="button"`, `aria-label="Choose avatar"`, `onClick={() => setIsModalOpen(true)}`, `fontSize: typography.sizes.xxl`, `minWidth: '48px'`, `minHeight: '48px'`, styled with surface background and border) and input on the right (`flex: 1`, remove its individual `marginBottom`); add `handleAvatarSelect = (emoji: string) => { setAvatar(emoji); setIsModalOpen(false); avatarPreviewRef.current?.focus(); }`; add `handleModalClose = () => { setIsModalOpen(false); avatarPreviewRef.current?.focus(); }`; render `<AvatarPickerModal open={isModalOpen} selected={avatar} onSelect={handleAvatarSelect} onClose={handleModalClose} />` inside the form

**Checkpoint**: At this point, all tests (T002–T005) should pass. User Story 1 is fully functional and independently testable — verify the manual independent test before continuing.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all quality gates.

- [X] T008 Run full unit test suite and confirm all pass: `cd frontend && pnpm test`
- [X] T009 [P] Run e2e test suite and confirm all pass: `cd e2e && pnpm exec playwright test`
- [X] T010 [P] Run Biome lint and format checks and fix any violations: `cd frontend && pnpm exec biome check src/components/AvatarPickerModal.tsx src/components/JoinForm.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — run immediately
- **Foundational (Phase 2)**: Pass-through — no work needed
- **User Story 1 (Phase 3)**: Depends on Phase 1 baseline passing
  - Tests (T002–T005): All parallel, must be written and confirmed FAILING before T006
  - T006: Depends on T002 confirming FAIL; unblocks T007
  - T007: Depends on T006
- **Polish (Phase 4)**: Depends on Phase 3 complete (T007 done)

### User Story Dependencies

- **User Story 1 (P1)**: Only story — entire feature is contained here

### Within User Story 1

1. Write T002–T005 in parallel (all different files)
2. Confirm T002–T005 FAIL (do not proceed until failure confirmed)
3. Implement T006 (`AvatarPickerModal.tsx`)
4. Implement T007 (`JoinForm.tsx`)
5. Confirm all tests pass at checkpoint
6. Polish: T008–T010 in parallel

---

## Parallel Example: User Story 1

```bash
# Step 1 — Write all failing tests in parallel:
Task: "Write AvatarPickerModal unit tests in frontend/tests/unit/components/AvatarPickerModal.test.tsx"  # T002
Task: "Update JoinForm unit tests in frontend/tests/unit/components/JoinForm.test.tsx"                   # T003
Task: "Update player-flow e2e tests in e2e/tests/player-flow.spec.ts"                                    # T004
Task: "Update full-game e2e tests in e2e/tests/full-game.spec.ts"                                        # T005

# Step 2 — Confirm FAIL, then implement sequentially:
Task: "Create AvatarPickerModal.tsx"  # T006
Task: "Update JoinForm.tsx"           # T007 (after T006)

# Step 3 — Polish in parallel:
Task: "Run unit tests"    # T008
Task: "Run e2e tests"     # T009
Task: "Run Biome checks"  # T010
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

This feature has one user story — the entire feature IS the MVP.

1. Complete Phase 1: Verify baseline
2. Complete Phase 3 tests (T002–T005): Write all failing tests in parallel
3. Complete Phase 3 implementation (T006 → T007): Make tests pass
4. **STOP and VALIDATE**: Run manual independent test + full suite
5. Complete Phase 4: Polish

### Key Implementation Notes

- `AvatarPickerModal` receives a `ref` callback indirectly via `onClose` — focus return is managed by `JoinForm` (calls `avatarPreviewRef.current?.focus()` after setting `isModalOpen=false`), not inside `AvatarPickerModal` itself. This keeps the modal component decoupled.
- `EmojiPicker.tsx` is **not modified** — existing unit tests for it remain green with zero changes.
- The display name `<label>` stays linked via `htmlFor="display-name"` — only the surrounding layout div changes.

---

## Notes

- [P] tasks operate on different files — no risk of conflicts when run in parallel
- TDD is mandatory per constitution: tests must FAIL before implementation starts
- `EmojiPicker.test.tsx` and `useGameState.test.ts` are untouched — confirm they still pass in T008
- Commit after T006, T007, and T010 at minimum
- Stop at the Phase 3 checkpoint to validate the story manually before polishing
