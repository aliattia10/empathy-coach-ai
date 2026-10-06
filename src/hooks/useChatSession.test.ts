import { describe, expect, it } from "vitest";
import { NotSavedError } from "./useChatSession";

describe("NotSavedError", () => {
  it("is a typed error for zero-row updates", () => {
    const err = new NotSavedError();
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("NotSavedError");
    expect(err.message).toBe("Changes were not saved.");
  });
});
