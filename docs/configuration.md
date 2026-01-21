# Configuration Reference

## Personal Config File

Copy `ralph-config.local.example` to `ralph-config.local` and customize:

```bash
cp ~/.config/ralph/ralph-config.local.example ~/.config/ralph/ralph-config.local
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RALPH_NTFY_TOPIC` | Notification topic | `ralph-notifications` |
| `RALPH_NTFY_TOPIC_PATTERN` | App-mode topic pattern | `{project}-{app}` |
| `RALPH_DEFAULT_MODEL` | Default model | `opus` |
| `RALPH_MAX_ITERATIONS` | Default iteration limit | `10` |
| `RALPH_SLEEP_SECONDS` | Seconds between iterations | `2` |
| `RALPH_VALID_APPS` | Valid app names (space-separated) | `frontend backend mobile expo public admin` |

## File Structure

```
~/.config/ralph/
├── ralph.zsh                   # Main script (source this)
├── ralph-config.local          # Your personal config (gitignored)
├── ralph-config.local.example  # Config template
├── skills/
│   ├── prd.md                  # /prd command
│   └── critique-waves.md
├── configs/                    # Rule configs (RTL, modals, etc.)
├── scripts/                    # Helper scripts
├── tests/                      # Test scripts
└── .githooks/                  # Pre-commit hooks
```

## Notifications

Enable with `-QN` flag. Uses [ntfy.sh](https://ntfy.sh) for push notifications.

Configure in `ralph-config.local`:
```bash
export RALPH_NTFY_TOPIC="your-topic-name"
export RALPH_NTFY_TOPIC_PATTERN="{project}-{app}"  # For app mode
```

Notifications sent:
- Iteration complete (with remaining task count)
- All tasks complete
- All tasks blocked
- Max iterations reached

## App-Specific Mode (Monorepos)

```bash
ralph frontend 30    # apps/frontend/prd-json/
ralph backend 30     # apps/backend/prd-json/
ralph mobile 30      # apps/mobile/prd-json/
```

Features:
- Auto-creates/switches to `feat/<app>-work` branch
- Uses app-specific PRD path
- Returns to original branch when done

Configure valid app names:
```bash
export RALPH_VALID_APPS="frontend backend mobile expo"
```

## Pre-Commit Hooks

Safety hooks prevent common bugs.

### Pre-Commit
- ZSH syntax check (`zsh -n`)
- Custom bug pattern detection
- Retry logic integrity
- Brace/bracket balance

### Pre-Push
- Dry run test
- Function completeness
- Critical pattern validation
- Documentation check
