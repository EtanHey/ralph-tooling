---
name: add-bug
description: Add a bug report to the PRD
---

# Add a Bug Report

> Add a bug fix story to an existing PRD, handling both active Ralph and manual scenarios.

## Step 1: Detect Ralph Status

```bash
# Check if Ralph is running
if [[ -f /tmp/ralph_pid_* ]]; then
    echo "Ralph ACTIVE - use update.json method"
else
    echo "Ralph NOT active - use direct edit method"
fi
```

## Step 2: Find Next Bug ID

```bash
# Get highest BUG-XXX number
last_bug=$(jq -r '.storyOrder[]' prd-json/index.json | grep '^BUG-' | sort -t'-' -k2 -n | tail -1 | cut -d'-' -f2)
next_bug=$((${last_bug:-0} + 1))
echo "Next bug ID: BUG-$(printf '%03d' $next_bug)"
```

## Step 3a: Ralph Active - Use update.json

When Ralph is running, create `prd-json/update.json`:

```json
{
  "newStories": [
    {
      "id": "BUG-XXX",
      "title": "Fix: Brief description of the bug",
      "description": "Detailed description of what's broken and expected behavior",
      "type": "bugfix",
      "priority": "high",
      "storyPoints": 2,
      "status": "pending",
      "acceptanceCriteria": [
        {"text": "Reproduce the bug (describe steps)", "checked": false},
        {"text": "Identify root cause", "checked": false},
        {"text": "Implement fix", "checked": false},
        {"text": "Verify bug no longer occurs", "checked": false},
        {"text": "No regression in related functionality", "checked": false}
      ],
      "dependencies": []
    }
  ]
}
```

**What happens:**
1. Ralph detects `update.json` at START of next iteration
2. Creates story file in `prd-json/stories/`
3. Adds ID to `pending` and `storyOrder` arrays
4. Recalculates stats
5. Deletes `update.json`

## Step 3b: Ralph Not Active - Direct Edit

### Create the bug story file:

```bash
# Create bug story JSON file
cat > prd-json/stories/BUG-XXX.json << 'EOF'
{
  "id": "BUG-XXX",
  "title": "Fix: Brief description of the bug",
  "description": "Detailed description of what's broken and expected behavior",
  "type": "bugfix",
  "priority": "high",
  "storyPoints": 2,
  "status": "pending",
  "acceptanceCriteria": [
    {"text": "Reproduce the bug (describe steps)", "checked": false},
    {"text": "Identify root cause", "checked": false},
    {"text": "Implement fix", "checked": false},
    {"text": "Verify bug no longer occurs", "checked": false},
    {"text": "No regression in related functionality", "checked": false}
  ],
  "dependencies": []
}
EOF
```

### Update index.json:

```bash
# Add to storyOrder and pending arrays
jq '.storyOrder += ["BUG-XXX"] | .pending += ["BUG-XXX"] | .stats.total += 1 | .stats.pending += 1' \
    prd-json/index.json > /tmp/index.tmp && mv /tmp/index.tmp prd-json/index.json
```

### Set nextStory if urgent:

```bash
# If this bug is critical and should be fixed next
jq '.nextStory = "BUG-XXX"' prd-json/index.json > /tmp/index.tmp && mv /tmp/index.tmp prd-json/index.json
```

## Bug Priority Guide

| Priority | Use When | Story Points |
|----------|----------|--------------|
| `critical` | Production down, data loss, security | 1-2 |
| `high` | Major feature broken, blocking users | 2-3 |
| `medium` | Feature partially broken, workaround exists | 2-3 |
| `low` | Minor issue, cosmetic, edge case | 1-2 |

## Bug Report Template

Good bug reports include:

1. **Steps to reproduce** - Exact sequence to trigger the bug
2. **Expected behavior** - What should happen
3. **Actual behavior** - What actually happens
4. **Environment** - Browser, OS, Node version, etc.
5. **Screenshots/logs** - Error messages, stack traces

### Example Bug Story:

```json
{
  "id": "BUG-012",
  "title": "Fix: Login form submits twice on Enter key",
  "description": "When pressing Enter in the password field, the form submits twice causing a 'user already logged in' error. Expected: single submission. Actual: double submission. Reproduce: 1) Go to /login 2) Enter credentials 3) Press Enter 4) Observe network tab shows 2 POST requests",
  "type": "bugfix",
  "priority": "high",
  "storyPoints": 2,
  "status": "pending",
  "acceptanceCriteria": [
    {"text": "Open /login and reproduce double-submit", "checked": false},
    {"text": "Add event.preventDefault() or debounce", "checked": false},
    {"text": "Verify single POST request on Enter", "checked": false},
    {"text": "Test button click still works", "checked": false}
  ],
  "dependencies": []
}
```

## Acceptance Criteria Tips for Bugs

1. **First criterion**: Always include reproduction step
2. **Include verification**: "Bug no longer occurs"
3. **Check for regressions**: Related functionality still works
4. **Be specific**: Include file names, error messages
5. **Object format required**: Always use `{text, checked}`, never strings

## Common Bug Patterns

| Pattern | Typical Fix |
|---------|-------------|
| Race condition | Add locks, debounce, or serialization |
| Off-by-one | Check array bounds, loop conditions |
| Null reference | Add null checks, use optional chaining |
| Event bubbling | stopPropagation, careful delegation |
| State sync | Single source of truth, derived state |
