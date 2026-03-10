# Research: 80s Arcade Neon UI Redesign

## Decision 1: Primary Display Font

**Decision**: Press Start 2P (OFL 1.1)

**Rationale**: Directly based on Namco arcade cabinet display hardware from 1981–1982. Universally recognized as the definitive arcade pixel font. OFL 1.1 permits commercial and non-commercial bundling with no attribution requirement. Available from Google Fonts as a downloadable `.ttf`, convertible to `.woff2` for optimal web delivery.

**Usage guidance**: Minimum 14px recommended; use for headings, game title, score displays, leaderboard rank numbers. Do NOT use at body text sizes — readability degrades below 12px.

**Alternatives considered**:
- **Silkscreen** (OFL 1.1): Cleaner pixel font, more readable at small sizes; less instantly recognizable as "arcade". Acceptable fallback.
- **Orbitron** (OFL 1.1): Futuristic geometric sans-serif (Tron aesthetic). Not pixelated — more "sci-fi" than "arcade". Less authentic for 80s cabinets.
- **Audiowide** (OFL 1.1): Display font with retro-futuristic feel; not arcade-specific enough.

---

## Decision 2: Secondary Body/UI Font

**Decision**: VT323 (OFL 1.1)

**Rationale**: Emulates the VT220 terminal/CRT phosphor display — a common visual element of 1980s computing and arcade game interfaces. Highly readable at 12px–16px (significantly better than Press Start 2P at normal text sizes). OFL 1.1 licensed. Complements Press Start 2P by sharing the "pixel era" aesthetic without competing for visual dominance.

**Usage guidance**: 14px minimum for body content; 12px acceptable for metadata/labels. Use for question text, answer options, player names, score values, secondary labels.

**Alternatives considered**:
- **Share Tech Mono** (OFL 1.1): More subtle retro feel; less "arcade" than VT323; better for technical UI but not themed enough.
- **Press Start 2P everywhere**: Rejected — too small/unreadable for body text, increases cognitive load during gameplay.

---

## Decision 3: Font Hosting Strategy

**Decision**: Self-hosted in `frontend/src/assets/fonts/`; referenced via CSS `@font-face` in a global CSS file.

**Rationale**: Clarification answer (Q3 in `/speckit.clarify`) mandated self-hosting. This approach:
- Eliminates third-party CDN dependency (no network risk during gameplay)
- Makes license compliance fully auditable (font files in repo)
- Works with Rspack's built-in asset processing: CSS `url()` references to font files in `src/` are automatically processed when using `type: "css"` loader

**Font file locations**:
- `frontend/src/assets/fonts/PressStart2P-Regular.woff2`
- `frontend/src/assets/fonts/VT323-Regular.woff2`

**Conversion note**: Download `.ttf` from Google Fonts; convert to `.woff2` using `python -m fonttools.ttLib.woff2.compress` (fonttools package, MIT license). `.woff2` is the preferred format (smaller file size, universally supported in modern browsers).

---

## Decision 4: Animation Architecture

**Decision**: Global CSS file (`frontend/src/styles/arcade.css`) imported in `main.tsx`, containing `@font-face` declarations, `@keyframes` animations, `@media (prefers-reduced-motion)` overrides, and base body styles. Inline styles in components reference animation names as strings.

**Rationale**:
- Rspack already has CSS support configured (`{ test: /\.css$/, type: "css" }`) — no bundler changes needed
- Keyframe definitions cannot be expressed as React inline style objects; a CSS file is the only practical approach
- Importing once in `main.tsx` ensures global availability across all components
- No CSS-in-JS library needed — zero new dependencies

**Alternatives considered**:
- **Programmatic `<style>` tag injection**: Works but is less conventional, harder to audit, and bypasses Rspack's CSS processing pipeline. Rejected.
- **Styled-components / Emotion**: Would require adding a library dependency and refactoring all existing components. Over-engineered for this use case. Rejected.

---

## Decision 5: Neon Glow Implementation

**Decision**: Multi-layer `box-shadow` (for elements/borders) and `text-shadow` (for text) using rgba values to simulate authentic neon tube depth. Glow helpers centralized in `frontend/src/components/ui/neon.ts` as pure TypeScript functions returning CSS string values.

**Neon color palette** (confirmed for implementation):
| Role | Hex | Usage |
|------|-----|-------|
| Neon cyan | `#00ffff` | Primary interactive elements, borders, default glow |
| Neon magenta | `#ff00ff` | Secondary accent, correct answer highlight |
| Neon green | `#39ff14` | Success/correct feedback |
| Neon red | `#ff3131` | Incorrect answer, warning state |
| Neon yellow | `#fff01f` | Timer urgency, leaderboard rank 1 highlight |
| Background | `#050510` | Near-black with slight blue tint (authentic CRT off-state) |
| Surface | `#0d0d2b` | Card/panel backgrounds (dark navy) |

**Glow pattern** (multi-layer shadows for depth):
```
/* Neon cyan glow example */
box-shadow:
  0 0 5px  #00ffff,   /* tight inner glow */
  0 0 10px #00ffff,   /* medium halo */
  0 0 20px #00ffff,   /* outer spread */
  0 0 40px #00ffffaa; /* distant bloom */
```

---

## Decision 6: Reduced-Motion Support

**Decision**: Two-layer approach — CSS `@media (prefers-reduced-motion: reduce)` in the global CSS file (suppresses `animation` and `transition` properties) PLUS a `useReducedMotion` React hook for components that apply animations via inline styles.

**Rationale**: CSS media query covers animations applied via CSS class/animation names. The React hook covers animation decisions made in JavaScript (e.g., conditional `animation` property in inline styles). Both are needed because the codebase uses inline styles for most visual state.

**Hook**: `frontend/src/hooks/useReducedMotion.ts` — reads `window.matchMedia('(prefers-reduced-motion: reduce)')` and re-evaluates on change. Returns a boolean.

---

## Decision 7: Scope of Changes (Frontend Only)

**Decision**: Zero backend changes. This is a pure frontend visual reskin.

**Rationale**: No new data is added or removed, no new API endpoints, no new WebSocket message types. The backend continues to serve the same data; only how it is displayed changes.

**Files changed** (frontend only):
- `frontend/src/components/ui/tokens.ts` — full overhaul of design tokens
- `frontend/src/components/ui/neon.ts` — new file, glow shadow utilities
- `frontend/src/styles/arcade.css` — new file, @font-face + @keyframes + base styles
- `frontend/src/assets/fonts/` — new directory, 2 woff2 font files
- `frontend/src/hooks/useReducedMotion.ts` — new file
- `frontend/src/main.tsx` — add CSS import
- All component files (`Button`, `Card`, `Timer`, `Question`, `Leaderboard`, `HostDashboard`, `Lobby`, `JoinForm`, `Podium`, `EmojiPicker`, `AvatarPickerModal`, `QuizUpload`, `HomePage`, `HostPage`, `PlayerPage`) — update to arcade tokens and neon effects

---

## Unresolved Items

None. All decisions resolved. Ready for Phase 1.
