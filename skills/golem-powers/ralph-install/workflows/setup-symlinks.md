# Setup Symlinks Workflow

Create symlinks in ~/.claude/commands/ to enable skills for Claude Code.

---

## Prerequisites

- ralphtools repository cloned
- ~/.claude/commands/ directory exists

---

## Create Commands Directory

```bash
mkdir -p ~/.claude/commands
```

---

## Symlink All Skills

Run this from the ralphtools directory:

```bash
#!/bin/bash
SKILLS_DIR="$(pwd)/skills"
COMMANDS_DIR="$HOME/.claude/commands"

echo "Creating skill symlinks..."
echo "Source: $SKILLS_DIR"
echo "Target: $COMMANDS_DIR"
echo ""

# Create commands directory if missing
mkdir -p "$COMMANDS_DIR"

# Single-file skills (*.md at root)
for skill in "$SKILLS_DIR"/*.md; do
  if [ -f "$skill" ]; then
    name=$(basename "$skill" .md)
    ln -sf "$skill" "$COMMANDS_DIR/$name.md"
    echo "[OK] $name.md"
  fi
done

# Multi-file skills (directories with SKILL.md)
for skill_dir in "$SKILLS_DIR"/*/; do
  if [ -f "${skill_dir}SKILL.md" ]; then
    name=$(basename "$skill_dir")
    ln -sf "${skill_dir%/}" "$COMMANDS_DIR/$name"
    echo "[OK] $name/"
  fi
done

echo ""
echo "Symlinks created! Skills available via /skill-name"
```

---

## Manual Symlinks

If you prefer to link skills individually:

### Single-file skills

```bash
# Format: ln -sf <source> <target>
ln -sf ~/path/to/ralphtools/skills/github.md ~/.claude/commands/github.md
ln -sf ~/path/to/ralphtools/skills/skills.md ~/.claude/commands/skills.md
ln -sf ~/path/to/ralphtools/skills/prd.md ~/.claude/commands/prd.md
```

### Multi-file skills (directories)

```bash
# Link the entire directory
ln -sf ~/path/to/ralphtools/skills/1password ~/.claude/commands/1password
ln -sf ~/path/to/ralphtools/skills/linear ~/.claude/commands/linear
ln -sf ~/path/to/ralphtools/skills/convex ~/.claude/commands/convex
ln -sf ~/path/to/ralphtools/skills/ralph-install ~/.claude/commands/ralph-install
```

---

## Verify Symlinks

Check that symlinks are correctly pointing:

```bash
ls -la ~/.claude/commands/
```

Expected output shows arrows pointing to skill files:
```
github.md -> /Users/.../ralphtools/skills/github.md
1password -> /Users/.../ralphtools/skills/1password
linear -> /Users/.../ralphtools/skills/linear
```

---

## Test Skill Discovery

In a new Claude Code session, run:
```
/skills
```

Should list all available skills.

---

## Troubleshooting

### Symlinks broken (red in ls -la)

The source file was moved or deleted. Recreate:
```bash
rm ~/.claude/commands/broken-link
ln -sf /correct/path ~/.claude/commands/skill-name
```

### Skills not appearing in Claude

1. Check Claude Code version supports skills
2. Verify symlink target exists
3. Restart Claude Code session

### Permission denied

Fix permissions:
```bash
chmod 755 ~/.claude/commands
chmod 644 ~/.claude/commands/*.md
chmod 755 ~/.claude/commands/*/
```

---

## Next Steps

After creating symlinks:
1. Run [validate](validate.md) to test the full installation
2. Try `/skills` in Claude Code to see available skills
