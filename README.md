# Ralph - The Original AI Coding Loop

> *"Ralph is a Bash loop"* — Geoffrey Huntley

Run Claude (or any LLM) in an autonomous loop to execute PRD stories. Each iteration spawns a **fresh Claude instance** with clean context.

```
while stories remain:
  1. Spawn fresh Claude
  2. Claude reads prd-json/, finds next story
  3. Claude implements ONE story, commits
  4. Loop
done
```

---

## Quick Start

```bash
# Install
git clone https://github.com/EtanHey/ralph-tooling.git ~/.config/ralph
echo 'source ~/.config/ralph/ralph.zsh' >> ~/.zshrc
source ~/.zshrc

# Setup skills
mkdir -p ~/.claude/commands
ln -sf ~/.config/ralph/skills/prd.md ~/.claude/commands/prd.md

# Use
claude                        # Open Claude Code
> /prd Add user authentication  # Generate PRD
ralph 20                      # Execute 20 iterations
```

---

## Commands

| Command | Description |
|---------|-------------|
| `ralph [N]` | Run N iterations (default 10) |
| `ralph <app> N` | Run on `apps/<app>/prd-json/` (monorepo) |
| `ralph-init` | Create PRD template |
| `ralph-status` | Show PRD status |
| `ralph-stop` | Kill running loops |

### Flags

