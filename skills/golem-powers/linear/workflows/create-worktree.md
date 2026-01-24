# Create Worktree from Linear Issue

Create an isolated git worktree for a Linear issue, using the issue identifier as branch name.

---

## Prerequisites

Run:
```bash
LINEAR_KEY=$(op read "op://Private/linear/api-key" 2>/dev/null)
[ -z "$LINEAR_KEY" ] && echo "ERROR: Linear API key not found" && exit 1
```

---

## Quick Workflow

### Step 1: Get issue details

Run (replace ENG-123):
```bash
ISSUE_ID="ENG-123"
ISSUE_DATA=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data "{
    \"query\": \"query GetIssue(\$id: String!) { issue(id: \$id) { id identifier title branchName } }\",
    \"variables\": { \"id\": \"$ISSUE_ID\" }
  }" \
  https://api.linear.app/graphql)

echo "$ISSUE_DATA" | jq '.data.issue'
```

Note the `branchName` field - Linear auto-generates a sanitized branch name.

### Step 2: Create worktree with Linear's branch name

Run:
```bash
BRANCH_NAME=$(echo "$ISSUE_DATA" | jq -r '.data.issue.branchName')
IDENTIFIER=$(echo "$ISSUE_DATA" | jq -r '.data.issue.identifier')
PROJECT_NAME=$(basename "$(pwd)")

# Create worktree directory alongside current project
git worktree add "../${PROJECT_NAME}-${IDENTIFIER}" -b "$BRANCH_NAME"
```

### Step 3: Navigate to worktree

Run:
```bash
cd "../${PROJECT_NAME}-${IDENTIFIER}"
pwd
```

---

## Full Automated Script

Copy and run (replace ENG-123):

```bash
#!/bin/bash
set -e

ISSUE_ID="${1:-ENG-123}"
LINEAR_KEY=$(op read "op://Private/linear/api-key" 2>/dev/null)

if [ -z "$LINEAR_KEY" ]; then
  echo "ERROR: Linear API key not found in 1Password"
  exit 1
fi

# Fetch issue
ISSUE_DATA=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data "{
    \"query\": \"query GetIssue(\$id: String!) { issue(id: \$id) { id identifier title branchName } }\",
    \"variables\": { \"id\": \"$ISSUE_ID\" }
  }" \
  https://api.linear.app/graphql)

# Extract fields
BRANCH_NAME=$(echo "$ISSUE_DATA" | jq -r '.data.issue.branchName')
IDENTIFIER=$(echo "$ISSUE_DATA" | jq -r '.data.issue.identifier')
TITLE=$(echo "$ISSUE_DATA" | jq -r '.data.issue.title')

if [ "$BRANCH_NAME" = "null" ]; then
  echo "ERROR: Issue $ISSUE_ID not found"
  exit 1
fi

PROJECT_NAME=$(basename "$(pwd)")
WORKTREE_PATH="../${PROJECT_NAME}-${IDENTIFIER}"

echo "Creating worktree for: $IDENTIFIER - $TITLE"
echo "Branch: $BRANCH_NAME"
echo "Path: $WORKTREE_PATH"
echo ""

# Create worktree
git worktree add "$WORKTREE_PATH" -b "$BRANCH_NAME"

echo ""
echo "Worktree created successfully!"
echo "Run: cd $WORKTREE_PATH"
```

---

## Custom Branch Name Format

If you prefer a different branch naming convention:

### Using identifier only

```bash
BRANCH_NAME=$(echo "$ISSUE_DATA" | jq -r '.data.issue.identifier | ascii_downcase')
# Result: eng-123
```

### Using type prefix

```bash
IDENTIFIER=$(echo "$ISSUE_DATA" | jq -r '.data.issue.identifier')
TITLE=$(echo "$ISSUE_DATA" | jq -r '.data.issue.title' | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-' | head -c 30)
BRANCH_NAME="feat/${IDENTIFIER}-${TITLE}"
# Result: feat/ENG-123-add-user-auth
```

---

## Update Linear Issue State

After creating worktree, optionally move issue to "In Progress":

### Step 1: Get "In Progress" state ID

```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{"query": "{ workflowStates(filter: { type: { eq: \"started\" } }) { nodes { id name } } }"}' \
  https://api.linear.app/graphql | jq '.data.workflowStates.nodes'
```

### Step 2: Update issue state

```bash
ISSUE_UUID=$(echo "$ISSUE_DATA" | jq -r '.data.issue.id')
STATE_ID="your-in-progress-state-id"

curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data "{
    \"query\": \"mutation UpdateIssue(\$id: String!, \$input: IssueUpdateInput!) { issueUpdate(id: \$id, input: \$input) { success } }\",
    \"variables\": {
      \"id\": \"$ISSUE_UUID\",
      \"input\": { \"stateId\": \"$STATE_ID\" }
    }
  }" \
  https://api.linear.app/graphql | jq '.data.issueUpdate'
```

---

## List Existing Worktrees

```bash
git worktree list
```

---

## Clean Up Worktree

After merging:

```bash
# Remove worktree
git worktree remove "../project-name-ENG-123"

# Or force remove if uncommitted changes
git worktree remove --force "../project-name-ENG-123"

# Prune stale worktree references
git worktree prune
```

---

## Troubleshooting

**"fatal: 'path' already exists" error?**
- Worktree already exists at that path
- Either remove it or use a different path

**"branch already exists" error?**
- Branch was created previously
- Use `git worktree add "../path" EXISTING_BRANCH` without `-b`

**Issue branchName is null?**
- Issue might be very old (before Linear added auto branch names)
- Use custom branch name format instead

**Cannot create worktree from detached HEAD?**
- Make sure you're on a branch in the main repo
- Run: `git checkout main` first
