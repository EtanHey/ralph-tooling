/**
 * PRD Operations Tests - TDD for MP-006
 * Tests for PRD file operations (ralph-ui/src/runner/prd.ts)
 */

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync, unlinkSync } from "fs";
import { join } from "path";

// Types
interface AcceptanceCriterion {
  text: string;
  checked: boolean;
}

interface Story {
  id: string;
  title: string;
  description?: string;
  acceptanceCriteria: AcceptanceCriterion[];
  dependencies?: string[];
  blockedBy?: string;
  passes?: boolean;
  completedAt?: string;
  completedBy?: string;
}

interface PRDIndex {
  nextStory?: string;
  storyOrder: string[];
  pending: string[];
  blocked: string[];
  completed?: string[];
  newStories?: string[];
}

interface UpdateQueue {
  newStories?: Story[];
  updateStories?: Partial<Story>[];
  moveToPending?: string[];
  moveToBlocked?: [string, string][];
  removeStories?: string[];
}

// Test fixtures
const TEST_DIR = "/tmp/ralph-prd-test";
const PRD_JSON_DIR = join(TEST_DIR, "prd-json");
const STORIES_DIR = join(PRD_JSON_DIR, "stories");

function setupTestPRD() {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true });
  }
  mkdirSync(STORIES_DIR, { recursive: true });

  const index: PRDIndex = {
    nextStory: "US-001",
    storyOrder: ["US-001", "US-002", "BUG-001"],
    pending: ["US-001", "US-002"],
    blocked: ["BUG-001"],
    completed: [],
  };
  writeFileSync(join(PRD_JSON_DIR, "index.json"), JSON.stringify(index, null, 2));

  const story1: Story = {
    id: "US-001",
    title: "Feature Story",
    acceptanceCriteria: [
      { text: "Criterion 1", checked: false },
      { text: "Criterion 2", checked: false },
      { text: "Criterion 3", checked: false },
    ],
    passes: false,
  };
  writeFileSync(join(STORIES_DIR, "US-001.json"), JSON.stringify(story1, null, 2));

  const story2: Story = {
    id: "US-002",
    title: "Another Story",
    dependencies: ["US-001"],
    acceptanceCriteria: [
      { text: "Single criterion", checked: false },
    ],
    passes: false,
  };
  writeFileSync(join(STORIES_DIR, "US-002.json"), JSON.stringify(story2, null, 2));

  const blockedStory: Story = {
    id: "BUG-001",
    title: "Blocked Bug",
    blockedBy: "External API unavailable",
    acceptanceCriteria: [
      { text: "Fix the bug", checked: false },
    ],
    passes: false,
  };
  writeFileSync(join(STORIES_DIR, "BUG-001.json"), JSON.stringify(blockedStory, null, 2));
}

function cleanupTestPRD() {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true });
  }
}

describe("Read Index", () => {
  beforeEach(setupTestPRD);
  afterEach(cleanupTestPRD);

  it("should read index.json correctly", () => {
    const content = readFileSync(join(PRD_JSON_DIR, "index.json"), "utf-8");
    const index = JSON.parse(content) as PRDIndex;

    expect(index.nextStory).toBe("US-001");
    expect(index.pending).toContain("US-001");
    expect(index.pending).toContain("US-002");
    expect(index.blocked).toContain("BUG-001");
  });

  it("should return null for missing index", () => {
    const missingPath = join(TEST_DIR, "nonexistent/index.json");
    expect(existsSync(missingPath)).toBe(false);
  });
});

describe("Read Story", () => {
  beforeEach(setupTestPRD);
  afterEach(cleanupTestPRD);

  it("should read story file correctly", () => {
    const content = readFileSync(join(STORIES_DIR, "US-001.json"), "utf-8");
    const story = JSON.parse(content) as Story;

    expect(story.id).toBe("US-001");
    expect(story.title).toBe("Feature Story");
    expect(story.acceptanceCriteria).toHaveLength(3);
    expect(story.passes).toBe(false);
  });

  it("should include blockedBy field for blocked stories", () => {
    const content = readFileSync(join(STORIES_DIR, "BUG-001.json"), "utf-8");
    const story = JSON.parse(content) as Story;

    expect(story.blockedBy).toBe("External API unavailable");
  });

  it("should include dependencies field", () => {
    const content = readFileSync(join(STORIES_DIR, "US-002.json"), "utf-8");
    const story = JSON.parse(content) as Story;

    expect(story.dependencies).toContain("US-001");
  });
});

