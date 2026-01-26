/**
 * Ntfy Notification Functions
 * TypeScript implementation matching the zsh _ralph_ntfy function
 */

export interface NotificationOptions {
  topic: string;
  title: string;
  body: string;
  priority?: "min" | "low" | "default" | "high" | "urgent";
  tags?: string[];
}

/**
 * Build curl arguments for ntfy notification
 * Returns array of arguments that can be passed to curl
 */
export function buildCurlArgs(options: NotificationOptions): string[] {
  const args: string[] = [
    "curl",
    "-s",
    "-H", `Title: ${options.title}`,
    "-H", `Priority: ${options.priority || "default"}`,
    "-H", "Markdown: true"
  ];

  if (options.tags && options.tags.length > 0) {
    args.push("-H", `Tags: ${options.tags.join(",")}`);
  }

  args.push("-d", options.body);
  args.push(`https://ntfy.sh/${options.topic}`);

  return args;
}

/**
 * Send notification using curl (for compatibility with zsh version)
 */
export async function sendNotification(options: NotificationOptions): Promise<boolean> {
  if (!options.topic) {
    console.error(`[NTFY] Error: Missing topic for notification "${options.title}"`);
    return false;
  }

  console.log(`[NTFY] Sending to ${options.topic}: ${options.title}`);

  try {
    const args = buildCurlArgs(options);
    
    // Use Bun's spawn for curl execution
    const proc = Bun.spawn(args, {
      stdout: "ignore",
      stderr: "ignore"
    });

    const exitCode = await proc.exited;
    return exitCode === 0;
  } catch {
    return false;
  }
}
