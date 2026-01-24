import React, { useState, useEffect } from 'react';
import { Box, Text, useStdout, useStdin, useInput, useApp } from 'ink';
import { IterationHeader } from './IterationHeader.js';
import { PRDStatus } from './PRDStatus.js';
import { StoryBox } from './StoryBox.js';
import { NotificationStatus } from './NotificationStatus.js';
import { useFileWatch } from '../hooks/useFileWatch.js';
import type { DashboardProps, PRDStats } from '../types.js';

// Live clock hook
function useLiveClock(): string {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return time;
}

// Wrapper component that conditionally uses input
function KeyboardHandler({ onExit }: { onExit: () => void }) {
  useInput((input, key) => {
    if (input === 'q' || (key.ctrl && input === 'c')) {
      onExit();
    }
  });
  return null;
}

export function Dashboard({
  mode,
  prdPath,
  iteration = 1,
  model = 'sonnet',
  startTime = Date.now(),
  ntfyTopic,
}: DashboardProps & { ntfyTopic?: string }) {
  const { stdout } = useStdout();
  const { isRawModeSupported } = useStdin();
  const { exit } = useApp();
  const [terminalWidth, setTerminalWidth] = useState(stdout?.columns || 80);
  const currentTime = useLiveClock();

  // Watch for file changes in live mode
  const liveStats = useFileWatch({
    prdPath,
    enabled: mode === 'live' || mode === 'iteration',
    debounceMs: 100,
  });

  // Use live stats if available, otherwise use defaults
  const stats: PRDStats = liveStats || {
    totalStories: 0,
    completedStories: 0,
    pendingStories: 0,
    blockedStories: 0,
    totalCriteria: 0,
    checkedCriteria: 0,
    currentStory: null,
    nextStoryId: '',
  };

  // Handle terminal resize
  useEffect(() => {
    const handleResize = () => {
      if (stdout) {
        setTerminalWidth(stdout.columns);
      }
    };

    stdout?.on('resize', handleResize);
    return () => {
      stdout?.off('resize', handleResize);
    };
  }, [stdout]);

  return (
    <Box flexDirection="column" width={terminalWidth}>
      {/* Keyboard handler - only when raw mode is supported */}
      {isRawModeSupported && <KeyboardHandler onExit={exit} />}

      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="blue">
          ╭{'─'.repeat(Math.min(terminalWidth - 2, 78))}╮
        </Text>
      </Box>
      <Box marginBottom={1} justifyContent="space-between" paddingX={2}>
        <Text bold color="blue">🐺 RALPH - React Ink Terminal UI</Text>
        <Text color="cyan">🕐 {currentTime}</Text>
      </Box>

      {/* Iteration Header (shown in iteration/live modes) */}
      {(mode === 'iteration' || mode === 'live') && (
        <Box marginBottom={1}>
          <IterationHeader
            iteration={iteration}
            model={model}
            startTime={startTime}
            isRunning={mode === 'iteration'}
          />
        </Box>
      )}

      {/* PRD Status */}
      <Box marginBottom={1}>
        <PRDStatus stats={stats} />
      </Box>

      {/* Current Story */}
      {stats.currentStory && (
        <Box marginBottom={1}>
          <StoryBox story={stats.currentStory} />
        </Box>
      )}

      {/* Notification Status */}
      <Box marginBottom={1}>
        <NotificationStatus topic={ntfyTopic} enabled={!!ntfyTopic} />
      </Box>

      {/* Footer */}
      <Box marginTop={1}>
        <Text dimColor>
          {isRawModeSupported ? "Press 'q' to quit" : 'Ctrl+C to quit'} • Terminal width: {terminalWidth}
        </Text>
      </Box>
    </Box>
  );
}
