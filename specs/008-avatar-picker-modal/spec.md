# Feature Specification: Avatar Picker Modal on Join Screen

**Feature Branch**: `008-avatar-picker-modal`
**Created**: 2026-02-22
**Status**: Draft
**Input**: User description: "in the join screen when the player selects an avatar the selected one has to be shown on the left of the user name input box. to select an avatar the user can select the current avatar. when doing this a modal window is shown where an avatar can be selected. when an avatar is clicked in the modal window the modal is closed. the modal is blocking."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Avatar Preview and Modal Selection (Priority: P1)

A player on the join screen sees their currently selected avatar displayed to the left of the display name input field. To change it, they click the avatar preview, which opens a blocking modal overlay showing all available avatars. Clicking any avatar in the modal immediately selects it and closes the modal; the newly chosen avatar is then visible in the preview position.

**Why this priority**: This is the entire feature — the current inline picker grid is replaced by this modal-based interaction. Without it, the join screen behaviour is unchanged.

**Independent Test**: Navigate to the join screen, observe the avatar preview to the left of the name field, click the avatar preview, select a different emoji in the modal, verify the modal closes and the selected emoji now appears in the preview.

**Acceptance Scenarios**:

1. **Given** the join screen is displayed, **When** the player views the name input area, **Then** the currently selected avatar is visible immediately to the left of the name input field.
2. **Given** the avatar preview is visible, **When** the player clicks it, **Then** a blocking modal dialog opens showing all available avatar choices.
3. **Given** the modal is open, **When** the player clicks any avatar, **Then** the modal closes immediately and the clicked avatar becomes the new selected avatar shown in the preview.
4. **Given** the modal is open, **When** the player attempts to interact with content behind the modal (form fields, buttons), **Then** those interactions are blocked — only the modal content is interactive.
5. **Given** the modal is open, **When** the player presses Escape, activates the visible close control, or clicks the backdrop, **Then** the modal closes without changing the previously selected avatar.

---

### Edge Cases

- What happens when the player presses Escape, clicks the ✕ button, or clicks the backdrop before selecting? The modal closes, keeping the previously selected avatar unchanged.
- What is shown as the avatar preview before any selection? The default avatar (🙂) is displayed.
- What happens if a player opens the modal, sees the current avatar is already highlighted, and closes without selecting? The selection is preserved unchanged.
- Can the player open the modal multiple times in a single session? Yes — each open/close cycle is independent.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The join screen MUST display the currently selected avatar as a clickable element to the left of the display name input field at all times.
- **FR-002**: Clicking the avatar preview MUST open a blocking modal overlay that presents all available avatar choices. The modal MUST fit within the viewport (max-height: 90vh); if the avatar grid overflows, it scrolls internally.
- **FR-003**: While the modal is open, interaction with all content behind it MUST be blocked — form fields, buttons, and other page controls are unreachable.
- **FR-004**: Clicking any avatar inside the modal MUST immediately select that avatar and close the modal in a single action, requiring no additional confirmation.
- **FR-005**: After the modal closes following a selection, the newly chosen avatar MUST be displayed in the preview position to the left of the name input.
- **FR-006**: The modal MUST be dismissible without changing the selection — via Escape key, a visible close control, or clicking the backdrop (overlay area outside the modal content) — leaving the previously selected avatar unchanged. On dismiss, keyboard focus MUST return to the avatar preview button.
- **FR-007**: The avatar shown in the preview MUST match the avatar that will be submitted with the join form (default 🙂 if none explicitly chosen).
- **FR-008**: The currently selected avatar MUST be visually highlighted inside the modal when it opens, so the player knows which one is active.

### Key Entities

- **Avatar Preview**: The interactive element to the left of the display name input that shows the current selection and acts as the trigger to open the modal.
- **Avatar Picker Modal**: A blocking overlay containing all available avatar choices; opens on preview click, closes on avatar selection or explicit dismiss.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can change their avatar in 2 interactions or fewer — one click to open the modal, one click to select an avatar.
- **SC-002**: The avatar preview is visible without scrolling on all supported screen sizes when the join screen loads.
- **SC-006**: The avatar picker modal MUST fit within the viewport on all supported screen sizes — the modal box MUST NOT exceed 90% of the viewport height (`max-height: 90vh`); if the emoji grid overflows, it scrolls internally within the modal.
- **SC-003**: 100% of avatar clicks inside the modal result in the modal closing and the preview updating — no additional confirmation step exists.
- **SC-004**: Background content is unreachable in 100% of tested cases while the modal is open — keyboard focus and pointer events remain confined to the modal.
- **SC-005**: When the modal closes via dismiss (Escape, ✕, or backdrop click), keyboard focus MUST return to the avatar preview button that triggered the modal.

## Clarifications

### Session 2026-02-22

- Q: Should clicking the backdrop (overlay area outside the modal) dismiss the modal without changing the selection? → A: Yes — backdrop click dismisses the modal, selection unchanged (same behaviour as Escape / ✕ button).
- Q: Where should keyboard focus return after the modal is dismissed without a selection (Escape, ✕, backdrop)? → A: Focus returns to the avatar preview button that triggered the modal.
- Q: How should the avatar picker modal behave on narrow/short viewports (e.g., mobile portrait)? → A: Modal box capped at max-height 90vh; emoji grid scrolls internally if it overflows — the modal never overflows the viewport.

## Assumptions

- The curated avatar list (30 emojis) is unchanged from the existing feature (007-player-avatar); this feature only changes how the picker is presented and triggered.
- A visible close control (e.g., ✕ button) is provided inside the modal in addition to Escape key support, to serve mouse-only and touch users.
- The avatar preview element meets minimum touch-target size requirements so it is easily tappable on mobile devices.
- The default avatar (🙂) is shown in the preview when the join screen first loads, consistent with the existing default behaviour.
- This feature replaces the current inline emoji grid on the join form; the grid no longer appears directly on the page.
