/**
 * Context Building - Build context and prompts for Ralph iterations
 * Part of MP-006: Move iteration loop from zsh to TypeScript
 */

import { existsSync, readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import type { Story, Model } from "./types";

// AIDEV-NOTE: This module replicates the context building logic from ralph.zsh
// It loads modular context files and builds story-type-specific prompts
// The key files are:
// - contexts/base.md - Core Ralph rules
// - contexts/workflow/ralph.md - Ralph-specific instructions
// - contexts/tech/*.md - Technology-specific contexts
// - prompts/base.md - Base prompt for all stories
// - prompts/{US,BUG,V,TEST,AUDIT,MP}.md - Story-type-specific prompts

export interface ContextConfig {
  contextsDir: string; // Path to contexts directory
  promptsDir: string; // Path to prompts directory
  workingDir: string; // Working directory for tech stack detection
  additionalContexts?: string[]; // Additional context files to load
}

/**
 * Get default paths for contexts and prompts
 */
export function getDefaultPaths(): { contextsDir: string; promptsDir: string } {
  const home = process.env.HOME || "";

  // Check ~/.claude/contexts first (primary), then ~/.config/ralphtools/contexts (fallback)
  let contextsDir = join(home, ".claude", "contexts");
  if (!existsSync(contextsDir)) {
    contextsDir = join(home, ".config", "ralphtools", "contexts");
  }

  // Prompts are in ~/.config/ralphtools/prompts
  const promptsDir = join(home, ".config", "ralphtools", "prompts");

  return { contextsDir, promptsDir };
}

/**
 * Detect tech stack from package.json and other config files
 * Returns array of tech names that have corresponding context files
 */
export function detectTechStack(workingDir: string): string[] {
  const techs: string[] = [];

  // Check package.json for dependencies
  const pkgPath = join(workingDir, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };

      // Map dependencies to tech names
      const depMap: Record<string, string> = {
        react: "react",
        next: "nextjs",
        "@remix-run/react": "remix",
        svelte: "svelte",
        vue: "vue",
        angular: "angular",
        convex: "convex",
        supabase: "supabase",
        prisma: "prisma",
        drizzle: "drizzle",
        "@tanstack/react-query": "react-query",
        tailwindcss: "tailwind",
        "styled-components": "styled-components",
        typescript: "typescript",
        bun: "bun",
        vitest: "vitest",
        jest: "jest",
        playwright: "playwright",
      };

      for (const [dep, tech] of Object.entries(depMap)) {
        if (allDeps[dep]) {
          techs.push(tech);
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  // Check for specific config files
  const configMap: Record<string, string> = {
    "convex.json": "convex",
    "convex/schema.ts": "convex",
    "supabase/config.toml": "supabase",
    "prisma/schema.prisma": "prisma",
    "tailwind.config.js": "tailwind",
    "tailwind.config.ts": "tailwind",
    "next.config.js": "nextjs",
    "next.config.ts": "nextjs",
    "remix.config.js": "remix",
    "playwright.config.ts": "playwright",
  };

  for (const [file, tech] of Object.entries(configMap)) {
    if (existsSync(join(workingDir, file)) && !techs.includes(tech)) {
      techs.push(tech);
    }
  }

  return techs;
}

/**
 * Build the system context from modular context files
 * This is passed to Claude via --append-system-prompt
 */
export function buildSystemContext(config: ContextConfig): string {
  const parts: string[] = [];

  // 1. Load base.md (core Ralph rules)
  const basePath = join(config.contextsDir, "base.md");
  if (existsSync(basePath)) {
    parts.push(readFileSync(basePath, "utf-8"));
  }

  // 2. Load workflow/ralph.md (Ralph-specific instructions)
  const workflowPath = join(config.contextsDir, "workflow", "ralph.md");
  if (existsSync(workflowPath)) {
    parts.push(readFileSync(workflowPath, "utf-8"));
  }

  // 3. Load tech-specific contexts based on detected stack
  const techStack = detectTechStack(config.workingDir);
  for (const tech of techStack) {
    const techPath = join(config.contextsDir, "tech", `${tech}.md`);
    if (existsSync(techPath)) {
      parts.push(readFileSync(techPath, "utf-8"));
    }
  }

  // 4. Load additional contexts if specified
  if (config.additionalContexts) {
    for (const ctx of config.additionalContexts) {
      const ctxPath = join(config.contextsDir, ctx);
      if (existsSync(ctxPath)) {
        parts.push(readFileSync(ctxPath, "utf-8"));
      }
    }
  }

  // Join with markdown separators
  return parts.join("\n---\n");
}

/**
 * Get story type from story ID prefix
 */
export function getStoryType(storyId: string): string {
  const prefix = storyId.split("-")[0];
  const validTypes = ["US", "BUG", "V", "AUDIT", "TEST", "MP"];
  return validTypes.includes(prefix) ? prefix : "";
}

/**
 * Build the iteration prompt for a specific story
 * This is the main prompt passed to Claude with -p flag
 */
export function buildStoryPrompt(
  storyId: string,
  model: Model,
  prdJsonDir: string,
  workingDir: string,
  promptsDir: string
): string {
  let prompt = "";

  // 1. Load base prompt
  const basePath = join(promptsDir, "base.md");
  if (existsSync(basePath)) {
    prompt = readFileSync(basePath, "utf-8");
  } else {
    // Fallback minimal prompt
    prompt =
      "You are Ralph, an autonomous coding agent. Do exactly ONE task per iteration.";
  }

  // 2. Load story-type-specific prompt
  const storyType = getStoryType(storyId);
  if (storyType) {
    const typePath = join(promptsDir, `${storyType}.md`);
    if (existsSync(typePath)) {
      prompt += "\n\n---\n\n";
      prompt += readFileSync(typePath, "utf-8");
    }
  }

  // 3. Template variable substitution
  const isoTimestamp = new Date().toISOString();
  prompt = prompt.replace(/\{\{MODEL\}\}/g, model);
  prompt = prompt.replace(/\{\{PRD_JSON_DIR\}\}/g, prdJsonDir);
  prompt = prompt.replace(/\{\{WORKING_DIR\}\}/g, workingDir);
  prompt = prompt.replace(/\{\{ISO_TIMESTAMP\}\}/g, isoTimestamp);

  return prompt;
}

/**
 * Build both system context and story prompt for an iteration
 */
export interface IterationContext {
  systemContext: string;
  storyPrompt: string;
}

export function buildIterationContext(
  storyId: string,
  model: Model,
  prdJsonDir: string,
  workingDir: string
): IterationContext {
  const { contextsDir, promptsDir } = getDefaultPaths();

  const systemContext = buildSystemContext({
    contextsDir,
    promptsDir,
    workingDir,
  });

  const storyPrompt = buildStoryPrompt(
    storyId,
    model,
    prdJsonDir,
    workingDir,
    promptsDir
  );

  return { systemContext, storyPrompt };
}
