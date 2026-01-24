# Create Issue Workflow

Imperative instructions for creating new issues in Linear.

---

## Prerequisites

### Step 1: Load API key

Run:
```bash
LINEAR_KEY=$(op read "op://Private/linear/api-key" 2>/dev/null)
[ -z "$LINEAR_KEY" ] && echo "ERROR: Linear API key not found" && exit 1
```

### Step 2: Get your team ID

Run:
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{"query": "{ teams { nodes { id name } } }"}' \
  https://api.linear.app/graphql | jq '.data.teams.nodes'
```

Save the team ID for the team you want to create issues in.

---

## Create a Basic Issue

### Step 1: Create the issue

Run (replace TEAM_ID and values):
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{
    "query": "mutation CreateIssue($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { id identifier title url } } }",
    "variables": {
      "input": {
        "teamId": "TEAM_ID",
        "title": "Issue title here",
        "description": "Issue description here"
      }
    }
  }' \
  https://api.linear.app/graphql | jq '.data.issueCreate'
```

### Step 2: Verify creation

Check response contains `"success": true` and note the `identifier` (e.g., "ENG-123").

---

## Create Issue with Priority

Priority values: 0 (No priority), 1 (Urgent), 2 (High), 3 (Medium), 4 (Low)

Run:
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{
    "query": "mutation CreateIssue($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { id identifier title priority url } } }",
    "variables": {
      "input": {
        "teamId": "TEAM_ID",
        "title": "High priority bug",
        "description": "Description here",
        "priority": 2
      }
    }
  }' \
  https://api.linear.app/graphql | jq '.data.issueCreate'
```

---

## Create Issue with Labels

### Step 1: Get available labels

Run:
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{"query": "{ issueLabels { nodes { id name } } }"}' \
  https://api.linear.app/graphql | jq '.data.issueLabels.nodes'
```

### Step 2: Create issue with label IDs

Run:
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{
    "query": "mutation CreateIssue($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { id identifier title url } } }",
    "variables": {
      "input": {
        "teamId": "TEAM_ID",
        "title": "Issue with labels",
        "description": "Description here",
        "labelIds": ["LABEL_ID_1", "LABEL_ID_2"]
      }
    }
  }' \
  https://api.linear.app/graphql | jq '.data.issueCreate'
```

---

## Create Issue with Assignee

### Step 1: Get team members

Run:
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{"query": "{ users { nodes { id name email } } }"}' \
  https://api.linear.app/graphql | jq '.data.users.nodes'
```

### Step 2: Create with assignee

Run:
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{
    "query": "mutation CreateIssue($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { id identifier title url assignee { name } } } }",
    "variables": {
      "input": {
        "teamId": "TEAM_ID",
        "title": "Assigned issue",
        "description": "Description here",
        "assigneeId": "USER_ID"
      }
    }
  }' \
  https://api.linear.app/graphql | jq '.data.issueCreate'
```

---

## Create Sub-issue (Child Issue)

Run:
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{
    "query": "mutation CreateIssue($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { id identifier title url parent { identifier } } } }",
    "variables": {
      "input": {
        "teamId": "TEAM_ID",
        "title": "Sub-task",
        "description": "Description here",
        "parentId": "PARENT_ISSUE_ID"
      }
    }
  }' \
  https://api.linear.app/graphql | jq '.data.issueCreate'
```

---

## Troubleshooting

**"Team not found" error?**
- Run teams query to get correct team ID
- Ensure you have access to the team

**"Invalid input" error?**
- Check required fields: teamId, title
- Verify IDs are valid UUIDs

**"Unauthorized" error?**
- Verify API key is valid: `op read "op://Private/linear/api-key"`
- Regenerate key at Linear Settings > API

**Response shows `null` for issueCreate?**
- Check `errors` array in response
- Common: invalid team ID or missing permissions
