# Security Review Workflow

Security-focused code review.

## When to Use

- Before deploying to production
- After adding auth/payment/sensitive features
- Security audit stories

## Steps

### Step 1: Run security-focused review

```bash
cr review --plain --config ~/.claude/commands/coderabbit/configs/security.yaml
```

Or without config:
```bash
cr review --plain
```

Then grep for security issues:
```bash
cr review --prompt-only | grep -i "security\|injection\|xss\|csrf\|auth\|password\|token\|secret"
```

### Step 2: Security checklist

Check CodeRabbit output for:

| Category | Look For |
|----------|----------|
| Injection | SQL, NoSQL, command injection |
| XSS | Unsanitized user input in HTML |
| Auth | Weak auth, missing checks |
| Secrets | Hardcoded keys, tokens |
| Data | PII exposure, logging sensitive data |
| CSRF | Missing tokens on mutations |

### Step 3: Severity triage

- **CRITICAL** - Exploitable vulnerability → Block merge
- **HIGH** - Security weakness → Must fix
- **MEDIUM** - Best practice violation → Should fix
- **LOW** - Informational → Nice to fix

## Common Security Issues

```
[CRITICAL] Hardcoded API key in source
[HIGH] SQL query built with string concatenation
[HIGH] User input rendered without sanitization
[MEDIUM] Missing rate limiting on auth endpoint
[LOW] Debug logging includes user email
```
