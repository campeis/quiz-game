# Research: pnpm Migration

## npm to pnpm Command Mapping

| npm Command | pnpm Equivalent |
|-------------|-----------------|
| `npm install` | `pnpm install` |
| `npm run <script>` | `pnpm run <script>` or `pnpm <script>` |
| `npm test` | `pnpm test` |
| `npx <command>` | `pnpm exec <command>` or `pnpx <command>` |
| `npm install <pkg>` | `pnpm add <pkg>` |
| `npm install -D <pkg>` | `pnpm add -D <pkg>` |

**Decision**: Use `pnpm exec` instead of `pnpx` for running package binaries in scripts, as it is the officially recommended approach.
**Rationale**: `pnpm exec` is more explicit and avoids confusion with the deprecated `pnpx` alias.

## Lockfile Migration

**Decision**: Delete `package-lock.json` files and generate `pnpm-lock.yaml` via `pnpm install`.
**Rationale**: pnpm uses its own lockfile format. Running `pnpm install` in a directory with `package.json` (and no existing pnpm lockfile) generates a fresh `pnpm-lock.yaml` from the declared dependencies.
**Alternatives considered**: `pnpm import` can convert `package-lock.json` to `pnpm-lock.yaml`, preserving exact resolved versions. However, for a small project with no deployment pinning concerns, a fresh install is simpler and produces a clean lockfile.

## pnpm Node Modules Structure

**Decision**: Use pnpm's default content-addressable store with symlinked `node_modules`.
**Rationale**: pnpm's default behavior works with the existing tooling (Rspack, Vitest, Biome, Playwright). No `.npmrc` configuration with `shamefully-hoist=true` is expected to be needed.
**Risk**: If any dependency relies on hoisted `node_modules` (flat structure), it may fail to resolve. This would manifest as import errors during build or test. Mitigation: if encountered, add `node-linker=hoisted` to `.npmrc`.

## Files Requiring Updates

Identified by searching for `npm` and `npx` references outside `node_modules/`:

1. `Justfile` — 8 references to `npm`/`npx` across 6 recipes
2. `specs/001-multiplayer-quiz/quickstart.md` — npm commands in setup instructions
3. `specs/001-multiplayer-quiz/research.md` — mentions npm in technology context
4. `e2e/playwright.config.ts` — no npm references (uses standard config)
5. `frontend/package-lock.json` — to be deleted
6. `e2e/package-lock.json` — to be deleted
