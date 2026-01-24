# Check Dependencies Workflow

Verify all required CLIs are installed and accessible.

---

## Required Dependencies

Run this script to check all dependencies:

```bash
#!/bin/bash
echo "Checking ralphtools dependencies..."
echo ""

MISSING=()

# Check each required CLI
for cmd in gh op gum fswatch jq git; do
  if command -v $cmd &>/dev/null; then
    VERSION=$($cmd --version 2>&1 | head -1)
    echo "[OK] $cmd: $VERSION"
  else
    echo "[MISSING] $cmd"
    MISSING+=($cmd)
  fi
done

echo ""

# Summary
if [ ${#MISSING[@]} -eq 0 ]; then
  echo "All dependencies installed!"
else
  echo "Missing dependencies: ${MISSING[*]}"
  echo ""
  echo "Run the install-deps workflow to install missing tools."
fi
```

---

## Individual Checks

### GitHub CLI (gh)

```bash
gh --version
gh auth status
```

Expected: Version number and authenticated user.

If not authenticated:
```bash
gh auth login
```

### 1Password CLI (op)

```bash
op --version
op account list
```

Expected: Version number and at least one account configured.

If no accounts:
```bash
op signin
```

### Gum (Interactive Prompts)

```bash
gum --version
```

Expected: Version number (e.g., v0.13.0).

### fswatch (File Watching)

```bash
fswatch --version
```

Expected: Version number.

### jq (JSON Processing)

```bash
jq --version
```

Expected: Version number (e.g., jq-1.7).

### Git

```bash
git --version
```

Expected: Version number (e.g., git version 2.43.0).

---

## Quick Check Script

Copy and run this one-liner:

```bash
for cmd in gh op gum fswatch jq git; do command -v $cmd &>/dev/null && echo "[OK] $cmd" || echo "[MISSING] $cmd"; done
```

---

## Next Steps

- If any dependencies are missing, proceed to [install-deps](install-deps.md)
- If all dependencies are installed, proceed to [setup-tokens](setup-tokens.md)
