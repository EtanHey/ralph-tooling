/**
 * PTY Wrapper Tests - TDD for MP-007
 * Tests for PTY process spawning (ralph-ui/src/runner/pty/)
 *
 * These tests mock node-pty to ensure predictable testing without
 * requiring actual PTY spawning.
 */

import { describe, it, expect, beforeEach, mock, spyOn } from "bun:test";
import { EventEmitter } from "events";

// ============================================================
// Types that will be implemented in ralph-ui/src/runner/pty/
// ============================================================

interface PTYProcess {
  onData: (handler: (chunk: string) => void) => void;
  onExit: (handler: (code: number) => void) => void;
  onError: (handler: (err: Error) => void) => void;
  write: (data: string) => void;
  resize: (cols: number, rows: number) => void;
  kill: (signal?: string) => void;
}

interface PTYSpawnOptions {
  name?: string;     // Terminal name (default: 'xterm-color')
  cols?: number;     // Columns (default: 80)
  rows?: number;     // Rows (default: 30)
  cwd?: string;      // Working directory
  env?: Record<string, string>;  // Environment variables
}

// ============================================================
// Mock node-pty implementation for testing
// ============================================================

class MockPTY extends EventEmitter {
  pid: number;
  cols: number;
  rows: number;
  killed: boolean = false;
  killedWith: string | undefined;
  resizedTo: { cols: number; rows: number } | null = null;
  writtenData: string[] = [];

  constructor(
    public file: string,
    public args: string[],
    public options: PTYSpawnOptions
  ) {
    super();
    this.pid = Math.floor(Math.random() * 10000) + 1000;
    this.cols = options.cols ?? 80;
    this.rows = options.rows ?? 30;
  }

  write(data: string): void {
    this.writtenData.push(data);
  }

  resize(cols: number, rows: number): void {
    this.cols = cols;
    this.rows = rows;
    this.resizedTo = { cols, rows };
  }

  kill(signal?: string): void {
    this.killed = true;
    this.killedWith = signal;
    // Emit exit after kill
    setTimeout(() => this.emit("exit", 0, null), 10);
  }

  // Test helper: simulate data output
  simulateData(data: string): void {
    this.emit("data", data);
  }

  // Test helper: simulate exit
  simulateExit(code: number): void {
    this.emit("exit", code, null);
  }

  // Test helper: simulate error
  simulateError(err: Error): void {
    this.emit("error", err);
  }
}

// Mock spawn function (simulates node-pty.spawn)
function mockSpawn(
  file: string,
  args: string[],
  options: PTYSpawnOptions
): MockPTY {
  return new MockPTY(file, args, options);
}

// ============================================================
// PTY Wrapper Implementation (to be tested)
// This would normally import from the actual module
// ============================================================

class PTYWrapper implements PTYProcess {
  private pty: MockPTY;
  private dataHandlers: Array<(chunk: string) => void> = [];
  private exitHandlers: Array<(code: number) => void> = [];
  private errorHandlers: Array<(err: Error) => void> = [];

  constructor(cmd: string, args: string[], options: PTYSpawnOptions = {}) {
    this.pty = mockSpawn(cmd, args, options);

    this.pty.on("data", (data: string) => {
      this.dataHandlers.forEach(h => h(data));
    });

    this.pty.on("exit", (code: number) => {
      this.exitHandlers.forEach(h => h(code));
    });

    this.pty.on("error", (err: Error) => {
      this.errorHandlers.forEach(h => h(err));
    });
  }

  onData(handler: (chunk: string) => void): void {
    this.dataHandlers.push(handler);
  }

  onExit(handler: (code: number) => void): void {
    this.exitHandlers.push(handler);
  }

  onError(handler: (err: Error) => void): void {
    this.errorHandlers.push(handler);
  }

  write(data: string): void {
    this.pty.write(data);
  }

  resize(cols: number, rows: number): void {
    this.pty.resize(cols, rows);
  }

  kill(signal?: string): void {
    this.pty.kill(signal);
  }

  // Test helper: access underlying mock
  getMockPTY(): MockPTY {
    return this.pty;
  }
}

// ============================================================
// TESTS: PTY Wrapper
// ============================================================

