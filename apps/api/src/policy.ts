import type { LessonStep } from "@fourier-tutor/shared";
import {
  DIAGNOSTIC_ITEMS,
  getMisconception,
  type DiagnosticItem
} from "./seed.js";
import type { SessionState } from "./store.js";

/**
 * The deterministic next-step policy. This is the adaptive core and it uses
 * no model calls: it reads the session's miss counts and picks the weakest
 * misconceptions to target next.
 *
 * Session shape (M1):
 *   1. diagnostics — one multiple-choice item per misconception (d1, d3, d5, d7)
 *   2. explanation — targets the weakest misconception so far
 *   3. manipulation — the waveform widget, prompted with that misconception's hint
 *   4. followup — free-text items for the two weakest misconceptions
 *   5. done
 */

interface PlannedStep {
  kind: LessonStep["kind"];
  title: string;
  prompt: string;
  itemId?: string;
  misconceptionId?: string;
}

const SCREENING_IDS = ["d1", "d3", "d5", "d7"];
const FOLLOWUP_IDS = ["d2", "d4", "d6", "d8"];

function itemById(id: string): DiagnosticItem {
  const item = DIAGNOSTIC_ITEMS.find((i) => i.id === id);
  if (!item) throw new Error(`Unknown item in plan: ${id}`);
  return item;
}

/** Weakest misconceptions first, by miss count; ties keep taxonomy order. */
export function weakestFirst(
  misses: Record<string, number>,
  ids: string[]
): string[] {
  return [...ids].sort((a, b) => (misses[b] ?? 0) - (misses[a] ?? 0));
}

export function planSteps(session: SessionState): PlannedStep[] {
  const steps: PlannedStep[] = [];

  for (const id of SCREENING_IDS) {
    const item = itemById(id);
    steps.push({
      kind: "diagnostic",
      title: "Quick check",
      prompt: item.prompt,
      itemId: item.id,
      misconceptionId: item.misconceptionId
    });
  }

  const weakest = weakestFirst(session.misses, SCREENING_IDS.map((id) => itemById(id).misconceptionId))[0];
  const target = getMisconception(weakest);

  steps.push({
    kind: "explanation",
    title: `Why "${target.label}" trips people up`,
    prompt: `Common trap: ${target.wrongModel} The real picture: ${target.correctModel}`,
    misconceptionId: target.id
  });

  steps.push({
    kind: "manipulation",
    title: "Break it with your hands",
    prompt: `${target.widgetHint} Then hit "I noticed the pattern" when the wrong model stops making sense.`,
    misconceptionId: target.id
  });

  // Follow-ups are frozen at the end of screening (see freezeFollowups);
  // fall back to a live ranking only before that point.
  const followupIds =
    session.followupItemIds ??
    weakestFirst(
      session.misses,
      FOLLOWUP_IDS.map((id) => itemById(id).misconceptionId)
    )
      .slice(0, 2)
      .map(
        (misconceptionId) =>
          FOLLOWUP_IDS.map(itemById).find((i) => i.misconceptionId === misconceptionId)!.id
      );

  for (const id of followupIds) {
    const item = itemById(id);
    steps.push({
      kind: "followup",
      title: "Follow-up",
      prompt: item.prompt,
      itemId: item.id,
      misconceptionId: item.misconceptionId
    });
  }

  steps.push({
    kind: "done",
    title: "Session complete",
    prompt: "Nice work. Your progress on each misconception is saved — come back and the next session picks up where this one left off."
  });

  return steps;
}

/**
 * Called once when the learner finishes screening (stepIndex reaches the
 * first post-screening step). Locks in the follow-up items so later attempts
 * can't reshuffle the remaining plan.
 */
export function freezeFollowups(session: SessionState): void {
  if (session.followupItemIds) return;
  session.followupItemIds = weakestFirst(
    session.misses,
    FOLLOWUP_IDS.map((id) => itemById(id).misconceptionId)
  )
    .slice(0, 2)
    .map(
      (misconceptionId) =>
        FOLLOWUP_IDS.map(itemById).find((i) => i.misconceptionId === misconceptionId)!.id
    );
}

/** Index of the first step after the screening diagnostics. */
export const POST_SCREENING_INDEX = SCREENING_IDS.length;

export function toLessonStep(planned: PlannedStep, index: number, total: number): LessonStep {
  const item = planned.itemId ? itemById(planned.itemId) : undefined;
  return {
    kind: planned.kind,
    title: planned.title,
    prompt: planned.prompt,
    progress: Math.min(1, (index + 1) / total),
    misconceptionId: planned.misconceptionId,
    item: item ? { id: item.id, choices: item.choices } : undefined
  };
}

/** The step the learner should see now. Pure function of session state. */
export function currentStep(session: SessionState): LessonStep {
  const steps = planSteps(session);
  const index = Math.min(session.stepIndex, steps.length - 1);
  return toLessonStep(steps[index], index, steps.length);
}

export function totalSteps(session: SessionState): number {
  return planSteps(session).length;
}
