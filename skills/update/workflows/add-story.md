---
name: add-story
description: Add a single story to the PRD
---

# Add a Single Story

> Add one story to an existing PRD, handling both active Ralph and manual scenarios.

## Step 1: Detect Ralph Status

```bash
# Check if Ralph is running
if [[ -f /tmp/ralph_pid_* ]]; then
    echo "Ralph ACTIVE - use update.json method"
else
    echo "Ralph NOT active - use direct edit method"
fi
```

## Step 2a: Ralph Active - Use update.json

When Ralph is running, create `prd-json/update.json`:

```json
{
  "newStories": [
    {
      "id": "US-XXX",
      "title": "Your story title",
      "description": "Full description",
      "type": "feature",
      "priority": "high",
      "storyPoints": 2,
      "status": "pending",
      "acceptanceCriteria": [
        {"text": "First criterion", "checked": false},
        {"text": "Second criterion", "checked": false}
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

## Step 2b: Ralph Not Active - Direct Edit

### Create the story file:

```bash
# Create story JSON file
cat > prd-json/stories/US-XXX.json << 'EOF'
{
  "id": "US-XXX",
  "title": "Your story title",
  "description": "Full description",
  "type": "feature",
  "priority": "high",
  "storyPoints": 2,
  "status": "pending",
  "acceptanceCriteria": [
    {"text": "First criterion", "checked": false},
    {"text": "Second criterion", "checked": false}
  ],
  "dependencies": []
}
EOF
```

### Update index.json:

```bash
# Add to storyOrder and pending arrays
jq '.storyOrder += ["US-XXX"] | .pending += ["US-XXX"] | .stats.total += 1 | .stats.pending += 1' \
    prd-json/index.json > /tmp/index.tmp && mv /tmp/index.tmp prd-json/index.json
```

### Set nextStory if needed:

```bash
# If this should be the next story to work on
jq '.nextStory = "US-XXX"' prd-json/index.json > /tmp/index.tmp && mv /tmp/index.tmp prd-json/index.json
```

## Finding the Next ID

```bash
# Find highest US-XXX number
jq -r '.storyOrder[]' prd-json/index.json | grep '^US-' | sort -t'-' -k2 -n | tail -1
# Output: US-068
# Use: US-069

# For bugs
jq -r '.storyOrder[]' prd-json/index.json | grep '^BUG-' | sort -t'-' -k2 -n | tail -1
```

## Story Type Reference

| Type | Use For |
|------|---------|
| `feature` | New functionality (US-XXX) |
| `bugfix` | Bug fixes (BUG-XXX) |
| `verification` | Manual verification of a feature (V-XXX) |
| `test` | E2E or integration tests (TEST-XXX) |

## Priority Guide

| Priority | When to Use |
|----------|-------------|
| `critical` | Blocking other work, needs immediate fix |
| `high` | Important feature, should be done soon |
| `medium` | Regular priority, can wait |
| `low` | Nice-to-have, whenever time permits |

## Acceptance Criteria Tips

1. **Specific and testable** - Avoid vague criteria
2. **One thing per criterion** - Don't combine multiple checks
3. **Include verification steps** - "Run tests and confirm passing"
4. **Object format required** - Always use `{text, checked}`, never strings
