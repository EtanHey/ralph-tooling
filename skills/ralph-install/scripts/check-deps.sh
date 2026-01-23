#!/bin/bash
# scripts/check-deps.sh
# Purpose: Check all required dependencies for ralphtools
# Usage: bash check-deps.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Help text
show_help() {
    echo "Usage: check-deps.sh [options]"
    echo ""
    echo "Options:"
    echo "  --verbose    Show version details"
    echo "  --json       Output as JSON"
    echo "  -h, --help   Show this help"
    echo ""
    echo "Checks for:"
    echo "  - gh (GitHub CLI)"
    echo "  - op (1Password CLI)"
    echo "  - gum (Interactive prompts)"
    echo "  - fswatch (File watching)"
    echo "  - jq (JSON processing)"
    echo "  - git (Version control)"
}

VERBOSE=false
JSON_OUTPUT=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose) VERBOSE=true; shift ;;
        --json) JSON_OUTPUT=true; shift ;;
        -h|--help) show_help; exit 0 ;;
        *) echo -e "${RED}ERROR: Unknown option: $1${NC}"; exit 1 ;;
    esac
done

echo -e "${BLUE}Checking ralphtools dependencies...${NC}"
echo ""

# Required CLIs with descriptions
declare -A DEPS
DEPS[gh]="GitHub CLI"
DEPS[op]="1Password CLI"
DEPS[gum]="Interactive prompts"
DEPS[fswatch]="File watching"
DEPS[jq]="JSON processing"
DEPS[git]="Version control"

MISSING=()
INSTALLED=()
declare -A VERSIONS

for cmd in gh op gum fswatch jq git; do
    if command -v "$cmd" &>/dev/null; then
        VERSION=$("$cmd" --version 2>&1 | head -1)
        VERSIONS[$cmd]="$VERSION"
        INSTALLED+=("$cmd")

        if [ "$VERBOSE" = true ]; then
            echo -e "${GREEN}[OK]${NC} $cmd (${DEPS[$cmd]})"
            echo "     Version: $VERSION"
        else
            echo -e "${GREEN}[OK]${NC} $cmd"
        fi
    else
        MISSING+=("$cmd")
        echo -e "${RED}[MISSING]${NC} $cmd (${DEPS[$cmd]})"
    fi
done

echo ""

# Summary
if [ "$JSON_OUTPUT" = true ]; then
    echo "{"
    echo "  \"installed\": [$(printf '"%s",' "${INSTALLED[@]}" | sed 's/,$//')],"
    echo "  \"missing\": [$(printf '"%s",' "${MISSING[@]}" | sed 's/,$//')],"
    echo "  \"complete\": $([ ${#MISSING[@]} -eq 0 ] && echo true || echo false)"
    echo "}"
    exit $([ ${#MISSING[@]} -eq 0 ] && echo 0 || echo 1)
fi

if [ ${#MISSING[@]} -eq 0 ]; then
    echo -e "${GREEN}SUCCESS: All ${#INSTALLED[@]} dependencies installed${NC}"
    exit 0
else
    echo -e "${YELLOW}Missing ${#MISSING[@]} dependencies: ${MISSING[*]}${NC}"
    echo ""
    echo "Install with:"
    echo "  bash ~/.claude/commands/ralph-install/scripts/install-deps.sh"
    echo ""
    echo "Or manually:"
    for cmd in "${MISSING[@]}"; do
        case $cmd in
            gh) echo "  brew install gh" ;;
            op) echo "  brew install --cask 1password-cli" ;;
            gum) echo "  brew install gum" ;;
            fswatch) echo "  brew install fswatch" ;;
            jq) echo "  brew install jq" ;;
            git) echo "  brew install git" ;;
        esac
    done
    exit 1
fi
