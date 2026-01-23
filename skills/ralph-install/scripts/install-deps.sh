#!/bin/bash
# scripts/install-deps.sh
# Purpose: Install missing dependencies via Homebrew
# Usage: bash install-deps.sh [--all | dep1 dep2 ...]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Help text
show_help() {
    echo "Usage: install-deps.sh [options] [deps...]"
    echo ""
    echo "Options:"
    echo "  --all       Install all missing dependencies"
    echo "  --dry-run   Show what would be installed"
    echo "  -h, --help  Show this help"
    echo ""
    echo "Available dependencies:"
    echo "  gh        GitHub CLI"
    echo "  op        1Password CLI"
    echo "  gum       Interactive prompts"
    echo "  fswatch   File watching"
    echo "  jq        JSON processing"
    echo "  git       Version control"
    echo ""
    echo "Examples:"
    echo "  bash install-deps.sh --all          # Install all missing"
    echo "  bash install-deps.sh gh op          # Install specific deps"
    echo "  bash install-deps.sh --dry-run --all  # Preview installation"
}

ALL=false
DRY_RUN=false
SPECIFIC_DEPS=()

while [[ $# -gt 0 ]]; do
    case $1 in
        --all) ALL=true; shift ;;
        --dry-run) DRY_RUN=true; shift ;;
        -h|--help) show_help; exit 0 ;;
        -*) echo -e "${RED}ERROR: Unknown option: $1${NC}"; exit 1 ;;
        *) SPECIFIC_DEPS+=("$1"); shift ;;
    esac
done

# Check for Homebrew
if ! command -v brew &>/dev/null; then
    echo -e "${RED}ERROR: Homebrew is not installed${NC}"
    echo ""
    echo "Install Homebrew first:"
    echo '  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
    exit 1
fi

echo -e "${BLUE}Checking for missing dependencies...${NC}"
echo ""

# Brew package names (op is a cask)
declare -A BREW_PACKAGES
BREW_PACKAGES[gh]="gh"
BREW_PACKAGES[op]="--cask 1password-cli"
BREW_PACKAGES[gum]="gum"
BREW_PACKAGES[fswatch]="fswatch"
BREW_PACKAGES[jq]="jq"
BREW_PACKAGES[git]="git"

# Find missing deps
MISSING=()
for cmd in gh op gum fswatch jq git; do
    if ! command -v "$cmd" &>/dev/null; then
        MISSING+=("$cmd")
    fi
done

# Determine what to install
TO_INSTALL=()
if [ "$ALL" = true ]; then
    TO_INSTALL=("${MISSING[@]}")
elif [ ${#SPECIFIC_DEPS[@]} -gt 0 ]; then
    for dep in "${SPECIFIC_DEPS[@]}"; do
        if [[ -n "${BREW_PACKAGES[$dep]:-}" ]]; then
            if ! command -v "$dep" &>/dev/null; then
                TO_INSTALL+=("$dep")
            else
                echo -e "${YELLOW}$dep is already installed${NC}"
            fi
        else
            echo -e "${RED}ERROR: Unknown dependency: $dep${NC}"
            exit 1
        fi
    done
else
    echo "Missing dependencies: ${MISSING[*]:-none}"
    echo ""
    echo "Usage:"
    echo "  bash install-deps.sh --all           # Install all missing"
    echo "  bash install-deps.sh gh op gum       # Install specific"
    exit 0
fi

if [ ${#TO_INSTALL[@]} -eq 0 ]; then
    echo -e "${GREEN}All requested dependencies are already installed${NC}"
    exit 0
fi

echo "Will install: ${TO_INSTALL[*]}"
echo ""

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}[DRY RUN] Would run:${NC}"
    for dep in "${TO_INSTALL[@]}"; do
        echo "  brew install ${BREW_PACKAGES[$dep]}"
    done
    exit 0
fi

# Install each dependency
for dep in "${TO_INSTALL[@]}"; do
    echo -e "${BLUE}Installing $dep...${NC}"
    brew install ${BREW_PACKAGES[$dep]}
    if command -v "$dep" &>/dev/null; then
        echo -e "${GREEN}[OK]${NC} $dep installed"
    else
        echo -e "${RED}[FAIL]${NC} $dep installation failed"
    fi
    echo ""
done

# Verify installation
echo -e "${BLUE}Verifying installation...${NC}"
echo ""

INSTALLED=0
FAILED=0
for dep in "${TO_INSTALL[@]}"; do
    if command -v "$dep" &>/dev/null; then
        echo -e "${GREEN}[OK]${NC} $dep"
        ((INSTALLED++))
    else
        echo -e "${RED}[FAIL]${NC} $dep"
        ((FAILED++))
    fi
done

echo ""
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}SUCCESS: Installed $INSTALLED dependencies${NC}"
    exit 0
else
    echo -e "${YELLOW}Installed $INSTALLED, failed $FAILED${NC}"
    exit 1
fi
