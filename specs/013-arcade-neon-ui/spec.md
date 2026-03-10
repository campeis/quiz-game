# Feature Specification: 80s Arcade Neon UI Redesign

**Feature Branch**: `013-arcade-neon-ui`
**Created**: 2026-03-10
**Status**: Draft
**Input**: User description: "redesign the frontend UI toward a 80s arcade neon style. use font similar to the one used in videogames. do not use any copyrighted resource."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Immersive Arcade Visual Experience (Priority: P1)

A player visiting the quiz game sees the entire interface styled in a vibrant 80s arcade aesthetic: glowing neon colors on dark backgrounds, retro-style typography reminiscent of classic arcade cabinets, and visual elements that evoke the golden age of arcade gaming. The experience is visually cohesive from the lobby through the quiz to the final leaderboard.

**Why this priority**: This is the core deliverable — transforming the visual identity of the product. All other stories build on having the base visual theme in place.

**Independent Test**: Can be fully tested by opening the app and visually inspecting all screens (lobby, quiz, leaderboard) against the 80s arcade neon reference criteria, delivering an immediately recognizable retro arcade feel.

**Acceptance Scenarios**:

1. **Given** a player opens the app, **When** they view any screen, **Then** they see a dark background with neon-colored text, borders, and UI elements that clearly evoke an 80s arcade aesthetic.
2. **Given** a player views text throughout the app, **When** they read headings, buttons, scores, and labels, **Then** all text uses a retro arcade-style typeface (freely licensed, not copyrighted) that resembles classic video game fonts.
3. **Given** a player navigates between screens, **When** they move from lobby to quiz to leaderboard, **Then** the neon arcade theme is consistent and cohesive across all views.

---

### User Story 2 - Neon Glow Effects and Animations (Priority: P2)

Interactive elements such as buttons, score counters, correct/incorrect answer indicators, and the leaderboard respond with neon glow effects and subtle animations that reinforce the arcade atmosphere. Flashing or pulsing effects celebrate correct answers or high scores.

**Why this priority**: Glow and animation effects elevate the theme from a static reskin to a living arcade experience, significantly increasing player engagement and immersion.

**Independent Test**: Can be fully tested by interacting with buttons, answering questions, and viewing the leaderboard to confirm glow and animation effects are present and enhance the arcade feel.

**Acceptance Scenarios**:

1. **Given** a player hovers over or selects a button, **When** the button is activated, **Then** it displays a neon glow effect that pulses or brightens noticeably.
2. **Given** a player answers a question correctly, **When** the result is shown, **Then** a celebratory neon flash or burst animation plays.
3. **Given** a player views the leaderboard, **When** scores are displayed, **Then** top scores are highlighted with distinct neon color accents or glow effects that draw the eye.

---

### User Story 3 - Arcade Typography Applied Uniformly (Priority: P3)

Every text element in the application — headings, body text, labels, buttons, scores, timers, and player names — uses the chosen retro arcade-style typeface or a complementary pairing. The typography reinforces the theme without sacrificing readability.

**Why this priority**: Consistent typography is a foundational pillar of the visual identity. Without it, the neon color scheme alone will not fully achieve the arcade look.

**Independent Test**: Can be fully tested by inspecting each screen and confirming that all visible text elements use the retro typeface, and that readability is maintained at all sizes.

**Acceptance Scenarios**:

1. **Given** a player joins the lobby, **When** they view player names and the game title, **Then** all text is rendered in the arcade-style typeface.
2. **Given** a player is in the quiz, **When** they read the question, answer options, timer, and score, **Then** all text uses the retro typeface at a readable size and contrast ratio.
3. **Given** the app loads for the first time, **When** the typeface has not yet loaded, **Then** a fallback font is displayed that does not break the layout, and the arcade font loads without visible page reflow.

---

### User Story 4 - Accessible Contrast and Readability (Priority: P4)

Despite the vibrant neon color palette, all text maintains sufficient contrast against its background so that players can read questions, scores, and labels clearly during fast-paced gameplay.

**Why this priority**: Accessibility and playability depend on readable text. A visually striking theme that players cannot read undermines the game's core function.

**Independent Test**: Can be fully tested by checking text contrast ratios across all screens and confirming that all key text (questions, answers, scores, timers) meets minimum readability standards.

**Acceptance Scenarios**:

1. **Given** neon-colored text on a dark background, **When** a player views any question or answer option, **Then** the text is legible without strain in normal viewing conditions.
2. **Given** a decorative neon glow effect on text, **When** the glow is applied, **Then** the core text remains clearly distinguishable from the glow halo.

---

### Edge Cases

