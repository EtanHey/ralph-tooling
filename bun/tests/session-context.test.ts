import { describe, it, expect, beforeEach } from 'bun:test';
import { SessionContext } from '../src/runner/session-context';

describe('SessionContext', () => {
  beforeEach(() => {
    // Clear environment variables
    delete process.env.RALPH_SESSION;
  });

  describe('create()', () => {
    it('returns valid context object with all required properties', () => {
      const ctx = SessionContext.create({});
      
      expect(ctx).toHaveProperty('runner');
      expect(ctx).toHaveProperty('model');
      expect(ctx).toHaveProperty('interactive');
      expect(ctx).toHaveProperty('notifications');
      expect(ctx.notifications).toHaveProperty('enabled');
    });
  });

  describe('detectRunner()', () => {
    it('returns "ralph" when RALPH_SESSION is set', () => {
      process.env.RALPH_SESSION = 'test-session-123';
      
      const ctx = SessionContext.create({});
      expect(ctx.runner).toBe('ralph');
    });

    it('returns "direct" when no RALPH_SESSION', () => {
      delete process.env.RALPH_SESSION;
      
      const ctx = SessionContext.create({});
      expect(ctx.runner).toBe('direct');
    });
  });

  describe('resolveNotifyConfig()', () => {
    it('merges env + config + flags correctly', () => {
      const config = { notifications: { enabled: true, topic: 'config-topic' } };
      const flags = { quiet: false, notify: true };
      
      const ctx = SessionContext.create({ config, flags });
      
      expect(ctx.notifications.enabled).toBe(true);
    });

    it('reflects -QN flag in ctx.notifications.enabled', () => {
      const flags = { quiet: true, notify: true }; // -QN equivalent
      
      const ctx = SessionContext.create({ flags });
      
      expect(ctx.notifications.enabled).toBe(true);
    });
  });
});
