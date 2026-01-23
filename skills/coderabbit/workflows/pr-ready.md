# PR-Ready Workflow

Comprehensive pre-PR check. Run before creating a pull request.

## Steps

### Step 1: Full review against target branch

```bash
cr review --plain --base main
```

### Step 2: Check all categories

Run focused checks:

```bash
# Security
cr review --prompt-only | grep -iE "security|inject|xss|csrf|auth|secret"

# Performance
cr review --prompt-only | grep -iE "performance|slow|memory|leak|cache"

# Accessibility
cr review --prompt-only | grep -iE "a11y|accessibility|aria|alt|label|focus"

# Code quality
cr review --prompt-only | grep -iE "unused|dead|duplicate|complex"
```

### Step 3: Checklist

Before creating PR:

- [ ] CodeRabbit review passes (no CRITICAL/HIGH)
- [ ] Security issues addressed
- [ ] Accessibility checked (if UI changes)
- [ ] No hardcoded secrets
- [ ] Tests pass
- [ ] Types check

### Step 4: Create PR

If all checks pass:
```bash
gh pr create --title "feat: description" --body "..."
```
