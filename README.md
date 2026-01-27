# Claude Golem: Ralph - The Autonomous AI Coding Loop

[![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/EtanHey/claude-golem?utm_source=oss&utm_medium=github&utm_campaign=EtanHey%2Fclaude-golem&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)](https://coderabbit.ai)

**[📚 Full Documentation](https://etanheyman.github.io/claude-golem/)** | **[GitHub](https://github.com/etanheyman/claude-golem)**

---

## 🚀 Project Overview

Ralph is an autonomous AI coding loop designed to execute Product Requirements Document (PRD) stories. It spawns fresh Claude instances in a loop, ensuring clean context for each task. Ralph is a self-improving toolkit that aims to streamline development by automating repetitive coding tasks, managing project context, and integrating with essential developer tools.

### Core Concept: Death and Rebirth

```
while stories remain:
  spawn fresh Claude → read prd-json/ → implement one story → CodeRabbit review → commit → loop
done
```
Ralph "dies" after each iteration. Every new iteration is a fresh Claude session with no memory of previous work. This design:
- **Prevents drift:** Each iteration follows the current PRD exactly.
- **Enables recovery:** Crashed sessions don't corrupt state.
- **Forces discipline:** All state must be persisted to files.

The PRD (`prd-json/index.json`, `prd-json/stories/*.json`) and `progress.txt` are Ralph's "memories" that survive death.

### Key Features

-   **Self-improving toolkit:** Bugs found by Claude become PRD stories, Ralph fixes them, and all users benefit.
-   **Skills library:** Access powerful workflows via `/golem-powers:*` for commits, PRs, PRDs, 1Password, Linear, Convex, and more.
-   **Modular context system:** Shared CLAUDE.md rules automatically detect project tech stacks, ensuring relevant instructions.
-   **Smart model routing:** Dynamically selects the optimal Claude model (Opus, Sonnet, Haiku) based on story type for balanced cost and capability.
-   **CodeRabbit integration:** Automated AI code reviews prior to every commit, catching issues early and ensuring quality.
-   **React Ink UI:** A modern terminal dashboard provides live-updating progress and enhanced user experience.
-   **Git Worktree isolation:** Use `ralph-start` to create isolated development environments, preventing conflicts and maintaining a clean main branch.

### Why Ralph is Different

1.  **Fresh Context Each Iteration:** No accumulated confusion from long sessions; each Claude instance starts with a clean slate.
2.  **JSON is Memory:** PRD files *are* the state, and checked criteria *are* the progress, providing a single source of truth.
3.  **Self-Improvement Loop:** Identify a gap → create a story → Ralph executes → the fix is committed → all projects benefit.
4.  **CodeRabbit → BUG Pattern:** Unfixable CodeRabbit review issues automatically become tracked BUG stories, ensuring no issues are ignored.
5.  **Human Sets Direction, Ralph Executes:** PRD planning is human-driven, while execution is autonomous, balancing control and efficiency.

### Target Audience

-   Developers using Claude Code who want autonomous execution.
-   Teams seeking consistent, repeatable AI coding workflows.
-   Projects needing self-documenting progress via PRD stories.

### Credits

-   **Original Concept:** [Geoffrey Huntley](https://ghuntley.com/ralph/)
-   **Superpowers Plugin:** [obra/superpowers](https://github.com/obra/superpowers)

---

## ⚡ Quick Start

Follow these steps to get Ralph up and running:

### 1. Installation

Ralph is distributed via Homebrew for macOS/Linux users.

```bash
# 1. Clone the repository
git clone https://github.com/EtanHey/claude-golem.git ~/.config/claude-golem

# 2. Source Ralph in your shell profile (e.g., ~/.zshrc)
echo 'source ~/.config/claude-golem/ralph.zsh' >> ~/.zshrc
source ~/.zshrc

# 3. Install Bun (if you don't have it)
curl -fsSL https://bun.sh/install | bash
```

### 2. Setup Wizard

Run the interactive setup wizard to configure essential settings, skills, and project wiring.

```bash
ralph-setup
```
This wizard will guide you through:
-   Project registration
-   MCP configuration
-   1Password integration (optional, but recommended for secrets)
-   CodeRabbit setup
-   Context migration
-   User preferences (model routing, colors, notifications)

### 3. Usage Example

```bash
# Open Claude Code CLI
claude

# In Claude, generate a new PRD for your feature
> /prd Add user authentication

# Exit Claude, then run Ralph to execute the PRD stories
ralph 20 # Executes up to 20 iterations
```
Ralph will automatically detect your project's tech stack and load the appropriate contexts for optimal performance.

---

## 🤖 Core Commands

Here's a comprehensive list of Ralph's commands and their usage:

| Command | Description |
| :------------------ | :------------------------------------------------------------------------------------- |
| `ralph [N]` | Run N iterations (default: 100). |
| `ralph <app> N` | Run on `apps/<app>/prd-json/` (for monorepo projects). |
| `ralph-setup` | Interactive wizard for all Ralph settings and configurations. |
| `ralph-status` | Show PRD status, next story, and blocked tasks. |
| `ralph-live [N]` | Live refreshing status (watch mode), refreshes every N seconds (default: 3). |
| `ralph-watch [filter]` | Live tail of current Ralph output with optional grep filter. |
| `ralph-start [flags]` | Create a git worktree for an isolated Ralph session. |
| `ralph-cleanup` | Merge changes from a worktree and remove it. |
| `fsteps` / `fs [subcommand]` | View and process the farther-steps queue (deferred actions). |
| `ralph-init [app]` | Create a new PRD JSON structure (`prd-json/`). |
| `ralph-archive [app]` | Archive completed stories to `docs.local/prd-archive/`. |
| `ralph-learnings` | Manage learnings in `docs.local/learnings/`. |
| `ralph-costs` | Show cost tracking summary (per-iteration, total, per-story). |
| `ralph-stop` | Kill all running Ralph processes immediately. |
| `ralph-kill-orphans [--all]` | Kill orphaned processes from crashed Ralph sessions. `--all` also kills untracked Ralph processes. |
| `ralph-logs [N]` | Show N (default: 5) most recent crash logs. |
| `ralph-session [--paths]` | Show current Ralph session state and data locations. |
| `ralph-help` | Display comprehensive Ralph command reference. |
| `ralph-whatsnew [--all]` | Show changelog for current or all versions. |
| `ralph-terminal-check [--save]` | Detect terminal capabilities and test UI support. |
| `ralph-secrets` | Manage 1Password integration and secret configuration. |

### Model Flags (Override)

These flags override the configured model selection for a single `ralph` run:

| Flag | Model | Notes |
| :--- | :---------------- | :---------------------------------- |
| `-O` | Claude Opus | Default, most capable, highest cost |
| `-S` | Claude Sonnet | Balanced capability/cost |
| `-H` | Claude Haiku | Fastest, cheapest |
| `-G` | Gemini 2.5 Flash | Free tier (1000 req/day) |
| `-GL` | Gemini 2.5 Flash-Lite | Fastest free option |
| `-G3` | Gemini 3 Flash Preview | Newest Gemini |
| `-K` | Kiro | AWS Kiro CLI |
| `-L` | Ollama (local) | Via Aider, no API costs |

**Example:** `ralph 20 -H` runs 20 iterations using Claude Haiku.

### Multi-CLI Support (`repoGolem`)

`repoGolem` creates unified launchers for Claude Code, OpenCode, and Gemini CLI, streamlining monorepo workflows.

```bash
repoGolem myproject ~/Gits/myproject linear supabase

# This generates shell functions like:
# - runMyproject       (starts dev server for myproject)
# - openMyproject      (cd into myproject)
# - myprojectClaude    (launches Claude Code with myproject's context)
# - myprojectOpenCode  (launches OpenCode for myproject)
# - myprojectGemini    (launches Gemini CLI for myproject)
```
These generated CLIs share unified flags for skipping permissions (`-s`), continuing sessions (`-c`), headless mode (`-p "prompt"`), and model overrides (`-m model`).

### `ralph-start` Flags (Isolated Sessions)

Use `ralph-start` to create isolated Git worktrees for focused development without impacting your main branch.

| Flag | Description |
| :------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--install` | Run package manager install (`bun`, `npm`, `pnpm`, `yarn`) in the worktree. |
| `--dev` | Start the development server in the background after setup. |
| `--symlink-deps` | Symlink `node_modules` from the main repository (faster than installing from scratch). |
| `--1password` | Use 1Password injection via `.env.template` for secret management. |
| `--no-env` | Skip copying `.env` and `.env.local` files to the worktree. |

Ralph automatically detects your package manager (Bun, pnpm, yarn, npm) based on lock files.

`.worktree-sync.json` for Custom Rules:
Create a `.worktree-sync.json` in your repository root to configure custom worktree sync rules:
```json
{
  "sync": {
    "files": [
      "secrets.json",         // Copy specific files/directories
      "config/local.yaml"
    ],
    "symlinks": [
      ".cache",               // Symlink large directories (e.g., for cache or data)
      "data"
    ],
    "commands": [
      "cp .env.example .env", // Run post-setup commands in the worktree
      "make setup"
    ]
  }
}
```
-   **`files`**: Additional files/directories to copy to the worktree.
-   **`symlinks`**: Files/directories to symlink instead of copy (changes in worktree affect the main repo).
-   **`commands`**: Post-setup shell commands to run within the worktree.

### `fsteps` / `fs` Commands (Deferred Actions)

Ralph uses a **farther-steps** system to track deferred actions that require human review before application.

| Command | Effect | Description |
| :-------------- | :---------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------- |
| `fsteps` | List all steps | Displays all pending, done, and skipped steps. |
| `fsteps pending` | Show pending with details | Lists only pending steps with full context. |
| `fsteps pending --auto-high` | Auto-apply high confidence | Automatically applies `context-proposal` steps with >=0.9 confidence and >=5 evidence. |
| `fsteps preview ID` | Show diff preview | For `context-proposal` steps, shows a diff of the proposed changes. |
| `fsteps apply ID` | Apply a step | Applies the change (e.g., file sync) and marks the step as `done`. Supports smart merge for `context-proposal` steps. |
| `fsteps done ID` | Mark as done | Marks a step as `done` without applying its changes. |
| `fsteps skip ID` | Mark as skipped | Marks a step as `skipped` (not needed). |
| `fsteps clean` | Remove processed entries | Removes all `done` and `skipped` steps from the queue. |
| `fsteps stats` | Show statistics | Displays statistics about pending, done, and skipped steps. |

**Human Review Workflow:**
1.  Ralph adds entries to `~/.claude/farther-steps.json` during execution.
2.  The human runs `fsteps pending` to review the queue.
3.  For each step, the user decides to `apply`, `done`, or `skip`.
4.  `fsteps clean` removes processed entries, keeping the queue tidy.

---

## ⚙️ Configuration

Ralph is **config-driven**, using `ralph-setup` for interactive configuration. Settings are stored in `~/.config/claude-golem/config.json` and `~/.config/claude-golem/registry.json`.

### Centralized Configuration Files

Ralph uses a centralized configuration system for projects, MCPs, and secrets.

1.  **`~/.config/claude-golem/config.json`** (Primary Configuration)
    *   **Purpose:** Stores user preferences, default models, notification settings, and runtime behaviors.
    *   **Schema:** Defined by `schemas/config.schema.json`.
    *   **Key Sections:** `defaultModel`, `modelStrategy`, `models`, `notifications`, `defaults`, `pricing`, `costEstimation`.

2.  **`~/.config/claude-golem/registry.json`** (Project and MCP Registry)
    *   **Purpose:** Centralized management of project paths, associated MCPs, and 1Password secret references. This enables `repoGolem` launchers and project-specific contexts.
    *   **Schema:** Defined by `schemas/registry.schema.json`.
    *   **Key Sections:** `global` (global MCPs), `projects` (individual project configurations), `mcpDefinitions` (reusable MCP definitions).

3.  **`.worktree-sync.json`** (Per-Repository Worktree Rules)
    *   **Purpose:** Defines custom file synchronization and commands for `ralph-start` worktrees.
    *   **Location:** In the root of your project repository.
    *   **Key Sections:** `sync.files`, `sync.symlinks`, `sync.commands`.

**Important:** Ralph performs basic validation on JSON configuration files. Malformed JSON may lead to silent failures or unexpected behavior.

### Environment Variables

Ralph uses several environment variables for configuration and runtime control.

#### User-Configurable (Set in your shell profile)

| Variable | Description | Default |
| :--------------------- | :------------------------------------------------------------------------------------------- | :---------------------------- |
| `RALPH_CONFIG_DIR` | Override the configuration directory. | `~/.config/claude-golem` |
| `RALPH_NTFY_PREFIX` | Prefix for generated `ntfy` topics (e.g., `my-ralph`). | `etanheys-ralph` |
| `RALPH_NTFY_TOPIC` | Explicitly set a fixed `ntfy` topic, overriding per-project generation. | (auto-generated) |
| `CLAUDE_NTFY_TOPIC` | `ntfy` topic specifically for Claude notifications. | `etanheys-ralphclaude-notify` |
| `RALPH_DEFAULT_MODEL` | Default model for execution if no smart routing or overrides apply. | `opus` |
| `RALPH_MAX_ITERATIONS` | Maximum iterations Ralph will run in an execution session. | `100` |
| `RALPH_SLEEP_SECONDS` | Delay in seconds between iterations. | `2` |
| `RALPH_DEBUG_LIVE` | Set to `true` to enable debug logging for live updates to `/tmp/ralph-live-debug.log`. | `false` |
| `RALPH_LIVE_ENABLED` | Set to `false` to disable live progress updates. | `true` |
| `RALPH_MODEL_US` | Override model for `US-*` stories. | `sonnet` |
| `RALPH_MODEL_V` | Override model for `V-*` stories. | `haiku` |
| `RALPH_MODEL_BUG` | Override model for `BUG-*` stories. | `sonnet` |
| `RALPH_MODEL_AUDIT` | Override model for `AUDIT-*` stories. | `opus` |
| `RALPH_MODEL_MP` | Override model for `MP-*` stories. | `opus` |
| `RALPH_MODEL_TEST` | Override model for `TEST-*` stories. | `haiku` |
| `ANTHROPIC_API_KEY` | Your Claude API key. | (required) |

#### Runtime Variables (Set by Ralph during execution)

| Variable | Description |
| :-------------------- | :------------------------------------------------------------ |
| `RALPH_SESSION` | Unique session ID for the current execution run. |
| `RALPH_MODEL` | The model selected for the current iteration. |
| `RALPH_ITERATIONS` | The number of iterations to run in the current session. |
| `RALPH_NOTIFY` | Set if notifications are enabled for the current session. |
| `RALPH_SCRIPT_DIR` | The absolute path to Ralph's installation directory. |
| `RALPH_LOGS_DIR` | Directory where Ralph stores crash logs. |

### Runtime Mode: Bun vs Bash

Ralph v2.0 defaults to the **Bun/React Ink UI** for a modern terminal dashboard with live-updating progress.

| Runtime | Description | When to Use |
| :---------- | :---------------------------------- | :---------------------------------------------------- |
| **bun** | React Ink dashboard, live updates | Standard use (default) |
| **bash** | Traditional zsh output | No Bun installed, debugging, or custom scripts |

You can override the default for a single session: `ralph 20 --ui-bash`. To change the default, run `ralph-setup` and select your preferred runtime.

### Error Handling

Ralph includes retry logic for transient API errors. Configure behavior in `config.json`:

```json
{
  "errorHandling": {
    "maxRetries": 5,                     // Max retries for general API errors
    "noMessagesMaxRetries": 3,           // Max retries for "No messages returned" errors
    "generalCooldownSeconds": 15,        // Wait time between general retries
    "noMessagesCooldownSeconds": 30      // Wait time for "No messages" retries
  }
}
```
Errors are logged to `/tmp/ralph_error_*.log` for debugging.

### Pre-Commit Hooks

Ralph installs safety pre-commit hooks to prevent common bugs:
-   ZSH syntax check
-   Custom bug pattern detection
-   Retry logic integrity
-   Brace/bracket balance

---

## 🧠 Smart Model Routing

Ralph intelligently selects the optimal AI model for each story type, balancing cost and performance.

### Model Assignment

| Story Type | Prefix | Default Model | Rationale |
| :--------- | :----- | :------------ | :---------------------------------------------------- |
| User Story | `US-*` | Sonnet | Balanced quality and speed for feature implementation. |
| Verification | `V-*` | Haiku | Fast and cost-effective for quick checks and visual verification. |
| E2E Test | `TEST-*` | Haiku | Repetitive, template-based test generation. |
| Bug Fix | `BUG-*` | Sonnet | Requires reasoning and investigation for root cause analysis. |
| Audit | `AUDIT-*` | Opus | Maximum thoroughness for security or deep code review. |
| Master Plan | `MP-*` | Opus | For architectural decisions and infrastructure work. |

### Model Override Hierarchy

When Ralph selects a model, it checks in the following order:

1.  **CLI Flag:** (`-O`, `-S`, `-H`, etc.) for the current `ralph` run.
2.  **Per-Story Override:** The `"model": "opus"` field within the story's JSON file.
3.  **Global Story-Type Mapping:** The `models` section in `config.json`.
4.  **`unknownTaskType`:** The fallback model specified in `config.json` for unrecognized story prefixes (default: `sonnet`).
5.  **`defaultModel`:** The overall default model in `config.json` if no other rules apply.

**Per-Story Override Example:**
```json
{
  "id": "US-100",
  "title": "Complex auth system",
  "model": "opus",  // Use Opus specifically for this story
  "criteria": [...]
}
```

**Global Model Mapping (in `~/.config/claude-golem/config.json`):**
```json
{
  "models": {
    "US": "sonnet",
    "BUG": "haiku",
    "AUDIT": "opus",
    // ...
  },
  "unknownTaskType": "sonnet"
}
```

### Cost-Benefit Analysis

-   **Opus** (`~$15.00/M input tokens`): Ideal for complex decisions, architecture, and thorough analysis where accuracy is paramount.
-   **Sonnet** (`~$3.00/M input tokens`): A balanced choice for feature implementation and general coding, offering good quality at a reasonable cost.
-   **Haiku** (`~$1.00/M input tokens`): Highly efficient for quick verifications, repetitive tasks, and test generation, significantly reducing costs for high-volume tasks.

---

## 🔔 Notifications

Enable push notifications via [ntfy.sh](https://ntfy.sh) to stay updated on Ralph's progress.

### Setup

1.  **Choose your topic:**
    *   **Per-project (recommended):** `ntfyTopic: ""` (empty) or `"auto"` in `config.json`. Ralph will generate a topic like `etanheys-ralph-${project-name}-notify`.
    *   **Fixed topic:** Set `ntfyTopic: "my-custom-topic"` in `config.json` for all projects to use.
2.  **Enable in `config.json`:**
    ```json
    {
      "notifications": {
        "enabled": true,
        "ntfyTopic": "my-ralph-notifications" // Or "" for per-project topics
      }
    }
    ```
3.  **Subscribe:** Visit `https://ntfy.sh/your-topic` in a browser or use the `ntfy` mobile app.
4.  **CLI Override:** Use `ralph 20 -QN` to enable notifications for a session, even if disabled in config.

### Notification Topics

Ralph and Claude use separate topics:
-   **Ralph:** Per-project topics (e.g., `etanheys-ralph-my-app-notify`).
-   **Claude:** Single fixed topic (`etanheys-ralphclaude-notify`).

### Troubleshooting

-   **Test manually:** `curl -d "Test notification" https://ntfy.sh/your-topic`
-   **Check config:** `cat ~/.config/claude-golem/config.json | grep -A3 notifications`
-   **Verify topic format:** Ensure no spaces or invalid characters in `ntfyTopic`.

---

## 🛠️ Skills System

Ralph includes a library of skills that provide workflows for common tasks. Skills are stored in `~/.config/claude-golem/skills/` and symlinked to `~/.claude/commands/`, making them globally available to Claude.

### Sourcing Skills in Other Projects

Projects automatically access Ralph's skills through `~/.claude/commands/`. No per-project configuration is needed.

### Available Skills

| Skill | Description | When to Use |
| :---------------------- | :------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------- |
| `/project-context` | **Auto-detect project tools and MCP servers** | At the start of a Claude session for project awareness. |
| `/prd` | PRD generation for Ralph. | When starting a new feature or bug fix to structure work. |
| `/prd-manager` | Add or modify PRD stories safely. | For granular control over PRD content. |
| `/archive` | Archive completed PRD stories. | After a story or feature is fully implemented. |
| `/convex` | Convex workflows: dev server, deployment, user deletion. | For tasks involving Convex backend operations. |
| `/1password` | Secret management, `.env` migration. | When dealing with sensitive credentials or `.env` files. |
| `/github` | Git and GitHub operations (commits, PRs, issues). | For version control interactions. |
| `/linear` | Linear issue management. | To link Ralph's work with Linear issues. |
| `/worktrees` | Git worktree isolation. | When working on features that require isolated environments. |
| `/brave` | Brave browser automation (fallback). | When standard browser MCPs are unavailable or incompatible. |
| `/coderabbit` | Code review workflows. | After completing code changes, before committing. |
| `/context7` | Library documentation lookup. | To quickly access up-to-date library documentation. |
| `/ralph-commit` | Atomic commit + criterion check for Ralph. | Internal use by Ralph to finalize iterations. |
| `/critique-waves` | Iterative verification with parallel agents. | For critical verification tasks requiring multi-agent consensus (e.g., story splitting, design comparison). |
| `/catchup` | Context recovery after long breaks. | To quickly re-establish context in a Claude session. |
| `/skills` | List available skills. | To explore available skills within Claude. |

### Superpowers Skills (via Plugin)

Ralph can also leverage skills from the [Superpowers plugin](https://github.com/obra/superpowers) for advanced AI reasoning and workflows:

| Skill | When to Use |
| :------------------------------- | :---------------------------------------------------- |
| `superpowers:brainstorming` | Before creative work, exploring requirements. |
| `superpowers:systematic-debugging` | When encountering bugs or test failures. |
| `superpowers:test-driven-development` | Before implementing features. |
| `superpowers:verification-before-completion` | Before claiming work is done. |
| `superpowers:writing-plans` | When planning multi-step implementations. |
| `superpowers:executing-plans` | When executing written plans. |
| `superpowers:dispatching-parallel-agents` | For 2+ independent tasks. |
| `superpowers:subagent-driven-development` | Multi-agent implementation. |
| `superpowers:code-reviewer` | After completing major features. |
| `superpowers:using-git-worktrees` | For isolated feature work. |

### Skill Environment Variables

Some skills require API keys. These are managed via 1Password to avoid storing secrets in files. The `ralph-setup` wizard will guide you through this process.

---

## 📦 Modular Context System

Ralph builds a **layered context** for each iteration, providing Claude with project-specific instructions without cluttering the main prompt.

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONTEXT BUILDING FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   1. BASE (always)         ~/.claude/contexts/base.md           │
│        │                   └─ Core rules, safety, patterns      │
│        ▼                                                        │
│   2. WORKFLOW              ~/.claude/contexts/workflow/ralph.md │
│        │                   └─ Ralph-specific: commits, PRD      │
│        ▼                                                        │
│   3. TECH (auto-detect)    ~/.claude/contexts/tech/*.md         │
│        │                   └─ Next.js, Convex, Supabase...      │
│        ▼                                                        │
│   4. ADDITIONAL (config)   Custom contexts from config.json     │
│        │                                                        │
│        ▼                                                        │
│   ╔═════════════════════════════════════════════════════════╗   │
│   ║  CONCATENATED → --append-system-prompt → Claude CLI     ║   │
│   ╚═════════════════════════════════════════════════════════╝   │
└─────────────────────────────────────────────────────────────────┘
```

### Auto-Detection Magic

Ralph scans your project for specific files or patterns and automatically loads relevant tech contexts:

| Detected File/Pattern | Context Loaded |
| :-------------------------- | :----------------------- |
| `next.config.{js,mjs,ts}` | `tech/nextjs.md` |
| `convex.json` or `convex/` | `tech/convex.md` |
| `supabase/` or `supabase` in `package.json` | `tech/supabase.md` |
| Expo or React Native markers | `tech/react-native.md` |

### Directory Structure

```
~/.claude/contexts/
├── base.md                 # 🔒 Core rules (ALWAYS loaded)
├── workflow/
│   ├── ralph.md           # 🤖 Ralph autonomous mode
│   └── interactive.md     # 💬 Human-in-loop mode
└── tech/
    ├── nextjs.md          # ⚡ Next.js patterns
    ├── convex.md          # 🔄 Convex patterns
    ├── supabase.md        # 🗄️ Supabase patterns
    └── react-native.md    # 📱 React Native patterns
```

### Configuration

You can extend context loading in `~/.config/claude-golem/config.json`:

```json
{
  "contexts": {
    "directory": "~/.claude/contexts",
    "additional": ["workflow/testing.md", "workflow/rtl.md"]
  }
}
```

---

## 📝 Story-Type Prompts (`AGENTS.md`)

Ralph uses **layered prompts** that adapt to the story type being worked on, providing specific guidance for each task.

### How It Works

1.  Each iteration loads a **base prompt** with universal rules.
2.  Then, a **story-type-specific prompt** is layered on top:
    *   `US.md` - Feature implementation guidance.
    *   `BUG.md` - Debugging workflow, root cause analysis.
    *   `V.md` - TDD verification approach.
    *   `TEST.md` - Test creation best practices.
    *   `AUDIT.md` - Comprehensive review checklist.
    *   `MP.md` - Master plan/architecture guidance.

Prompts are stored in `~/.config/claude-golem/prompts/`.

### `AGENTS.md` Auto-Update

Your project's `prd-json/AGENTS.md` is automatically refreshed when:
-   New skills are added to `~/.claude/commands/`.
-   Prompts are updated in `~/.config/claude-golem/prompts/`.
-   You run `ralph-setup` context migration.

---

## 🤝 CodeRabbit Integration

Ralph integrates with [CodeRabbit](https://coderabbit.ai) for free AI-powered code reviews before commits, ensuring consistent code quality.

### How It Works

1.  After Claude implements a story, it runs `cr review --prompt-only`.
2.  If issues are found, Claude fixes them and re-reviews.
3.  **Maximum 3 iterations:** If issues persist, they automatically become new BUG stories.
4.  Ralph only commits after a passing CodeRabbit review.

### CodeRabbit → BUG Story Pattern

When CodeRabbit finds issues that cannot be fixed within the current iteration, Ralph automatically creates a new BUG story:

```json
// prd-json/update.json is created automatically
{
  "newStories": [{
    "id": "BUG-XXX",
    "title": "Fix CodeRabbit finding: [issue]",
    "type": "bug",
    "priority": "medium"
  }]
}
```
This pattern ensures that no issues are silently ignored, maintaining forward progress while addressing quality.

### Setup

1.  **Install CodeRabbit CLI:** `npm install -g coderabbit`
2.  **Configure via `ralph-setup`:** The wizard will guide you through enabling CodeRabbit and specifying repositories.

### Configuration

CodeRabbit is **opt-in** per repository. Configure in `~/.config/claude-golem/registry.json`:

```json
{
  "coderabbit": {
    "enabled": true,
    "repos": ["my-repo-name", "another-repo"] // Or use "*" for all repos
  }
}
```

---

## ⚡ Live Progress Updates

Ralph provides real-time progress updates directly in your terminal, leveraging file watchers and ANSI escape codes for a dynamic display.

### Overview

The live updates system comprises:
1.  **File Watcher:** Monitors changes in `prd-json/stories/` and `prd-json/index.json`.
2.  **Polling Loop:** Reads file change events and triggers display updates.
3.  **Display Updaters:** Uses ANSI escape codes to update progress bars in-place without screen flickering.

### Requirements

-   **macOS:** `fswatch` (`brew install fswatch`)
-   **Linux:** `inotifywait` (usually part of `inotify-tools`, `sudo apt-get install inotify-tools`)

If neither is available, live updates are gracefully disabled, and Ralph continues to run without real-time progress indicators.

### Configuration

Live updates are enabled by default. To disable for a session: `RALPH_LIVE_ENABLED=false ralph -i1 -p prd-json/`.
To debug live updates: `RALPH_DEBUG_LIVE=true ralph -i1 -p prd-json/` (logs to `/tmp/ralph-live-debug.log`).

### PTY Mode (Pseudo-Terminal)

Ralph attempts to use PTY for streaming output, but current Bun runtimes may not fully support it. If PTY is not supported, Ralph gracefully falls back to a slower `child_process` spawning mode without notification.

---

## 🔄 Process Tracking & Orphan Management

Ralph actively tracks all its spawned processes (Claude, file watchers, Bun UI) to ensure proper cleanup and prevent orphaned processes from consuming system resources.

### Viewing Tracked Processes

Use `ralph-pids` to list all processes currently tracked by Ralph:

```bash
ralph-pids
# Output:
# PID   TYPE               TIMESTAMP           PARENT_PID
# 1234  main-iteration     2026-01-26T14:23:45 1200
# 1235  claude-instance    2026-01-26T14:23:47 1234
# 1236  watcher            2026-01-26T14:23:50 1234
```

### Cleaning Up Orphans

If a Ralph session crashes or terminates unexpectedly, you can clean up lingering processes:

```bash
# Kill tracked orphans only
ralph-kill-orphans

# Also kill untracked Ralph-related processes (e.g., fswatch, bun UI)
ralph-kill-orphans --all
```

---

## 🚨 Crash Logging

Ralph automatically logs any crashes or errors to a dedicated directory for easier debugging.

### Viewing Crashes

Use `ralph-logs` to quickly view recent crash logs:

```bash
# Show the 5 most recent crashes (default)
ralph-logs

# Show the last 10 crashes
ralph-logs 10

# View a specific crash log
cat ~/.config/claude-golem/logs/ralph-crash-2026-01-26-14.23.45.log
```

**Log Contents:** Each log typically includes the iteration number, story being executed, error message, stack trace (if available), and environment details at the time of the crash.

---

## 🗺️ Advanced Topics & Workflows

### Monorepo Support

Ralph fully supports monorepo structures, allowing you to manage PRDs for multiple applications or packages within a single repository.

#### Structure

```
monorepo/
├── apps/
│   ├── web/
│   │   └── prd-json/
│   └── api/
│       └── prd-json/
├── packages/
│   ├── ui/
│   │   └── prd-json/
```

#### Usage

After setting up your monorepo projects via `ralph-setup`, you can run Ralph on specific applications using the `ralph <app> N` command format.

```bash
ralph web 50     # Run 50 iterations for the 'web' app
ralph api 30     # Run 30 iterations for the 'api' app
ralph ui 20      # Run 20 iterations for the shared 'ui' package
```

### Parallel Verification Stories (`V-*`)

For `V-*` (verification) stories, Ralph can run multiple agents in parallel to reduce time to completion, especially useful for UI/UX testing.

#### Configuration

Enable and configure in `~/.config/claude-golem/config.json`:
```json
{
  "parallelVerification": true,
  "parallelAgents": 3 // Number of parallel agents (1-5 recommended)
}
```

#### Use Cases

-   **Visual Regression Testing:** Multiple agents check different UI areas.
-   **Cross-Browser Verification:** Agents test across different browser environments (if MCPs are configured).
-   **Performance Testing:** Agents load-test different components.

### 1Password Integration

Ralph provides deep integration with 1Password for secure secret management. This allows you to keep sensitive API keys and credentials out of your `.env` files and Git history.

#### Setup

The `ralph-setup` wizard will guide you through:
1.  Installing the `op` CLI (if not present).
2.  Signing in to your 1Password account.
3.  Configuring vault structures.
4.  Migrating existing `.env` files to 1Password references.

#### `.env.template` Pattern

Instead of plaintext `.env` files, use `.env.template` with `op://` references, which are safe to commit:

```bash
# .env.template (committed to Git)
DATABASE_URL=op://MyVault/MyProject/DatabaseURL
SUPABASE_KEY=op://MyVault/MyProject/SupabaseKey
```
Then, use `op run --env-file .env.template -- <your_command>` to inject secrets at runtime. Ralph integrates this automatically for project launchers.

### Project Launchers (`repoGolem`)

Ralph generates shell functions (e.g., `myprojectClaude`, `runMyproject`) for each registered project, streamlining project-specific operations. These launchers automatically handle:
-   Changing to the project directory.
-   Setting up project-specific MCPs.
-   Injecting 1Password secrets.
-   Launching Claude Code or development servers.

### Performance & Cost Optimization

To optimize Ralph's execution for speed or cost:

-   **Fast Verification Loop:** Prioritize Haiku for `US-*` and `BUG-*` stories and reduce `sleepSeconds`.
    ```bash
    export RALPH_MODEL_US=haiku
    export RALPH_MODEL_BUG=haiku
    export RALPH_SLEEP_SECONDS=1
    ralph 50
    ```
-   **Cheaper Development:** Use Sonnet for `AUDIT-*` and `MP-*` stories instead of Opus.
    ```bash
    export RALPH_MODEL_AUDIT=sonnet
    export RALPH_MODEL_MP=sonnet
    ralph 100
    ```
-   **Silent Mode (CI/CD):** `ralph 100 --quiet` runs without terminal UI.
-   **Verbose Debugging:** `ralph 20 --verbose` enables full logging.

---

## ⁉️ Troubleshooting

### Ralph Doesn't Start

-   **Error: `bun is required but not installed`**
    *   **Fix:** `curl -fsSL https://bun.sh/install | bash` and ensure `bun` is in your `PATH`.
-   **Error: `prd-json/ directory not found`**
    *   **Fix:** Run `/prd` in Claude to generate your initial PRD.
-   **Error: `Invalid JSON in config file`**
    *   **Fix:** Check `~/.config/claude-golem/config.json` and `registry.json` for syntax errors. Use `jq . config.json` to validate.

### No Live Updates

-   **Symptom:** Progress bars don't update in real-time.
-   **Cause:** `fswatch` (macOS) or `inotifywait` (Linux) is not installed, or PTY mode is unsupported.
-   **Fix (macOS):** `brew install fswatch`
-   **Fix (Linux):** `sudo apt-get install inotify-tools`
-   **Debug:** `RALPH_DEBUG_LIVE=true ralph 5` and check `/tmp/ralph-live-debug.log`.

### Notifications Not Working

-   **Symptom:** `ralph 20 -QN` doesn't send `ntfy` notifications.
-   **Check:**
    1.  Verify `notifications.enabled` is `true` in `config.json`.
    2.  Test `ntfy` manually: `curl -d "test" https://ntfy.sh/your-topic`.
    3.  Ensure your `ntfyTopic` format is valid (no spaces, special characters).

### Stuck/Hung Ralph Process

-   **Symptom:** Ralph is frozen, consuming CPU or not progressing.
-   **Fix:**
    *   `ralph-kill-orphans`: Kills tracked orphaned processes.
    *   `ralph-kill-orphans --all`: Aggressively kills untracked Ralph-related processes.
    *   Manual kill: `pkill -f "bun.*ralph-ui"` or `pkill -f "claude"`.

### Config File Issues

-   **Symptom:** Ralph behaves unexpectedly, ignoring `config.json` settings.
-   **Cause:** Malformed JSON, incorrect path for `RALPH_CONFIG_DIR`, or `user-prefs.json` overriding `config.json` (legacy issue).
-   **Fix:** Ensure JSON is valid. Check `RALPH_CONFIG_DIR` environment variable. If applicable, migrate or remove `user-prefs.json`.

---

## 🧑‍💻 Development & Contribution

### Requirements

-   **zsh** (preferred, bash may work with caveats)
-   **Claude Code CLI**
-   **git**
-   **Bun** (for Ralph's UI and TypeScript core)
-   Optional: `fswatch` (macOS), `inotifywait` (Linux) for live updates.
-   Optional: Claude-in-Chrome extension, `ntfy`, [Superpowers plugin](https://github.com/obra/superpowers).
-   Optional: 1Password CLI for secret management.

### Documentation

Ralph's internal documentation is critical for its self-improvement and maintainability.
-   **`docs/`**: Public documentation for users and integrators.
-   **`docs.local/`**: Local-only, gitignored documentation for project-specific learnings, research, and archived PRDs.
-   **`contexts/`**: Contains shared CLAUDE.md contexts that form Ralph's core knowledge base.
-   **`lib/`**: Modular zsh library documentation.
-   **`prd-json/`**: Details on the JSON-based PRD format.
-   **`skills/`**: Guide on creating and managing skills.

### Philosophy

1.  **Iteration > Perfection:** Let the loop refine.
2.  **Fresh Context = Consistent Behavior:** No accumulated confusion.
3.  **PRD is Truth:** JSON criteria are the only state.
4.  **Failures Are Data:** Notes for the next iteration.
5.  **Human Sets Direction, Ralph Executes:** Balancing control and autonomy.

### Contributing

-   **New Contexts:** Create a new shared context when a pattern appears in 3+ projects, is 50+ lines, and is reusable.
-   **New Skills:** Create a new skill when an operation is repeatable, has clear inputs/outputs, and benefits from encapsulation.
-   **Ralph Core:** Update Ralph's core for changes that affect all projects or require orchestration changes.

### CI/CD & Code Quality

Ralph leverages [CodeRabbit](https://coderabbit.ai) for AI-powered code reviews on PRs (free for open source) and GitHub Actions for automated testing.

### Security: Separating Sensitive Data

Ralph enforces a strict separation of sensitive data. All personal API keys, tokens, and credentials (e.g., Supabase, Linear, `ntfy` topics) are stored locally in `~/.config/claude-golem/config.json` or managed via 1Password, and **never committed to the repository**. Example configuration files are provided with placeholders.

---

## 📜 Changelog

### v2.0.0
**Major architecture update with React Ink UI, modular codebase, and layered prompts.**
> **Note:** Repository renamed from `ralphtools` to `claude-golem` as part of this release to better reflect the project's scope as a Claude Code extension ecosystem.

-   **React Ink UI** is now the default runtime - modern terminal dashboard with live-updating progress.
-   **Modular codebase:** `ralph.zsh` split into `lib/*.zsh` modules for maintainability.
-   **Layered AGENTS prompt:** Story-type-specific prompts (US.md, BUG.md, V.md, etc.) on top of `base.md`.
-   **`AGENTS.md` auto-update:** Prompts automatically refresh when skills are added/modified.
-   **CodeRabbit → BUG integration:** CR findings automatically become BUG stories if unfixable.
-   **`MP` story type:** Master Plan stories for infrastructure/architecture work.
-   **Comprehensive test suite:** 156+ ZSH tests + 83 Bun tests run on pre-commit.
-   **Context injection tests:** Verify modular context system integrity.
-   Config-driven approach: `ralph-setup` wizard replaces flag-heavy CLI.
-   Orphan process cleanup and crash logging (`ralph-logs`, `ralph-kill-orphans`).
-   Docusaurus documentation site at etanheyman.github.io/claude-golem/.

### v1.5.0
-   **`golem-powers` skills:** Unified skill namespace with executable pattern (`SKILL.md` + `scripts/`).
-   **Modular context system:** Layered `CLAUDE.md` with auto-detection (MP-002).
-   **`prd-manager` skill:** Atomic PRD operations (add-to-index, add-criterion, etc.).
-   **1Password vault organization:** Development vault for global tools, project vaults.
-   **Commit conventions:** Story-type based (feat/fix/test/refactor).
-   **TDD verification stories:** V-016/V-017 audit with failing tests first.
-   Skills migrated: context7, coderabbit, linear, worktrees, github, 1password.
-   Deprecated: `update` skill (replaced by `prd-manager`).

### v1.4.0
-   **Smart Model Routing:** `AUDIT`→`opus`, `US`→`sonnet`, `V`→`haiku`, story-level `"model"` override.
-   **Live criteria sync:** `fswatch` file watching, ANSI cursor updates (no flash).
-   **1Password Environments:** `op run --env-file` integration, `ralph-secrets` command.
-   **`ralph-setup` wizard:** `gum`-based first-run experience.
-   **Test framework:** zsh test suite with unit tests for config, cost tracking, notifications.
-   Per-iteration cost tracking with model-aware pricing.
-   Progress bars and compact output mode.

### v1.3.0
-   **JSON-based PRD format** (`prd-json/` replaces markdown PRD).
-   **Smart model routing** for story types (auto-select appropriate model).
-   **Configuration system** (`ralph-config.local` for project settings).
-   **Archive skill** (`/archive` command pointing to `ralph-archive`).

### v1.2.0
-   **Comprehensive documentation** rewrite for open source release.
-   **Skills documentation** with `/prd`, `/archive` commands.
-   **`docs.local` convention** for project-specific learnings.

### v1.1.0
-   **Browser tab checking** for MCP verification stories.
-   **Learnings directory** support (`docs.local/learnings/`).
-   **Pre-commit/pre-push hooks** with Claude Haiku validation.

### v1.0.0
-   Initial Ralph tooling release.
-   Core loop: spawn fresh Claude, read PRD, implement story, commit.
-   `ntfy` notification support (`-QN` flag).