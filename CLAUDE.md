# Etan's Tools

Central tooling repo: Ralph, skills, CLAUDE.md management.

## Contexts

@context: base
@context: workflow/ralph

---

## 🤖 EXECUTION MODE DETECTION

**Are you Ralph or Interactive Claude?**

| Signal | You are... |
|--------|-----------|
| AGENTS.md prompt with story ID | **Ralph** - autonomous PRD execution |
| User conversation, no AGENTS.md | **Interactive Claude** - follow CLAUDE_COUNTER |

---

## 📋 RALPH-SPECIFIC RULES

When running as Ralph (PRD execution mode):

1. **No CLAUDE_COUNTER** - You run once per iteration, then exit
2. **Commit freely** - After completing work, commit without asking
3. **Re-read CLAUDE.md** - Only every 20+ tool uses (not every response)
4. **Focus on story** - Current acceptance criteria is your only goal
5. **Update progress** - Mark criteria checked, update index.json

**For PRD story format and management, invoke `/prd` skill** - it has authoritative docs on:
- Story JSON structure (criteria objects with `text`/`checked` fields)
- File locations (`prd-json/index.json`, `prd-json/stories/*.json`)
- The `update.json` pattern for adding stories safely

---

## 💬 INTERACTIVE CLAUDE RULES

When running as interactive Claude (conversation with user):

**Commit Protocol:** ASK before any commit - User's global rule.

---

## 🚨 SHARED: Commit Rules (Both Modes)

**After ANY edit to files in this repo:**

1. `git add <specific-files>` (NOT -A, to avoid secrets)
2. `git commit -m "type: description"` (feat/fix/docs/refactor)
3. **ASK before push** - user's global rule

**Why:** Version-controlled to track regressions. Uncommitted changes invisible to future sessions.

---

## 🐰 CodeRabbit Context

CodeRabbit reads this file automatically. These are project-specific rules CR should follow:

### Intentional Design Patterns

- **ralph.zsh is a single file by design** - don't suggest splitting into modules
- **Long functions are acceptable** - this is a CLI tool, not a library
- **ZSH-specific syntax** - don't suggest POSIX compatibility changes

### Project Conventions

- **Test files use `test_` prefix** - pattern: `test_feature_name()`
- **Skills use SKILL.md** - not README.md for skill documentation
- **Contexts use @context tags** - layered markdown compilation

### Known Patterns (Don't Flag)

- `setopt localoptions` blocks for temporary shell options
- `typeset -g` for global variables in functions
- HEREDOC for multi-line strings in commits
- `eval` only in safe, controlled contexts (prompt expansion)

### When CR Finds Issues

Ralph should:
1. **Accept best practices** - fix them
2. **If intentional** - add explanation here, proceed
3. **If can't fix now** - create BUG story

---

## Project-Specific

### Files

| File | Purpose |
|------|---------|
| `ralph.zsh` | Main Ralph function + helpers |
| `README.md` | Docs with changelog |
| `CLAUDE.md` | This file - instructions for Claude |
| `skills/` | Skill definitions |
| `tests/` | Test suite |
| `scripts/` | Migration and helper scripts |

### Versioning

- **Patch** (v1.0.X): Bug fixes, minor tweaks
- **Minor** (v1.X.0): New features, new commands
- **Major** (vX.0.0): Breaking changes

### 🚨 Version Release Rules

**Before ANY version bump:**

1. **Update README.md changelog** with all features/fixes
2. **Run critique-waves** - must get 6 consecutive agent passes
3. **Verify scope** - significant enough for release

**DO NOT** bump version for:
- Single bug fixes (batch them)
- Documentation-only changes
- Internal refactors with no user impact

**DO** bump version for:
- New commands or flags
- New skills
- Breaking changes
- Significant UX improvements

---

### Testing Changes

After editing `ralph.zsh`:
```bash
source ~/.config/ralph/ralph.zsh
```

Run tests manually:
```bash
./tests/test-ralph.zsh
```

### Pre-commit Test Hook

Tests run automatically on every commit. If any test fails, commit is blocked.

**What the hook checks:**
1. ZSH syntax (`zsh -n`)
2. Code patterns (break/continue, eval, long sleeps)
3. Retry logic integrity
4. Brace/bracket balance
5. JSON syntax validation
6. **Test suite** (all 35+ tests)
7. AGENTS.md sync

**Bypass for emergencies:** `git commit --no-verify`

To enable hooks: `./scripts/setup-hooks.sh`

---

### Learnings

Project-specific learnings in `docs.local/learnings/` (gitignored):

| File | Topics |
|------|--------|
| `terminal-box-alignment.md` | ANSI escapes, emoji width, box padding |

---

### Active Tasks

**Check after context reset:**
- `docs.local/current-task.md` - if exists, resume from there
- `prd-json/index.json` - current PRD state
- `claude.scratchpad.md` - ongoing work notes
