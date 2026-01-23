#!/bin/bash
# scripts/validate.sh
# Purpose: Validate full ralphtools installation
# Usage: bash validate.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Help text
show_help() {
    echo "Usage: validate.sh [options]"
    echo ""
    echo "Options:"
    echo "  --quick     Quick check (dependencies only)"
    echo "  --json      Output as JSON"
    echo "  -h, --help  Show this help"
    echo ""
    echo "Validates:"
    echo "  - All CLI dependencies installed"
    echo "  - 1Password signed in with vault access"
    echo "  - API tokens accessible"
    echo "  - Config directories exist"
    echo "  - Skill symlinks valid"
}

QUICK=false
JSON_OUTPUT=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --quick) QUICK=true; shift ;;
        --json) JSON_OUTPUT=true; shift ;;
        -h|--help) show_help; exit 0 ;;
        *) echo -e "${RED}ERROR: Unknown option: $1${NC}"; exit 1 ;;
    esac
done

echo -e "${BLUE}Validating ralphtools installation...${NC}"
echo ""

PASS=0
FAIL=0

check() {
    local name="$1"
    local cmd="$2"

    if eval "$cmd" &>/dev/null; then
        echo -e "${GREEN}[PASS]${NC} $name"
        ((PASS++))
    else
        echo -e "${RED}[FAIL]${NC} $name"
        ((FAIL++))
    fi
}

check_warn() {
    local name="$1"
    local cmd="$2"

    if eval "$cmd" &>/dev/null; then
        echo -e "${GREEN}[PASS]${NC} $name"
        ((PASS++))
    else
        echo -e "${YELLOW}[WARN]${NC} $name"
        # Warnings don't count as failures
    fi
}

# Section: Dependencies
echo "=== Dependencies ==="
check "gh (GitHub CLI)" "command -v gh"
check "op (1Password CLI)" "command -v op"
check "gum (Interactive prompts)" "command -v gum"
check "fswatch (File watching)" "command -v fswatch"
check "jq (JSON processing)" "command -v jq"
check "git (Version control)" "command -v git"
echo ""

if [ "$QUICK" = true ]; then
    echo "=== Summary ==="
    echo "Passed: $PASS"
    echo "Failed: $FAIL"

    if [ $FAIL -eq 0 ]; then
        echo -e "\n${GREEN}All dependency checks passed${NC}"
        exit 0
    else
        echo -e "\n${RED}$FAIL checks failed${NC}"
        exit 1
    fi
fi

# Section: 1Password
echo "=== 1Password ==="
check "op signed in" "op account list 2>/dev/null | grep -q ."
check_warn "GitHub token accessible" "op read 'op://Private/github-token/credential' 2>/dev/null"
check_warn "Linear API key accessible" "op read 'op://Private/linear/api-key' 2>/dev/null"
echo ""

# Section: Directories
echo "=== Directories ==="
check "~/.config/ralphtools exists" "test -d ~/.config/ralphtools"
check "~/.claude/commands exists" "test -d ~/.claude/commands"
check_warn "~/.claude/CLAUDE.md exists" "test -f ~/.claude/CLAUDE.md"
echo ""

# Section: Skills
echo "=== Skill Symlinks ==="
check "github skill" "test -e ~/.claude/commands/github.md"
check "linear skill" "test -e ~/.claude/commands/linear"
check "1password skill" "test -e ~/.claude/commands/1password"
check "ralph-install skill" "test -e ~/.claude/commands/ralph-install"
check "archive skill" "test -e ~/.claude/commands/archive"
check "skills skill" "test -e ~/.claude/commands/skills.md"
echo ""

# Section: Ralph (optional)
echo "=== Ralph (Optional) ==="
if [ -f ~/.config/ralph/ralph.zsh ]; then
    check "ralph.zsh exists" "test -f ~/.config/ralph/ralph.zsh"
    # Can't source in subshell effectively, just check file exists
else
    echo -e "${YELLOW}[SKIP]${NC} ralph.zsh not installed"
fi
echo ""

# Summary
echo "=== Summary ==="
echo "Passed: $PASS"
echo "Failed: $FAIL"

if [ "$JSON_OUTPUT" = true ]; then
    echo ""
    echo "{"
    echo "  \"passed\": $PASS,"
    echo "  \"failed\": $FAIL,"
    echo "  \"complete\": $([ $FAIL -eq 0 ] && echo true || echo false)"
    echo "}"
fi

if [ $FAIL -eq 0 ]; then
    echo ""
    echo -e "${GREEN}SUCCESS: Installation validated${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Restart Claude Code to load skills"
    echo "  2. Test with: /skills"
    exit 0
else
    echo ""
    echo -e "${RED}$FAIL checks failed - see above for details${NC}"
    exit 1
fi
