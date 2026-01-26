# Claude Golem (Ralph) - Project Context for Gemini

This is **Ralph** - an autonomous AI coding loop that runs Claude Code to execute PRD stories.

## Core Concept

Ralph spawns fresh Claude instances in a loop, each implementing one story from a JSON-based PRD. Fresh context each iteration = consistent behavior.

```
while stories remain:
  spawn fresh Claude → read prd-json/ → implement one story → CodeRabbit review → commit → loop
done
```

## Key Features

- **Self-improving toolkit** - Bugs found → PRD stories → Ralph fixes → all users benefit
- **Skills library** - `/golem-powers:*` provides workflows for commits, PRs, 1Password, Linear, Convex
- **Modular context system** - Shared CLAUDE.md rules that auto-detect project tech stacks
- **Smart model routing** - AUDIT→Opus, US→Sonnet, V→Haiku based on story type
- **CodeRabbit integration** - Free AI code review before every commit
- **React Ink UI** - Modern terminal dashboard with live progress

## Technical Stack

- **Core**: Zsh scripts (`ralph.zsh`, modular `lib/*.zsh`)
- **UI**: Bun + React Ink (TypeScript)
- **Skills**: SKILL.md + scripts/ pattern in `skills/golem-powers/`
- **Contexts**: Shared markdown files in `contexts/`
- **PRD Format**: JSON with `prd-json/index.json` + `stories/*.json`

## Directory Structure

```
claude-golem/
├── ralph.zsh              # Main entry point
├── lib/                   # Modular zsh library
├── bun/                   # TypeScript core (story management)
├── ralph-ui/              # React Ink dashboard
├── contexts/              # Shared CLAUDE.md contexts
├── skills/golem-powers/   # Skills for Claude
├── prompts/               # Story-type prompts (US.md, BUG.md, etc.)
├── tests/                 # Test suite (156+ ZSH + 83 Bun tests)
└── docs/                  # Documentation
```

## Import Context Files

@./contexts/README.md
@./contexts/base.md
@./contexts/golem-system.md
@./lib/README.md
@./docs/prd-format.md
@./docs/skills.md

## What Makes Ralph Different

1. **Fresh Context Each Iteration** - No accumulated confusion from long sessions
2. **JSON is Memory** - PRD files ARE the state, checked criteria ARE progress
3. **Self-Improvement Loop** - Find gap → create story → Ralph executes → all projects benefit
4. **CodeRabbit→BUG Pattern** - Unfixable review issues become tracked BUG stories
5. **Human Sets Direction, Ralph Executes** - PRD planning is human, execution is autonomous

## Target Audience

- Developers using Claude Code who want autonomous execution
- Teams wanting consistent, repeatable AI coding workflows
- Projects needing self-documenting progress via PRD stories
