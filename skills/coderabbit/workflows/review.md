# Review Workflow

Standard code review with CodeRabbit.

## Steps

### Step 1: Determine what to review

```bash
# Check git status
git status --short
```

Options:
- `--type all` (default) - All changes since last push
- `--type committed` - Only committed changes
- `--type uncommitted` - Only staged/unstaged changes

### Step 2: Run review

**For humans:**
```bash
cr review --plain
```

**For AI agents:**
```bash
cr review --prompt-only
```

**Against specific branch:**
```bash
cr review --plain --base main
```

### Step 3: Interpret results

CodeRabbit returns:
- **Critical issues** - Must fix (security, bugs)
- **Suggestions** - Should consider (style, performance)
- **Nitpicks** - Optional (formatting, naming)

### Step 4: Apply fixes

For each critical/suggestion:
1. Read the recommendation
2. Apply the fix
3. Re-run `cr review --plain` to verify

## Common Flags

| Flag | Description |
|------|-------------|
| `--plain` | Detailed human output |
| `--prompt-only` | Minimal AI-friendly output |
| `--type <t>` | all, committed, uncommitted |
| `--base <branch>` | Compare against branch |
| `--config <file>` | Use custom config |
