# Research: GitHub Actions CI Workflow

**Feature**: 004-github-actions-ci | **Date**: 2026-02-19

## R1: Action SHA Pins

**Decision**: Pin all third-party actions to their full 40-character commit SHA with a version comment, as of 2026-02-19.

| Action | Version | SHA |
|--------|---------|-----|
| `actions/checkout` | v4.2.2 | `11bd71901bbe5b1630ceea73d27597364c9af683` |
| `dtolnay/rust-toolchain` | 2026-02-13 | `efa25f7f19611383d5b0ccf2d1c8914531636bf9` |
| `pnpm/action-setup` | v4.2.0 | `41ff72655975bd51cab0327fa583b6e92b6d3061` |
| `actions/setup-node` | v4.4.0 | `49933ea5288caeca8642d1e84afbd3f7d6820020` |
| `taiki-e/install-action` | v2.68.2 | `70e00552f3196d9a4c7dde7c57ef4c4830d422dd` |
| `actions/cache` | v5.0.3 | `cdf6c1fa76f9f475f3d7449005a359c84ca0f306` |

**Rationale**: SHA pins are immutable — unlike version tags (`@v4`), a SHA cannot be repointed by the action's author or by an attacker who compromises their account. This prevents supply-chain attacks via compromised action releases.

**Alternatives considered**:
- Floating tags (`@v4`, `@main`) — rejected because tags are mutable and can be silently repointed
- Renovate instead of Dependabot — both work; Dependabot is built-in to GitHub with zero configuration overhead

## R2: Tool for Installing `just`

**Decision**: Use `taiki-e/install-action` to install `just` on the runner.

**Rationale**: `taiki-e/install-action` natively supports `just` (sourced from `casey/just` GitHub Releases, SHA256-verified). It is the standard tool for installing pre-built binaries on GitHub Actions runners and supports Linux/macOS/Windows.

**Alternatives considered**:
- `moonrepo/setup-toolchain` — designed for the `moon`/`proto` ecosystem, not general tool installation. Rejected.
- `cargo install just` — installs from source, significantly slower (~3-5 min compile). Rejected for performance reasons.
- `brew install just` on Ubuntu — not available on Linux runners without extra setup. Rejected.

## R3: Playwright System Dependencies on `ubuntu-latest`

**Decision**: Install Playwright Chromium system dependencies via `apt-get` as a separate step before `just setup`, targeting only the known-missing libraries.

**Missing libraries on `ubuntu-latest`**:
- `libnss3`, `libatk-bridge2.0-0`, `libdrm2`, `libxcomposite1`, `libxdamage1`, `libxrandr2`, `libgbm1`

**Command**:
```
sudo apt-get update && sudo apt-get install -y libnss3 libatk-bridge2.0-0 libdrm2 libxcomposite1 libxdamage1 libxrandr2 libgbm1
```

**Rationale**: `just setup` runs `pnpm exec playwright install chromium` which installs the browser binary but not its OS-level runtime libraries. These must be present before the browser can launch during `just test-e2e`.

**Alternatives considered**:
- `pnpm exec playwright install --with-deps chromium` — installs browser + system deps in one command, but has known apt lock contention issues on GitHub-hosted runners (causing hangs / timeouts in `microsoft/playwright#23896`, `actions/runner-images#11347`). Rejected.
- Modifying `just setup` to include `install-deps` — would tie the local developer setup to the CI runner's apt environment. Rejected.

## R4: Caching Strategy

**Decision**: Use `actions/cache` with two separate cache entries: one for Cargo (keyed on `Cargo.lock`) and one for the pnpm store (keyed on all `pnpm-lock.yaml` files).

**Cargo cache paths**:
```
~/.cargo/registry
~/.cargo/git
backend/target
```
**Key**: `${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}`

**pnpm store cache path**:
```
~/.local/share/pnpm/store
```
**Key**: `${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}`

**Rationale**: Caching significantly reduces CI run time on repeat pushes. Rust compilation is the largest time consumer; caching `backend/target` avoids recompiling unchanged crates. pnpm's content-addressable store means a single cache entry covers both `frontend/` and `e2e/` lockfiles.

**Alternatives considered**:
- `Swatinem/rust-cache` action — a popular alternative for Rust caching with more granular options, but adds a third-party dependency. Using `actions/cache` directly keeps the dependency count minimal.
- `actions/setup-node` with `cache: 'pnpm'` — supports only a single lockfile path; this project has two (`frontend/pnpm-lock.yaml` and `e2e/pnpm-lock.yaml`). Using `actions/cache` directly handles both.

## R5: pnpm Version

**Decision**: Specify `version: '10'` in `pnpm/action-setup` to match the version in use locally (`pnpm v10.29.3` observed during project setup).

**Rationale**: The project's `package.json` does not have a `packageManager` field. Explicitly setting the major version ensures pnpm v10 is installed rather than defaulting to whatever `pnpm/action-setup` ships.

**Alternatives considered**:
- Add `packageManager: pnpm@10.x.x` to `frontend/package.json` — would allow `pnpm/action-setup` to auto-detect the version, but requires a separate package.json change unrelated to CI. Deferred.
- Hardcode exact version (e.g., `10.29.3`) — overly specific; will break on any pnpm patch update. Rejected.

## R6: `reuseExistingServer` in `playwright.config.ts`

**Decision**: Change `reuseExistingServer: true` to `reuseExistingServer: !process.env.CI` in both `webServer` entries.

**Rationale**: On CI, no servers are pre-running, so `reuseExistingServer: true` is functionally equivalent — Playwright will always start fresh servers. However, `!process.env.CI` makes the intent explicit (never reuse in CI) and is the established Playwright convention. It also prevents a subtle race condition if a future CI setup runs multiple jobs on the same runner.

**Impact**: Minor — changes two lines in `e2e/playwright.config.ts`. No behavioral change in current CI environment.

## R7: Dependabot for Action Updates

**Decision**: Add `.github/dependabot.yml` configured for `github-actions` package ecosystem.

**Rationale**: SHA-pinned actions with version comments are recognized by Dependabot, which will open PRs automatically when newer versions are available. This addresses the "periodic SHA re-check" maintenance burden without manual effort.

**Alternatives considered**:
- Renovate — more configurable but requires an external app install. Dependabot is built-in to GitHub with no additional setup. Accepted.
- Manual periodic updates — error-prone, relies on humans remembering. Rejected.
