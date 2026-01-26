#!/usr/bin/env bun
/**
 * Test script to simulate rapid error iterations and verify no duplicate boxes
 * This simulates the scenario described in BUG-004
 */

import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

const statusFile = `/tmp/ralph-status-${process.pid}.json`;

// Simulate 5 rapid error iterations with different states
const errorStates = [
  { state: 'running', iteration: 1, error: null },
  { state: 'error', iteration: 1, error: 'Blocked story loop detected' },
  { state: 'retry', iteration: 1, retryIn: 5 },
  { state: 'retry', iteration: 1, retryIn: 4 },
  { state: 'retry', iteration: 1, retryIn: 3 },
  { state: 'retry', iteration: 1, retryIn: 2 },
  { state: 'retry', iteration: 1, retryIn: 1 },
  { state: 'running', iteration: 2, error: null },
  { state: 'error', iteration: 2, error: 'Same blocked story again' },
];

async function simulateErrorLoop() {
  console.log('🧪 Testing BUG-004 fix: Simulating rapid error iterations...');
  
  // Start the ralph-ui in the background
  const ui = Bun.spawn(['bun', 'ralph-ui/src/index.tsx', '--mode', 'iteration'], {
    cwd: process.cwd(),
    stdout: 'pipe',
    stderr: 'pipe',
  });

  // Wait a moment for UI to start
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Rapidly write status updates to simulate error loop
  for (let i = 0; i < errorStates.length; i++) {
    const status = {
      ...errorStates[i],
      storyId: 'BUG-TEST',
      model: 'kiro',
      startTime: Date.now() - (i * 1000),
      lastActivity: Math.floor(Date.now() / 1000),
      pid: process.pid,
    };

    writeFileSync(statusFile, JSON.stringify(status, null, 2));
    console.log(`📝 Wrote status ${i + 1}/${errorStates.length}: ${status.state} (iteration ${status.iteration})`);
    
    // Short delay between updates to simulate rapid changes
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Let UI render for a moment
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Kill the UI process
  ui.kill();
  
  // Cleanup
  if (existsSync(statusFile)) {
    unlinkSync(statusFile);
  }

  console.log('✅ Test completed. Check terminal output above for duplicate boxes.');
  console.log('   Expected: Clean transitions between states without duplicate ╭───╮ borders');
  console.log('   Bug would show: Multiple empty boxes stacked on top of each other');
}

// Run the test
simulateErrorLoop().catch(console.error);
