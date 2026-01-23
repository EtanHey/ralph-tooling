# Update Issue Workflow

Imperative instructions for updating issues in Linear (status, assignee, priority, etc.).

---

## Prerequisites

Run:
```bash
LINEAR_KEY=$(op read "op://Private/linear/api-key" 2>/dev/null)
[ -z "$LINEAR_KEY" ] && echo "ERROR: Linear API key not found" && exit 1
```

---

## Get Issue ID

Before updating, get the issue's UUID (required for mutations).

Run (replace ENG-123):
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{
    "query": "query GetIssue($id: String!) { issue(id: $id) { id identifier title state { id name } } }",
    "variables": { "id": "ENG-123" }
  }' \
  https://api.linear.app/graphql | jq '.data.issue'
```

Save the `id` (UUID) for update mutations.

---

## Update Issue State (Status)

### Step 1: Get available states for the team

Run:
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{"query": "{ workflowStates { nodes { id name type } } }"}' \
  https://api.linear.app/graphql | jq '.data.workflowStates.nodes'
```

Common state types: backlog, unstarted, started, completed, canceled

### Step 2: Update the state

Run (replace ISSUE_ID and STATE_ID):
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{
    "query": "mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) { issueUpdate(id: $id, input: $input) { success issue { identifier title state { name } } } }",
    "variables": {
      "id": "ISSUE_ID",
      "input": { "stateId": "STATE_ID" }
    }
  }' \
  https://api.linear.app/graphql | jq '.data.issueUpdate'
```

---

## Update Assignee

### Step 1: Get team members

Run:
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{"query": "{ users { nodes { id name email } } }"}' \
  https://api.linear.app/graphql | jq '.data.users.nodes'
```

### Step 2: Assign to user

Run (replace ISSUE_ID and USER_ID):
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{
    "query": "mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) { issueUpdate(id: $id, input: $input) { success issue { identifier title assignee { name } } } }",
    "variables": {
      "id": "ISSUE_ID",
      "input": { "assigneeId": "USER_ID" }
    }
  }' \
  https://api.linear.app/graphql | jq '.data.issueUpdate'
```

### Unassign (remove assignee)

Run:
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{
    "query": "mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) { issueUpdate(id: $id, input: $input) { success issue { identifier title } } }",
    "variables": {
      "id": "ISSUE_ID",
      "input": { "assigneeId": null }
    }
  }' \
  https://api.linear.app/graphql | jq '.data.issueUpdate'
```

---

## Update Priority

Priority values: 0 (No priority), 1 (Urgent), 2 (High), 3 (Medium), 4 (Low)

Run:
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{
    "query": "mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) { issueUpdate(id: $id, input: $input) { success issue { identifier title priority } } }",
    "variables": {
      "id": "ISSUE_ID",
      "input": { "priority": 2 }
    }
  }' \
  https://api.linear.app/graphql | jq '.data.issueUpdate'
```

---

## Update Title/Description

Run:
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{
    "query": "mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) { issueUpdate(id: $id, input: $input) { success issue { identifier title description } } }",
    "variables": {
      "id": "ISSUE_ID",
      "input": {
        "title": "New title here",
        "description": "New description here"
      }
    }
  }' \
  https://api.linear.app/graphql | jq '.data.issueUpdate'
```

---

## Add/Remove Labels

### Step 1: Get available labels

Run:
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{"query": "{ issueLabels { nodes { id name } } }"}' \
  https://api.linear.app/graphql | jq '.data.issueLabels.nodes'
```

### Step 2: Set labels (replaces existing)

Run:
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{
    "query": "mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) { issueUpdate(id: $id, input: $input) { success issue { identifier labels { nodes { name } } } } }",
    "variables": {
      "id": "ISSUE_ID",
      "input": { "labelIds": ["LABEL_ID_1", "LABEL_ID_2"] }
    }
  }' \
  https://api.linear.app/graphql | jq '.data.issueUpdate'
```

---

## Set Due Date

Run (ISO 8601 format):
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{
    "query": "mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) { issueUpdate(id: $id, input: $input) { success issue { identifier title dueDate } } }",
    "variables": {
      "id": "ISSUE_ID",
      "input": { "dueDate": "2026-02-15" }
    }
  }' \
  https://api.linear.app/graphql | jq '.data.issueUpdate'
```

---

## Add Comment

Run:
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{
    "query": "mutation CreateComment($input: CommentCreateInput!) { commentCreate(input: $input) { success comment { id body } } }",
    "variables": {
      "input": {
        "issueId": "ISSUE_ID",
        "body": "Comment text here. Supports **markdown**."
      }
    }
  }' \
  https://api.linear.app/graphql | jq '.data.commentCreate'
```

---

## Batch Update Multiple Fields

Run:
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{
    "query": "mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) { issueUpdate(id: $id, input: $input) { success issue { identifier title state { name } priority assignee { name } } } }",
    "variables": {
      "id": "ISSUE_ID",
      "input": {
        "stateId": "STATE_ID",
        "priority": 2,
        "assigneeId": "USER_ID"
      }
    }
  }' \
  https://api.linear.app/graphql | jq '.data.issueUpdate'
```

---

## Archive Issue

Run:
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{
    "query": "mutation ArchiveIssue($id: String!) { issueArchive(id: $id) { success } }",
    "variables": { "id": "ISSUE_ID" }
  }' \
  https://api.linear.app/graphql | jq '.data.issueArchive'
```

---

## Troubleshooting

**"Issue not found" error?**
- Verify issue ID is correct (UUID, not identifier)
- Use identifier query first to get UUID

**"Invalid input" error?**
- Check that stateId/assigneeId/labelIds are valid UUIDs
- Verify field names match API schema

**Update shows success but no change?**
- Check if value was already set to that
- Verify you have edit permissions on the issue

**Cannot change state?**
- Some workflows restrict state transitions
- Check team workflow settings in Linear
