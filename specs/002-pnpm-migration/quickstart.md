# Quickstart: pnpm Migration

## Prerequisites

- pnpm (v9+) — install via `npm install -g pnpm` or `corepack enable && corepack prepare pnpm@latest --activate`
- Rust toolchain (stable)
- just (command runner)

## Migration Steps

### 1. Remove npm lockfiles

```bash
rm frontend/package-lock.json
rm e2e/package-lock.json
```

### 2. Install dependencies with pnpm

```bash
cd frontend && pnpm install
cd ../e2e && pnpm install
```

### 3. Verify pnpm lockfiles created

```bash
ls frontend/pnpm-lock.yaml
ls e2e/pnpm-lock.yaml
```

### 4. Update Justfile

Replace all `npm`/`npx` references:
- `npm install` → `pnpm install`
- `npm run <script>` → `pnpm run <script>`
- `npm test` → `pnpm test`
- `npx <command>` → `pnpm exec <command>`

### 5. Update documentation

Replace npm references in:
- `specs/001-multiplayer-quiz/quickstart.md`
- Any other documentation files referencing npm commands

### 6. Verify

```bash
just test          # All 43 tests pass
just build         # Frontend builds successfully
just lint          # Linting passes
```

## Rollback

If issues arise, restore npm lockfiles from git:

```bash
git checkout -- frontend/package-lock.json e2e/package-lock.json
```
