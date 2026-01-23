# Setup Tokens Workflow

Configure API tokens in 1Password for use with ralphtools.

---

## Prerequisites

- 1Password CLI installed and signed in (`op account list` shows accounts)
- API tokens obtained from respective services

---

## Required Tokens

| Token | Service | Where to get |
|-------|---------|--------------|
| GitHub PAT | GitHub CLI | github.com/settings/tokens |
| Linear API Key | Linear skill | linear.app/settings/api |
| Anthropic API Key | Claude | console.anthropic.com |

---

## Store Tokens in 1Password

### Method 1: Interactive (Recommended)

Use the 1Password skill:
```
/1password add-secret
```

Or manually for each token:

### GitHub Token

1. Get token from: https://github.com/settings/tokens
2. Create a "Fine-grained token" with repo access
3. Store in 1Password:

```bash
op item create \
  --category "API Credential" \
  --title "github-token" \
  --vault "Private" \
  "credential=ghp_your_token_here"
```

Verify:
```bash
op read "op://Private/github-token/credential"
```

### Linear API Key

1. Get token from: https://linear.app/settings/api
2. Create a "Personal API key"
3. Store in 1Password:

```bash
op item create \
  --category "API Credential" \
  --title "linear" \
  --vault "Private" \
  "api-key=lin_api_your_key_here"
```

Verify:
```bash
op read "op://Private/linear/api-key"
```

### Anthropic API Key

1. Get token from: https://console.anthropic.com
2. Create an API key
3. Store in 1Password:

```bash
op item create \
  --category "API Credential" \
  --title "anthropic" \
  --vault "Private" \
  "api-key=sk-ant-your_key_here"
```

Verify:
```bash
op read "op://Private/anthropic/api-key"
```

---

## Verify All Tokens

Run this to check all tokens are accessible:

```bash
#!/bin/bash
echo "Checking API tokens in 1Password..."
echo ""

# GitHub
if op read "op://Private/github-token/credential" &>/dev/null; then
  echo "[OK] GitHub token"
else
  echo "[MISSING] GitHub token"
fi

# Linear
if op read "op://Private/linear/api-key" &>/dev/null; then
  echo "[OK] Linear API key"
else
  echo "[MISSING] Linear API key"
fi

# Anthropic
if op read "op://Private/anthropic/api-key" &>/dev/null; then
  echo "[OK] Anthropic API key"
else
  echo "[MISSING] Anthropic API key"
fi
```

---

## Create Config Directory

Ensure the ralphtools config directory exists:

```bash
mkdir -p ~/.config/ralphtools
chmod 700 ~/.config/ralphtools
```

---

## Troubleshooting

### "vault not found"

Check vault name:
```bash
op vault list
```

Use correct vault name (case-sensitive).

### "not signed in"

Sign in to 1Password:
```bash
op signin
```

### Token format errors

- GitHub: Starts with `ghp_` or `github_pat_`
- Linear: Starts with `lin_api_`
- Anthropic: Starts with `sk-ant-`

---

## Next Steps

After storing all tokens:
1. Proceed to [setup-symlinks](setup-symlinks.md) to enable skills
2. Then [validate](validate.md) to test everything
