# Quickstart: Expand Dependabot Coverage

**Branch**: `005-dependabot-expand`

## File Modified

| File | Change |
|------|--------|
| `.github/dependabot.yml` | MODIFIED — add cargo + npm×2 entries; all schedules → daily |

## Validation

After implementation, verify `.github/dependabot.yml` contains exactly four entries:

```bash
grep "package-ecosystem:" .github/dependabot.yml
# Expected output (4 lines):
#   package-ecosystem: github-actions
#   package-ecosystem: cargo
#   package-ecosystem: npm
#   package-ecosystem: npm

grep "interval:" .github/dependabot.yml
# Expected output (4 lines, all daily):
#       interval: daily
#       interval: daily
#       interval: daily
#       interval: daily
```

## What to Expect After Merge

On the next daily Dependabot run after this config is pushed to the default branch:
- Dependabot will scan `backend/Cargo.toml` for outdated Rust crates
- Dependabot will scan `frontend/pnpm-lock.yaml` for outdated Node.js packages
- Dependabot will scan `e2e/pnpm-lock.yaml` for outdated Node.js packages
- GitHub Actions SHAs will continue to be checked (now daily instead of weekly)

Any outdated dependencies found will generate individual pull requests automatically.
