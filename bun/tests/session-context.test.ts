import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { SessionContext } from '../../ralph-ui/src/runner/session-context';

describe('SessionContext', () => {
  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    // Save original environment
    originalEnv = {
      RALPH_SESSION: process.env.RALPH_SESSION,
      RALPH_NOTIFY: process.env.RALPH_NOTIFY,
    };
  });

  afterEach(() => {
    // Restore original environment
    process.env.RALPH_SESSION = originalEnv.RALPH_SESSION;
    process.env.RALPH_NOTIFY = originalEnv.RALPH_NOTIFY;
  });

  describe('SessionContext.create()', () => {
    test('returns valid context with default values', () => {
      // Ensure clean environment for this test
      delete process.env.RALPH_SESSION;
      
      const context = SessionContext.create();
      
      expect(context).toBeDefined();
      expect(context.runner).toBe('direct'); // No RALPH_SESSION set
      expect(context.model).toBe('opus');
      expect(context.interactive).toBe(true); // direct mode is interactive
      expect(context.notifications).toEqual({
        enabled: false,
        topic: undefined,
      });
    });
  });

  describe('detectRunner()', () => {
    test('returns "ralph" when RALPH_SESSION is set', () => {
      process.env.RALPH_SESSION = '1';
      
      const context = SessionContext.create();
      
      expect(context.runner).toBe('ralph');
      expect(context.interactive).toBe(false); // ralph mode is not interactive
    });

    test('returns "direct" when no RALPH_SESSION', () => {
      delete process.env.RALPH_SESSION;
      
      const context = SessionContext.create();
      
      expect(context.runner).toBe('direct');
      expect(context.interactive).toBe(true); // direct mode is interactive
    });
  });

  describe('notifications.enabled', () => {
    test('reflects RALPH_NOTIFY env via flags.notify', () => {
      process.env.RALPH_NOTIFY = '1';
      
      const context = SessionContext.create({
        flags: { notify: true }
      });
      
      expect(context.notifications.enabled).toBe(true);
    });

    test('is false when no notification flags set', () => {
      delete process.env.RALPH_NOTIFY;
      
      const context = SessionContext.create();
      
      expect(context.notifications.enabled).toBe(false);
    });

    test('config.notifications.enabled is respected', () => {
      const context = SessionContext.create({
        config: {
          notifications: {
            enabled: true,
            topic: 'test-topic'
          }
        }
      });
      
      expect(context.notifications.enabled).toBe(true);
      expect(context.notifications.topic).toBe('test-topic');
    });

    test('flags.notify overrides config.notifications.enabled', () => {
      const context = SessionContext.create({
        config: {
          notifications: {
            enabled: false
          }
        },
        flags: {
          notify: true
        }
      });
      
      expect(context.notifications.enabled).toBe(true);
    });
  });
});
