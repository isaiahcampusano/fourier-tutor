import { describe, expect, it } from "vitest";
import { computeWaveform } from "./WaveformWidget";

describe("computeWaveform", () => {
  it("returns zero when amplitude is zero", () => {
    expect(computeWaveform(3, 0, 1.2, 0.4)).toBe(0);
  });

  it("is deterministic for the same inputs", () => {
    expect(computeWaveform(1.5, 1.2, 0.7, 0.25)).toBe(
      computeWaveform(1.5, 1.2, 0.7, 0.25)
    );
  });

  it("changes when phase changes", () => {
    expect(computeWaveform(1, 1, 0, 0.2)).not.toBe(computeWaveform(1, 1, 1, 0.2));
  });
});
