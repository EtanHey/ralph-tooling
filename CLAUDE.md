# Etan's Tools

Central tooling repo: Ralph, skills, CLAUDE.md management.

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

### CLAUDE_COUNTER SYSTEM

Every response MUST end with `CLAUDE_COUNTER: N`

- Start at 10, decrement by 1 each response
- When 0: re-read this CLAUDE.md, reset to 10
- Prevents drift in long conversations

### Commit Protocol

**ASK before any commit** - User's global rule. Check with them first.

---

## 🚨 SHARED: Commit Rules (Both Modes)

**After ANY edit to files in this repo:**

1. `git add <specific-files>` (NOT -A, to avoid secrets)
2. `git commit -m "type: description"` (feat/fix/docs/refactor)
3. **ASK before push** - user's global rule

**Why:** Version-controlled to track regressions. Uncommitted changes invisible to future sessions.

---

## Scratchpad for Complex Tasks

Use `claude.scratchpad.md` (gitignored) for:
- Tracking multi-step operations
- Storing intermediate results
- Notes that persist across messages
- **Check after `/compact`** for ongoing work context

---

## Thinking Before Doing

**Anti-patterns to AVOID:**
- Jumping straight to code without understanding
- Suggesting first solution that comes to mind
- Adding dependencies without checking existing
- Assuming full context from brief description
- Researching patterns then NOT implementing them (like I just did)

**DO:**
- Read existing code before suggesting changes
- Check for existing utilities/patterns
- Ask clarifying questions
- Apply learnings immediately, not just discuss them

---

## Files

| File | Purpose |
|------|---------|
| `ralph.zsh` | Main Ralph function + helpers |
| `README.md` | Docs with changelog |
| `CLAUDE.md` | This file - instructions for Claude |
| `skills/` | Skill definitions |
| `tests/` | Test suite |

## Versioning

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

## Testing Changes

After editing `ralph.zsh`:
```bash
source ~/.config/ralph/ralph.zsh
```

Run tests manually:
```bash
./tests/test-ralph.zsh
```

### Pre-commit Test Hook

Tests run automatically on every commit via the pre-commit hook. If any test fails, the commit is blocked.

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

## Learnings

Project-specific learnings in `docs.local/learnings/` (gitignored):

| File | Topics |
|------|--------|
| `terminal-box-alignment.md` | ANSI escapes, emoji width, box padding |

---

## Active Tasks

**Check after context reset:**
- `docs.local/current-task.md` - if exists, resume from there
- `prd-json/index.json` - current PRD state
- `claude.scratchpad.md` - ongoing work notes
