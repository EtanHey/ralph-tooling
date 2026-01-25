#!/usr/bin/env zsh
# ═══════════════════════════════════════════════════════════════════
# RALPH-SECRETS.ZSH - 1Password integration for secrets management
# ═══════════════════════════════════════════════════════════════════
# Part of the Ralph modular architecture.
# Contains: ralph-secrets, MCP setup, 1Password environment detection.
#
# Commands:
#   ralph-secrets setup            - Configure 1Password vault
#   ralph-secrets status           - Show 1Password configuration
#   ralph-secrets migrate <.env>   - Migrate .env file to 1Password
# ═══════════════════════════════════════════════════════════════════

# SERVICE_PREFIXES: Map env var prefixes to service names
# Used by _ralph_detect_service() to auto-categorize secrets
typeset -gA RALPH_SERVICE_PREFIXES
RALPH_SERVICE_PREFIXES[ANTHROPIC]=anthropic
RALPH_SERVICE_PREFIXES[OPENAI]=openai
RALPH_SERVICE_PREFIXES[SUPABASE]=supabase
RALPH_SERVICE_PREFIXES[VERCEL]=vercel
RALPH_SERVICE_PREFIXES[AWS]=aws
RALPH_SERVICE_PREFIXES[STRIPE]=stripe
RALPH_SERVICE_PREFIXES[DATABASE]=db
RALPH_SERVICE_PREFIXES[DB]=db
RALPH_SERVICE_PREFIXES[REDIS]=redis
RALPH_SERVICE_PREFIXES[GITHUB]=github
RALPH_SERVICE_PREFIXES[LINEAR]=linear
RALPH_SERVICE_PREFIXES[FIGMA]=figma
RALPH_SERVICE_PREFIXES[TWILIO]=twilio
RALPH_SERVICE_PREFIXES[SENDGRID]=sendgrid
RALPH_SERVICE_PREFIXES[SLACK]=slack
RALPH_SERVICE_PREFIXES[FIREBASE]=firebase
RALPH_SERVICE_PREFIXES[GOOGLE]=google
RALPH_SERVICE_PREFIXES[AZURE]=azure
RALPH_SERVICE_PREFIXES[CLOUDFLARE]=cloudflare
RALPH_SERVICE_PREFIXES[POSTGRES]=db
RALPH_SERVICE_PREFIXES[MYSQL]=db
RALPH_SERVICE_PREFIXES[MONGO]=db
RALPH_SERVICE_PREFIXES[MONGODB]=db

# GLOBAL_VARS: Variables that are truly global (not project-specific)
# These go to _global/{service}/{key} instead of {project}/{service}/{key}
typeset -ga RALPH_GLOBAL_VARS
RALPH_GLOBAL_VARS=(
  "EDITOR"
  "VISUAL"
  "GIT_AUTHOR_NAME"
  "GIT_AUTHOR_EMAIL"
  "GIT_COMMITTER_NAME"
  "GIT_COMMITTER_EMAIL"
  "PATH"
  "HOME"
  "USER"
  "SHELL"
  "TERM"
  "LANG"
  "LC_ALL"
)

