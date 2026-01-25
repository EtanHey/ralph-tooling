/**
 * Ntfy Notification Sending
 * Sends notifications to ntfy.sh for iteration events
 */

export interface NtfyOptions {
  topic: string;
  title: string;
  message: string;
  priority?: "min" | "low" | "default" | "high" | "urgent";
  tags?: string[];
}

/**
 * Send a notification to ntfy.sh
 */
export async function sendNtfy(options: NtfyOptions): Promise<boolean> {
  if (!options.topic) {
    return false;
  }

  try {
    const headers: Record<string, string> = {
      Title: options.title,
      Priority: options.priority || "default",
    };

    if (options.tags && options.tags.length > 0) {
      headers.Tags = options.tags.join(",");
    }

    const response = await fetch(`https://ntfy.sh/${options.topic}`, {
      method: "POST",
      headers,
      body: options.message,
    });

    return response.ok;
  } catch {
    // Silently fail - notifications are non-critical
    return false;
  }
}

/**
 * Send iteration complete notification
 */
export async function notifyIterationComplete(
  topic: string,
  iteration: number,
  storyId: string
): Promise<void> {
  await sendNtfy({
    topic,
    title: `Iteration ${iteration} Complete`,
    message: `Story: ${storyId}`,
    priority: "low",
    tags: ["repeat"],
  });
}

/**
 * Send story complete notification
 */
export async function notifyStoryComplete(
  topic: string,
  storyId: string
): Promise<void> {
  await sendNtfy({
    topic,
    title: `Story Complete: ${storyId}`,
    message: `${storyId} has been completed`,
    priority: "default",
    tags: ["white_check_mark"],
  });
}

/**
 * Send PRD complete notification
 */
export async function notifyPRDComplete(topic: string): Promise<void> {
  await sendNtfy({
    topic,
    title: "PRD Complete!",
    message: "All stories have been completed",
    priority: "high",
    tags: ["tada"],
  });
}

/**
 * Send error notification
 */
export async function notifyError(
  topic: string,
  error: string,
  storyId?: string
): Promise<void> {
  await sendNtfy({
    topic,
    title: storyId ? `Error on ${storyId}` : "Ralph Error",
    message: error,
    priority: "urgent",
    tags: ["warning"],
  });
}

/**
 * Send retry notification
 */
export async function notifyRetry(
  topic: string,
  retryCount: number,
  cooldownSecs: number
): Promise<void> {
  await sendNtfy({
    topic,
    title: `Retry ${retryCount}`,
    message: `Waiting ${cooldownSecs}s before retry`,
    priority: "low",
    tags: ["hourglass"],
  });
}
