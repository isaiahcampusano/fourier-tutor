import { FormEvent, useState } from "react";
import { useSession } from "../hooks/useSession";
import { WaveformWidget } from "./WaveformWidget";

export function SessionFlow() {
  const { answer, continueStep, error, isLoading, logInteraction, restart, step } = useSession();
  const [response, setResponse] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await answer(response);
    setResponse("");
  }

  if (isLoading && !step) {
    return <p className="status">Starting session...</p>;
  }

  if (error) {
    return (
      <section className="lesson-panel">
        <p className="error">{error}</p>
        <button type="button" onClick={restart}>
          Try again
        </button>
      </section>
    );
  }

  if (!step) {
    return null;
  }

  return (
    <section className="lesson-panel">
      <div className="progress-track" aria-label="Progress">
        <div style={{ width: `${step.progress * 100}%` }} />
      </div>
      <p className="eyebrow">{step.kind}</p>
      <h1>{step.title}</h1>
      <p>{step.prompt}</p>

      {step.item?.choices ? (
        <div className="choice-grid">
          {step.item.choices.map((choice) => (
            <button key={choice} type="button" onClick={() => void answer(choice)}>
              {choice}
            </button>
          ))}
        </div>
      ) : null}

      {step.kind === "manipulation" ? <WaveformWidget onInteract={logInteraction} /> : null}

      {step.item && !step.item.choices ? (
        <form className="answer-form" onSubmit={(event) => void onSubmit(event)}>
          <textarea
            value={response}
            onChange={(event) => setResponse(event.target.value)}
            placeholder="Type your answer"
            rows={4}
          />
          <button type="submit" disabled={response.trim().length === 0 || isLoading}>
            Submit
          </button>
        </form>
      ) : null}

      {!step.item && step.kind !== "done" ? (
        <button type="button" onClick={() => void continueStep()} disabled={isLoading}>
          Continue
        </button>
      ) : null}

      {step.kind === "manipulation" ? (
        <button type="button" onClick={() => void continueStep()} disabled={isLoading}>
          I noticed the pattern
        </button>
      ) : null}

      {step.kind === "done" ? (
        <button type="button" onClick={restart}>
          Start another session
        </button>
      ) : null}
    </section>
  );
}
