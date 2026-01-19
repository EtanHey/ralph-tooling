---
name: prd
description: "Generate a Product Requirements Document (PRD) for a new feature. Use when planning a feature, starting a new project, or when asked to create a PRD."
---

# PRD Generator

Create PRDs for autonomous AI implementation via Ralph loop.

**Config files available:** Read from `~/.config/ralph/configs/` when needed:
- `iteration-rules.json` - Critical iteration rules
- `rtl-rules.json` - RTL layout rules (Hebrew/Arabic projects)
- `modal-rules.json` - Modal/dynamic state rules
- `mcp-tools.json` - Available MCP tools for verification

---

## The Job

1. Ask 3-5 clarifying questions (use `AskUserQuestion` tool)
2. Find git root: `git rev-parse --show-toplevel`
3. Create JSON output:
   - `prd-json/index.json` - Story order and stats
   - `prd-json/stories/{US-XXX}.json` - One file per story
4. Create `progress.txt` at git root
5. **STOP and say: "PRD ready. Run Ralph to execute."**

**🛑 DO NOT IMPLEMENT** - Ralph handles that externally.

---

## Story Rules

### Sizing (THE NUMBER ONE RULE)
Each story must complete in ONE context window (~10 min of AI work).

**Right-sized:** Add one component, update one action, fix one bug
**Too big (split):** "Build dashboard" → Schema + Queries + UI + Filters

### Ordering (Dependencies First)
1. Schema/database
2. Server actions
3. UI components
4. Verification stories (V-XXX)

### Acceptance Criteria
- Must be verifiable (not vague)
- Include "Typecheck passes"
- Include "Verify in browser" for UI stories

---

## Conditional Rules

**For RTL projects (Hebrew/Arabic):**
Read `~/.config/ralph/configs/rtl-rules.json` and include RTL checklist in stories.

**For modals/dynamic states:**
Read `~/.config/ralph/configs/modal-rules.json` - each state = separate story.

---

## JSON Templates

### index.json
```json
{
  "$schema": "https://ralph.dev/schemas/prd-index.schema.json",
  "generatedAt": "2026-01-19T12:00:00Z",
  "stats": {"total": 4, "completed": 0, "pending": 4, "blocked": 0},
  "nextStory": "US-001",
  "storyOrder": ["US-001", "US-002", "V-001", "V-002"],
  "pending": ["US-001", "US-002", "V-001", "V-002"],
  "blocked": []
}
```

### Story JSON (prd-json/stories/US-XXX.json)
```json
{
  "id": "US-001",
  "title": "[Story Title]",
  "description": "[What and why]",
  "acceptanceCriteria": [
    {"text": "[Specific criterion]", "checked": false},
    {"text": "Typecheck passes", "checked": false},
    {"text": "Verify in browser", "checked": false}
  ],
  "passes": false,
  "blockedBy": null
}
```

---

## Output

Create at repository root:
- `prd-json/index.json`
- `prd-json/stories/*.json`
- `progress.txt`

**Then say:**
> ✅ PRD saved to `prd-json/` with X stories + X verification stories.
> Run Ralph to execute. I will not implement - that's Ralph's job.

---

## Checklist

- [ ] prd-json/ created at repo root
- [ ] index.json has valid stats, storyOrder, pending
- [ ] Each story has its own JSON file
- [ ] Stories ordered by dependency
- [ ] All criteria are verifiable
- [ ] Every story has "Typecheck passes"
- [ ] UI stories have "Verify in browser"
- [ ] Verification stories (V-XXX) for each US-XXX
- [ ] RTL rules included (if applicable) - read rtl-rules.json
- [ ] Modal rules followed (if applicable) - read modal-rules.json
