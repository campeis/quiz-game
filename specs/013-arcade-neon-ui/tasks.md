# Tasks: 80s Arcade Neon UI Redesign

**Input**: Design documents from `/specs/013-arcade-neon-ui/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: New business-logic modules (`neon.ts`, `useReducedMotion.ts`) require TDD per constitution §II. Test tasks are included for these modules only; existing component tests must remain green throughout.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Exact file paths included in every task description

---

## Phase 1: Setup (Font Assets & CSS Infrastructure)

**Purpose**: Obtain font files and create the global CSS file that all other phases depend on.

**⚠️ CRITICAL**: Phases 2+ cannot begin until font files exist in `frontend/src/assets/fonts/`.

- [X] T001 Create `frontend/src/assets/fonts/` directory and download Press Start 2P font from Google Fonts; convert `PressStart2P-Regular.ttf` → `PressStart2P-Regular.woff2` using fonttools (`pip install fonttools brotli && python -m fonttools.ttLib.woff2 compress PressStart2P-Regular.ttf`); move result to `frontend/src/assets/fonts/`
- [X] T002 Download VT323 font from Google Fonts; convert `VT323-Regular.ttf` → `VT323-Regular.woff2` using fonttools; move to `frontend/src/assets/fonts/`; copy OFL license text to `frontend/src/assets/fonts/OFL.txt`
- [X] T003 Create `frontend/src/styles/arcade.css` with `@font-face` declarations for both fonts using `font-display: swap`, referencing `../assets/fonts/PressStart2P-Regular.woff2` and `../assets/fonts/VT323-Regular.woff2`; add `body { background-color: #050510; color: #e0f8ff; font-family: 'VT323', monospace; }` and `* { box-sizing: border-box; }`; leave `/* TODO: keyframes added in T010 */` comment as a placeholder
- [X] T004 Import `./styles/arcade.css` at the top of `frontend/src/main.tsx` (add import before the App import)

**Checkpoint**: Font files exist in `frontend/src/assets/fonts/`; `arcade.css` is loaded by the app; base body styles apply on all pages.

---

## Phase 2: Foundational (Design System Overhaul)

**Purpose**: Core design system that every component depends on. MUST complete before any user story work.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete — all component updates import from `tokens.ts` and `neon.ts`.

**TDD Note (constitution §II)**: T006 and T007 are test tasks — write them FIRST and confirm they FAIL before starting T008/T009 implementation. Tests for `neon.ts` and `useReducedMotion.ts` are required per constitution §II (TDD is the mandatory default workflow for new business logic).

- [X] T005 Overhaul `frontend/src/components/ui/tokens.ts`: replace `colors` with arcade-neon palette (`background: "#050510"`, `surface: "#0d0d2b"`, `surfaceHover: "#12124a"`, `border: "#00ffff"`, `borderDim: "#00ffff44"`, `text: "#e0f8ff"`, `textSecondary: "#7ec8e3"`, `primary: "#00ffff"`, `primaryHover: "#66ffff"`, `accent: "#ff00ff"`, `success: "#39ff14"`, `error: "#ff3131"`, `warning: "#fff01f"`, `winner: "#fff01f"`); replace `typography.fontFamily` with `fontDisplay: "'Press Start 2P', monospace"` and `fontBody: "'VT323', monospace"`; preserve `spacing`, `borderRadius`, `breakpoints` unchanged; update exports accordingly
- [X] T006 **[TDD — write FIRST, confirm FAILING]** Write unit tests in `frontend/src/components/ui/neon.test.ts` for the `neon.ts` module (not yet created): test that `neonBoxShadow(color, 'low')` returns a CSS string with exactly 2 comma-separated shadow layers each containing the hex color; test `neonBoxShadow(color, 'medium')` returns 3 layers; test `neonBoxShadow(color, 'high')` returns 4 layers; test `neonTextShadow('low'/'medium'/'high')` returns strings with smaller blur radii than the corresponding `neonBoxShadow` call for the same intensity; test `neonPulseStyle('#00ffff')` returns a `React.CSSProperties`-compatible object with `animation` key (containing `'neonPulse'`) and `boxShadow` key (containing `'#00ffff'`); run `pnpm test` and confirm all new tests FAIL with "module not found" or similar before proceeding to T008
- [X] T007 **[TDD — write FIRST, confirm FAILING]** Write unit tests in `frontend/src/hooks/useReducedMotion.test.ts` for the `useReducedMotion` hook (not yet created): mock `window.matchMedia` via Vitest `vi.fn()` returning a mock MediaQueryList with `matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn()`; test that `useReducedMotion()` returns `false` when `matches` is false; test it returns `true` when `matches` is true; test that `addEventListener('change', ...)` is called on mount and `removeEventListener` is called on unmount (cleanup); run `pnpm test` and confirm all new tests FAIL before proceeding to T009
- [X] T008 [P] Create `frontend/src/components/ui/neon.ts`: implement `neonBoxShadow(color: string, intensity: 'low' | 'medium' | 'high' = 'medium'): string` returning multi-layer CSS `box-shadow` string (low=2 layers, medium=3 layers, high=4 layers; blur radii 5/10/20/40px; opacities 0.5/0.7/0.9/0.5); implement `neonTextShadow(color: string, intensity: 'low' | 'medium' | 'high' = 'medium'): string` with same pattern at smaller radii (3/6/12/24px); implement `neonPulseStyle(color: string): React.CSSProperties` returning `{ animation: 'neonPulse 2s ease-in-out infinite', boxShadow: neonBoxShadow(color, 'low') }` — the base `boxShadow` applies the chosen color; the `neonPulse` keyframe (defined in T010) modulates opacity only, making it color-agnostic; run `pnpm test` and confirm T006 tests now PASS
- [X] T009 [P] Create `frontend/src/hooks/useReducedMotion.ts`: implement `useReducedMotion(): boolean` hook that initialises state from `window.matchMedia('(prefers-reduced-motion: reduce)').matches`, registers a `change` event listener on the media query, removes it on cleanup, and re-renders on preference change; handle SSR safely with `typeof window !== 'undefined'` guard; run `pnpm test` and confirm T007 tests now PASS
- [X] T010 Add `@keyframes` and `@media` rules to `frontend/src/styles/arcade.css` (replacing the TODO placeholder from T003): add `neonPulse` as an **opacity-only** keyframe (`0%, 100% { opacity: 0.7; } 50% { opacity: 1; }`) — color-agnostic, works with any `boxShadow` color set inline via `neonPulseStyle`; add `correctBurst` (0.5s forwards: scale 1→1.12→1 + neon green glow burst via `filter: drop-shadow`); add `incorrectFlash` (0.6s forwards: background flash + red glow burst via `filter: drop-shadow`); add `neonShimmer` (1.5s infinite: `text-shadow` multi-color shimmer cycling cyan/magenta/green); add `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; } }`

**Checkpoint**: All T006/T007 tests pass. `tokens.ts` exports arcade palette + `fontDisplay`/`fontBody`. `neon.ts` exports glow helpers. `useReducedMotion.ts` exports hook. `arcade.css` has keyframes. All pages now have dark body background.

---

## Phase 3: User Story 1 — Immersive Arcade Visual Experience (Priority: P1) 🎯 MVP

**Goal**: Apply the complete arcade color theme and typography across all screens. Every screen should feel immediately like a dark-background 80s arcade game after this phase — cohesive neon colors, dark surfaces, and arcade fonts throughout.

**Independent Test**: Open the app and navigate through all 6 screens (join, lobby, quiz, answer reveal, leaderboard, host dashboard). Every screen must show a dark background, neon-colored borders and accents, and text in Press Start 2P (headings) or VT323 (body). No screen should retain the previous light/Inter styling.

### Implementation for User Story 1

- [X] T011 [P] [US1] Update `frontend/src/pages/HomePage.tsx`: set root `<main>` background to `colors.background`; apply `typography.fontDisplay` to the "Quiz Game" `<h1>`; apply `typography.fontBody` to the subtitle `<p>` and all other text; replace `colors.text` / `colors.primary` references with new arcade token values (tokens already imported — verify each style object explicitly uses the updated token names including the renamed `fontDisplay`/`fontBody`)
- [X] T012 [P] [US1] Update `frontend/src/components/ui/Card.tsx`: set `backgroundColor: colors.surface`, `border: \`1px solid ${colors.border}\``; remove `colors.border` reference that previously used a grey value — it now uses neon cyan
- [X] T013 [P] [US1] Update `frontend/src/components/ui/Button.tsx`: set primary variant to `backgroundColor: "transparent"`, `color: colors.primary`, `border: \`2px solid ${colors.primary}\``; set secondary variant to `color: colors.textSecondary`, `border: \`2px solid ${colors.borderDim}\``; apply `fontFamily: typography.fontDisplay` (arcade font for button labels); update `transition` to include border-color and color
- [X] T014 [P] [US1] Update `frontend/src/components/JoinForm.tsx`: set all `input` elements to `backgroundColor: colors.background`, `border: \`2px solid ${colors.border}\``, `color: colors.text`, `fontFamily: typography.fontBody`; apply `typography.fontDisplay` to the `<h2>` "Join a Game" heading; apply `fontFamily: typography.fontBody` to all labels and error text; update avatar button border to `colors.border`
- [X] T015 [P] [US1] Update `frontend/src/components/Lobby.tsx`: apply `typography.fontDisplay` to the join code `<p>` (big display text) and the "Waiting for Players" `<h2>`; apply `typography.fontBody` to player list items, scoring rule labels, and time limit labels; update `fieldset` and `input` borders to use `colors.border` and `colors.background`; update all color token references to use new arcade palette
- [X] T016 [P] [US1] Update `frontend/src/components/Question.tsx`: apply `typography.fontBody` to question text `<h2>`, answer option `<button>` elements (larger size — `typography.sizes.xl`), and metadata `<span>` elements; apply `typography.fontDisplay` to the question counter; update all color token references (selected answer border uses `colors.primary`, correct uses `colors.success`, incorrect uses `colors.error`); update `getOptionStyle()` function to use new arcade palette
- [X] T017 [P] [US1] Update `frontend/src/components/Leaderboard.tsx`: apply `typography.fontDisplay` to rank numbers (`#1`, `#2`, etc.) and the heading (`Final Results` / `Leaderboard`); apply `typography.fontBody` to player names, score values, and "correct count" metadata; update all color references to arcade palette; set `borderBottom` separators to `colors.borderDim`
- [X] T018 [P] [US1] Update `frontend/src/components/HostDashboard.tsx`: apply `typography.fontDisplay` to the question counter `<span>` and "Standings" `<h3>`; apply `typography.fontBody` to question text `<h2>`, answer option `<div>` elements, and progress bar labels; update all color references to arcade palette; set answer option backgrounds to `colors.surface`, borders to `colors.borderDim`
- [X] T019 [P] [US1] Update `frontend/src/components/Podium.tsx`: update all inline styles to use arcade palette; apply `typography.fontDisplay` to rank labels (1st/2nd/3rd); apply `typography.fontBody` to player names; use `colors.winner` for rank 1, `colors.primary` for rank 2, `colors.accent` for rank 3
- [X] T020 [P] [US1] Update `frontend/src/components/EmojiPicker.tsx`: apply `backgroundColor: colors.surface` to the picker grid container; apply `border: \`1px solid ${colors.borderDim}\`` to individual emoji cells; apply `typography.fontBody` to any text labels; use `colors.background` for the overall modal background
- [X] T021 [P] [US1] Update `frontend/src/components/AvatarPickerModal.tsx`: apply arcade theme to modal overlay (`backgroundColor: "rgba(5, 5, 16, 0.92)"`) and modal container (`backgroundColor: colors.surface`, `border: \`2px solid ${colors.border}\``); apply `typography.fontDisplay` to modal heading; apply `typography.fontBody` to descriptive text
- [X] T022 [P] [US1] Update `frontend/src/components/QuizUpload.tsx`: apply `backgroundColor: colors.surface` to upload card; set drag-and-drop zone border to `2px dashed ${colors.border}`; apply `typography.fontBody` to file name display and instructions; update error text to use `colors.error`
- [X] T023 [P] [US1] Update `frontend/src/pages/HostPage.tsx` and `frontend/src/pages/PlayerPage.tsx`: ensure each page's root wrapper applies `backgroundColor: colors.background`, `minHeight: "100vh"`, and `fontFamily: typography.fontBody` as the base layout style; import and use `colors` and `typography` from tokens

**Checkpoint**: All 6 screens (join, lobby, quiz, answer reveal, leaderboard, host dashboard) display the arcade color theme and fonts. SC-001 satisfied. The app looks like an 80s arcade game at first glance. No animations yet.

---

## Phase 4: User Story 2 — Neon Glow Effects and Animations (Priority: P2)

**Goal**: Add neon glow effects to interactive elements, and animate correct/incorrect answer feedback, leaderboard highlights, Podium winner display, and timer urgency. All animations must respect `prefers-reduced-motion`.

**Independent Test**: Interact with the app — hover a button (glow appears), answer a question correctly (green burst animation), answer incorrectly (red flash), view the leaderboard (rank 1 has a bright neon highlight), view the Podium (winner name shimmers). Enable OS "reduce motion" preference and confirm all animations stop while neon colors/glows remain visible.

### Implementation for User Story 2

- [X] T024 [US2] Update `frontend/src/components/ui/Button.tsx`: import `neonPulseStyle` from `./neon` and `useReducedMotion` from `../../hooks/useReducedMotion`; apply `boxShadow: neonBoxShadow(colors.primary, 'medium')` to primary variant base state; add hover glow intensification via `onMouseEnter`/`onMouseLeave` state — on hover apply `neonPulseStyle(colors.primary)` (which includes `animation: 'neonPulse ...'` and brighter `boxShadow`), on leave revert to base `neonBoxShadow(colors.primary, 'medium')`; check `useReducedMotion()` and omit the `animation` key (keep the static `boxShadow`) when `true`; apply `boxShadow: neonBoxShadow(colors.borderDim, 'low')` to secondary variant
- [X] T025 [US2] Update `frontend/src/components/Question.tsx`: import `neonBoxShadow` from `./ui/neon` and `useReducedMotion`; in `getOptionStyle()`, add `boxShadow: neonBoxShadow(colors.primary, 'medium')` for selected state and `neonBoxShadow(colors.success, 'high')` for correct state; add `boxShadow: neonBoxShadow(colors.error, 'medium')` for incorrect selected state; in the answer result `<div>`, add `animation: prefersReducedMotion ? "none" : (answerResult.correct ? "correctBurst 0.5s ease-out forwards" : "incorrectFlash 0.6s ease-out forwards")` — use `useReducedMotion()` for the `prefersReducedMotion` value
- [X] T026 [US2] Update `frontend/src/components/Leaderboard.tsx`: import `neonBoxShadow`, `neonTextShadow` from `./ui/neon` and `useReducedMotion`; add `boxShadow: neonBoxShadow(colors.winner, 'high')` and `border: \`1px solid ${colors.winner}\`` to rank 1 `<li>` row; add `textShadow: neonTextShadow(colors.winner, 'medium')` to rank 1 name; add `animation: prefersReducedMotion ? "none" : "neonShimmer 1.5s infinite"` to the final results heading `<h2>` when `isFinal` is true
- [X] T027 [US2] Update `frontend/src/components/ui/Timer.tsx`: import `neonBoxShadow`, `neonTextShadow` from `./neon` and `useReducedMotion`; apply `textShadow: neonTextShadow(urgencyColor, 'medium')` to the countdown `<span>`; update `urgencyColor` thresholds to use arcade palette (`colors.primary` above 33%, `colors.warning` 15–33%, `colors.error` below 15%); apply `boxShadow: neonBoxShadow(urgencyColor, 'low')` to the progress bar fill `<div>`; suppress all transitions with `useReducedMotion()` check; apply `fontFamily: typography.fontDisplay` and `fontSize: typography.sizes.xxl` to the countdown number to fulfill FR-008's "bold, prominent" requirement
- [X] T028 [US2] Update `frontend/src/components/EmojiPicker.tsx`: import `neonBoxShadow` from `./ui/neon`; add `boxShadow: neonBoxShadow(colors.primary, 'medium')` to the selected emoji cell (currently styled with `aria-pressed`); add a hover glow by tracking hovered index in state and applying `neonBoxShadow(colors.accent, 'low')` on hover
- [X] T029 [US2] Update `frontend/src/components/HostDashboard.tsx`: import `neonBoxShadow` from `./ui/neon`; apply `boxShadow: neonBoxShadow(colors.primary, 'low')` to the answer progress bar fill `<div>` inner element; apply `border: \`1px solid ${colors.primary}\`` and `boxShadow: neonBoxShadow(colors.primary, 'low')` to the current question `<h2>` container to give it a subtle neon frame
- [X] T030 [US2] Update `frontend/src/components/Podium.tsx`: import `neonBoxShadow`, `neonTextShadow` from `./ui/neon` and `useReducedMotion`; apply `boxShadow: neonBoxShadow(colors.winner, 'high')` to the rank-1 podium step container; apply `textShadow: neonTextShadow(colors.winner, 'medium')` to the rank-1 player name; add `animation: prefersReducedMotion ? "none" : "neonShimmer 1.5s infinite"` to the winner name `<span>` for a celebratory shimmer effect on the final screen

**Checkpoint**: Buttons glow on hover. Correct answers trigger a green burst animation. Incorrect answers trigger a red flash. Rank 1 leaderboard entry has bright neon yellow highlight. Podium winner name shimmers. Timer digits glow in urgency color. Reduced-motion preference suppresses all animations while glows remain.

---

## Phase 5: User Story 3 — Arcade Typography Applied Uniformly (Priority: P3)

**Goal**: Audit every text element across all screens to ensure consistent use of `fontDisplay` (Press Start 2P) for headings/scores/display values and `fontBody` (VT323) for all body/interactive/label text. Verify and fix font fallback behavior.

**Independent Test**: Inspect each screen and confirm: (1) all headings use Press Start 2P, (2) all body text and form labels use VT323, (3) disabling custom fonts in browser DevTools shows a monospace fallback that does not break any layout, (4) no text falls back to Inter or system-ui.

### Implementation for User Story 3

> **Note**: These tasks are audit-and-fix tasks — if a typography gap is found, fix it in the same task. Do not mark a task complete if it found issues that were not corrected.

- [X] T031 [P] [US3] Audit and fix `frontend/src/styles/arcade.css` `@font-face` declarations: verify `font-display: swap` is present on both fonts; add `unicode-range: U+0020-007E, U+00A0-00FF` restriction to Press Start 2P (it only covers basic Latin + Latin-1 Supplement — this prevents invisible squares for unsupported Unicode); VT323 has broader coverage so no restriction needed; add a `/* Fallback: player names with non-Latin characters render in system monospace */` comment; verify the fallback font stack is `monospace` (not `system-ui` or `sans-serif`), fix if needed
- [X] T032 [P] [US3] Audit and fix `frontend/src/components/Lobby.tsx` for typography completeness: verify player name `<li>` elements use `fontFamily: typography.fontBody`; verify the scoring rule radio label `<strong>` elements use `fontFamily: typography.fontBody`; verify the time limit `<input>` uses `fontFamily: typography.fontBody`; verify the join code display uses `fontFamily: typography.fontDisplay` at `typography.sizes.display`; fix any element still using `typography.fontFamily` (old token name) or a system font
- [X] T033 [P] [US3] Audit and fix `frontend/src/components/Question.tsx` for typography completeness: verify the "Correct!" / "Incorrect" result text uses `fontFamily: typography.fontBody` (at `typography.sizes.xl`); verify streak multiplier, position, and points awarded text all use `fontFamily: typography.fontBody`; verify the scoring rule label uses `fontFamily: typography.fontBody`; fix any element using `typography.fontFamily` (old name) or a non-arcade font
- [X] T034 [P] [US3] Audit and fix `frontend/src/components/JoinForm.tsx` for typography completeness: verify join-code `<input>` uses `fontFamily: typography.fontDisplay` (it's a display value — the 6-char code); verify display-name `<input>` uses `fontFamily: typography.fontBody`; verify the avatar picker `<button>` uses `fontSize: typography.sizes.xxl` (emoji display, no custom font family needed for emoji — emoji render in system emoji font); fix any remaining references to the old `typography.fontFamily` token
- [X] T035 [P] [US3] Audit and fix `frontend/src/components/HostDashboard.tsx` for typography completeness: verify answer option `<div>` elements use `fontFamily: typography.fontBody`; verify answer count `<p>` uses `fontFamily: typography.fontBody`; verify standings score `<span>` values use `fontFamily: typography.fontDisplay`; verify the "End Question" Button inherits `fontDisplay` from the Button component (no override needed); fix any remaining old `typography.fontFamily` references

**Checkpoint**: Every text element on every screen uses either `fontDisplay` (headings, scores, counters) or `fontBody` (body text, labels, inputs). No Inter or system-ui fallback visible. Disabling custom fonts in DevTools shows clean monospace layout with no overlap or broken elements.

---

## Phase 6: User Story 4 — Accessible Contrast and Readability (Priority: P4)

**Goal**: Verify and enforce the 4.5:1 minimum contrast ratio between primary text and its background across all screens. Ensure neon glow halos do not reduce text legibility — core text must always be clearly distinguishable. Verify reduced-motion suppression is complete.

**Independent Test**: Using browser DevTools color picker, measure contrast ratio of: (a) `colors.text` (#e0f8ff) on `colors.background` (#050510) — must be ≥ 4.5:1, (b) `colors.text` on `colors.surface` (#0d0d2b) — must be ≥ 4.5:1, (c) `colors.success` (#39ff14) on `colors.surface` — must be ≥ 4.5:1, (d) `colors.warning` (#fff01f) on `colors.surface` — must be ≥ 4.5:1. Enable OS reduced-motion and confirm all animation properties are suppressed. Verify that focused elements (tab through the UI) have visible neon focus rings.

### Implementation for User Story 4

- [X] T036 [US4] Verify and fix contrast ratios in `frontend/src/components/ui/tokens.ts`: calculate the contrast ratio for `text` (#e0f8ff) on `background` (#050510) and `surface` (#0d0d2b); calculate contrast for `success` (#39ff14) on `surface`; calculate contrast for `warning` (#fff01f) on `surface`; calculate contrast for `textSecondary` (#7ec8e3) on `surface` (acceptable at 3:1 for non-essential secondary text); if any primary content color fails 4.5:1, adjust the failing token value and update all affected usages; document the verified ratios in a comment block at the top of `tokens.ts`
- [X] T037 [P] [US4] Review `frontend/src/components/ui/neon.ts` glow helper: verify that `neonTextShadow` adds glow around text (outward spread) without reducing the legibility of the text character itself; add a JSDoc comment: `@param color - Must differ from the element's background-color; applying glow in the same hue as the background causes text to blend in`; add an optional `offset?: number` parameter (default 0) to shift the glow outward from the text if needed for readability; verify `neonPulseStyle` does not produce a `boxShadow` that obscures the element's text content
- [X] T038 [P] [US4] Review and fix `frontend/src/components/Question.tsx` answer option contrast: verify that the selected-state background (`${colors.primary}15` = #00ffff15, very low opacity) does not reduce text contrast below 4.5:1 for `colors.text` on that background; verify correct-state background (`${colors.success}15`) and incorrect-state (`${colors.error}15`) pass contrast check for their respective text colors; adjust opacity suffixes on background colors if needed; verify focus rings on answer option `<button>` elements remain visible (check browser default `:focus-visible` outline is not overridden)

**Checkpoint**: All primary text (questions, answers, scores, timers, player names) passes 4.5:1 contrast minimum. Glow halos are visually distinct from text characters. Focus rings are visible on all interactive elements. Reduced-motion fully suppresses all animations.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, cleanup, and completeness checks.

- [X] T039 Update `frontend/src/index.html`: change page `<title>` from "Quiz Game" to a themed title (e.g., "QUIZ GAME" — confirm no copyrighted branding); verify `<meta name="viewport" content="width=device-width, initial-scale=1.0">` is present for mobile support
- [X] T040 [P] Run `pnpm exec biome check src/` in `frontend/` and fix all linting/formatting violations introduced by token and component changes; verify zero violations before committing
- [X] T041 [P] Run `pnpm test` in `frontend/` and confirm all existing Vitest component tests pass plus all new T006/T007 tests pass; if any test fails due to renamed token exports (`fontFamily` → `fontDisplay`/`fontBody`), update the test to use the new token names
- [X] T042 Run visual inspection checklist across all 6 screens at desktop (1280px), mobile-standard (375px), and **mobile-minimum (320px)** widths: join screen, lobby (player view), lobby (host view with scoring controls), quiz question, answer reveal (correct), answer reveal (incorrect), mid-game leaderboard, final leaderboard with Podium, host dashboard; for each screen confirm: dark background, neon accents, arcade fonts, no layout overlap, no invisible text, and visible focus rings when tabbing; also confirm button glow feedback appears within approximately 100ms of hover (check in browser DevTools Performance panel — look for a paint event within one frame of the `mouseover` event)
- [X] T043 [P] Run `just lint` and `just test` from repo root to confirm full suite passes (frontend + backend + e2e); confirm Playwright e2e tests pass (they test functional behavior, not visual styling, so they should be unaffected by the theme changes)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on T001 + T002 (font files must exist before `@font-face` can reference them); T006/T007 (tests) MUST run before T008/T009 (implementations); T005, T006, T007 can start together; T008, T009, T010 follow after tests are written
- **Phase 3 (US1)**: Depends on Phase 2 completion — all `tokens.ts` and `neon.ts` exports must exist
- **Phase 4 (US2)**: Depends on Phase 2 completion and Phase 3 partial completion (components must have arcade theme before animations are layered on)
- **Phase 5 (US3)**: Depends on Phase 3 completion (must audit components after they've been updated)
- **Phase 6 (US4)**: Depends on Phase 3 + Phase 5 completion (contrast must be checked after fonts and colors are finalized)
- **Phase 7 (Polish)**: Depends on all preceding phases complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependencies on other user stories
- **US2 (P2)**: Can start after Phase 2 + US1 partial (components should have base theme before animations)
- **US3 (P3)**: Can start after US1 complete (auditing typography of updated components)
- **US4 (P4)**: Can start after US1 + US3 complete (contrast audit requires final token values and font choices)

### Within Each Phase

- All [P]-marked tasks within a phase can run in parallel (they operate on different files)
- Non-[P] tasks within a phase depend on the same-phase [P] tasks completing first
- **TDD ordering in Phase 2**: T006 → T008 (test then implement neon.ts); T007 → T009 (test then implement useReducedMotion.ts)

### Parallel Opportunities

- T001 and T002 (font downloads) can run in parallel
- T005, T006, T007 (tokens + two test files) can all run in parallel
- T008, T009 (implementations) can run in parallel after T006 and T007 complete
- All Phase 3 US1 tasks (T011–T023) can run in parallel (different component files)
- All Phase 5 US3 audit tasks (T031–T035) can run in parallel (different files)
- T040, T041, T043 in Polish phase can run in parallel

---

## Parallel Example: User Story 1 (Phase 3)

```bash
# All 13 Phase 3 tasks can be launched simultaneously (different files):
Task T011: Update frontend/src/pages/HomePage.tsx
Task T012: Update frontend/src/components/ui/Card.tsx
Task T013: Update frontend/src/components/ui/Button.tsx
Task T014: Update frontend/src/components/JoinForm.tsx
Task T015: Update frontend/src/components/Lobby.tsx
Task T016: Update frontend/src/components/Question.tsx
Task T017: Update frontend/src/components/Leaderboard.tsx
Task T018: Update frontend/src/components/HostDashboard.tsx
Task T019: Update frontend/src/components/Podium.tsx
Task T020: Update frontend/src/components/EmojiPicker.tsx
Task T021: Update frontend/src/components/AvatarPickerModal.tsx
Task T022: Update frontend/src/components/QuizUpload.tsx
Task T023: Update frontend/src/pages/HostPage.tsx + PlayerPage.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (font assets + arcade.css)
2. Complete Phase 2: Foundational (TDD tests → tokens → neon.ts → useReducedMotion.ts → keyframes)
3. Complete Phase 3: US1 — apply arcade theme to all screens
4. **STOP and VALIDATE**: Navigate all 6 screens, confirm arcade color scheme and fonts
5. Demo/validate — already a fully themed arcade-style app at this point

### Incremental Delivery

1. **Phase 1 + 2** → Foundation ready (dark theme, fonts, glow utilities, keyframes, tests passing)
2. **Phase 3** → Arcade visual theme on all screens → **Demo ready (MVP)**
3. **Phase 4** → Glow effects + animations → **Enhanced arcade experience**
4. **Phase 5** → Typography audit → **Typography consistency guaranteed**
5. **Phase 6** → Contrast validation → **Accessibility confirmed**
6. **Phase 7** → Polish + full suite validation → **Ship ready**

Each phase adds measurable value without breaking the previous phases.

---

## Notes

- All tasks modify `frontend/` only — no backend files changed
- `tokens.ts` rename of `fontFamily` to `fontDisplay`/`fontBody` is a breaking change — any test referencing `typography.fontFamily` must be updated in T041
- Press Start 2P is very wide — use it sparingly and at readable sizes (≥14px); never use it for long sentences
- VT323 renders best at larger-than-typical sizes for body text (use 18–22px rather than 14–16px)
- `neonPulseStyle(color)` uses an opacity-modulating keyframe + inline `boxShadow` for the color — the `neonPulse` keyframe itself is color-agnostic
- When checking contrast ratios manually: `text` (#e0f8ff) on `background` (#050510) ≈ 18:1 — well above 4.5:1; the main risk area is `textSecondary` on `surface`
- Focus ring visibility: browser default `:focus-visible` outlines should appear in the neon border color; if they are suppressed (via `outline: none` anywhere), restore them with neon-colored `outline: 2px solid ${colors.primary}` on interactive elements
