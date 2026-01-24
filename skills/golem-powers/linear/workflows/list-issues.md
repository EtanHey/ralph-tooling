# List Issues Workflow

Imperative instructions for querying and searching issues in Linear.

---

## Prerequisites

Run:
```bash
LINEAR_KEY=$(op read "op://Private/linear/api-key" 2>/dev/null)
[ -z "$LINEAR_KEY" ] && echo "ERROR: Linear API key not found" && exit 1
```

---

## List All Issues

### Basic list (first 50)

Run:
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{"query": "{ issues(first: 50) { nodes { identifier title state { name } priority assignee { name } url } } }"}' \
  https://api.linear.app/graphql | jq '.data.issues.nodes'
```

---

## List My Assigned Issues

Run:
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{"query": "{ viewer { assignedIssues(first: 50) { nodes { identifier title state { name } priority dueDate url } } } }"}' \
  https://api.linear.app/graphql | jq '.data.viewer.assignedIssues.nodes'
```

---

## List Issues by Team

### Step 1: Get team ID

Run:
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{"query": "{ teams { nodes { id name } } }"}' \
  https://api.linear.app/graphql | jq '.data.teams.nodes'
```

### Step 2: List team issues

Run (replace TEAM_ID):
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{
    "query": "query TeamIssues($teamId: String!) { team(id: $teamId) { issues(first: 50) { nodes { identifier title state { name } priority assignee { name } url } } } }",
    "variables": { "teamId": "TEAM_ID" }
  }' \
  https://api.linear.app/graphql | jq '.data.team.issues.nodes'
```

---

## Filter Issues by State

Common states: Backlog, Todo, In Progress, In Review, Done, Canceled

Run:
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{
    "query": "{ issues(first: 50, filter: { state: { name: { eq: \"In Progress\" } } }) { nodes { identifier title state { name } assignee { name } url } } }"
  }' \
  https://api.linear.app/graphql | jq '.data.issues.nodes'
```

---

## Filter by Priority

Priority values: 0 (No priority), 1 (Urgent), 2 (High), 3 (Medium), 4 (Low)

Run (urgent and high priority):
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{
    "query": "{ issues(first: 50, filter: { priority: { lte: 2 } }) { nodes { identifier title priority state { name } url } } }"
  }' \
  https://api.linear.app/graphql | jq '.data.issues.nodes'
```

---

## Search Issues

### Search by title/description

Run:
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{
    "query": "query SearchIssues($query: String!) { issueSearch(query: $query, first: 20) { nodes { identifier title state { name } url } } }",
    "variables": { "query": "search term here" }
  }' \
  https://api.linear.app/graphql | jq '.data.issueSearch.nodes'
```

---

## Get Single Issue by Identifier

Run (replace ENG-123):
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{
    "query": "query GetIssue($id: String!) { issue(id: $id) { id identifier title description state { name } priority assignee { name } labels { nodes { name } } comments { nodes { body user { name } } } url createdAt updatedAt } }",
    "variables": { "id": "ENG-123" }
  }' \
  https://api.linear.app/graphql | jq '.data.issue'
```

Note: The `id` variable accepts either the UUID or the identifier (e.g., "ENG-123").

---

## List Issues with Labels

Run:
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{
    "query": "{ issues(first: 50, filter: { labels: { name: { eq: \"bug\" } } }) { nodes { identifier title state { name } labels { nodes { name } } url } } }"
  }' \
  https://api.linear.app/graphql | jq '.data.issues.nodes'
```

---

## Pagination (More than 50 Issues)

### Step 1: Get first page with cursor

Run:
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{"query": "{ issues(first: 50) { nodes { identifier title } pageInfo { hasNextPage endCursor } } }"}' \
  https://api.linear.app/graphql | jq '.data.issues'
```

### Step 2: Get next page using cursor

Run (replace CURSOR):
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  --data '{
    "query": "query NextPage($cursor: String!) { issues(first: 50, after: $cursor) { nodes { identifier title } pageInfo { hasNextPage endCursor } } }",
    "variables": { "cursor": "CURSOR" }
  }' \
  https://api.linear.app/graphql | jq '.data.issues'
```

---

## Output Formatting

### Compact table format

Pipe to:
```bash
| jq -r '.data.issues.nodes[] | "\(.identifier)\t\(.state.name)\t\(.title)"' | column -t -s $'\t'
```

### JSON to CSV

Pipe to:
```bash
| jq -r '.data.issues.nodes[] | [.identifier, .state.name, .title] | @csv'
```

---

## Troubleshooting

**Empty results?**
- Check filter syntax - field names are case-sensitive
- Verify you have access to the team/project

**"Cannot query field" error?**
- Check Linear API schema for available fields
- Some fields require specific permissions

**Rate limited?**
- API key auth: 1,500 requests/hour
- Add delay between bulk requests
