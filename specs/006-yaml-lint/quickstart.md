# Quickstart: YAML Linting

**Branch**: `006-yaml-lint`

## Files Created / Modified

| File | Change |
|------|--------|
| `.yamllint.yml` | NEW — yamllint configuration |
| `Justfile` | MODIFIED — `yamllint .` added to `lint` recipe |
| `.github/workflows/ci.yml` | MODIFIED — `pip install yamllint` step added before lint |

## Running YAML Lint Locally

Install yamllint (one-time):

```bash
pip install yamllint
```

Then run via the task runner:

```bash
just lint          # runs all lints including yamllint
```

Or run yamllint directly:

```bash
yamllint .         # checks all .yml and .yaml files (excludes lockfiles per config)
```

## Validating the Implementation

All existing YAML files must pass (SC-001):

```bash
yamllint .
# Expected: no output, exit code 0
```

Verify the lockfiles are excluded:

```bash
yamllint frontend/pnpm-lock.yaml
# Expected: "frontend/pnpm-lock.yaml: ignored" (or similar skip message)
```

Test that a syntax error is caught (then revert):

```bash
echo "invalid: yaml: :" >> .github/dependabot.yml
yamllint .
# Expected: error reported with file and line number
git checkout .github/dependabot.yml
```
