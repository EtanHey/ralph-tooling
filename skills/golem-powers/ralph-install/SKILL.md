---
name: ralph-install
description: Install wizard for ralphtools. Checks dependencies, installs missing tools, configures API tokens, and validates installation.
---

# Ralph Install Wizard

> Guides new users through ralphtools setup. Checks for required CLIs, configures tokens in 1Password, sets up symlinks, and validates everything works.

## Available Scripts

Run these directly - standalone setup and validation:

| Script | Purpose | Usage |
|--------|---------|-------|
| `scripts/check-deps.sh` | Check dependencies | `bash ~/.claude/commands/ralph-install/scripts/check-deps.sh` |
| `scripts/install-deps.sh` | Install missing | `bash ~/.claude/commands/ralph-install/scripts/install-deps.sh --all` |
| `scripts/validate.sh` | Full validation | `bash ~/.claude/commands/ralph-install/scripts/validate.sh` |

---

## Quick Start

For a full installation, run through these workflows in order:

| Step | Workflow | Purpose |
|------|----------|---------|
| 1 | [check-deps](workflows/check-deps.md) | Verify required CLIs are installed |
| 2 | [install-deps](workflows/install-deps.md) | Install missing dependencies via brew |
| 3 | [setup-tokens](workflows/setup-tokens.md) | Configure API tokens in 1Password |
| 4 | [setup-symlinks](workflows/setup-symlinks.md) | Create skill symlinks in ~/.claude/commands |
| 5 | [validate](workflows/validate.md) | Verify installation works end-to-end |

---

## Required Dependencies

| CLI | Purpose | Check Command |
|-----|---------|---------------|
| `gh` | GitHub CLI for PRs, issues | `gh --version` |
| `op` | 1Password CLI for secrets | `op --version` |
| `gum` | Interactive prompts | `gum --version` |
| `fswatch` | File watching for live mode | `fswatch --version` |
| `jq` | JSON processing | `jq --version` |
| `git` | Version control | `git --version` |

## Required API Keys

These keys are stored in 1Password under the `claude-golem` item:

| Key | Purpose | 1Password Path |
|-----|---------|----------------|
| Context7 | Library documentation lookup | `op://Private/claude-golem/context7/API_KEY` |
| Linear | Issue tracking integration | `op://Private/claude-golem/linear/API_KEY` |

**Setup:**
```bash
# Create the claude-golem item with sections
op item create --category "API Credential" --vault "Private" --title "claude-golem"
op item edit "claude-golem" --vault "Private" "context7.API_KEY[concealed]=ctx7sk_your_key"
op item edit "claude-golem" --vault "Private" "linear.API_KEY[concealed]=lin_api_your_key"
```

---

## Configuration Paths

| Path | Purpose |
|------|---------|
| `~/.config/ralphtools/` | Main config directory |
| `~/.config/ralphtools/config.json` | User settings |
| `~/.claude/commands/` | Skill symlinks |
| `~/.claude/CLAUDE.md` | Global Claude instructions |

---

## Troubleshooting

### Homebrew not installed

Install Homebrew first:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 1Password CLI not connecting to app

Ensure:
1. 1Password 8 desktop app is installed
2. Settings > Developer > CLI integration is enabled
3. Biometric unlock is enabled for CLI

### Skills not appearing in Claude

Check symlinks exist:
```bash
ls -la ~/.claude/commands/
```

If missing, run [setup-symlinks](workflows/setup-symlinks.md) workflow.
