import { describe, expect, it } from "vitest";
import { goalsCompletionRatio, tasksCompletionPercent } from "./journeyProgress";

describe("tasksCompletionPercent", () => {
  it("returns 100% when 1 of 1 tasks is done", () => {
    const goals = [{ id: "1", title: "Task", completed: true, completed_at: null, source: "user" as const, created_at: "" }];
    expect(goalsCompletionRatio(goals)).toEqual({ done: 1, total: 1 });
    expect(tasksCompletionPercent(goals)).toBe(100);
  });

  it("returns 0% when there are no tasks", () => {
    expect(tasksCompletionPercent([])).toBe(0);
  });

  it("returns rounded percentage for partial completion", () => {
    const goals = [
      { id: "1", title: "A", completed: true, completed_at: null, source: "user" as const, created_at: "" },
      { id: "2", title: "B", completed: false, completed_at: null, source: "user" as const, created_at: "" },
    ];
    expect(tasksCompletionPercent(goals)).toBe(50);
  });
});
