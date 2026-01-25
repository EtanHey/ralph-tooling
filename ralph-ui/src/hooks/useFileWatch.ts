import { useState, useEffect, useCallback, useMemo } from 'react';
import { existsSync } from 'fs';
import { join } from 'path';
import type { PRDStats } from '../types.js';
import { createStatsLoader } from './usePRDStats.js';

interface UseFileWatchOptions {
  prdPath: string;
  enabled?: boolean;
}

interface UsePollingWatchOptions extends UseFileWatchOptions {
  intervalMs?: number;
}

/**
 * Poll for file changes (fs.watch is unreliable on macOS)
 * Default interval: 1000ms
 */
export function usePollingWatch({
  prdPath,
  enabled = true,
  intervalMs = 1000,
}: UsePollingWatchOptions): PRDStats | null {
  const [stats, setStats] = useState<PRDStats | null>(null);

  // Memoize the loader so it doesn't change on every render
  const loadStats = useMemo(() => createStatsLoader(prdPath), [prdPath]);

  useEffect(() => {
    // Initial load
    const newStats = loadStats();
    if (newStats) {
      setStats(newStats);
    }

    if (!enabled) {
      return;
    }

    // Poll at regular intervals - only update if stats changed
    const interval = setInterval(() => {
      const newStats = loadStats();
      if (newStats) {
        setStats(prev => {
          // Only update if something actually changed
          if (!prev) return newStats;
          if (JSON.stringify(prev) === JSON.stringify(newStats)) return prev;
          return newStats;
        });
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [prdPath, enabled, intervalMs, loadStats]);

  return stats;
}

// Alias for backwards compatibility
export const useFileWatch = usePollingWatch;
