import type { ClassifierSource } from "@fourier-tutor/shared";
import { getItem, getMisconception } from "./seed.js";

export interface Classification {
  correct: boolean;
  misconceptionId: string;
  confidence: number;
  source: ClassifierSource;
  feedback: string;
}

/**
 * Rules-based classifier (M1 milestone). Maps a learner's response to the
 * authored misconception taxonomy without any model call.
 *
 * Multiple-choice: exact match against the authored answer; each distractor
 * is pre-mapped to the misconception it reveals.
 *
 * Free-text: keyword scoring. Wrong-model keywords win over correct-model
 * keywords — a response containing both is treated as still holding the
 * misconception. Low confidence when nothing matches.
 *
 * The interface is deliberately model-shaped ({ misconceptionId, confidence,
 * source }) so the model classifier (M2) can replace this behind the same
 * boundary without touching the policy.
 */

const WRONG_KEYWORDS: Record<string, string[]> = {
  m1: ["taller", "bigger", "higher", "louder", "greater amplitude", "amplitude increases", "grows taller"],
  m2: ["500", "adds the frequencies", "sum of the frequencies", "combined frequency", "new frequency", "merge into"],
  m3: ["pitch", "higher note", "note changes", "frequency change", "sounds faster", "becomes faster"],
  m4: ["single", "one frequency", "just 100", "played harshly", "only 100"]
};

const CORRECT_KEYWORDS: Record<string, string[]> = {
  m1: ["same height", "amplitude stays", "independent", "only faster", "not the height", "height stays"],
  m2: ["both", "each", "point by point", "superpos", "200 hz and 300", "200 and 300"],
  m3: ["timing", "starting point", "delay", "same pitch", "when it starts", "no change", "does not change", "doesn't change", "still 440"],
  m4: ["harmonic", "odd", "300", "500 hz", "sum of", "multiple frequenc"]
};

function hits(text: string, keywords: string[]): boolean {
  return keywords.some((k) => text.includes(k));
}

export function classify(itemId: string, responseText: string): Classification {
  const startedAt = Date.now();
  const item = getItem(itemId);
  const misconception = getMisconception(item.misconceptionId);
  void startedAt;

  // Multiple-choice: deterministic.
  if (item.choices && typeof item.correctChoice === "number") {
    const choiceIndex = item.choices.indexOf(responseText);
    if (choiceIndex === item.correctChoice) {
      return {
        correct: true,
        misconceptionId: item.misconceptionId,
        confidence: 1,
        source: "rules",
        feedback: `Correct. ${misconception.correctModel}`
      };
    }
    const revealed =
      item.distractorMisconceptions?.[choiceIndex] ?? item.misconceptionId;
    const revealedM = getMisconception(revealed);
    return {
      correct: false,
      misconceptionId: revealed,
      confidence: 0.9,
      source: "rules",
      feedback: `Not quite — ${revealedM.wrongModel} Actually: ${revealedM.correctModel}`
    };
  }

  // Free-text: keyword scoring.
  const text = responseText.toLowerCase();
  const wrongHit = hits(text, WRONG_KEYWORDS[item.misconceptionId] ?? []);
  const correctHit = hits(text, CORRECT_KEYWORDS[item.misconceptionId] ?? []);

  if (wrongHit) {
    return {
      correct: false,
      misconceptionId: item.misconceptionId,
      confidence: 0.65,
      source: "rules",
      feedback: `That points at a common trap: ${misconception.wrongModel} The real picture: ${misconception.correctModel}`
    };
  }
  if (correctHit) {
    return {
      correct: true,
      misconceptionId: item.misconceptionId,
      confidence: 0.7,
      source: "rules",
      feedback: `Yes — ${misconception.correctModel}`
    };
  }
  return {
    correct: false,
    misconceptionId: item.misconceptionId,
    confidence: 0.4,
    source: "rules",
    feedback: `I couldn't quite tell from that. The key idea: ${misconception.correctModel}`
  };
}
