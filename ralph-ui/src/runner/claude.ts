/**
 * Claude Spawning - Spawn Claude CLI via child_process
 * Part of MP-006: Move iteration loop from zsh to TypeScript
 */

import { spawn as bunSpawn } from "bun";
import type { SpawnOptions, SpawnResult, Model } from "./types";
import { DEFAULT_TIMEOUT_MS } from "./types";
import { detectError, hasCompletionSignal, hasBlockedSignal } from "./errors";

// AIDEV-NOTE: This module spawns the Claude CLI as a subprocess
// It must handle TTY inheritance properly for interactive features
// The tests in tests/claude.test.ts verify the argument building and result parsing

export function buildCliArgs(options: SpawnOptions): string[] {
  const args: string[] = [];

  // Core options (--print for pipe-friendly output, --dangerously-skip-permissions for autonomy)
  args.push("--print", "--dangerously-skip-permissions");

  // Model
  args.push("--model", options.model);

  // Context content (system prompt append) - passed as content, not file path
  if (options.contextFile) {
    args.push("--append-system-prompt", options.contextFile);
  }

  // Max turns
  if (options.maxTurns) {
    args.push("--max-turns", options.maxTurns.toString());
  }

  // Prompt (required) - use -p flag
  args.push("-p", options.prompt);

  return args;
}

export async function spawnClaude(options: SpawnOptions): Promise<SpawnResult> {
  const startTime = Date.now();
  const args = buildCliArgs(options);

  // Find the Claude CLI - use which to locate it
  let cli = "claude";
  try {
    const whichProc = bunSpawn(["which", "claude"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const whichOutput = await new Response(whichProc.stdout).text();
    if (whichOutput.trim()) {
      cli = whichOutput.trim();
    }
  } catch {
    // Use default "claude" if which fails
  }

  try {
    const proc = bunSpawn([cli, ...args], {
      cwd: options.workingDir,
      stdin: "inherit", // Pass through stdin for TTY
      stdout: "pipe", // Capture for parsing
      stderr: "pipe", // Capture for error detection
      env: {
        ...process.env,
        ANTHROPIC_NO_TERMINAL: "1", // Hint for non-terminal mode
      },
    });

    // Set up timeout
    const timeout = options.timeout || DEFAULT_TIMEOUT_MS;
    let timedOut = false;

    const timeoutId = setTimeout(() => {
      timedOut = true;
      proc.kill();
    }, timeout);

    // Wait for process to complete
    const exitCode = await proc.exited;
    clearTimeout(timeoutId);

    // Collect output
    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();

    const durationMs = Date.now() - startTime;

    if (timedOut) {
      return {
        success: false,
        exitCode: -1,
        stdout,
        stderr: "Process timed out",
        durationMs,
      };
    }

    // Extract session ID if present
    let sessionId: string | undefined;
    const sessionMatch = stdout.match(/"session_id":\s*"([^"]+)"/);
    if (sessionMatch) {
      sessionId = sessionMatch[1];
    }

    return {
      success: exitCode === 0,
      exitCode,
      stdout,
      stderr,
      durationMs,
      sessionId,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    return {
      success: false,
      exitCode: -1,
      stdout: "",
      stderr: error instanceof Error ? error.message : String(error),
      durationMs,
    };
  }
}

// Parse JSONL output from Claude CLI
export interface ClaudeMessage {
  type: string;
  subtype?: string;
  content?: string | Array<{ type: string; text?: string }>;
}

export function parseJsonlOutput(output: string): ClaudeMessage[] {
  const messages: ClaudeMessage[] = [];
  const lines = output.split("\n").filter((line) => line.trim());

  for (const line of lines) {
    try {
      const data = JSON.parse(line);
      messages.push(data);
    } catch {
      // Skip malformed lines
    }
  }

  return messages;
}

export function extractAssistantText(output: string): string {
  const messages = parseJsonlOutput(output);
  const textParts: string[] = [];

  for (const message of messages) {
    if (message.type === "assistant" && message.content) {
      if (Array.isArray(message.content)) {
        for (const part of message.content) {
          if (part.type === "text" && part.text) {
            textParts.push(part.text);
          }
        }
      } else if (typeof message.content === "string") {
        textParts.push(message.content);
      }
    }
  }

  return textParts.join("\n");
}

// Analyze spawn result for iteration outcome
export interface IterationOutcome {
  success: boolean;
  hasComplete: boolean;
  hasAllBlocked: boolean;
  errorType: ReturnType<typeof detectError>;
  assistantText: string;
}

export function analyzeResult(result: SpawnResult): IterationOutcome {
  const combinedOutput = result.stdout + result.stderr;
  const assistantText = extractAssistantText(result.stdout);

  const errorType = result.success ? null : detectError(combinedOutput);
  const hasComplete = hasCompletionSignal(combinedOutput);
  const hasAllBlocked = hasBlockedSignal(combinedOutput);

  return {
    success: result.success,
    hasComplete,
    hasAllBlocked,
    errorType,
    assistantText,
  };
}

// Model name mapping for Claude CLI
const MODEL_NAMES: Record<Model, string> = {
  haiku: "haiku",
  sonnet: "sonnet",
  opus: "opus",
};

export function getModelName(model: Model): string {
  return MODEL_NAMES[model] || "sonnet";
}
