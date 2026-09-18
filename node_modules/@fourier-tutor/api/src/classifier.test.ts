import { describe, expect, it } from "vitest";
import { classify } from "./classifier.js";

describe("classify", () => {
  it("marks the correct multiple-choice answer correct", () => {
    const result = classify("d1", "A has higher frequency; the amplitudes are equal");
    expect(result.correct).toBe(true);
    expect(result.confidence).toBe(1);
    expect(result.source).toBe("rules");
  });

  it("maps a wrong choice to its distractor misconception", () => {
    const result = classify("d1", "A has higher frequency and greater amplitude");
    expect(result.correct).toBe(false);
    expect(result.misconceptionId).toBe("m1");
  });

  it("detects the wrong model in free text", () => {
    const result = classify("d2", "the wave gets taller when it goes faster");
    expect(result.correct).toBe(false);
    expect(result.misconceptionId).toBe("m1");
  });

  it("accepts a correct-model free-text answer", () => {
    const result = classify(
      "d2",
      "frequency and amplitude are independent, the height stays the same"
    );
    expect(result.correct).toBe(true);
  });

  it("returns low confidence when nothing matches", () => {
    const result = classify("d2", "waves are cool i guess");
    expect(result.correct).toBe(false);
    expect(result.confidence).toBeLessThan(0.5);
  });
});
