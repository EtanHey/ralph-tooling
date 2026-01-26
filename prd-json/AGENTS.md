# AI Agent Instructions for PRD: Self-Improvement Dogfooding

## Overview

This PRD makes claude-golem eat its own dogfood:
- Use its own context system
- Make the repo's purpose obvious to AI
- Auto-load contexts via registry
- Test and improve the context-audit skill

## Relevant Skills

| Skill | When to Use |
|-------|-------------|
| `/golem-powers:ralph-commit` | For "Commit:" criteria - atomic commit + criterion check |
| `/golem-powers:coderabbit` | Code review before commits - iterate until clean |
| `/golem-powers:context-audit` | Diagnose missing contexts in a project |
| `/golem-powers:prd-manager` | Manage PRD stories - list, show, stats |
| `/golem-powers:context7` | Look up library docs when unsure about APIs |
| `/golem-powers:catchup` | Recover context after long breaks |

## Project Contexts (Auto-Loaded by Ralph)

Ralph automatically loads these contexts from the registry (`~/.config/ralphtools/registry.json`):
- `base` - Universal rules (scratchpad, AIDEV-NOTE, type safety)
- `skill-index` - Available skills reference
- `workflow/interactive` - CLAUDE_COUNTER, git safety

To modify contexts, update the project's `contexts` array in the registry.

## Key Files for This PRD

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Add @context: refs and setup header here |
| `contexts/` | Shared context files |
| `lib/ralph-registry.zsh` | Update repoGolem for auto-loading |
| `~/.config/ralphtools/registry.json` | Add contexts field to projects |
| `skills/golem-powers/context-audit/` | Fix and test this skill |
| `skills/golem-powers/prd-manager/` | Add summary action |

## Worktree Workflow (CRITICAL)

Stories with `SETUP:` and `CLEANUP:` criteria use git worktrees for isolation:

### SETUP Phase
```bash
# Create worktree with new branch
git worktree add ~/worktrees/claude-golem/{branch-name} -b {branch-name}
cd ~/worktrees/claude-golem/{branch-name}

# Log location
echo "[$(date -Iseconds)] WORKTREE CREATED: ~/worktrees/claude-golem/{branch-name}" >> prd-json/execution.log

# Install deps if needed
bun install
```

### CLEANUP Phase (Before completing iteration)
```bash
# In worktree directory
git add -A
git commit -m "feat: {STORY-ID} {description}"
git push -u origin {branch-name}

# Return to main repo
cd /Users/etanheyman/Gits/claude-golem
git checkout master

# Log completion
echo "[$(date -Iseconds)] WORKTREE COMPLETE: {branch-name} pushed to origin" >> prd-json/execution.log
```

### Why Worktrees?
- Prevents cross-contamination between parallel stories
- Each story has isolated working directory
- Main repo stays on master for Ralph to track progress
- Branches can be merged via PR after review

## CodeRabbit Iteration Rule

For "Run CodeRabbit review" criteria:
1. Run: `cr review --prompt-only --type uncommitted`
2. If issues found → Fix them
3. Run CR again
4. Repeat until clean or only intentional patterns remain

## NEVER Edit index.json Directly

Use `update.json` instead:
1. Create story files in `stories/`
2. Write changes to `update.json`
3. Ralph merges automatically

## Story Dependencies

```
US-116 (dogfood CLAUDE.md)
   └── US-118 (registry contexts)
          └── US-119 (Ralph contexts)
          └── V-116 (verify dogfooding)
          └── US-123 (setup docs)

US-120 (TDD context-audit)
   └── US-121 (fix monorepo detection)

US-122 (contexts README) ← US-116

US-124 (TDD prd-manager)
   └── US-125 (summary action)

US-126 (AI-friendly README) - independent
```

## Testing (CRITICAL)

- **Test file for context-audit:** `tests/test-context-audit.sh`
- **Test file for prd-manager:** `tests/test-prd-manager.sh`
- TDD: Write tests FIRST, then implement

## Self-Improvement Loop

When you find something broken or missing:
1. **Ask the user** - "I found X is missing, should I create a story?"
2. **Create a PRD story** - Use /golem-powers:prd-manager
3. **Ralph fixes it** - The system improves itself

This is the core purpose of this repo.
