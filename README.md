# Ralph - Autonomous AI Coding Loop

Run Claude (or other LLMs) in an autonomous loop to execute PRD stories. Each iteration spawns a fresh Claude instance with clean context, ensuring consistent behavior across long coding sessions.

## Why Ralph?

- **Fresh context each iteration** - No context window bloat, no confused state
- **PRD-driven development** - Stories are the contract, checkboxes are the proof
- **Built-in guardrails** - Blocked task handling, browser verification, learning persistence
- **Monorepo support** - Run multiple Ralphs on different apps simultaneously

---

## Quick Start

```bash
# 1. Install
git clone https://github.com/YOUR_USERNAME/ralph.git ~/.config/ralph
echo '[[ -f ~/.config/ralph/ralph.zsh ]] && source ~/.config/ralph/ralph.zsh' >> ~/.zshrc
source ~/.zshrc

# 2. Create a PRD in your project
ralph-init

# 3. Run Ralph
ralph 10  # 10 iterations
```

---

## Commands

| Command | Description |
|---------|-------------|
| `ralph [N] [sleep]` | Run N iterations (default 10) on `./PRD.md` |
| `ralph <app> N` | Run on `apps/<app>/PRD.md` with auto branch switching |
| `ralph-init [app]` | Create PRD template |
| `ralph-archive [app]` | Archive completed stories |
| `ralph-status` | Show PRD status across all apps |
| `ralph-learnings` | Manage learnings files |
| `ralph-stop` | Kill running Ralph loops |

### Flags

| Flag | Description |
|------|-------------|
| `-QN` | Enable notifications via [ntfy](https://ntfy.sh) |
| `-S` | Use Sonnet model (faster, cheaper than Opus) |

---

## How It Works

### The Loop

```
┌─────────────────────────────────────────────────────────────┐
│  1. Ralph reads PRD.md, finds first unchecked [ ] story     │
│  2. Claude implements that ONE story                        │
│  3. Claude updates checkboxes [ ] → [x]                     │
│  4. Claude commits changes                                  │
│  5. Loop: spawn fresh Claude, repeat from step 1            │
│  6. Exit when all [x] or <promise>COMPLETE</promise>        │
└─────────────────────────────────────────────────────────────┘
```

### PRD Format

```markdown
**Working Directory:** `src`

### US-001: Add User Authentication

**Description:** Implement login/logout functionality

**Acceptance Criteria:**
- [ ] Login form with email/password
- [ ] Session management
- [ ] Logout button in header
- [ ] Typecheck passes

**⏹️ STOP - END OF US-001**

### US-002: Add Dashboard
...
```

Key rules:
- **One story per iteration** - Ralph completes exactly one story, then respawns
- **Stop markers** - `⏹️ STOP` prevents Claude from continuing to next story
- **Checkboxes are truth** - Next Claude only sees what's in PRD.md

---

## Learnings System

Ralph persists learnings across iterations in a searchable structure.

### Structure

```
docs.local/
├── README.md                    # Index
├── learnings/                   # Topic files
│   ├── auth-patterns.md
│   ├── rtl-layouts.md
│   └── api-quirks.md
└── prd-archive/                 # Completed PRDs
```

### Usage

```bash
# Check learnings status
ralph-learnings

# Search learnings (from within your project)
grep -r "#auth" docs.local/learnings/
```

Files over 200 lines are offered for archiving.

---

## Browser Verification

Ralph integrates with [Claude-in-Chrome](https://github.com/anthropics/claude-code) for visual verification.

### Setup

Open two Chrome tabs before running Ralph:
- **Tab 1:** Desktop viewport (1440px+)
- **Tab 2:** Mobile viewport (375px)

### Protocol

At each iteration, Ralph:
1. Checks if browser tabs are available
2. Reports status: "✓ Available" or "⚠️ Not available"
3. If not available: marks browser steps as BLOCKED, continues other work

### Rules

- Never resize viewport (use correct tab)
- Always `left_click` (never `right_click`)
- Take screenshots to verify visual changes
- Check console for errors

---

## Blocked Task Handling

### What Blocks a Task

- External API unavailable (need API key)
- User decision required (ambiguous requirements)
- MCP tools fail or return errors
- Manual testing needed (no automation available)

### Behavior

When Ralph encounters a blocked task:
1. Marks in PRD: `**Status:** ⏹️ BLOCKED: [reason]`
2. Notes in progress.txt
3. Moves to next incomplete task
4. Commits the blocker note

When ALL tasks are blocked:
- Outputs `<promise>ALL_BLOCKED</promise>`
- Loop stops for user intervention

---

## Story Splitting

When a story is too big for one iteration, Ralph can split it.

### When to Split

- 8+ acceptance criteria
- 5+ files to modify
- 50% through context and not close to done

### Process

1. **Recognize** - Acknowledge the story is too big
2. **Plan** - Break into substories (US-001a, US-001b, etc.)
3. **Validate** - Run critique-waves for consensus
4. **Write** - Insert substories to PRD
5. **Exit** - Next iteration picks up first substory

---

## App-Specific Mode (Monorepos)

```bash
ralph frontend 30    # apps/frontend/PRD.md
ralph backend 30     # apps/backend/PRD.md
ralph mobile 30      # apps/mobile/PRD.md
```

Features:
- Auto-creates/switches to `feat/<app>-work` branch
- Uses app-specific PRD path
- Returns to original branch when done

Configure valid app names in `ralph.zsh`:
```bash
local valid_apps=("frontend" "backend" "mobile")
```

---

## Notifications

Enable with `-QN` flag. Uses [ntfy.sh](https://ntfy.sh) for push notifications.

Configure your topic in `ralph.zsh`:
```bash
local ntfy_topic="your-topic-name"
```

Notifications sent:
- Iteration complete (with remaining task count)
- All tasks complete
- All tasks blocked
- Max iterations reached

---

## Pre-Commit Hooks

This repo includes safety hooks:

### Pre-Commit
- ZSH syntax check
- Custom bug pattern detection
- Retry logic integrity
- Brace/bracket balance

### Pre-Push
- Dry run test
- Function completeness
- Critical pattern validation
- Documentation check

---

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RALPH_MODEL` | Default model | `opus` |
| `RALPH_MAX_ITERATIONS` | Default iteration limit | `10` |
| `RALPH_SLEEP` | Seconds between iterations | `2` |

### Customization

Edit `ralph.zsh` to customize:
- Valid app names for monorepo mode
- ntfy topic for notifications
- Default iteration count
- Browser verification rules in prompt

---

## Requirements

- **zsh** (bash may work with modifications)
- **Claude CLI** (`claude` command available)
- **git** (for commits and branch management)
- Optional: Chrome + Claude-in-Chrome extension for browser verification
- Optional: ntfy app for notifications

---

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make changes (pre-commit hooks will validate)
4. Submit PR

The pre-commit hooks ensure code quality. Run `source ralph.zsh` to test changes locally.

---

## License

MIT License - See LICENSE file

---

## Changelog

### v1.1.0
- Browser tab checking protocol
- Learnings directory structure
- Variable quoting for safety
- Comprehensive documentation

### v1.0.0
- Initial release
- App-specific mode
- Blocked task handling
- Helper commands