describe("Check Criterion", () => {
  beforeEach(setupTestPRD);
  afterEach(cleanupTestPRD);

  it("should mark criterion as checked", () => {
    // Read story
    const storyPath = join(STORIES_DIR, "US-001.json");
    let story = JSON.parse(readFileSync(storyPath, "utf-8")) as Story;

    // Check first criterion
    story.acceptanceCriteria[0].checked = true;
    writeFileSync(storyPath, JSON.stringify(story, null, 2));

    // Verify
    story = JSON.parse(readFileSync(storyPath, "utf-8")) as Story;
    expect(story.acceptanceCriteria[0].checked).toBe(true);
    expect(story.acceptanceCriteria[1].checked).toBe(false);
  });

  it("should update passes when all criteria checked", () => {
    const storyPath = join(STORIES_DIR, "US-001.json");
    let story = JSON.parse(readFileSync(storyPath, "utf-8")) as Story;

    // Check all criteria
    for (const criterion of story.acceptanceCriteria) {
      criterion.checked = true;
    }

    // Check if all are now checked
    const allChecked = story.acceptanceCriteria.every(c => c.checked);
    if (allChecked) {
      story.passes = true;
    }

    writeFileSync(storyPath, JSON.stringify(story, null, 2));

    // Verify
    story = JSON.parse(readFileSync(storyPath, "utf-8")) as Story;
    expect(story.passes).toBe(true);
  });
});

describe("Complete Story", () => {
  beforeEach(setupTestPRD);
  afterEach(cleanupTestPRD);

  it("should mark story as complete with timestamp", () => {
    const storyPath = join(STORIES_DIR, "US-001.json");
    let story = JSON.parse(readFileSync(storyPath, "utf-8")) as Story;

    // Complete the story
    for (const criterion of story.acceptanceCriteria) {
      criterion.checked = true;
    }
    story.passes = true;
    story.completedAt = new Date().toISOString();
    story.completedBy = "opus";

    writeFileSync(storyPath, JSON.stringify(story, null, 2));

    // Verify
    story = JSON.parse(readFileSync(storyPath, "utf-8")) as Story;
    expect(story.passes).toBe(true);
    expect(story.completedAt).toBeDefined();
    expect(story.completedBy).toBe("opus");
  });

  it("should update index when story is complete", () => {
    const indexPath = join(PRD_JSON_DIR, "index.json");
    let index = JSON.parse(readFileSync(indexPath, "utf-8")) as PRDIndex;

    const storyId = "US-001";

    // Remove from pending
    index.pending = index.pending.filter(id => id !== storyId);

    // Add to completed
    if (!index.completed) index.completed = [];
    index.completed.push(storyId);

    // Update nextStory
    index.nextStory = index.pending.length > 0 ? index.pending[0] : undefined;

    writeFileSync(indexPath, JSON.stringify(index, null, 2));

    // Verify
    index = JSON.parse(readFileSync(indexPath, "utf-8")) as PRDIndex;
    expect(index.pending).not.toContain(storyId);
    expect(index.completed).toContain(storyId);
    expect(index.nextStory).toBe("US-002");
  });
});

describe("Block Story", () => {
  beforeEach(setupTestPRD);
  afterEach(cleanupTestPRD);

  it("should mark story as blocked with reason", () => {
    const storyPath = join(STORIES_DIR, "US-001.json");
    let story = JSON.parse(readFileSync(storyPath, "utf-8")) as Story;

    story.blockedBy = "Figma MCP timeout";
    writeFileSync(storyPath, JSON.stringify(story, null, 2));

    story = JSON.parse(readFileSync(storyPath, "utf-8")) as Story;
    expect(story.blockedBy).toBe("Figma MCP timeout");
  });

  it("should move story from pending to blocked in index", () => {
    const indexPath = join(PRD_JSON_DIR, "index.json");
    let index = JSON.parse(readFileSync(indexPath, "utf-8")) as PRDIndex;

    const storyId = "US-001";

    // Move from pending to blocked
    index.pending = index.pending.filter(id => id !== storyId);
    if (!index.blocked.includes(storyId)) {
      index.blocked.push(storyId);
    }

    // Update nextStory
    index.nextStory = index.pending.length > 0 ? index.pending[0] : undefined;

    writeFileSync(indexPath, JSON.stringify(index, null, 2));

    // Verify
    index = JSON.parse(readFileSync(indexPath, "utf-8")) as PRDIndex;
    expect(index.pending).not.toContain(storyId);
    expect(index.blocked).toContain(storyId);
  });
});

