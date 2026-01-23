#!/bin/bash
# add-story.sh - Add a story to the PRD with Ralph detection
# Auto-routes to update.json (Ralph running) or direct edit (Ralph not running)
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
STORY_ID=""
STORY_TITLE=""
STORY_DESC=""
STORY_TYPE="feature"
STORY_PRIORITY="medium"
STORY_POINTS="2"
CRITERIA=()
DEPENDENCIES=()
PRD_DIR="prd-json"

show_help() {
    cat << EOF
Usage: $(basename "$0") [OPTIONS]

Add a story to the PRD. Auto-detects if Ralph is running and routes appropriately.

Options:
  --id ID           Story ID (e.g., US-070, BUG-012, V-015)
  --title TITLE     Story title (required)
  --desc DESC       Full description
  --type TYPE       Story type: feature|bugfix|verification|test (default: feature)
  --priority PRI    Priority: critical|high|medium|low (default: medium)
  --points N        Story points 1-5 (default: 2)
  --criterion TEXT  Acceptance criterion (can be used multiple times)
  --depends ID      Dependency story ID (can be used multiple times)
  --prd-dir DIR     PRD directory (default: prd-json)
  --force-update    Force use of update.json even if Ralph not detected
  --force-direct    Force direct edit even if Ralph is detected
  -h, --help        Show this help

Examples:
  # Auto-detect Ralph and add a feature story
  $(basename "$0") --id US-070 --title "Add user settings" --priority high \\
      --criterion "Settings page renders" --criterion "Changes persist"

  # Add a bug report
  $(basename "$0") --id BUG-012 --title "Fix login double-submit" --type bugfix \\
      --priority critical --criterion "Bug no longer occurs"

  # Add with dependency
  $(basename "$0") --id V-015 --title "Verify settings" --type verification \\
      --depends US-070 --criterion "Verify in browser"
EOF
}

# Parse arguments
FORCE_UPDATE=false
FORCE_DIRECT=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --id)
            STORY_ID="$2"
            shift 2
            ;;
        --title)
            STORY_TITLE="$2"
            shift 2
            ;;
        --desc)
            STORY_DESC="$2"
            shift 2
            ;;
        --type)
            STORY_TYPE="$2"
            shift 2
            ;;
        --priority)
            STORY_PRIORITY="$2"
            shift 2
            ;;
        --points)
            STORY_POINTS="$2"
            shift 2
            ;;
        --criterion)
            CRITERIA+=("$2")
            shift 2
            ;;
        --depends)
            DEPENDENCIES+=("$2")
            shift 2
            ;;
        --prd-dir)
            PRD_DIR="$2"
            shift 2
            ;;
        --force-update)
            FORCE_UPDATE=true
            shift
            ;;
        --force-direct)
            FORCE_DIRECT=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}ERROR: Unknown option: $1${NC}" >&2
            show_help
            exit 1
            ;;
    esac
done

# Validate required fields
if [[ -z "$STORY_TITLE" ]]; then
    echo -e "${RED}ERROR: --title is required${NC}" >&2
    show_help
    exit 1
fi

# Validate story type
case "$STORY_TYPE" in
    feature|bugfix|verification|test) ;;
    *)
        echo -e "${RED}ERROR: Invalid type '$STORY_TYPE'. Must be: feature|bugfix|verification|test${NC}" >&2
        exit 1
        ;;
esac

# Validate priority
case "$STORY_PRIORITY" in
    critical|high|medium|low) ;;
    *)
        echo -e "${RED}ERROR: Invalid priority '$STORY_PRIORITY'. Must be: critical|high|medium|low${NC}" >&2
        exit 1
        ;;
esac

# Validate story points
if ! [[ "$STORY_POINTS" =~ ^[1-5]$ ]]; then
    echo -e "${RED}ERROR: Story points must be 1-5${NC}" >&2
    exit 1
fi

# Check if PRD directory exists
if [[ ! -d "$PRD_DIR" ]]; then
    echo -e "${RED}ERROR: PRD directory '$PRD_DIR' not found${NC}" >&2
    exit 1
fi

# Auto-generate ID if not provided
if [[ -z "$STORY_ID" ]]; then
    case "$STORY_TYPE" in
        feature)
            prefix="US"
            ;;
        bugfix)
            prefix="BUG"
            ;;
        verification)
            prefix="V"
            ;;
        test)
            prefix="TEST"
            ;;
    esac

    # Find highest existing ID of this type
    last_num=$(jq -r '.storyOrder[]' "$PRD_DIR/index.json" 2>/dev/null | grep "^$prefix-" | sed "s/$prefix-//" | sort -n | tail -1)
    next_num=$((${last_num:-0} + 1))
    STORY_ID=$(printf "%s-%03d" "$prefix" "$next_num")
    echo -e "${BLUE}INFO: Auto-generated ID: $STORY_ID${NC}"
fi

# Use title as description if not provided
if [[ -z "$STORY_DESC" ]]; then
    STORY_DESC="$STORY_TITLE"
fi

