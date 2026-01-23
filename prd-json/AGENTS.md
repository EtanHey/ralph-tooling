# AI Agent Instructions for ralphtools PRD

## Project Context

This PRD implements ralphtools v1.4+ features:
- **Phase 1**: Interactive setup CLI with `gum`
- **Phase 3**: Enhanced version tracking
- **Phase 5**: Parallel verification for V-* stories
- **Phase 6**: Project launchers (runX, openX, XClaude)
- **Phase 7**: 1Password integration

## Key Files

- `ralph.zsh` - Main source file, all functions go here
- `~/.config/ralphtools/config.json` - User config
- `~/.config/ralphtools/projects.json` - Project registry
- `~/.config/ralphtools/launchers.zsh` - Generated launcher functions

## Conventions

- All functions use `_ralph_` prefix for internal, `ralph-` for user-facing
- Use `local` for all variables inside functions
- Check `zsh -n ralph.zsh` after every change (typecheck)
- Colors: CYAN for headers, GREEN for success, YELLOW for warnings, RED for errors

## ⚠️ NEVER EDIT index.json DIRECTLY

To add/modify stories, use `update.json`:

1. Create story files in `stories/`
2. Write changes to `update.json` (not index.json!)
3. Ralph merges automatically on next run

## Testing (CRITICAL)

**Test file:** `tests/test-ralph.zsh`

### Rules
- **New code = new tests.** Every new function needs test coverage.
- **Updated code = updated tests.** If you change a function, update its tests.
- **Run tests before completing any story:** `zsh tests/test-ralph.zsh`

### Verification Checklist
1. `zsh -n ralph.zsh` passes (syntax check)
2. `zsh -n tests/test-ralph.zsh` passes (test syntax)
3. `zsh tests/test-ralph.zsh` passes (all tests green)
4. `source ralph.zsh` works without errors
5. New commands/functions are callable

### Adding Tests
```zsh
test_my_new_function() {
  test_start "my_new_function works"

  # Arrange
  local input="test"

  # Act
  local result=$(_ralph_my_function "$input")

  # Assert
  assert_equals "$result" "expected" "should return expected"
}
```