- What happens when a player's browser does not support the custom arcade font? The fallback font must not break layout or overlap other elements.
- How does the neon theme render on high-brightness or low-brightness device screens? Key text must remain legible across typical device brightness settings.
- What happens on small mobile screens? Neon effects and arcade typography must scale gracefully without clipping or overlapping.
- How are player-entered names (potentially any Unicode characters) displayed in the arcade font? Characters not supported by the font must fall back gracefully without breaking the layout.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST display a dark base background (near-black or deep navy) on all screens as the foundation for the neon aesthetic.
- **FR-002**: All text headings, labels, buttons, scores, and interactive elements MUST use a retro arcade-style typeface that is freely licensed, contains no copyrighted assets, and is self-hosted (bundled with the application, served from the same origin).
- **FR-003**: The application MUST apply neon color accents (e.g., cyan, magenta, electric green, hot pink, or electric blue) to key UI elements including buttons, borders, score displays, and highlighted text.
- **FR-004**: Interactive elements (buttons, answer options) MUST display a neon glow or highlight effect on hover and on selection.
- **FR-005**: Correct answer feedback MUST include a celebratory visual effect consistent with the arcade theme (e.g., neon flash, color burst, or animated glow).
- **FR-006**: Incorrect answer feedback MUST include a distinct visual effect that clearly signals the wrong answer without being visually identical to the correct answer effect.
- **FR-007**: The leaderboard MUST highlight the top-ranked player(s) with a visually distinct neon accent or animation to evoke a classic "high score" display.
- **FR-008**: The countdown timer MUST be styled to resemble an arcade score counter — bold, prominent, and color-coded to signal urgency as time runs low (e.g., color shifts from calm neon to warning neon when below a threshold).
- **FR-009**: All fonts, icons, and visual assets used MUST be freely licensed (e.g., open-source or public domain) with no copyright restrictions on commercial or non-commercial use.
- **FR-010**: The theme MUST be applied consistently across all screens: join screen, lobby, quiz question view, answer reveal, leaderboard, and host dashboard.
- **FR-011**: Text contrast ratios for all primary content (questions, answer options, scores, timers) MUST meet a minimum 4.5:1 contrast ratio against their background color to ensure readability.
- **FR-012**: The neon UI theme MUST render correctly on modern desktop and mobile browsers without broken layouts or invisible text.
- **FR-013**: When a user has enabled the OS-level "reduce motion" preference, all motion animations (glow pulses, celebratory bursts, transitions) MUST be suppressed or replaced with static equivalents; neon colors and static glow effects MUST remain visible.

### Key Entities

- **Theme**: The visual design system defining the color palette, typography, glow effects, and animation rules applied globally across the application.
- **Color Palette**: The set of neon and dark background colors used throughout the interface, constrained to evoke an 80s arcade aesthetic.
- **Typeface**: The freely licensed retro arcade-style font(s) applied to all text elements, with defined fallback behavior for unsupported characters or slow loads.
- **Glow Effect**: A visual treatment applied to text, borders, and interactive elements to simulate the illuminated neon tube look of 80s arcade machines.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of application screens (join, lobby, quiz, answer reveal, leaderboard, host dashboard) display the neon arcade theme with no screens retaining the previous default styling.
- **SC-002**: All primary text elements (questions, answer options, scores, timers, player names) achieve a minimum contrast ratio of 4.5:1 against their background, as verifiable by a contrast-checking tool.
- **SC-003**: Every font, icon, and graphic asset used in the redesign is verifiably freely licensed — zero copyrighted resources are present in the final implementation.
- **SC-004**: All interactive elements (buttons, answer options) display a visible neon glow or highlight effect within 100 milliseconds of hover or selection, ensuring immediate visual feedback.
- **SC-005**: The arcade typeface loads and renders correctly on the first visit without causing layout shifts that obscure or overlap any interactive element.
- **SC-006**: On screens as narrow as 320px wide, all text and interactive elements remain fully readable and non-overlapping, confirming the theme scales to mobile devices.

## Clarifications

### Session 2026-03-10

- Q: Should the arcade neon theme be applied to the host-facing dashboard, or only to player-facing screens? → A: Include — host dashboard gets the full neon arcade theme.
- Q: Should the app respect a user's OS-level "reduce motion" preference? → A: Yes — animations suppressed/reduced when reduce-motion is enabled; neon colors and static glows remain.
- Q: Should arcade-style fonts be self-hosted or fetched from an external web font CDN? → A: Self-hosted — font files bundled with the app, served from the same origin.

## Assumptions

- The existing application screens (join, lobby, quiz question, answer reveal, leaderboard, host dashboard) remain structurally the same; this feature is a visual reskin, not a structural redesign.
- "Font similar to the one used in videogames" is interpreted as a freely licensed retro pixel or arcade-style typeface (e.g., Press Start 2P, Orbitron, or equivalent open-licensed alternatives) — not a reproduction of any specific trademarked game font.
- Animated effects are subtle and non-distracting — they enhance atmosphere without impeding gameplay readability or causing seizure-risk flashing (no strobing effects above safe thresholds).
- The neon color palette will be defined during planning; the specific hues are a design decision, not a specification constraint, as long as they evoke 80s arcade aesthetics.
- This feature is a visual reskin only; no keyboard navigation or focus-management behavior is changed. WCAG 2.1 AA keyboard/focus compliance is inherited from the existing baseline — the theme MUST NOT introduce any keyboard navigation regressions. Neon border colors used on focused elements MUST maintain visible focus indicators (verified in T041 visual inspection).