# Add default criterion if none provided
if [[ ${#CRITERIA[@]} -eq 0 ]]; then
    CRITERIA+=("TODO: Add acceptance criteria")
fi

# Detect Ralph status
ralph_running() {
    # Check for active Ralph tee process writing to output file
    if pgrep -f "tee /tmp/ralph_output_" >/dev/null 2>&1; then
        return 0
    fi
    # Alternative: check for Ralph watcher PID files (indicates active fswatch)
    if ls /tmp/ralph_watcher_*_pid 1>/dev/null 2>&1; then
        return 0
    fi
    # Legacy: check for Ralph PID file
    if ls /tmp/ralph_pid_* 1>/dev/null 2>&1; then
        return 0
    fi
    return 1
}

# Build acceptance criteria JSON
build_criteria_json() {
    local criteria_json="["
    local first=true
    for criterion in "${CRITERIA[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            criteria_json+=","
        fi
        # Escape special characters in criterion text (use printf -n to avoid trailing newline)
        escaped=$(printf '%s' "$criterion" | jq -Rs '.')
        criteria_json+="{\"text\":$escaped,\"checked\":false}"
    done
    criteria_json+="]"
    echo "$criteria_json"
}

# Build dependencies JSON
build_deps_json() {
    if [[ ${#DEPENDENCIES[@]} -eq 0 ]]; then
        echo "[]"
        return
    fi
    local deps_json="["
    local first=true
    for dep in "${DEPENDENCIES[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            deps_json+=","
        fi
        deps_json+="\"$dep\""
    done
    deps_json+="]"
    echo "$deps_json"
}

# Build the story JSON
build_story_json() {
    local criteria_json=$(build_criteria_json)
    local deps_json=$(build_deps_json)
    local title_escaped=$(printf '%s' "$STORY_TITLE" | jq -Rs '.')
    local desc_escaped=$(printf '%s' "$STORY_DESC" | jq -Rs '.')

    cat << EOF
{
  "id": "$STORY_ID",
  "title": $title_escaped,
  "description": $desc_escaped,
  "type": "$STORY_TYPE",
  "priority": "$STORY_PRIORITY",
  "storyPoints": $STORY_POINTS,
  "status": "pending",
  "acceptanceCriteria": $criteria_json,
  "dependencies": $deps_json
}
EOF
}

# Route based on Ralph detection
use_update_json=false

if [[ "$FORCE_UPDATE" == "true" ]]; then
    use_update_json=true
    echo -e "${YELLOW}INFO: Forcing update.json method${NC}"
elif [[ "$FORCE_DIRECT" == "true" ]]; then
    use_update_json=false
    echo -e "${YELLOW}INFO: Forcing direct edit method${NC}"
elif ralph_running; then
    use_update_json=true
    echo -e "${GREEN}INFO: Ralph detected - using update.json${NC}"
else
    use_update_json=false
    echo -e "${GREEN}INFO: Ralph not running - using direct edit${NC}"
fi

story_json=$(build_story_json)

if [[ "$use_update_json" == "true" ]]; then
    # Write to update.json
    if [[ -f "$PRD_DIR/update.json" ]]; then
        # Append to existing newStories array
        existing=$(cat "$PRD_DIR/update.json")
        echo "$existing" | jq --argjson story "$story_json" '.newStories += [$story]' > "$PRD_DIR/update.json"
        echo -e "${GREEN}SUCCESS: Appended $STORY_ID to existing update.json${NC}"
    else
        # Create new update.json
        echo "{\"newStories\": [$story_json]}" | jq '.' > "$PRD_DIR/update.json"
        echo -e "${GREEN}SUCCESS: Created update.json with $STORY_ID${NC}"
    fi
    echo -e "${BLUE}INFO: Story will be processed at start of next Ralph iteration${NC}"
else
    # Direct edit: create story file and update index.json

    # Create story file
    echo "$story_json" | jq '.' > "$PRD_DIR/stories/$STORY_ID.json"
    echo -e "${GREEN}SUCCESS: Created $PRD_DIR/stories/$STORY_ID.json${NC}"

    # Update index.json
    jq --arg id "$STORY_ID" '
        .storyOrder += [$id] |
        .pending += [$id] |
        .stats.total += 1 |
        .stats.pending += 1
    ' "$PRD_DIR/index.json" > /tmp/index.tmp && mv /tmp/index.tmp "$PRD_DIR/index.json"
    echo -e "${GREEN}SUCCESS: Updated $PRD_DIR/index.json${NC}"
fi

# Summary
echo ""
echo -e "${BLUE}Story Summary:${NC}"
echo "  ID:       $STORY_ID"
echo "  Title:    $STORY_TITLE"
echo "  Type:     $STORY_TYPE"
echo "  Priority: $STORY_PRIORITY"
echo "  Points:   $STORY_POINTS"
echo "  Criteria: ${#CRITERIA[@]}"
if [[ ${#DEPENDENCIES[@]} -gt 0 ]]; then
    echo "  Depends:  ${DEPENDENCIES[*]}"
fi