# _ralph_detect_service: Detect service name from env var key
# Arguments: $1 = key name (e.g., ANTHROPIC_API_KEY)
# Returns: service name (e.g., anthropic) or 'misc' if no match
function _ralph_detect_service() {
  local key="$1"
  local prefix=""

  # Try each known prefix (longest match first by iterating)
  for p in "${(@k)RALPH_SERVICE_PREFIXES}"; do
    if [[ "$key" == ${p}_* || "$key" == ${p} ]]; then
      # Check if this is a longer match than current
      if [[ ${#p} -gt ${#prefix} ]]; then
        prefix="$p"
      fi
    fi
  done

  if [[ -n "$prefix" ]]; then
    echo "${RALPH_SERVICE_PREFIXES[$prefix]}"
  else
    echo "misc"
  fi
}

# _ralph_normalize_key: Strip service prefix from key
# Arguments: $1 = key name (e.g., ANTHROPIC_API_KEY)
# Returns: normalized key (e.g., API_KEY) or original if no prefix
function _ralph_normalize_key() {
  local key="$1"
  local prefix=""

  # Find matching prefix
  for p in "${(@k)RALPH_SERVICE_PREFIXES}"; do
    if [[ "$key" == ${p}_* ]]; then
      if [[ ${#p} -gt ${#prefix} ]]; then
        prefix="$p"
      fi
    fi
  done

  if [[ -n "$prefix" ]]; then
    # Strip prefix and underscore
    echo "${key#${prefix}_}"
  else
    echo "$key"
  fi
}

# _ralph_is_global_var: Check if var is in GLOBAL_VARS list
# Arguments: $1 = key name
# Returns: 0 if global, 1 if not
function _ralph_is_global_var() {
  local key="$1"
  for gv in "${RALPH_GLOBAL_VARS[@]}"; do
    if [[ "$key" == "$gv" ]]; then
      return 0
    fi
    # Also check for prefix match (GIT_* matches GIT_AUTHOR_NAME, etc.)
    if [[ "$gv" == *"_" && "$key" == ${gv}* ]]; then
      return 0
    fi
  done
  return 1
}

# ═══════════════════════════════════════════════════════════════════
# 1PASSWORD ENVIRONMENT DETECTION
# Check if 1Password Environments are configured in a project
# Looks for .env.1password files or op:// references in env files
# ═══════════════════════════════════════════════════════════════════

# Returns 0 if 1Password Environments are configured, 1 if not
function _ralph_check_op_environments() {
  local project_path="${1:-.}"

  # Check for .env.1password file
  if [[ -f "$project_path/.env.1password" ]]; then
    return 0
  fi

  # Check for op:// references in common env files
  local env_files=(".env" ".env.local" ".env.development" ".env.production" ".env.example")
  for env_file in "${env_files[@]}"; do
    if [[ -f "$project_path/$env_file" ]]; then
      if grep -q "op://" "$project_path/$env_file" 2>/dev/null; then
        return 0
      fi
    fi
  done

  # Check for op:// in package.json scripts (some projects use this pattern)
  if [[ -f "$project_path/package.json" ]]; then
    if grep -q "op://" "$project_path/package.json" 2>/dev/null; then
      return 0
    fi
  fi

  # Not configured
  return 1
}

# ═══════════════════════════════════════════════════════════════════
# SECRETS MANAGEMENT - 1Password integration
# ═══════════════════════════════════════════════════════════════════

function ralph-secrets() {
  local RED='\033[0;31m'
  local GREEN='\033[0;32m'
  local YELLOW='\033[0;33m'
  local NC='\033[0m'
  local config_file="$HOME/.config/ralphtools/config.json"
  local subcommand="${1:-status}"

  # Helper function: Check if op CLI is installed
  _ralph_check_op_cli() {
    if ! command -v op &>/dev/null; then
      echo "${RED}Error: 1Password CLI (op) is not installed${NC}"
      echo ""
      echo "Install with:"
      echo "  brew install 1password-cli"
      echo ""
      echo "Or download from:"
      echo "  https://1password.com/downloads/command-line/"
      return 1
    fi
    return 0
  }

  # Helper function: Check if user is signed into 1Password
  _ralph_check_op_signin() {
    if ! op account list &>/dev/null; then
      echo "${RED}Error: Not signed into 1Password${NC}"
      echo ""
      echo "Sign in with:"
      echo "  eval \$(op signin)"
      echo ""
      echo "Or if using biometric unlock:"
      echo "  op signin"
      return 1
    fi
    return 0
  }

  case "$subcommand" in
    setup)
      echo ""
      echo "Ralph Secrets Setup (1Password)"
      echo ""

      # Check op CLI is installed
      if ! _ralph_check_op_cli; then
        return 1
      fi
      echo "${GREEN}1Password CLI installed${NC}"

      # Check user is signed in
      if ! _ralph_check_op_signin; then
        return 1
      fi
      echo "${GREEN}Signed into 1Password${NC}"
      echo ""

      # Get available vaults
      echo "Available vaults:"
      local vaults
      vaults=$(op vault list --format=json 2>/dev/null | /usr/bin/jq -r '.[].name')
      if [[ -z "$vaults" ]]; then
        echo "${RED}Error: No vaults found${NC}"
        return 1
      fi

      local vault_array=()
      while IFS= read -r vault; do
        vault_array+=("$vault")
        echo "   - $vault"
      done <<< "$vaults"
      echo ""

      local selected_vault=""

      # Select vault
      if [[ $RALPH_HAS_GUM -eq 0 ]]; then
        echo "Select vault to use for Ralph secrets:"
        selected_vault=$(gum choose "${vault_array[@]}")
      else
        echo "Enter vault name to use for Ralph secrets:"
        echo -n "   Vault name: "
        read selected_vault
        # Validate vault exists
        local vault_exists=false
        for v in "${vault_array[@]}"; do
          if [[ "$v" == "$selected_vault" ]]; then
            vault_exists=true
            break
          fi
        done
        if ! $vault_exists; then
          echo "${RED}Error: Vault '$selected_vault' not found${NC}"
          return 1
        fi
      fi

      echo ""
      echo "${GREEN}Selected vault: $selected_vault${NC}"
      echo ""

      # Update config.json with secrets configuration
      # Ensure config file exists
      if [[ ! -f "$config_file" ]]; then
        mkdir -p "$HOME/.config/ralphtools"
        echo '{}' > "$config_file"
      fi

      # Add secrets section to config using jq
      /usr/bin/jq ".secrets = {\"provider\": \"1password\", \"vault\": \"$selected_vault\"}" "$config_file" > "${config_file}.tmp"
      /bin/mv "${config_file}.tmp" "$config_file"

      echo "Secrets configuration saved!"
      echo ""
      echo "   Provider: 1password"
      echo "   Vault: $selected_vault"
      echo ""
      echo "Ralph will now look for credentials in this vault."
      ;;

    status)
      echo ""
      echo "Ralph Secrets Status"
      echo ""

      # Check op CLI
      echo "1Password CLI:"
      if command -v op &>/dev/null; then
        local op_version
        op_version=$(op --version 2>/dev/null || echo "unknown")
        echo "   ${GREEN}Installed (version $op_version)${NC}"
      else
        echo "   ${RED}Not installed${NC}"
        echo "     Install with: brew install 1password-cli"
        return 0
      fi

      # Check sign-in status
      echo ""
      echo "Sign-in Status:"
      if op account list &>/dev/null; then
        local account
        account=$(op account list --format=json 2>/dev/null | /usr/bin/jq -r '.[0].email // "Unknown"')
        echo "   ${GREEN}Signed in as: $account${NC}"
      else
        echo "   ${RED}Not signed in${NC}"
        echo "     Sign in with: eval \$(op signin)"
        return 0
      fi

      # Check config
      echo ""
      echo "Ralph Configuration:"
      if [[ -f "$config_file" ]]; then
        local provider
        local vault
        provider=$(/usr/bin/jq -r '.secrets.provider // "not configured"' "$config_file" 2>/dev/null)
        vault=$(/usr/bin/jq -r '.secrets.vault // "not configured"' "$config_file" 2>/dev/null)

        if [[ "$provider" != "not configured" && "$provider" != "null" ]]; then
          echo "   ${GREEN}Provider: $provider${NC}"
          echo "   ${GREEN}Vault: $vault${NC}"

          # Check if vault exists
          if op vault get "$vault" &>/dev/null; then
            echo "   ${GREEN}Vault accessible${NC}"
          else
            echo "   ${YELLOW}Vault '$vault' not accessible${NC}"
          fi
        else
          echo "   ${YELLOW}Not configured${NC}"
          echo "     Run: ralph-secrets setup"
        fi
      else
        echo "   ${YELLOW}No config file found${NC}"
        echo "     Run: ralph-secrets setup"
      fi
      ;;

    migrate)
      local env_path=""
      local dry_run=false
      local service_override=""
      shift # remove 'migrate' from args

      # Parse arguments
      while [[ $# -gt 0 ]]; do
        case "$1" in
          --dry-run)
            dry_run=true
            shift
            ;;
          --service)
            if [[ -n "$2" && "$2" != -* ]]; then
              service_override="$2"
              shift 2
            else
              echo "${RED}Error: --service requires a service name${NC}"
              return 1
            fi
            ;;
          -*)
            echo "${RED}Error: Unknown option: $1${NC}"
            echo "Usage: ralph-secrets migrate <.env path> [--dry-run] [--service <name>]"
            return 1
            ;;
          *)
            if [[ -z "$env_path" ]]; then
              env_path="$1"
            fi
            shift
            ;;
        esac
      done

      echo ""
      echo "Ralph Secrets Migration"
      echo ""

      if $dry_run; then
        echo "${YELLOW}[DRY RUN MODE - No changes will be made]${NC}"
        echo ""
      fi

      # Validate .env path provided
      if [[ -z "$env_path" ]]; then
        echo "${RED}Error: .env file path required${NC}"
        echo ""
        echo "Usage: ralph-secrets migrate <.env path> [--dry-run] [--service <name>]"
        echo ""
        echo "Examples:"
        echo "  ralph-secrets migrate .env"
        echo "  ralph-secrets migrate ~/myproject/.env --dry-run"
        echo "  ralph-secrets migrate .env --service backend"
        return 1
      fi

      # Validate file exists
      if [[ ! -f "$env_path" ]]; then
        echo "${RED}Error: File not found: $env_path${NC}"
        return 1
      fi

      # Check op CLI
      if ! _ralph_check_op_cli; then
        return 1
      fi

      # Check signed in
      if ! _ralph_check_op_signin; then
        return 1
      fi

      # Get configured vault from config
      local vault=""
      if [[ -f "$config_file" ]]; then
        vault=$(/usr/bin/jq -r '.secrets.vault // ""' "$config_file" 2>/dev/null)
      fi

      if [[ -z "$vault" || "$vault" == "null" ]]; then
        echo "${RED}Error: No vault configured${NC}"
        echo "Run: ralph-secrets setup"
        return 1
      fi

      echo "Source: $env_path"
      echo "Target vault: $vault"
      echo ""

      # Parse .env file and count secrets
      local secrets_count=0
      local migrated_count=0
      local skipped_count=0
      local overwritten_count=0
      local env_template=""

      # Get the project name from the .env path (parent directory name)
      local project_dir
      project_dir=$(/usr/bin/dirname "$env_path")
      local project_name
      project_name=$(/usr/bin/basename "$project_dir")
      if [[ "$project_name" == "." ]]; then
        project_name=$(/usr/bin/basename "$PWD")
      fi

      echo "Scanning .env file..."
      echo ""

      # Read and process each line
      while IFS= read -r line || [[ -n "$line" ]]; do
        # Skip empty lines and comments
        [[ -z "$line" ]] && continue
        [[ "$line" =~ ^[[:space:]]*# ]] && {
          # Preserve comments in template
          env_template+="$line"$'\n'
          continue
        }

        # Extract KEY=VALUE
        if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
          local key="${match[1]}"
          local value="${match[2]}"

          # Remove surrounding quotes from value if present
          if [[ "$value" =~ ^\"(.*)\"$ ]]; then
            value="${match[1]}"
          elif [[ "$value" =~ ^\'(.*)\'$ ]]; then
            value="${match[1]}"
          fi

          ((secrets_count++))

          # Detect service: use override if provided, else auto-detect
          local service=""
          if [[ -n "$service_override" ]]; then
            service="$service_override"
          else
            service=$(_ralph_detect_service "$key")
          fi

          # Normalize key (strip service prefix)
          local normalized_key=$(_ralph_normalize_key "$key")

          # Determine if this is a global var
          local is_global=false
          local item_prefix=""
          if _ralph_is_global_var "$key"; then
            is_global=true
            item_prefix="_global"
          else
            item_prefix="$project_name"
          fi

          # Build item name: {project|_global}/{service}/{normalized_key}
          local item_name="${item_prefix}/${service}/${normalized_key}"
          # Build op:// reference path
          local op_path="op://${vault}/${item_prefix}/${service}/${normalized_key}/password"

          echo "|- ${YELLOW}${key}${NC}"
          if $dry_run; then
            echo "|  |- Service: ${service}"
            echo "|  |- Normalized: ${normalized_key}"
            if $is_global; then
              echo "|  |- Scope: global"
            else
              echo "|  |- Scope: project (${project_name})"
            fi
          fi

          # Check if item already exists in 1Password
          local item_exists=false
          if op item get "$item_name" --vault "$vault" &>/dev/null 2>&1; then
            item_exists=true
          fi

          if $item_exists; then
            # Prompt before overwriting (unless dry-run)
            if $dry_run; then
              echo "|  '- Would prompt to overwrite (item exists)"
              env_template+="${key}=${op_path}"$'\n'
              ((skipped_count++))
            else
              local overwrite_choice="no"
              if [[ $RALPH_HAS_GUM -eq 0 ]]; then
                if gum confirm "Item '$item_name' already exists. Overwrite?"; then
                  overwrite_choice="yes"
                fi
              else
                echo -n "|  '- Item exists. Overwrite? (y/n): "
                read overwrite_choice
              fi

              if [[ "$overwrite_choice" == "yes" || "$overwrite_choice" == "y" ]]; then
                # Edit existing item
                if op item edit "$item_name" --vault "$vault" "password=$value" &>/dev/null; then
                  echo "|  '- ${GREEN}Updated${NC}"
                  ((overwritten_count++))
                  ((migrated_count++))
                  env_template+="${key}=${op_path}"$'\n'
                else
                  echo "|  '- ${RED}Failed to update${NC}"
                  ((skipped_count++))
                  env_template+="${key}=${value}"$'\n'
                fi
              else
                echo "|  '- ${YELLOW}Skipped (not overwritten)${NC}"
                ((skipped_count++))
                env_template+="${key}=${op_path}"$'\n'
              fi
            fi
          else
            # Create new item
            if $dry_run; then
              echo "|  '- Would create: ${item_name}"
              env_template+="${key}=${op_path}"$'\n'
              ((migrated_count++))
            else
              if op item create --vault "$vault" --category "Password" --title "$item_name" "password=$value" &>/dev/null; then
                echo "|  '- ${GREEN}Created${NC}"
                ((migrated_count++))
                env_template+="${key}=${op_path}"$'\n'
              else
                echo "|  '- ${RED}Failed to create${NC}"
                ((skipped_count++))
                env_template+="${key}=${value}"$'\n'
              fi
            fi
          fi
        fi
      done < "$env_path"

      echo ""
      echo "─────────────────────────────────────────────────────────────"

      # Generate .env.template
      local template_path="${env_path}.template"
      if $dry_run; then
        echo ""
        echo "Would generate: $template_path"
        echo ""
        echo "Template preview:"
        echo "─────────────────────────────────────────────────────────────"
        echo "$env_template"
        echo "─────────────────────────────────────────────────────────────"
      else
        echo "$env_template" > "$template_path"
        echo ""
        echo "${GREEN}Generated: $template_path${NC}"
      fi

      echo ""
      echo "Summary"
      echo ""
      if $dry_run; then
        echo "   ${YELLOW}[DRY RUN - No changes made]${NC}"
      fi
      echo ""
      echo "   Total secrets found: $secrets_count"
      echo "   ${GREEN}Migrated to 1Password: $migrated_count${NC}"
      if [[ $overwritten_count -gt 0 ]]; then
        echo "   ${YELLOW}Overwritten: $overwritten_count${NC}"
      fi
      if [[ $skipped_count -gt 0 ]]; then
        echo "   ${YELLOW}Skipped: $skipped_count${NC}"
      fi
      echo ""
      if ! $dry_run && [[ $migrated_count -gt 0 ]]; then
        echo "   To use in your project:"
        echo "   1. Copy ${template_path} to .env"
        echo "   2. Load secrets with: source <(op inject -i .env)"
        echo "   3. Or use: op run --env-file .env -- your-command"
      fi
      ;;

    *)
      echo "Usage: ralph-secrets [setup|status|migrate <path>]"
      echo ""
      echo "Subcommands:"
      echo "  setup              - Configure 1Password vault for Ralph secrets"
      echo "  status             - Show 1Password configuration and sign-in status"
      echo "  migrate <.env>     - Migrate .env file secrets to 1Password"
      echo ""
      echo "Options for migrate:"
      echo "  --dry-run          - Preview migration without making changes"
      echo "  --service <name>   - Override auto-detected service for all vars"
      echo ""
      echo "Item naming format:"
      echo "  Project vars: {project}/{service}/{normalized_key}"
      echo "  Global vars:  _global/{service}/{key}"
      echo ""
      echo "Examples:"
      echo "  ralph-secrets migrate .env --dry-run"
      echo "  ralph-secrets migrate .env --service backend"
      return 1
      ;;
  esac
}

# ═══════════════════════════════════════════════════════════════════
# MCP SETUP - Configure MCPs for project launchers
# ═══════════════════════════════════════════════════════════════════
# Supported MCPs: figma, linear, supabase, browser-tools, context7
# Credentials: 1Password (if op CLI available) or environment variables
# ═══════════════════════════════════════════════════════════════════

function _ralph_setup_mcps() {
  local mcps_json="$1"
  local YELLOW='\033[0;33m'
  local GREEN='\033[0;32m'
  local RED='\033[0;31m'
  local NC='\033[0m'

  # Parse MCPs from JSON array
  local mcps=()
  if [[ -n "$mcps_json" && "$mcps_json" != "[]" ]]; then
    # Convert JSON array to zsh array
    while IFS= read -r mcp; do
      mcps+=("$mcp")
    done < <(echo "$mcps_json" | /usr/bin/jq -r '.[]' 2>/dev/null)
  fi

  if [[ ${#mcps[@]} -eq 0 ]]; then
    return 0
  fi

  echo "${YELLOW}Setting up MCPs: ${mcps[*]}${NC}"

  # Check if 1Password CLI is available
  local has_1password=false
  if command -v op &>/dev/null; then
    has_1password=true
  fi

  for mcp in "${mcps[@]}"; do
    case "$mcp" in
      figma)
        if [[ -z "$FIGMA_PERSONAL_ACCESS_TOKEN" ]]; then
          if $has_1password; then
            export FIGMA_PERSONAL_ACCESS_TOKEN=$(op read "op://Private/Figma Personal Access Token/credential" 2>/dev/null)
          fi
        fi
        if [[ -n "$FIGMA_PERSONAL_ACCESS_TOKEN" ]]; then
          echo "${GREEN}  Figma MCP configured${NC}"
        else
          echo "${RED}  Figma: Set FIGMA_PERSONAL_ACCESS_TOKEN or add to 1Password${NC}"
        fi
        ;;

      linear)
        if [[ -z "$LINEAR_API_KEY" ]]; then
          if $has_1password; then
            export LINEAR_API_KEY=$(op read "op://Private/Linear API Key/credential" 2>/dev/null)
          fi
        fi
        if [[ -n "$LINEAR_API_KEY" ]]; then
          echo "${GREEN}  Linear MCP configured${NC}"
        else
          echo "${RED}  Linear: Set LINEAR_API_KEY or add to 1Password${NC}"
        fi
        ;;

      supabase)
        if [[ -z "$SUPABASE_ACCESS_TOKEN" ]]; then
          if $has_1password; then
            export SUPABASE_ACCESS_TOKEN=$(op read "op://Private/Supabase Access Token/credential" 2>/dev/null)
          fi
        fi
        if [[ -n "$SUPABASE_ACCESS_TOKEN" ]]; then
          echo "${GREEN}  Supabase MCP configured${NC}"
        else
          echo "${RED}  Supabase: Set SUPABASE_ACCESS_TOKEN or add to 1Password${NC}"
        fi
        ;;

      browser-tools)
        # Browser-tools MCP doesn't require credentials, just needs to be enabled
        echo "${GREEN}  Browser-tools MCP enabled${NC}"
        ;;

      context7|Context7)
        # Context7 MCP doesn't require credentials
        echo "${GREEN}  Context7 MCP enabled${NC}"
        ;;

      tempmail)
        # Tempmail MCP - check for API key
        if [[ -z "$TEMPMAIL_API_KEY" ]]; then
          if $has_1password; then
            export TEMPMAIL_API_KEY=$(op read "op://development/tempmail/credential" 2>/dev/null)
          fi
        fi
        if [[ -n "$TEMPMAIL_API_KEY" ]]; then
          echo "${GREEN}  Tempmail MCP configured${NC}"
        else
          echo "${RED}  Tempmail: Set TEMPMAIL_API_KEY or add to 1Password${NC}"
        fi
        ;;

      figma-local|figma-remote)
        # Figma MCPs use HTTP transport, no credentials needed here
        echo "${GREEN}  ${mcp} MCP enabled${NC}"
        ;;

      *)
        echo "${YELLOW}  Unknown MCP: $mcp (no setup configured)${NC}"
        ;;
    esac
  done

  echo ""
}

# List of available MCPs for multi-select (fallback if registry not available)
RALPH_AVAILABLE_MCPS=("figma" "linear" "supabase" "browser-tools" "context7")

# Get available MCPs from registry mcpDefinitions
function _ralph_get_available_mcps() {
  if [[ -f "$RALPH_REGISTRY_FILE" ]]; then
    local mcps=($(jq -r '.mcpDefinitions | keys[]' "$RALPH_REGISTRY_FILE" 2>/dev/null))
    if [[ ${#mcps[@]} -gt 0 ]]; then
      echo "${mcps[@]}"
      return 0
    fi
  fi
  # Fallback to hardcoded list
  echo "${RALPH_AVAILABLE_MCPS[@]}"
}
