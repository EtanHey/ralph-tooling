/**
 * Ntfy Notification Tests
 * Tests for bun/core/ntfy.ts sendNotification function
 */

import { describe, it, expect } from "bun:test";
import { buildCurlArgs, sendNotification, type NotificationOptions } from "../core/ntfy";

describe("sendNotification", () => {
  describe("buildCurlArgs", () => {
    it("should build correct curl args with basic options", () => {
      const options: NotificationOptions = {
        topic: "test-topic",
        title: "Test Title",
        body: "Test message"
      };

      const args = buildCurlArgs(options);

      expect(args).toEqual([
        "curl",
        "-s",
        "-H", "Title: Test Title",
        "-H", "Priority: default",
        "-H", "Markdown: true",
        "-d", "Test message",
        "https://ntfy.sh/test-topic"
      ]);
    });

    it("should include priority when specified", () => {
      const options: NotificationOptions = {
        topic: "test-topic",
        title: "Urgent",
        body: "Critical error",
        priority: "urgent"
      };

      const args = buildCurlArgs(options);

      expect(args).toContain("-H");
      expect(args).toContain("Priority: urgent");
    });

    it("should include tags when specified", () => {
      const options: NotificationOptions = {
        topic: "test-topic",
        title: "Tagged",
        body: "Message with tags",
        tags: ["warning", "red_circle"]
      };

      const args = buildCurlArgs(options);

      expect(args).toContain("-H");
      expect(args).toContain("Tags: warning,red_circle");
    });

    it("should handle empty tags array", () => {
      const options: NotificationOptions = {
        topic: "test-topic",
        title: "No Tags",
        body: "Message without tags",
        tags: []
      };

      const args = buildCurlArgs(options);

      // Should not include Tags header for empty array
      expect(args.join(" ")).not.toContain("Tags:");
    });

    it("should build correct URL with topic", () => {
      const options: NotificationOptions = {
        topic: "my-custom-topic",
        title: "Test",
        body: "Test"
      };

      const args = buildCurlArgs(options);

      expect(args).toContain("https://ntfy.sh/my-custom-topic");
    });

    it("should handle multiline body", () => {
      const options: NotificationOptions = {
        topic: "test-topic",
        title: "Multiline",
        body: "Line 1\nLine 2\nLine 3"
      };

      const args = buildCurlArgs(options);

      expect(args).toContain("Line 1\nLine 2\nLine 3");
    });
  });

  describe("sendNotification", () => {
    it("should return false for empty topic", async () => {
      const options: NotificationOptions = {
        topic: "",
        title: "Test",
        body: "Test message"
      };

      const result = await sendNotification(options);
      expect(result).toBe(false);
    });

    // Note: We can't easily test the actual curl execution in unit tests
    // without mocking Bun.spawn, but we can test the argument building
    it("should build valid curl command structure", () => {
      const options: NotificationOptions = {
        topic: "etanheys-ralph-claude-golem-notify",
        title: "[Ralph] Complete",
        body: "claude-golem\n5 BUG-002 kiro\n6 stories 12 criteria $1.50",
        priority: "high",
        tags: ["white_check_mark", "robot"]
      };

      const args = buildCurlArgs(options);

      // Verify structure matches expected curl command
      expect(args[0]).toBe("curl");
      expect(args[1]).toBe("-s");
      expect(args).toContain("-H");
      expect(args).toContain("Title: [Ralph] Complete");
      expect(args).toContain("Priority: high");
      expect(args).toContain("Tags: white_check_mark,robot");
      expect(args).toContain("Markdown: true");
      expect(args).toContain("-d");
      expect(args).toContain("claude-golem\n5 BUG-002 kiro\n6 stories 12 criteria $1.50");
      expect(args).toContain("https://ntfy.sh/etanheys-ralph-claude-golem-notify");
    });
  });
});
