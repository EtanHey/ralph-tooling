# Skill: Brave Browser Management (Ultra-Minimal v2.0)

You have access to a custom browser management tool.
**Global Command:** `brave-manager <command> [args]`

### Core Commands
- **tabs**: List URLs of all open tabs.
- **switch <index>**: Focus a specific tab.
- **navigate <url>**: Go directly to a page.
- **inspect**: (LOW TOKEN) Get a numbered list of all interactive elements.
- **click <id>**: Click element by its ID from `inspect` (e.g., `click 5`).
- **type <id> <text>**: Type into element by its ID (e.g., `type 2 "email@test.com"`).
- **errors**: (LOW TOKEN) Show only the last 5 network/console errors.
- **eval "<code>"**: (POWERFUL) Run JS to check `localStorage` or state.
- **screenshot**: Save visual state to `screenshot.png`.

### Efficient Workflow
1. **inspect**: Always run `inspect` first to see the available "Menu" of elements.
2. **Act by ID**: Use the numeric ID for `click` or `type`. This is much safer than CSS selectors.
3. **Verify**: Use `errors` to check if things broke, or `eval` to check `localStorage`.