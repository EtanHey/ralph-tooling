# Skills Reference

Ralph can leverage these skills during execution.

## Core Skills (Custom)

| Skill | File | Description |
|-------|------|-------------|
| `/prd` | `~/.claude/commands/prd.md` | Generate PRDs for Ralph |
| `/critique-waves` | `~/.claude/commands/critique-waves.md` | Multi-agent consensus verification |

## Superpowers Skills (via Plugin)

Requires the [Superpowers plugin](https://github.com/obra/superpowers).

| Skill | When to Use |
|-------|-------------|
| `superpowers:brainstorming` | Before creative work, exploring requirements |
| `superpowers:systematic-debugging` | When encountering bugs or test failures |
| `superpowers:test-driven-development` | Before implementing features |
| `superpowers:verification-before-completion` | Before claiming work is done |
| `superpowers:writing-plans` | When planning multi-step implementations |
| `superpowers:executing-plans` | When executing written plans |
| `superpowers:dispatching-parallel-agents` | For 2+ independent tasks |
| `superpowers:subagent-driven-development` | Multi-agent implementation |
| `superpowers:code-reviewer` | After completing major features |
| `superpowers:using-git-worktrees` | For isolated feature work |

## /critique-waves (Multi-Agent Consensus)

For critical verification, use multi-agent consensus. This spawns multiple agents to verify the same criteria — if any disagree, the issue is flagged.

### When to Use

- Story splitting decisions (is this too big?)
- RTL layout verification
- Design comparison verification
- Critical bug fixes

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  Wave 1: 3 agents verify in parallel                        │
│    Agent 1: PASS                                            │
│    Agent 2: FAIL (found forbidden pattern)                  │
│    Agent 3: PASS                                            │
│  Result: 0 consecutive passes (reset due to failure)        │
│                                                             │
│  Fix the issue...                                           │
│                                                             │
│  Wave 2: 3 agents verify in parallel                        │
│    All PASS → 3 consecutive passes                          │
│                                                             │
│  ...continue until 20 consecutive passes...                 │
└─────────────────────────────────────────────────────────────┘
```

### Setup

```bash
cp ~/.config/ralph/skills/critique-waves.md ~/.claude/commands/critique-waves.md
```
