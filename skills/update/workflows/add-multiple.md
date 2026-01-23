---
name: add-multiple
description: Add multiple stories to the PRD at once
---

# Add Multiple Stories

> Batch add multiple stories when planning a sprint or feature set.

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

Create `prd-json/update.json` with all stories in the `newStories` array:

```json
{
  "newStories": [
    {
      "id": "US-070",
      "title": "First feature",
      "description": "Description of first feature",
      "type": "feature",
      "priority": "high",
      "storyPoints": 3,
      "status": "pending",
      "acceptanceCriteria": [
        {"text": "Criterion 1", "checked": false},
        {"text": "Criterion 2", "checked": false}
      ],
      "dependencies": []
    },
    {
      "id": "US-071",
      "title": "Second feature",
      "description": "Description of second feature",
      "type": "feature",
      "priority": "medium",
      "storyPoints": 2,
      "status": "pending",
      "acceptanceCriteria": [
        {"text": "Criterion A", "checked": false},
        {"text": "Criterion B", "checked": false}
      ],
      "dependencies": []
    },
    {
      "id": "V-013",
      "title": "Verify both features work together",
      "description": "Integration verification",
      "type": "verification",
      "priority": "high",
      "storyPoints": 1,
      "status": "pending",
      "acceptanceCriteria": [
        {"text": "Both features integrated", "checked": false}
      ],
      "dependencies": ["US-070", "US-071"]
    }
  ]
}
```

**What happens:**
- All stories created in one atomic operation
- Stats recalculated once (efficient)
- Order preserved from array order

## Step 2b: Ralph Not Active - Batch Script

Use this script to add multiple stories:

```bash
#!/bin/bash
# add-stories.sh - Add multiple stories at once

PRD_DIR="prd-json"

# Define stories as heredocs
stories=(
'US-070|First feature|Description|feature|high|3'
'US-071|Second feature|Description|feature|medium|2'
'V-013|Verify integration|Description|verification|high|1'
)

for story in "${stories[@]}"; do
    IFS='|' read -r id title desc type priority points <<< "$story"

    # Create story file
    cat > "$PRD_DIR/stories/$id.json" << EOF
{
  "id": "$id",
  "title": "$title",
  "description": "$desc",
  "type": "$type",
  "priority": "$priority",
  "storyPoints": $points,
  "status": "pending",
  "acceptanceCriteria": [
    {"text": "TODO: Add criteria", "checked": false}
  ],
  "dependencies": []
}
EOF

    echo "Created $id"
done

# Update index.json in one operation
ids=$(printf '%s\n' "${stories[@]}" | cut -d'|' -f1 | jq -R . | jq -s .)
count=$(echo "$ids" | jq length)

jq --argjson ids "$ids" --argjson count "$count" '
    .storyOrder += $ids |
    .pending += $ids |
    .stats.total += $count |
    .stats.pending += $count
' "$PRD_DIR/index.json" > /tmp/index.tmp && mv /tmp/index.tmp "$PRD_DIR/index.json"

echo "Added $count stories to index.json"
```

## Batch Planning: Feature + Verification Pattern

A common pattern is to create a feature story followed by a verification story:

```json
{
  "newStories": [
    {
      "id": "US-072",
      "title": "Add user settings page",
      "description": "Create settings UI with profile, preferences, and notifications sections",
      "type": "feature",
      "priority": "high",
      "storyPoints": 5,
      "status": "pending",
      "acceptanceCriteria": [
        {"text": "Settings page renders at /settings", "checked": false},
        {"text": "Profile section shows user info", "checked": false},
        {"text": "Preferences section has toggles", "checked": false},
        {"text": "Changes persist after save", "checked": false}
      ],
      "dependencies": []
    },
    {
      "id": "V-014",
      "title": "Verify settings page in browser",
      "description": "Manual browser verification of US-072",
      "type": "verification",
      "priority": "high",
      "storyPoints": 1,
      "status": "pending",
      "acceptanceCriteria": [
        {"text": "Navigate to /settings", "checked": false},
        {"text": "Screenshot all sections", "checked": false},
        {"text": "Test save functionality", "checked": false}
      ],
      "dependencies": ["US-072"]
    }
  ]
}
```

## ID Assignment for Batch

```bash
# Get next available IDs
last_us=$(jq -r '.storyOrder[]' prd-json/index.json | grep '^US-' | sort -t'-' -k2 -n | tail -1 | cut -d'-' -f2)
last_bug=$(jq -r '.storyOrder[]' prd-json/index.json | grep '^BUG-' | sort -t'-' -k2 -n | tail -1 | cut -d'-' -f2)
last_v=$(jq -r '.storyOrder[]' prd-json/index.json | grep '^V-' | sort -t'-' -k2 -n | tail -1 | cut -d'-' -f2)

echo "Next US: US-$((last_us + 1))"
echo "Next BUG: BUG-$((last_bug + 1))"
echo "Next V: V-$((last_v + 1))"
```

## Dependencies

Use `dependencies` array to enforce order:

```json
{
  "dependencies": ["US-070", "US-071"]
}
```

- Story won't be picked up until all dependencies have `passes: true`
- Ralph auto-unblocks stories when blockers complete
- Creates natural sprint flow: foundation → features → verification

## Validation

After adding stories, verify:

```bash
# Check story files exist
ls prd-json/stories/*.json | wc -l

# Verify index.json stats match
jq '.stats' prd-json/index.json

# Verify pending array
jq '.pending | length' prd-json/index.json

# Validate JSON syntax
for f in prd-json/stories/*.json; do jq empty "$f" && echo "$f OK"; done
```
