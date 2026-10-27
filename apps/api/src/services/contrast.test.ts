import { describe, expect, it } from "vitest";
import { contrastRatio, ensureContrast, relativeLuminance } from "./contrast.js";

describe("contrast", () => {
  it("calculates WCAG reference contrast", () => expect(contrastRatio("#000000", "#ffffff")).toBe(21));
  it("calculates relative luminance", () => expect(relativeLuminance("#000000")).toBe(0));
  it("adjusts insufficient contrast to normal-text AA", () => expect(ensureContrast("#777777", "#ffffff").ratio).toBeGreaterThanOrEqual(4.5));
  it("uses the large-text threshold when requested", () => expect(ensureContrast("#777777", "#ffffff", true).ratio).toBeGreaterThanOrEqual(3));
});
