import { useCallback, useEffect, useRef, useState } from "react";
import type { LessonStep, WidgetInteraction } from "@fourier-tutor/shared";
import { createSession, getNextStep, sendInteractions, submitAttempt } from "../lib/api";

export function useSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [step, setStep] = useState<LessonStep | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const interactionQueue = useRef<WidgetInteraction[]>([]);

  const start = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await createSession();
      const next = await getNextStep(session.sessionId);
      setSessionId(session.sessionId);
      setStep(next);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "Could not start session");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void start();
  }, [start]);

  async function answer(responseText: string) {
    if (!sessionId || !step?.item) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Note: the client never sends correctness — the server decides.
      const result = await submitAttempt(sessionId, {
        itemId: step.item.id,
        responseText
      });
      setStep(result.nextStep);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "Could not submit answer");
    } finally {
      setIsLoading(false);
    }
  }

  async function continueStep() {
    if (!sessionId || !step) {
      return;
    }

    if (step.kind === "manipulation" && interactionQueue.current.length > 0) {
      await sendInteractions(sessionId, interactionQueue.current);
      interactionQueue.current = [];
    }

    if (step.item) {
      await answer("continued");
      return;
    }

    setIsLoading(true);
    try {
      const result = await submitAttempt(sessionId, {
        itemId: `virtual-${step.kind}`,
        responseText: "continued"
      });
      setStep(result.nextStep);
    } finally {
      setIsLoading(false);
    }
  }

  function logInteraction(eventType: string, payload: Record<string, unknown>) {
    interactionQueue.current.push({
      widgetId: "waveform-widget",
      eventType,
      payload
    });
  }

  return {
    answer,
    continueStep,
    error,
    isLoading,
    logInteraction,
    restart: start,
    sessionId,
    step
  };
}