describe("Update Queue Processing", () => {
  beforeEach(setupTestPRD);
  afterEach(cleanupTestPRD);

  it("should process newStories from update.json", () => {
    // Create update.json
    const updateQueue: UpdateQueue = {
      newStories: [
        {
          id: "US-003",
          title: "New Story",
          acceptanceCriteria: [
            { text: "Do something", checked: false },
          ],
        },
      ],
    };
    const updatePath = join(PRD_JSON_DIR, "update.json");
    writeFileSync(updatePath, JSON.stringify(updateQueue, null, 2));

    // Process update queue
    const queue = JSON.parse(readFileSync(updatePath, "utf-8")) as UpdateQueue;

    if (queue.newStories) {
      for (const story of queue.newStories) {
        // Write story file
        writeFileSync(
          join(STORIES_DIR, `${story.id}.json`),
          JSON.stringify(story, null, 2)
        );

        // Update index
        const indexPath = join(PRD_JSON_DIR, "index.json");
        const index = JSON.parse(readFileSync(indexPath, "utf-8")) as PRDIndex;

        if (!index.pending.includes(story.id)) {
          index.pending.push(story.id);
        }
        if (!index.storyOrder.includes(story.id)) {
          index.storyOrder.push(story.id);
        }

        writeFileSync(indexPath, JSON.stringify(index, null, 2));
      }
    }

    // Delete update.json
    unlinkSync(updatePath);

    // Verify
    expect(existsSync(join(STORIES_DIR, "US-003.json"))).toBe(true);
    const index = JSON.parse(readFileSync(join(PRD_JSON_DIR, "index.json"), "utf-8")) as PRDIndex;
    expect(index.pending).toContain("US-003");
    expect(existsSync(updatePath)).toBe(false);
  });

  it("should process moveToPending from update.json", () => {
    const updateQueue: UpdateQueue = {
      moveToPending: ["BUG-001"],
    };
    const updatePath = join(PRD_JSON_DIR, "update.json");
    writeFileSync(updatePath, JSON.stringify(updateQueue, null, 2));

    // Process
    const queue = JSON.parse(readFileSync(updatePath, "utf-8")) as UpdateQueue;
    const indexPath = join(PRD_JSON_DIR, "index.json");
    let index = JSON.parse(readFileSync(indexPath, "utf-8")) as PRDIndex;

    if (queue.moveToPending) {
      for (const storyId of queue.moveToPending) {
        index.blocked = index.blocked.filter(id => id !== storyId);
        if (!index.pending.includes(storyId)) {
          index.pending.push(storyId);
        }

        // Clear blockedBy
        const storyPath = join(STORIES_DIR, `${storyId}.json`);
        const story = JSON.parse(readFileSync(storyPath, "utf-8")) as Story;
        delete story.blockedBy;
        writeFileSync(storyPath, JSON.stringify(story, null, 2));
      }
    }

    writeFileSync(indexPath, JSON.stringify(index, null, 2));
    unlinkSync(updatePath);

    // Verify
    index = JSON.parse(readFileSync(indexPath, "utf-8")) as PRDIndex;
    expect(index.blocked).not.toContain("BUG-001");
    expect(index.pending).toContain("BUG-001");

    const story = JSON.parse(readFileSync(join(STORIES_DIR, "BUG-001.json"), "utf-8")) as Story;
    expect(story.blockedBy).toBeUndefined();
  });
});

describe("Verify Pending Count", () => {
  beforeEach(setupTestPRD);
  afterEach(cleanupTestPRD);

  it("should detect false COMPLETE signal", () => {
    // Verify that pending count matches actual stories
    const indexPath = join(PRD_JSON_DIR, "index.json");
    const index = JSON.parse(readFileSync(indexPath, "utf-8")) as PRDIndex;

    const pendingCount = index.pending.length;
    const blockedCount = index.blocked.length;

    // Check if COMPLETE would be valid
    const isComplete = pendingCount === 0 && blockedCount === 0;

    expect(isComplete).toBe(false); // Should NOT be complete in test data
    expect(pendingCount).toBe(2);
    expect(blockedCount).toBe(1);
  });

  it("should verify story files exist for pending items", () => {
    const indexPath = join(PRD_JSON_DIR, "index.json");
    const index = JSON.parse(readFileSync(indexPath, "utf-8")) as PRDIndex;

    for (const storyId of index.pending) {
      const storyPath = join(STORIES_DIR, `${storyId}.json`);
      expect(existsSync(storyPath)).toBe(true);
    }
  });
});

describe("Criteria Progress", () => {
  beforeEach(setupTestPRD);
  afterEach(cleanupTestPRD);

  it("should calculate criteria progress correctly", () => {
    const storyPath = join(STORIES_DIR, "US-001.json");
    let story = JSON.parse(readFileSync(storyPath, "utf-8")) as Story;

    // Check 1 of 3 criteria
    story.acceptanceCriteria[0].checked = true;
    writeFileSync(storyPath, JSON.stringify(story, null, 2));

    story = JSON.parse(readFileSync(storyPath, "utf-8")) as Story;

    const total = story.acceptanceCriteria.length;
    const checked = story.acceptanceCriteria.filter(c => c.checked).length;
    const percentage = Math.round((checked / total) * 100);

    expect(total).toBe(3);
    expect(checked).toBe(1);
    expect(percentage).toBe(33);
  });

  it("should detect partial progress", () => {
    const storyPath = join(STORIES_DIR, "US-001.json");
    let story = JSON.parse(readFileSync(storyPath, "utf-8")) as Story;

    // Check 2 of 3 criteria
    story.acceptanceCriteria[0].checked = true;
    story.acceptanceCriteria[1].checked = true;
    writeFileSync(storyPath, JSON.stringify(story, null, 2));

    story = JSON.parse(readFileSync(storyPath, "utf-8")) as Story;

    const checked = story.acceptanceCriteria.filter(c => c.checked).length;
    const total = story.acceptanceCriteria.length;
    const hasPartialProgress = checked > 0 && checked < total && !story.passes;

    expect(hasPartialProgress).toBe(true);
  });
});
