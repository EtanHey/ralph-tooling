/**
 * Error Detection and Retry Logic
 * Part of MP-006: Move iteration loop from zsh to TypeScript
 */

import type { ErrorType } from "./types";
import {
  MAX_RETRIES,
  NO_MSG_MAX_RETRIES,
  GENERAL_COOLDOWN_MS,
  NO_MSG_COOLDOWN_MS,
} from "./types";

// AIDEV-NOTE: These patterns must match the error detection in tests/claude.test.ts
// and the existing zsh behavior for backwards compatibility

export const ERROR_PATTERNS: Record<ErrorType, RegExp> = {
  no_messages: /No messages returned/i,
  connection_reset: /ECONNRESET|EAGAIN|fetch failed/i,
  timeout: /ETIMEDOUT|socket hang up/i,
  rate_limit: /rate limit|overloaded/i,
  server_error: /Error: 5[0-9][0-9]|HTTP.*5[0-9][0-9]/i,
  unknown: /Error/i,
};

export function detectError(output: string): ErrorType | null {
  // Check specific patterns first (in order of specificity)
  for (const type of [
    "no_messages",
    "connection_reset",
    "timeout",
    "rate_limit",
    "server_error",
  ] as ErrorType[]) {
    if (ERROR_PATTERNS[type].test(output)) {
      return type;
    }
  }

  // Generic error detection
  if (/Error/i.test(output)) {
    return "unknown";
  }

  return null;
}

export function shouldRetry(errorType: ErrorType, retryCount: number): boolean {
  if (errorType === "no_messages") {
    return retryCount < NO_MSG_MAX_RETRIES;
  }
  return retryCount < MAX_RETRIES;
}

export function getCooldownMs(errorType: ErrorType): number {
  if (errorType === "no_messages") {
    return NO_MSG_COOLDOWN_MS;
  }
  return GENERAL_COOLDOWN_MS;
}

export function getMaxRetries(errorType: ErrorType): number {
  if (errorType === "no_messages") {
    return NO_MSG_MAX_RETRIES;
  }
  return MAX_RETRIES;
}

// Completion signal detection
const COMPLETION_PATTERNS = [
  /COMPLETE/i,
  /all\s+criteria\s+(are\s+)?checked/i,
  /story\s+(is\s+)?complete/i,
  /passes.*true/i,
];

export function hasCompletionSignal(output: string): boolean {
  return COMPLETION_PATTERNS.some((pattern) => pattern.test(output));
}

// Blocked signal detection
const BLOCKED_PATTERNS = [
  /BLOCKED/i,
  /cannot\s+proceed/i,
  /blocked\s+by/i,
  /manual\s+intervention/i,
];

export function hasBlockedSignal(output: string): boolean {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(output));
}

// Promise tag detection (output from Claude)
export function hasCompletePromise(output: string): boolean {
  return /<promise>COMPLETE<\/promise>/i.test(output);
}

export function hasAllBlockedPromise(output: string): boolean {
  return /<promise>ALL_BLOCKED<\/promise>/i.test(output);
}

// Human-readable error descriptions
export function getErrorDescription(errorType: ErrorType): string {
  switch (errorType) {
    case "no_messages":
      return "No messages returned from API";
    case "connection_reset":
      return "Connection was reset";
    case "timeout":
      return "Request timed out";
    case "rate_limit":
      return "Rate limit exceeded";
    case "server_error":
      return "Server error (5xx)";
    case "unknown":
      return "Unknown error";
  }
}