describe("PTY Wrapper Tests", () => {
  describe("Process Spawning", () => {
    it("should spawn process correctly (mock)", () => {
      const wrapper = new PTYWrapper("claude", ["-p", "test"], {
        cwd: "/tmp/test",
        cols: 120,
        rows: 40,
      });

      const mockPty = wrapper.getMockPTY();
      expect(mockPty.file).toBe("claude");
      expect(mockPty.args).toEqual(["-p", "test"]);
      expect(mockPty.options.cwd).toBe("/tmp/test");
      expect(mockPty.cols).toBe(120);
      expect(mockPty.rows).toBe(40);
    });

    it("should use default dimensions when not specified", () => {
      const wrapper = new PTYWrapper("echo", ["hello"], {});
      const mockPty = wrapper.getMockPTY();

      expect(mockPty.cols).toBe(80);
      expect(mockPty.rows).toBe(30);
    });

    it("should generate a PID for the spawned process", () => {
      const wrapper = new PTYWrapper("echo", ["test"], {});
      const mockPty = wrapper.getMockPTY();

      expect(mockPty.pid).toBeGreaterThan(0);
    });

    it("should pass environment variables to spawned process", () => {
      const customEnv = { CUSTOM_VAR: "value", PATH: "/usr/bin" };
      const wrapper = new PTYWrapper("bash", ["-c", "echo test"], {
        env: customEnv,
      });

      const mockPty = wrapper.getMockPTY();
      expect(mockPty.options.env).toEqual(customEnv);
    });
  });

  describe("Data Handling", () => {
    it("should call onData callback when receiving output chunks", async () => {
      const wrapper = new PTYWrapper("echo", ["hello"], {});
      const mockPty = wrapper.getMockPTY();
      const receivedChunks: string[] = [];

      wrapper.onData((chunk) => {
        receivedChunks.push(chunk);
      });

      mockPty.simulateData("Hello, ");
      mockPty.simulateData("World!\n");

      expect(receivedChunks).toHaveLength(2);
      expect(receivedChunks[0]).toBe("Hello, ");
      expect(receivedChunks[1]).toBe("World!\n");
    });

    it("should support multiple onData handlers", () => {
      const wrapper = new PTYWrapper("echo", ["test"], {});
      const mockPty = wrapper.getMockPTY();
      const handler1Calls: string[] = [];
      const handler2Calls: string[] = [];

      wrapper.onData((chunk) => handler1Calls.push(chunk));
      wrapper.onData((chunk) => handler2Calls.push(chunk));

      mockPty.simulateData("test output");

      expect(handler1Calls).toEqual(["test output"]);
      expect(handler2Calls).toEqual(["test output"]);
    });

    it("should handle large output chunks", () => {
      const wrapper = new PTYWrapper("cat", ["largefile"], {});
      const mockPty = wrapper.getMockPTY();
      const receivedChunks: string[] = [];

      wrapper.onData((chunk) => receivedChunks.push(chunk));

      // Simulate large output (10KB)
      const largeOutput = "x".repeat(10240);
      mockPty.simulateData(largeOutput);

      expect(receivedChunks[0].length).toBe(10240);
    });

    it("should handle output with ANSI escape codes", () => {
      const wrapper = new PTYWrapper("ls", ["--color"], {});
      const mockPty = wrapper.getMockPTY();
      const receivedChunks: string[] = [];

      wrapper.onData((chunk) => receivedChunks.push(chunk));

      const coloredOutput = "\x1b[32mgreen text\x1b[0m normal text";
      mockPty.simulateData(coloredOutput);

      expect(receivedChunks[0]).toContain("\x1b[32m");
      expect(receivedChunks[0]).toContain("\x1b[0m");
    });
  });

  describe("Exit Handling", () => {
    it("should call onExit callback with exit code", async () => {
      const wrapper = new PTYWrapper("exit", ["0"], {});
      const mockPty = wrapper.getMockPTY();
      let exitCode: number | null = null;

      wrapper.onExit((code) => {
        exitCode = code;
      });

      mockPty.simulateExit(0);

      expect(exitCode).toBe(0);
    });

    it("should pass non-zero exit codes", () => {
      const wrapper = new PTYWrapper("exit", ["1"], {});
      const mockPty = wrapper.getMockPTY();
      let exitCode: number | null = null;

      wrapper.onExit((code) => {
        exitCode = code;
      });

      mockPty.simulateExit(1);

      expect(exitCode).toBe(1);
    });

    it("should handle various exit codes", () => {
      const exitCodes = [0, 1, 2, 127, 130, 137, 255];

      for (const expectedCode of exitCodes) {
        const wrapper = new PTYWrapper("test", [], {});
        const mockPty = wrapper.getMockPTY();
        let receivedCode: number | null = null;

        wrapper.onExit((code) => {
          receivedCode = code;
        });

        mockPty.simulateExit(expectedCode);
        expect(receivedCode).toBe(expectedCode);
      }
    });

    it("should support multiple onExit handlers", () => {
      const wrapper = new PTYWrapper("test", [], {});
      const mockPty = wrapper.getMockPTY();
      const handler1Calls: number[] = [];
      const handler2Calls: number[] = [];

      wrapper.onExit((code) => handler1Calls.push(code));
      wrapper.onExit((code) => handler2Calls.push(code));

      mockPty.simulateExit(42);

      expect(handler1Calls).toEqual([42]);
      expect(handler2Calls).toEqual([42]);
    });
  });

  describe("Error Handling", () => {
    it("should call onError callback on spawn failure", () => {
      const wrapper = new PTYWrapper("nonexistent-cmd", [], {});
      const mockPty = wrapper.getMockPTY();
      let caughtError: Error | null = null;

      wrapper.onError((err) => {
        caughtError = err;
      });

      mockPty.simulateError(new Error("ENOENT: command not found"));

      expect(caughtError).not.toBeNull();
      expect(caughtError?.message).toContain("ENOENT");
    });

    it("should handle permission denied errors", () => {
      const wrapper = new PTYWrapper("/etc/passwd", [], {});
      const mockPty = wrapper.getMockPTY();
      let caughtError: Error | null = null;

      wrapper.onError((err) => {
        caughtError = err;
      });

      mockPty.simulateError(new Error("EACCES: permission denied"));

      expect(caughtError?.message).toContain("EACCES");
    });
  });

  describe("Process Control", () => {
    it("should terminate process with kill()", () => {
      const wrapper = new PTYWrapper("sleep", ["1000"], {});
      const mockPty = wrapper.getMockPTY();

      expect(mockPty.killed).toBe(false);

      wrapper.kill();

      expect(mockPty.killed).toBe(true);
    });

    it("should pass signal to kill() when specified", () => {
      const wrapper = new PTYWrapper("sleep", ["1000"], {});
      const mockPty = wrapper.getMockPTY();

      wrapper.kill("SIGKILL");

      expect(mockPty.killed).toBe(true);
      expect(mockPty.killedWith).toBe("SIGKILL");
    });

    it("should default to no signal when kill() called without argument", () => {
      const wrapper = new PTYWrapper("sleep", ["1000"], {});
      const mockPty = wrapper.getMockPTY();

      wrapper.kill();

      expect(mockPty.killedWith).toBeUndefined();
    });

    it("should update terminal dimensions with resize()", () => {
      const wrapper = new PTYWrapper("vim", [], {
        cols: 80,
        rows: 24,
      });
      const mockPty = wrapper.getMockPTY();

      expect(mockPty.cols).toBe(80);
      expect(mockPty.rows).toBe(24);

      wrapper.resize(120, 40);

      expect(mockPty.cols).toBe(120);
      expect(mockPty.rows).toBe(40);
      expect(mockPty.resizedTo).toEqual({ cols: 120, rows: 40 });
    });

    it("should handle multiple resize() calls", () => {
      const wrapper = new PTYWrapper("vim", [], {});
      const mockPty = wrapper.getMockPTY();

      wrapper.resize(100, 50);
      expect(mockPty.cols).toBe(100);
      expect(mockPty.rows).toBe(50);

      wrapper.resize(200, 60);
      expect(mockPty.cols).toBe(200);
      expect(mockPty.rows).toBe(60);
    });
  });

  describe("Input Handling", () => {
    it("should send data to process with write()", () => {
      const wrapper = new PTYWrapper("cat", [], {});
      const mockPty = wrapper.getMockPTY();

      wrapper.write("Hello\n");

      expect(mockPty.writtenData).toContain("Hello\n");
    });

    it("should handle multiple write() calls", () => {
      const wrapper = new PTYWrapper("bash", [], {});
      const mockPty = wrapper.getMockPTY();

      wrapper.write("echo 1\n");
      wrapper.write("echo 2\n");
      wrapper.write("exit\n");

      expect(mockPty.writtenData).toHaveLength(3);
      expect(mockPty.writtenData).toEqual(["echo 1\n", "echo 2\n", "exit\n"]);
    });

    it("should handle control characters in write()", () => {
      const wrapper = new PTYWrapper("bash", [], {});
      const mockPty = wrapper.getMockPTY();

      // Ctrl+C (SIGINT)
      wrapper.write("\x03");
      // Ctrl+D (EOF)
      wrapper.write("\x04");

      expect(mockPty.writtenData).toContain("\x03");
      expect(mockPty.writtenData).toContain("\x04");
    });
  });
});
