# Validate Installation Workflow

Verify the full ralphtools installation works end-to-end.

---

## Quick Validation

Run this comprehensive check:

```bash
#!/bin/bash
echo "Validating ralphtools installation..."
echo ""

PASS=0
FAIL=0

check() {
  if eval "$2" &>/dev/null; then
    echo "[PASS] $1"
    ((PASS++))
  else
    echo "[FAIL] $1"
    ((FAIL++))
  fi
}

# Dependencies
echo "=== Dependencies ==="
check "gh installed" "command -v gh"
check "op installed" "command -v op"
check "gum installed" "command -v gum"
check "fswatch installed" "command -v fswatch"
check "jq installed" "command -v jq"
check "git installed" "command -v git"
echo ""

# 1Password
echo "=== 1Password ==="
check "op signed in" "op account list"
check "GitHub token exists" "op read 'op://Private/github-token/credential'"
echo ""

# Directories
echo "=== Directories ==="
check "~/.config/ralphtools exists" "test -d ~/.config/ralphtools"
check "~/.claude/commands exists" "test -d ~/.claude/commands"
echo ""

# Skills
echo "=== Skills ==="
check "github skill linked" "test -e ~/.claude/commands/github.md"
check "linear skill linked" "test -e ~/.claude/commands/linear"
check "1password skill linked" "test -e ~/.claude/commands/1password"
check "ralph-install skill linked" "test -e ~/.claude/commands/ralph-install"
echo ""

# Summary
echo "=== Summary ==="
echo "Passed: $PASS"
echo "Failed: $FAIL"

if [ $FAIL -eq 0 ]; then
  echo ""
  echo "Installation validated successfully!"
else
  echo ""
  echo "Some checks failed. Review and fix issues above."
fi
```

---

## Individual Validations

### 1. Test GitHub CLI

```bash
gh auth status
gh repo list --limit 1
```

Expected: Shows authenticated user and at least one repo.

### 2. Test 1Password CLI

```bash
op account list
op vault list
```

Expected: Shows account and vaults.

### 3. Test Token Access

```bash
# GitHub
TOKEN=$(op read "op://Private/github-token/credential")
echo "GitHub token length: ${#TOKEN}"

# Linear
LINEAR=$(op read "op://Private/linear/api-key" 2>/dev/null)
echo "Linear key exists: $([ -n "$LINEAR" ] && echo 'yes' || echo 'no')"
```

### 4. Test Skill Symlinks

```bash
# List all skill symlinks
ls -la ~/.claude/commands/

# Test a skill file is readable
cat ~/.claude/commands/github.md | head -5
```

### 5. Test Interactive Tools

```bash
# Quick gum test
echo "test" | gum filter

# Should show interactive filter
```

---

## Test Ralph (if installed)

```bash
# Source ralph
source ~/.config/ralph/ralph.zsh

# Check ralph is available
type ralph

# Show help
ralph --help
```

---

## Common Issues

### "Not signed in" for op

```bash
op signin
```

### Token not found

Check vault name matches:
```bash
op vault list
op item list --vault "Private"
```

### Symlink points to wrong location

```bash
# Check where it points
readlink -f ~/.claude/commands/skill-name

# Fix it
rm ~/.claude/commands/skill-name
ln -sf /correct/path ~/.claude/commands/skill-name
```

### Skills not loading in Claude

1. Restart Claude Code
2. Check skill format (needs frontmatter or blockquote description)
3. Verify file permissions

---

## Post-Validation

Once all checks pass:

1. **Restart Claude Code** to load skills
2. **Test a skill**: Type `/skills` in Claude
3. **Ready to use**: All ralphtools features available

---

## Success Criteria

All these should be true:
- [ ] All 6 CLIs installed (gh, op, gum, fswatch, jq, git)
- [ ] 1Password signed in with vault access
- [ ] At least GitHub token stored
- [ ] ~/.config/ralphtools/ exists
- [ ] Skill symlinks created in ~/.claude/commands/
- [ ] `/skills` command works in Claude Code
