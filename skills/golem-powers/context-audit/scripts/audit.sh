#!/bin/bash
# Context Audit Script
# Diagnoses missing contexts in a project

set -eo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Context locations
GLOBAL_CONTEXTS="${HOME}/.claude/contexts"
REPO_CONTEXTS="./contexts"
CLAUDE_MD="./CLAUDE.md"

echo ""
echo "=== CONTEXT AUDIT ==="
echo ""

# ─────────────────────────────────────────────────────────────
# 1. AVAILABLE CONTEXTS
# ─────────────────────────────────────────────────────────────
echo -e "${CYAN}AVAILABLE CONTEXTS:${NC}"

AVAILABLE=()

# Check global contexts
if [ -d "$GLOBAL_CONTEXTS" ]; then
    while IFS= read -r ctx; do
        rel_path="${ctx#$GLOBAL_CONTEXTS/}"
        rel_path="${rel_path%.md}"
        AVAILABLE+=("$rel_path")
        echo "  $rel_path"
    done < <(find "$GLOBAL_CONTEXTS" -name "*.md" -type f 2>/dev/null | grep -v README | sort)
fi

# Check repo contexts (if different from global)
if [ -d "$REPO_CONTEXTS" ] && [ "$(realpath "$REPO_CONTEXTS" 2>/dev/null)" != "$(realpath "$GLOBAL_CONTEXTS" 2>/dev/null)" ]; then
    echo "  (repo contexts/)"
    while IFS= read -r ctx; do
        rel_path="${ctx#$REPO_CONTEXTS/}"
        rel_path="${rel_path%.md}"
        if [[ ! " ${AVAILABLE[*]} " =~ " ${rel_path} " ]]; then
            AVAILABLE+=("$rel_path")
            echo "  $rel_path"
        fi
    done < <(find "$REPO_CONTEXTS" -name "*.md" -type f 2>/dev/null | grep -v README | sort)
fi

echo ""

# ─────────────────────────────────────────────────────────────
# 2. DETECT TECH STACK
# ─────────────────────────────────────────────────────────────
echo -e "${CYAN}DETECTED TECH STACK:${NC}"

NEEDED=("base" "skill-index")  # Always needed

# Check for package.json
if [ -f "package.json" ]; then
    PKG=$(cat package.json)

    # Next.js
    if echo "$PKG" | grep -q '"next"'; then
        echo -e "  ${GREEN}[x]${NC} Next.js (found in package.json)"
        NEEDED+=("tech/nextjs")
    else
        echo -e "  ${YELLOW}[ ]${NC} Next.js"
    fi

    # React Native / Expo
    if echo "$PKG" | grep -q '"react-native"\|"expo"'; then
        echo -e "  ${GREEN}[x]${NC} React Native/Expo (found in package.json)"
        NEEDED+=("tech/react-native")
    else
        echo -e "  ${YELLOW}[ ]${NC} React Native"
    fi
fi

# Convex
if [ -d "convex" ] || [ -f "convex.json" ]; then
    echo -e "  ${GREEN}[x]${NC} Convex (found convex/)"
    NEEDED+=("tech/convex")
else
    echo -e "  ${YELLOW}[ ]${NC} Convex"
fi

# Supabase
if [ -d "supabase" ] || [ -f "supabase/config.toml" ]; then
    echo -e "  ${GREEN}[x]${NC} Supabase (found supabase/)"
    NEEDED+=("tech/supabase")
else
    echo -e "  ${YELLOW}[ ]${NC} Supabase"
fi

# RTL (Hebrew/Arabic) - check for Hebrew characters or rtl in code
if grep -rq '[\u0590-\u05FF]' . --include="*.tsx" --include="*.ts" --include="*.js" 2>/dev/null || \
   grep -rq 'dir="rtl"\|direction.*rtl\|rtl:' . --include="*.tsx" --include="*.css" 2>/dev/null; then
    echo -e "  ${GREEN}[x]${NC} RTL (found Hebrew/Arabic or RTL patterns)"
    NEEDED+=("workflow/rtl")
else
    echo -e "  ${YELLOW}[ ]${NC} RTL"
fi

# UI Components
if [ -d "src/components" ] || [ -d "components" ] || [ -d "packages/ui" ]; then
    echo -e "  ${GREEN}[x]${NC} UI Components (found components dir)"
    NEEDED+=("workflow/design-system")
