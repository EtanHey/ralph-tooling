#!/bin/bash
# Claude Code Stop notification - per-project topics
# Called by: ~/.claude/hooks/notify_stop.sh
# Topic format: {user}-{ralph|claude}-{project}
#
# Usage: echo '{"cwd":"/path/to/project"}' | ./notify-stop.sh
#    or: ./notify-stop.sh (uses PWD)

set -euo pipefail

# Config location
CONFIG_FILE="${RALPH_CONFIG_FILE:-$HOME/.config/ralphtools/config.json}"

# Check if notifications enabled
check_enabled() {
    if [ -f "$CONFIG_FILE" ]; then
        grep -q '"enabled"[[:space:]]*:[[:space:]]*true' "$CONFIG_FILE" 2>/dev/null
    else
        return 1
    fi
}

# Get project name from path
get_project_name() {
    local path="$1"
    basename "$path" 2>/dev/null || echo "unknown"
}

# Detect mode (ralph vs claude)
get_mode() {
    if [ -n "${RALPH_SESSION:-}" ]; then
        echo "ralph"
    else
        echo "claude"
    fi
}

# Get username (configurable)
get_user() {
    echo "${NTFY_USER:-etanheys}"
}

# Build stats from transcript
get_stats() {
    local transcript="$1"
    [ -z "$transcript" ] || [ ! -f "$transcript" ] && return

    local edits writes bashes stats=""
    edits=$(grep -c '"name":"Edit"' "$transcript" 2>/dev/null || echo 0)
    writes=$(grep -c '"name":"Write"' "$transcript" 2>/dev/null || echo 0)
    bashes=$(grep -c '"name":"Bash"' "$transcript" 2>/dev/null || echo 0)

    [ "$edits" -gt 0 ] && stats="${edits}e"
    [ "$writes" -gt 0 ] && stats="${stats:+$stats }${writes}w"
    [ "$bashes" -gt 0 ] && stats="${stats:+$stats }${bashes}b"

    echo "$stats"
}

# Check if Claude is waiting for user input
check_waiting_for_input() {
    local transcript="$1"
    [ -z "$transcript" ] || [ ! -f "$transcript" ] && return 1

    # Check for AskUserQuestion tool in last few lines
    if tail -100 "$transcript" 2>/dev/null | grep -q '"name":"AskUserQuestion"'; then
        echo "question"
        return 0
    fi

    # Check for EnterPlanMode (waiting for plan approval)
    if tail -100 "$transcript" 2>/dev/null | grep -q '"name":"ExitPlanMode"'; then
        echo "plan"
        return 0
    fi

    # Check if last assistant message ends with question mark
    if tail -50 "$transcript" 2>/dev/null | grep -o '"text":"[^"]*"' | tail -1 | grep -q '\?'; then
        echo "question"
        return 0
    fi

    return 1
}

# Get last action summary from transcript
get_last_action() {
    local transcript="$1"
    [ -z "$transcript" ] || [ ! -f "$transcript" ] && return

    # Try to find the last meaningful tool use
    local last_edit last_file
    last_file=$(grep -o '"file_path":"[^"]*"' "$transcript" 2>/dev/null | tail -1 | cut -d'"' -f4)

    if [ -n "$last_file" ]; then
        echo "$(basename "$last_file")"
        return
    fi

    # Check for commit
    if tail -50 "$transcript" 2>/dev/null | grep -q 'git commit'; then
        echo "committed"
        return
    fi
}

# Send notification
send_ntfy() {
    local topic="$1"
    local title="$2"
    local body="$3"
    local tags="${4:-robot}"
    local priority="${5:-default}"

    curl -s \
        -H "Title: $title" \
        -H "Tags: $tags" \
        -H "Priority: $priority" \
        -d "$body" \
        "ntfy.sh/$topic" > /dev/null 2>&1
}

# Main
main() {
    # Check enabled
    check_enabled || exit 0

    # Read hook data from stdin (if piped)
    local hook_data=""
    if [ ! -t 0 ]; then
        hook_data=$(cat)
    fi

    # Get cwd from hook data or PWD
    local cwd
    cwd=$(echo "$hook_data" | grep -o '"cwd":"[^"]*"' 2>/dev/null | cut -d'"' -f4 || true)
    [ -z "$cwd" ] && cwd="$PWD"

    # Get transcript path if available
    local transcript
    transcript=$(echo "$hook_data" | grep -o '"transcript_path":"[^"]*"' 2>/dev/null | cut -d'"' -f4 || true)

    # Build components
    local user mode project topic
    user=$(get_user)
    mode=$(get_mode)
    project=$(get_project_name "$cwd")
    topic="${user}-${mode}-${project}"

    # Check if waiting for input
    local waiting_type tags priority
    waiting_type=$(check_waiting_for_input "$transcript" || true)
    tags="${mode},robot"
    priority="default"

    # Build message based on state
    local stats title body last_action
    stats=$(get_stats "$transcript")
    last_action=$(get_last_action "$transcript")

    if [ "$waiting_type" = "question" ]; then
        title="[$mode] $project - WAITING"
        body="Needs your input"
        tags="question,${mode}"
        priority="high"
    elif [ "$waiting_type" = "plan" ]; then
        title="[$mode] $project - PLAN READY"
        body="Review and approve plan"
        tags="clipboard,${mode}"
        priority="high"
    else
        title="[$mode] $project done"
        [ -n "$stats" ] && title="$title ($stats)"
        if [ -n "$last_action" ]; then
            body="Last: $last_action"
        else
            body="Session complete"
        fi
    fi

    # Send
    send_ntfy "$topic" "$title" "$body" "$tags" "$priority"
}

main "$@"
