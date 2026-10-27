import { describe, expect, it } from "vitest";
import { calculateScore } from "./score.js";

describe("calculateScore", () => {
  it("applies the specified weighted penalties", () => {
    expect(calculateScore([{ impact: "critical" }, { impact: "serious" }, { impact: "moderate" }, { impact: "minor" }])).toBe(82);
  });

  it("never returns a negative score", () => {
    expect(calculateScore(Array.from({ length: 11 }, () => ({ impact: "critical" as const })))).toBe(0);
  });
});
