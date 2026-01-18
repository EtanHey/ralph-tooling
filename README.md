# Ralph - Autonomous Coding Loop

Personal tooling for running Claude in an autonomous loop to execute PRDs.

## Files

- `ralph.zsh` - Main Ralph function and helpers

## Commands

| Command | Description |
|---------|-------------|
| `ralph [N]` | Run N iterations on `./PRD.md` |
| `ralph expo N` | Run on `apps/expo/PRD.md` with `feat/expo-work` branch |
| `ralph public N` | Run on `apps/public/PRD.md` with `feat/public-work` branch |
| `ralph-init [app]` | Create PRD template |
| `ralph-archive [app]` | Archive completed stories |
| `ralph-status` | Show PRD status across all apps |
| `ralph-learnings` | Archive learnings if >300 lines |
| `ralph-stop` | Kill running Ralph loops |

## Installation

Sourced from `~/.zshrc`:
```bash
[[ -f ~/.config/ralph/ralph.zsh ]] && source ~/.config/ralph/ralph.zsh
```

## Changelog

Track changes here for easy regression tracking.

### v1.0.0 (2026-01-18)
- Initial versioned release
- App-specific mode: `ralph expo`, `ralph public`, `ralph admin`
- Branch auto-switching for app modes
- Blocked task handling with `ALL_BLOCKED` promise
- Helper commands: init, archive, status, learnings