else
    echo -e "  ${YELLOW}[ ]${NC} UI Components"
fi

# Tests
if [ -d "tests" ] || [ -d "__tests__" ] || ls *.test.ts *.spec.ts 2>/dev/null | head -1 | grep -q .; then
    echo -e "  ${GREEN}[x]${NC} Tests (found test files)"
    NEEDED+=("workflow/testing")
else
    echo -e "  ${YELLOW}[ ]${NC} Tests"
fi

# PRD/Ralph
if [ -d "prd-json" ] || [ -f "PRD.md" ]; then
    echo -e "  ${GREEN}[x]${NC} Ralph PRD (found prd-json/)"
    # Ralph context handled separately
fi

# Interactive mode (always for interactive Claude)
NEEDED+=("workflow/interactive")

echo ""

# ─────────────────────────────────────────────────────────────
# 3. CHECK CURRENT CLAUDE.MD
# ─────────────────────────────────────────────────────────────
echo -e "${CYAN}CURRENT CLAUDE.MD CONTEXTS:${NC}"

HAS=()

if [ -f "$CLAUDE_MD" ]; then
    # Look for @context: lines
    while IFS= read -r line; do
        ctx=$(echo "$line" | sed 's/.*@context:[[:space:]]*//' | tr -d ' ')
        if [ -n "$ctx" ]; then
            HAS+=("$ctx")
            echo "  $ctx"
        fi
    done < <(grep -E "@context:" "$CLAUDE_MD" 2>/dev/null || true)

    if [ ${#HAS[@]} -eq 0 ]; then
        echo -e "  ${RED}(none found)${NC}"
    fi
else
    echo -e "  ${RED}(no CLAUDE.md file)${NC}"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# 4. RECOMMENDED BLOCK
# ─────────────────────────────────────────────────────────────
echo -e "${CYAN}RECOMMENDED @context: BLOCK:${NC}"
echo ""
echo "  ## Contexts"

# Deduplicate NEEDED (bash 3 compatible)
UNIQUE_NEEDED=()
for ctx in "${NEEDED[@]}"; do
    duplicate=false
    for existing in "${UNIQUE_NEEDED[@]}"; do
        if [ "$existing" = "$ctx" ]; then
            duplicate=true
            break
        fi
    done
    if [ "$duplicate" = false ]; then
        UNIQUE_NEEDED+=("$ctx")
    fi
done

for ctx in "${UNIQUE_NEEDED[@]}"; do
    echo "  @context: $ctx"
done

echo ""

# ─────────────────────────────────────────────────────────────
# 5. GAP SUMMARY
# ─────────────────────────────────────────────────────────────
echo -e "${CYAN}GAP SUMMARY:${NC}"

MISSING=()
for ctx in "${UNIQUE_NEEDED[@]}"; do
    if [[ ! " ${HAS[*]} " =~ " ${ctx} " ]]; then
        MISSING+=("$ctx")
    fi
done

if [ ${#MISSING[@]} -eq 0 ]; then
    echo -e "  ${GREEN}All recommended contexts are present!${NC}"
else
    echo -e "  ${RED}Missing ${#MISSING[@]} contexts:${NC}"
    for ctx in "${MISSING[@]}"; do
        echo -e "    - $ctx"
    done
    echo ""
    echo -e "  ${YELLOW}Action: Add the recommended block above to CLAUDE.md${NC}"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# 6. SETUP HEADER CHECK
# ─────────────────────────────────────────────────────────────
echo -e "${CYAN}SETUP HEADER CHECK:${NC}"

if [ -f "$CLAUDE_MD" ]; then
    if grep -q "AI: Read This First\|SETUP.*Read.*First\|🔧 SETUP" "$CLAUDE_MD" 2>/dev/null; then
        echo -e "  ${GREEN}[x]${NC} Setup header found"
    else
        echo -e "  ${RED}[ ]${NC} No setup header - AI won't know the meta-purpose"
        echo -e "      ${YELLOW}Add a '## SETUP (AI: Read This First)' section${NC}"
    fi
else
    echo -e "  ${RED}[ ]${NC} No CLAUDE.md - create one with setup header"
fi

echo ""
echo "=== END AUDIT ==="
