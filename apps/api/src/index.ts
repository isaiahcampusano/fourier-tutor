import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import type { SubmitAttemptRequest, WidgetInteraction } from "@fourier-tutor/shared";
import { classify } from "./classifier.js";
import { CONCEPT_ID, getItem } from "./seed.js";
import { MemoryStore, type Store } from "./store.js";
import {
  POST_SCREENING_INDEX,
  currentStep,
  freezeFollowups,
  planSteps,
  totalSteps
} from "./policy.js";

const PORT = Number(process.env.PORT ?? 3001);
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? "http://localhost:5173";

// Postgres store replaces this when DATABASE_URL is set (see supabase/schema.sql).
const store: Store = new MemoryStore();

const app = Fastify({ logger: true });
await app.register(cors, { origin: WEB_ORIGIN });

function deviceId(request: { headers: Record<string, string | string[] | undefined> }): string {
  const header = request.headers["x-device-id"];
  const id = Array.isArray(header) ? header[0] : header;
  if (!id) {
    throw httpError(400, "Missing x-device-id header");
  }
  return id;
}

function httpError(statusCode: number, message: string): Error & { statusCode: number } {
  return Object.assign(new Error(message), { statusCode });
}

app.get("/health", async () => ({ ok: true }));

// --- Sessions ---------------------------------------------------------------

app.post("/sessions", async (request) => {
  const learner = await store.upsertLearner(deviceId(request));
  const session = await store.createSession(learner.id, CONCEPT_ID);
  return { sessionId: session.id };
});

app.get("/sessions/:id/next", async (request) => {
  const session = await store.getSession((request.params as { id: string }).id);
  if (!session) throw httpError(404, "Unknown session");
  return currentStep(session);
});

// --- Attempts ---------------------------------------------------------------

app.post<{ Params: { id: string }; Body: SubmitAttemptRequest }>(
  "/sessions/:id/attempts",
  async (request) => {
    const session = await store.getSession(request.params.id);
    if (!session) throw httpError(404, "Unknown session");
    if (session.status === "done") throw httpError(400, "Session is done");

    const { itemId, responseText } = request.body;
    if (typeof responseText !== "string" || responseText.trim().length === 0) {
      throw httpError(400, "responseText is required");
    }

    const startedAt = Date.now();

    if (itemId.startsWith("virtual-")) {
      // Non-item steps (explanation / manipulation "continue") just advance.
      session.stepIndex += 1;
      if (session.stepIndex === POST_SCREENING_INDEX) freezeFollowups(session);
      if (session.stepIndex >= totalSteps(session)) session.status = "done";
      await store.saveSession(session);
      return {
        correct: true,
        classifierSource: "rules" as const,
        feedback: "Onward.",
        nextStep: currentStep(session)
      };
    }

    // The server decides correctness. The client never sends it.
    const item = getItem(itemId);
    const result = classify(itemId, responseText);
    const latencyMs = Date.now() - startedAt;

    await store.saveAttempt({
      sessionId: session.id,
      itemId: item.id,
      responseText: responseText.slice(0, 2000),
      correct: result.correct,
      misconceptionId: result.misconceptionId,
      confidence: result.confidence,
      classifierSource: result.source,
      latencyMs
    });

    if (!result.correct) {
      session.misses[result.misconceptionId] = (session.misses[result.misconceptionId] ?? 0) + 1;
    }
    session.stepIndex += 1;
    if (session.stepIndex === POST_SCREENING_INDEX) freezeFollowups(session);
    if (session.stepIndex >= totalSteps(session)) session.status = "done";
    await store.saveSession(session);

    return {
      correct: result.correct,
      misconceptionId: result.misconceptionId,
      confidence: result.confidence,
      classifierSource: result.source,
      feedback: result.feedback,
      nextStep: currentStep(session)
    };
  }
);

// --- Widget interactions (fire-and-forget telemetry) -------------------------

app.post<{ Params: { id: string }; Body: { events: WidgetInteraction[] } }>(
  "/sessions/:id/interactions",
  async (request) => {
    const session = await store.getSession(request.params.id);
    if (!session) throw httpError(404, "Unknown session");
    const events = Array.isArray(request.body.events) ? request.body.events : [];
    // Cap batch size so a misbehaving client can't flood the store.
    const accepted = await store.saveInteractions(session.id, events.slice(0, 200));
    return { accepted };
  }
);

await app.listen({ port: PORT, host: "0.0.0.0" });
