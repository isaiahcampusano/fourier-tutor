/**
 * Shared contract between apps/web and apps/api.
 * The API is the authority on correctness — the client never decides
 * whether an answer is right; it only collects responses.
 */

export interface CreateSessionResponse {
  sessionId: string;
}

export type StepKind =
  | "diagnostic"
  | "explanation"
  | "manipulation"
  | "followup"
  | "done";

export interface DiagnosticItemRef {
  id: string;
  /** Present for multiple-choice items. Absent = free-text answer. */
  choices?: string[];
}

export interface LessonStep {
  kind: StepKind;
  title: string;
  prompt: string;
  /** 0..1 fraction of the session completed after this step. */
  progress: number;
  item?: DiagnosticItemRef;
  misconceptionId?: string;
}

export interface SubmitAttemptRequest {
  itemId: string;
  responseText: string;
}

export type ClassifierSource = "rules" | "model" | "fallback";

export interface SubmitAttemptResponse {
  correct: boolean;
  misconceptionId?: string;
  confidence?: number;
  classifierSource?: ClassifierSource;
  feedback: string;
  nextStep: LessonStep;
}

export interface WidgetInteraction {
  widgetId: string;
  eventType: string;
  payload: Record<string, unknown>;
}
