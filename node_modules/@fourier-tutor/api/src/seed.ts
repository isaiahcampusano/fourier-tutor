/**
 * Authored content for the V1 concept domain: Fourier / sine waves.
 * This is the product's core IP — a finite misconception taxonomy plus a
 * diagnostic bank mapped to it. The model never invents these; it only
 * classifies learner answers into them.
 */

export interface Misconception {
  id: string;
  label: string;
  /** The wrong mental model the learner likely holds. */
  wrongModel: string;
  /** The correct model, stated plainly. */
  correctModel: string;
  /** What to try in the widget to break the wrong model. */
  widgetHint: string;
}

export interface DiagnosticItem {
  id: string;
  misconceptionId: string;
  prompt: string;
  /** Present for multiple-choice; absent means free-text. */
  choices?: string[];
  /** Index into choices. Present only for multiple-choice. */
  correctChoice?: number;
  /** misconceptionId implied by each wrong choice, aligned with choices. */
  distractorMisconceptions?: (string | null)[];
}

export const CONCEPT_ID = "fourier-sine-waves";

export const MISCONCEPTIONS: Misconception[] = [
  {
    id: "m1",
    label: "Frequency vs amplitude",
    wrongModel: "A wave that oscillates faster is also taller.",
    correctModel:
      "Frequency (how fast it wiggles) and amplitude (how tall it is) are independent. Doubling the frequency changes the pitch, not the height.",
    widgetHint:
      "Drag the Frequency slider up and down while watching the wave's height. Then drag Amplitude and watch the pitch stay put."
  },
  {
    id: "m2",
    label: "Superposition",
    wrongModel: "Adding two waves produces a wave with the sum of their frequencies.",
    correctModel:
      "Waves add point-by-point. A 200 Hz tone plus a 300 Hz tone contains 200 Hz and 300 Hz — no 500 Hz appears.",
    widgetHint:
      "Imagine a second wave layered on this one: at each instant the heights add. The wiggles don't merge into a new speed."
  },
  {
    id: "m3",
    label: "Phase",
    wrongModel: "Shifting a wave's phase changes its pitch.",
    correctModel:
      "Phase shifts when the wave starts, not how fast it oscillates. A quarter-cycle delay of a 440 Hz tone is still 440 Hz.",
    widgetHint:
      "Drag the Phase slider through a full cycle. Count the wiggles — the number per second never changes."
  },
  {
    id: "m4",
    label: "Square wave spectrum",
    wrongModel: "A square wave is a single frequency played harshly.",
    correctModel:
      "A square wave is a sum of odd harmonics: f + 1/3·3f + 1/5·5f + … The harshness is extra frequencies, not extra attitude.",
    widgetHint:
      "This widget draws one sine plus its octave. A square wave is the same idea pushed further: many odd harmonics stacked."
  }
];

export const DIAGNOSTIC_ITEMS: DiagnosticItem[] = [
  {
    id: "d1",
    misconceptionId: "m1",
    prompt:
      "Wave A completes 4 cycles per second. Wave B completes 1 cycle per second. Both waves have the same height. Which statement is true?",
    choices: [
      "A has higher frequency and greater amplitude",
      "A has higher frequency; the amplitudes are equal",
      "B has higher frequency",
      "A is louder because it is faster"
    ],
    correctChoice: 1,
    distractorMisconceptions: ["m1", null, null, "m1"]
  },
  {
    id: "d2",
    misconceptionId: "m1",
    prompt: "In your own words: what changes about a wave when its frequency doubles?"
  },
  {
    id: "d3",
    misconceptionId: "m2",
    prompt: "You play a 200 Hz tone and a 300 Hz tone at the same time. Which frequencies are present in the air?",
    choices: ["500 Hz", "200 Hz and 300 Hz", "250 Hz", "200 Hz, 300 Hz, and 500 Hz"],
    correctChoice: 1,
    distractorMisconceptions: ["m2", null, "m2", "m2"]
  },
  {
    id: "d4",
    misconceptionId: "m2",
    prompt: "What happens when two different sine waves overlap? Describe the result."
  },
  {
    id: "d5",
    misconceptionId: "m3",
    prompt: "You delay a 440 Hz sine wave by a quarter of a cycle. What changed?",
    choices: [
      "Its pitch rose slightly",
      "Only its starting point in time",
      "Its frequency doubled",
      "Its amplitude dropped"
    ],
    correctChoice: 1,
    distractorMisconceptions: ["m3", null, "m3", "m1"]
  },
  {
    id: "d6",
    misconceptionId: "m3",
    prompt: "Does shifting a wave left or right change the note you hear? Why or why not?"
  },
  {
    id: "d7",
    misconceptionId: "m4",
    prompt: "A square wave at 100 Hz is best described as…",
    choices: [
      "A single 100 Hz tone played harshly",
      "100 Hz plus odd harmonics (300 Hz, 500 Hz, …)",
      "100 Hz plus 200 Hz",
      "Random noise centered on 100 Hz"
    ],
    correctChoice: 1,
    distractorMisconceptions: ["m4", null, "m2", null]
  },
  {
    id: "d8",
    misconceptionId: "m4",
    prompt: "Why does a square wave sound harsher than a sine wave at the same pitch?"
  }
];

export function getMisconception(id: string): Misconception {
  const found = MISCONCEPTIONS.find((m) => m.id === id);
  if (!found) throw new Error(`Unknown misconception: ${id}`);
  return found;
}

export function getItem(id: string): DiagnosticItem {
  const found = DIAGNOSTIC_ITEMS.find((i) => i.id === id);
  if (!found) throw new Error(`Unknown diagnostic item: ${id}`);
  return found;
}
