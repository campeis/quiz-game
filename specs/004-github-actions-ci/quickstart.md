# Quickstart: GitHub Actions CI Workflow

**Branch**: `004-github-actions-ci`

## Files Created / Modified

| File | Change |
|------|--------|
| `.github/workflows/ci.yml` | NEW — CI workflow |
| `.github/dependabot.yml` | NEW — keeps action SHAs updated |
| `e2e/playwright.config.ts` | MODIFIED — `reuseExistingServer: !process.env.CI` |

## Validating the Workflow

### Test: Workflow triggers on main push

Push any commit to `main` and verify in the GitHub Actions tab that the `CI` workflow appears and runs.

### Test: Workflow passes on clean code

```bash
git checkout main
git push  # triggers workflow
# check GitHub → Actions → CI → latest run → all steps green
```

### Test: Workflow fails on broken code

```bash
git checkout -b test-ci-failure
# introduce a deliberate test failure (e.g., a failing assertion)
git commit -am "test: deliberate failure"
# merge/push directly to main (test only)
git push
# verify GitHub → Actions → CI → run shows failure on the "Test" step
```

### Test: Workflow does NOT trigger on non-main branches

```bash
git checkout -b feature/some-work
git push
# verify GitHub → Actions shows no new CI run for this push
```

## Checking Caches

After the first successful run, subsequent runs with unchanged dependencies will show "Cache restored" in the Cargo and pnpm cache steps, significantly reducing run time.

## Updating Action SHAs

Dependabot will automatically open PRs when newer versions of the pinned actions are released. Review and merge those PRs to keep SHAs current.

To manually update a SHA:
1. Find the new release on the action's GitHub releases page
2. Copy the full commit SHA of the release tag
3. Update the SHA in `.github/workflows/ci.yml` and update the version comment

## Environment Variables and Secrets

No secrets are required for this workflow. If secrets are needed in the future:
- Add them via GitHub repository Settings → Secrets and variables → Actions
- Reference them in the workflow as `${{ secrets.SECRET_NAME }}`
- Never hardcode secret values in the workflow file
