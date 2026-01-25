# Ralph Tooling

## File Tree

```
claude-golem/
├── ralph.zsh              # Main entry point - sources lib/*.zsh
├── lib/                   # Modular library (see lib/README.md)
│   ├── ralph-commands.zsh # Helper commands (ralph-session, jqf)
│   ├── ralph-models.zsh   # Model routing, costs, ntfy
│   ├── ralph-registry.zsh # repoGolem launchers
│   ├── ralph-secrets.zsh  # 1Password integration
│   ├── ralph-setup.zsh    # Setup wizard
│   ├── ralph-ui.zsh       # Colors, progress bars
│   ├── ralph-watcher.zsh  # PID tracking, orphan detection
│   └── ralph-worktrees.zsh # Git worktree isolation
├── bun/                   # TypeScript core (Ink UI, story management)
├── contexts/              # Shared CLAUDE.md contexts
├── skills/golem-powers/   # Skills for Claude
├── tests/                 # Test suite
├── prd-json/              # PRD stories (index.json + stories/)
└── docs.local/            # Local docs, learnings (gitignored)
```

---

## 🚨 CRITICAL: Always Commit & Push Changes

**After ANY edit to files in this repo:**

1. `git add -A`
2. `git commit -m "type: description"` (use feat/fix/docs/refactor)
3. `git push`
4. If significant change: `git tag vX.Y.Z && git push --tags`

**Why:** This repo is version-controlled to track regressions. Uncommitted changes are invisible to future sessions.

---

## Files

| File | Purpose |
|------|---------|
| `ralph.zsh` | Main Ralph function + helpers |
| `README.md` | Docs with changelog |
| `CLAUDE.md` | This file - instructions for Claude |

## Versioning

- **Patch** (v1.0.X): Bug fixes, minor tweaks
- **Minor** (v1.X.0): New features, new commands
- **Major** (vX.0.0): Breaking changes to command interface

## Testing Changes

After editing `ralph.zsh`, reload in current shell:
```bash
source ~/.config/ralphtools/ralph.zsh
```

---

## JQ Escaping Bug Workaround

Claude Code's Bash tool corrupts jq commands with `!=` and `|`. Use **double quotes** with escaped inner quotes:

```bash
# CORRECT:
jq ".pending | map(select(. != \"FOO\"))" file.json

# WRONG (breaks with \!= error):
jq '.pending | map(select(. != "FOO"))' file.json
```

**User helper:** `jqf` writes filter to temp file, avoiding escaping entirely:
```bash
jqf '.pending | map(select(. != "FOO"))' file.json -i
```
