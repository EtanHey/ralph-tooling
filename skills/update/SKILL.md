---
name: update
description: Add stories to a PRD safely. Handles both active Ralph (update.json) and manual mode (index.json direct).
---

# /update - PRD Story Management

> **TL;DR:** Use this skill to add new stories to a PRD. Detects if Ralph is running and routes to the correct method.

## Quick Actions

| Task | Workflow |
|------|----------|
| Add a single story | [add-story](workflows/add-story.md) |
| Add multiple stories at once | [add-multiple](workflows/add-multiple.md) |

## Ralph Detection

**How to check if Ralph is running:**
```bash
# Check for Ralph PID file
if [[ -f /tmp/ralph_pid_* ]]; then
    echo "Ralph is ACTIVE - use update.json"
else
    echo "Ralph is NOT active - edit index.json directly"
fi
```

## Method Selection

| Ralph Status | Method | File to Edit |
|-------------|--------|--------------|
| **Active** | update.json pattern | `prd-json/update.json` |
| **Not active** | Direct edit | `prd-json/index.json` + `prd-json/stories/*.json` |

### Why Two Methods?

- **update.json**: Ralph merges this at the START of each iteration. Safe for concurrent use.
- **Direct edit**: Faster when Ralph isn't running, but risky if Ralph starts mid-edit.

## Story ID Conventions

| Prefix | Purpose | Example |
|--------|---------|---------|
| `US-XXX` | User Story (new feature) | `US-069` |
| `BUG-XXX` | Bug fix | `BUG-011` |
| `V-XXX` | Verification story | `V-012` |
| `TEST-XXX` | Test/E2E story | `TEST-001` |

**ID Assignment:**
- Check `storyOrder` array in `index.json` for highest existing ID of that type
- Use next sequential number (e.g., if highest US is 068, use US-069)

## Story JSON Template

```json
{
  "id": "US-XXX",
  "title": "Short descriptive title",
  "description": "Full description of what needs to be done",
  "type": "feature|bugfix|verification|test",
  "priority": "critical|high|medium|low",
  "storyPoints": 1-5,
  "status": "pending",
  "acceptanceCriteria": [
    {"text": "First criterion description", "checked": false},
    {"text": "Second criterion description", "checked": false}
  ],
  "dependencies": []
}
```

### Critical: Acceptance Criteria Format

**CORRECT (object format):**
```json
"acceptanceCriteria": [
  {"text": "Criterion text here", "checked": false},
  {"text": "Another criterion", "checked": false}
]
```

**WRONG (string format - breaks live progress):**
```json
"acceptanceCriteria": [
  "Criterion text here",
  "Another criterion"
]
```

Ralph's live progress tracking requires the `{text, checked}` object format.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Story not appearing | Check `pending` array in index.json contains the ID |
| Criteria progress broken | Verify criteria use `{text, checked}` format, not strings |
| Update.json not processed | Ensure Ralph is actively running (check `/tmp/ralph_pid_*`) |
| ID collision | Use `jq '.storyOrder[-1]'` to find highest ID |