| Flag | Description |
|------|-------------|
| `-QN` | Enable [ntfy](https://ntfy.sh) notifications |

### Model Flags

Specify up to two model flags: **first = main stories**, **second = verification stories**.

| Flag | Model | Browser Automation |
|------|-------|-------------------|
| `-O` | Claude Opus (default) | Claude-in-Chrome MCP |
| `-S` | Claude Sonnet | Claude-in-Chrome MCP |
| `-H` | Claude Haiku | Claude-in-Chrome MCP |
| `-K` | [Kiro CLI](https://kiro.dev/) | brave-manager (built-in) |
| `-G` | [Gemini CLI](https://github.com/google-gemini/gemini-cli) | brave-manager (built-in) |

### Examples

```bash
ralph 50              # Opus main, Haiku verify (default)
ralph 50 -G -H        # Gemini main, Haiku verify
ralph 50 -K -G        # Kiro main, Gemini verify
ralph 50 -G -G        # Gemini for all stories
```

---

## Why Fresh Context?

Long sessions accumulate confusion. Ralph solves this by **spawning fresh Claude every iteration**:
- JSON files ARE the memory
- Checked criteria ARE the state
- No hallucinated memory of non-existent code

---

## Alternative: Kiro CLI

[Kiro CLI](https://kiro.dev/) is AWS's agentic coding assistant — good when you're out of Claude tokens. Ralph uses the CLI (not the IDE) so it can run Kiro in a loop just like Claude Code.

**Note:** Ralph includes an internal **Brave Browser Manager** (`scripts/brave-manager.js`) that allows Kiro to perform browser verification even though it lacks native MCP support.

### Free Credits Deal

New users get **500 bonus credits** (30 days) when signing up with:
- GitHub / Google / AWS Builder ID

No AWS account required. ~50% of Kiro Pro's monthly allocation.

```bash
ralph -K 20    # Run with Kiro instead of Claude
```

| Feature | Claude Code | Kiro |
|---------|-------------|------|
| MCP tools | Full support | Limited (Ralph Fallback ✅) |
| Context window | Large | Smaller |
| Cost | Per-token | Credit-based |

---

## Alternative: Gemini CLI

[Gemini CLI](https://github.com/google-gemini/gemini-cli) is Google's AI terminal agent. Like Kiro, it uses Ralph's built-in **Brave Browser Manager** for browser verification stories.

**Note:** Gemini also supports chrome-devtools-mcp if you prefer native MCP integration.

---

## Requirements

- **zsh** (bash may work)
- **Claude CLI**, **Kiro CLI**, or **Gemini CLI**
- **git**
- **For Kiro/Gemini browser automation:** Run `npm install` in `~/.config/ralph/` (installs puppeteer)
- Optional: Claude-in-Chrome extension, ntfy, [Superpowers plugin](https://github.com/obra/superpowers)

---

## Documentation

Detailed docs for AI agents in [`docs/`](docs/):

| Doc | Contents |
|-----|----------|
| [prd-format.md](docs/prd-format.md) | JSON structure, /prd command |
| [skills.md](docs/skills.md) | All skills reference |
| [mcp-tools.md](docs/mcp-tools.md) | Browser automation setup |
| [configuration.md](docs/configuration.md) | Environment variables, files |
| [workflows.md](docs/workflows.md) | Story splitting, blocked tasks, learnings |

---

## Philosophy

1. **Iteration > Perfection** — Let the loop refine
2. **Fresh Context = Consistent Behavior** — No accumulated confusion
3. **PRD is Truth** — JSON criteria are the only state
4. **Failures Are Data** — Notes for next iteration
5. **Human Sets Direction, Ralph Executes**

---

## Credits

- **Original Concept:** [Geoffrey Huntley](https://ghuntley.com/ralph/)
- **Superpowers Plugin:** [obra/superpowers](https://github.com/obra/superpowers)

---

## Changelog

### v1.4.0
- **Smart Model Routing**: AUDIT→opus, US→sonnet, V→haiku, story-level `"model"` override
- **Live criteria sync**: fswatch file watching, ANSI cursor updates (no flash)
- **1Password Environments**: `op run --env-file` integration, `ralph-secrets` command
- **Progressive disclosure skills**: GitHub + 1Password skills (SKILL.md → workflows/)
- **Box drawing alignment**: emoji width calculation, variation selector handling
- **ANSI color fixes**: full escape sequences, semantic color schemes
- **ralph-setup wizard**: gum-based first-run experience
- **Multi-agent audit**: AUDIT-001 pattern with parallel verification
- **Test framework**: zsh test suite with unit tests for config, cost tracking, notifications
- **GitHub Actions CI**: automated testing workflow (TEST-005)
- **Brave Browser Manager**: internal fallback for Kiro/Gemini browser automation
- Per-iteration cost tracking with model-aware pricing
- Per-project MCP configuration (`ralph-projects`)
- Project launcher auto-generation (US-009)
- Parallel verification infrastructure (US-006, US-007)
- `ralph --version` flag
- Compact ntfy notifications with emoji labels (3-line format)
- Error handling for 'No messages returned' Claude CLI error (BUG-002)
- .env to 1Password migration (US-012)
- Progress bars and compact output mode (US-015, US-016)
- AGENTS.md auto-sync to all AI tools (US-017)
- Enhanced iteration status with gum interactivity (US-021)

### v1.3.0
- **JSON-based PRD format** (`prd-json/` replaces markdown PRD)
- **Kiro CLI support** (`-K` flag for AWS's agentic coding assistant)
- **Gemini CLI support** (`-G` flag)
- **Claude Haiku support** (`-H` flag for faster verification)
- **Configuration system** (`ralph-config.local` for project settings)
- **Model routing** for V-* stories (auto-select Haiku for verification)
- **Per-iteration cost tracking**: costs.json with token estimates
- **Archive skill** (`/archive` command pointing to `ralph-archive`)
- `completedAt` timestamp tracking
- `ralph-live` enhanced status mode
- `ralph-auto` auto-restart wrapper
- Incremental criteria checking with robust retry logic
- Dev server self-start + end iteration on infrastructure blockers
- Update queue for criteria count display
- Fail-safe when Claude output is unclear
- Smarter error detection to avoid false positives

### v1.2.0
- **Comprehensive documentation** rewrite for open source release
- **Skills documentation** with /prd, /archive commands
- **docs.local convention** for project-specific learnings
- Enhanced helper commands with better UX
- Real-time output capture with `script` command
- Proper Ctrl+C handling
- Line-buffered output with `tee`

### v1.1.0
- **Browser tab checking** for MCP verification stories
- **Learnings directory** support (`docs.local/learnings/`)
- **Pre-commit/pre-push hooks** with Claude Haiku validation
- Improved retry logic and command execution
- Sonnet model flag (`-S`)
- Use pipestatus to capture claude exit code
- Quote all variables in conditionals for safer evaluation

### v1.0.0
- Initial Ralph tooling release
- Core loop: spawn fresh Claude, read PRD, implement story, commit
- `ralph [N]` command for N iterations
- `ralph-init`, `ralph-status`, `ralph-stop` commands
- ntfy notification support (`-QN` flag)
- Real-time output with `ralph-watch`
- CLAUDE.md with commit/push instructions
