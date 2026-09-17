import { describe, expect, it } from "vitest";
import {
  POST_SCREENING_INDEX,
  currentStep,
  freezeFollowups,
  planSteps,
  weakestFirst
} from "./policy.js";
import type { SessionState } from "./store.js";

function makeSession(misses: Record<string, number> = {}): SessionState {
  return {
    id: "s1",
    learnerId: "l1",
    conceptId: "fourier-sine-waves",
    stepIndex: 0,
    misses,
    followupItemIds: null,
    status: "active",
    createdAt: new Date().toISOString()
  };
}

describe("policy", () => {
  it("starts with four screening diagnostics", () => {
    const steps = planSteps(makeSession());
    expect(steps.slice(0, 4).map((s) => s.kind)).toEqual([
      "diagnostic",
      "diagnostic",
      "diagnostic",
      "diagnostic"
    ]);
    expect(steps.at(-1)?.kind).toBe("done");
  });

  it("targets the weakest misconception in the explanation", () => {
    const session = makeSession({ m3: 2 });
    const steps = planSteps(session);
    expect(steps[POST_SCREENING_INDEX].misconceptionId).toBe("m3");
    expect(steps[POST_SCREENING_INDEX].kind).toBe("explanation");
    expect(steps[POST_SCREENING_INDEX + 1].kind).toBe("manipulation");
  });

  it("freezes follow-ups so later misses can't reshuffle the plan", () => {
    const session = makeSession({ m2: 3 });
    freezeFollowups(session);
    const before = planSteps(session).map((s) => s.itemId ?? s.kind);
    session.misses = { m4: 9 };
    const after = planSteps(session).map((s) => s.itemId ?? s.kind);
    expect(after).toEqual(before);
  });

  it("ranks weakest misconceptions first", () => {
    expect(weakestFirst({ m2: 1, m4: 5 }, ["m1", "m2", "m3", "m4"])[0]).toBe("m4");
  });

  it("currentStep clamps at the end of the plan", () => {
    const session = makeSession();
    session.stepIndex = 999;
    expect(currentStep(session).kind).toBe("done");
  });
});
