# Research: Add Storybook Component Showcase

**Date**: 2026-03-14
**Branch**: `014-add-storybook`

---

## R-001: Storybook + Rspack Integration

**Decision**: Use `storybook-react-rsbuild` (community Storybook builder wrapping Rsbuild)

**Rationale**: Storybook has no first-class Rspack builder — the feature request (storybookjs/storybook #21561) remains open, and the `storybook-builder-rspack` package was abandoned at version 7.0.0-rc.25 (2 years ago, incompatible with Storybook 8+). `storybook-react-rsbuild` is the recommended path from the Rspack ecosystem: it wraps Rsbuild (Rspack's official higher-level build tool, from the same org), is listed on Storybook's integrations page, and avoids introducing webpack or Vite as a second bundler into the project.

**Packages required** (new `devDependencies` in `frontend/package.json`):
- `storybook` — core CLI and manager
- `storybook-react-rsbuild` — framework + builder (includes Rsbuild integration)
- `@rsbuild/core` — Rsbuild core (peer dependency)
- `@rsbuild/plugin-react` — React JSX transform + Fast Refresh for Rsbuild
- `@storybook/addon-essentials` — bundles Controls, Actions, Docs, Viewport, Backgrounds

**Alternatives considered**:
- `@storybook/react-webpack5` — Rspack is webpack-API-compatible but adds a separate bundler; risks divergence from the project's Rspack setup
- `@storybook/react-vite` — completely different bundler with separate module resolution; CSS and import behaviour may diverge from main app
- `storybook-builder-rspack` (abandoned) — last release targets Storybook 7; incompatible with Storybook 8+, ruled out

---

## R-002: Build Configuration Approach

**Decision**: Separate `frontend/rsbuild.config.ts` with only `pluginReact()` — not shared with `rspack.config.ts`

**Rationale**: The main `rspack.config.ts` configures `rspack serve` and the production build with `HtmlRspackPlugin`, a backend proxy, and asset size limits — none of which are relevant to Storybook. A minimal `rsbuild.config.ts` keeps the two build pipelines independent and prevents Storybook from inheriting app-specific settings. Rsbuild picks up `rsbuild.config.ts` automatically when Storybook runs from `frontend/`.

**Alternatives considered**:
- Merging via the `rsbuildFinal` hook to reuse `rspack.config.ts` rules — over-engineering; the proxy, HTML plugin, and performance limits are irrelevant to Storybook
- Sharing the same config file — Rsbuild and Rspack use different config formats; not directly possible

---

## R-003: Global CSS and Font Loading

**Decision**: Import `arcade.css` in `.storybook/preview.ts`

**Rationale**: Everything imported in `preview.ts` is applied to every story's iframe and is HMR-aware. Importing `../src/styles/arcade.css` (same relative path as in `main.tsx`) ensures stories get the arcade body background, `Press Start 2P` display font, `VT323` body font, and all keyframe animations. `@rsbuild/plugin-react` handles CSS imports natively — no additional CSS loader config needed.

**Alternatives considered**:
- `preview-head.html` with a `<link>` tag — not HMR-aware and requires absolute/CDN paths, defeating self-hosted font setup
- Per-story CSS decorator — redundant for global styles that every component needs

---

## R-004: TypeScript Prop Controls (ArgTypes)

**Decision**: CSF3 format with `reactDocgen: 'react-docgen-typescript'` enabled in `main.ts`

**Rationale**: Storybook 8 defaults to `react-docgen` for prop inference, but `react-docgen-typescript` gives better results with TypeScript interfaces that extend HTML attribute types — specifically `ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>` and `CardProps extends HTMLAttributes<HTMLDivElement>`. With the default `react-docgen`, inherited HTML props like `disabled` and `onClick` would not appear in the Controls panel. Enabling `react-docgen-typescript` ensures full prop coverage without manual `argTypes` definitions.

**Alternatives considered**:
- Default `react-docgen` — misses inherited HTML attributes; would require per-story manual `argTypes` that drift from the component interface
- Manual `argTypes` in every story — fragile; requires updating whenever component interface changes

---

## R-005: Story Format

**Decision**: CSF3 (Component Story Format 3) with `satisfies Meta<typeof Component>` pattern

**Rationale**: CSF3 is the Storybook 8 standard. The TypeScript `satisfies` operator (available since TS 4.9, present in this project's TS 5.7) infers the exact `args` type from the component's props while validating against `Meta<...>` — better IDE autocompletion and stricter type checking than the older `as Meta<...>` cast. Story objects define `args` for initial values; the Controls panel allows runtime overrides.

---

## R-006: Port and Launch Command

**Decision**: Port 6006 (Storybook default); `package.json` script `storybook dev -p 6006`; Justfile recipe `cd frontend && pnpm storybook`

**Rationale**: Port 6006 is the Storybook community default and does not conflict with port 5173 (Rspack dev server) or port 3000 (Rust backend). Using the default avoids unnecessary configuration and matches developer expectations. The Justfile recipe follows the same delegation pattern as existing `just test-frontend` and `just lint` recipes.
