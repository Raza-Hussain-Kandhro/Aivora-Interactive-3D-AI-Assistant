import { describe, expect, it } from "vitest";
import { analyzeSentiment, stripMarkdown } from "./sentiment";

describe("analyzeSentiment", () => {
  it("detects positive responses", () => {
    expect(
      analyzeSentiment("Great, the task is done and works perfectly!"),
    ).toBe("happy");
  });

  it("detects confused responses", () => {
    expect(
      analyzeSentiment("Sorry, there was an error and the request failed."),
    ).toBe("confused");
  });

  it("detects neutral responses", () => {
    expect(analyzeSentiment("The assistant is ready.")).toBe("neutral");
  });
});

describe("stripMarkdown", () => {
  it("removes Markdown formatting", () => {
    expect(stripMarkdown("**Hello** `world`")).toBe("Hello world");
  });
});