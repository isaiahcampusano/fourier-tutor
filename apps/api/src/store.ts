import type { WidgetInteraction } from "@fourier-tutor/shared";
import { randomUUID } from "node:crypto";

/**
 * Persistence boundary. The API only talks to this interface, so the
 * Postgres implementation (Supabase) can replace the in-memory one without
 * touching routes or policy. See supabase/schema.sql for the table shapes.
 */

export interface AttemptRecord {
  id: string;
  sessionId: string;
  itemId: string;
  responseText: string;
  correct: boolean;
  misconceptionId?: string;
  confidence?: number;
  classifierSource?: string;
  latencyMs: number;
  createdAt: string;
}

export interface SessionState {
  id: string;
  learnerId: string;
  conceptId: string;
  /** Index into the session's planned step list. */
  stepIndex: number;
  /** Misses per misconception — the adaptive signal the policy reads. */
  misses: Record<string, number>;
  /**
   * Frozen follow-up item ids, chosen once the screening phase ends.
   * Freezing keeps the plan stable: later misses must not reshuffle
   * steps the learner hasn't reached yet.
   */
  followupItemIds: string[] | null;
  status: "active" | "done";
  createdAt: string;
}

export interface Store {
  upsertLearner(deviceId: string): Promise<{ id: string }>;
  createSession(learnerId: string, conceptId: string): Promise<SessionState>;
  getSession(sessionId: string): Promise<SessionState | null>;
  saveSession(session: SessionState): Promise<void>;
  saveAttempt(attempt: Omit<AttemptRecord, "id" | "createdAt">): Promise<AttemptRecord>;
  saveInteractions(sessionId: string, events: WidgetInteraction[]): Promise<number>;
  getInteractionCount(sessionId: string): Promise<number>;
}

function now(): string {
  return new Date().toISOString();
}

/** Zero-config store for local dev. Data is lost on restart — documented limitation. */
export class MemoryStore implements Store {
  private learners = new Map<string, { id: string }>();
  private sessions = new Map<string, SessionState>();
  private attempts: AttemptRecord[] = [];
  private interactions = new Map<string, WidgetInteraction[]>();

  async upsertLearner(deviceId: string): Promise<{ id: string }> {
    const existing = this.learners.get(deviceId);
    if (existing) return existing;
    const learner = { id: randomUUID() };
    this.learners.set(deviceId, learner);
    return learner;
  }

  async createSession(learnerId: string, conceptId: string): Promise<SessionState> {
    const session: SessionState = {
      id: randomUUID(),
      learnerId,
      conceptId,
      stepIndex: 0,
      misses: {},
      followupItemIds: null,
      status: "active",
      createdAt: now()
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async getSession(sessionId: string): Promise<SessionState | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async saveSession(session: SessionState): Promise<void> {
    this.sessions.set(session.id, session);
  }

  async saveAttempt(
    attempt: Omit<AttemptRecord, "id" | "createdAt">
  ): Promise<AttemptRecord> {
    const record: AttemptRecord = { ...attempt, id: randomUUID(), createdAt: now() };
    this.attempts.push(record);
    return record;
  }

  async saveInteractions(sessionId: string, events: WidgetInteraction[]): Promise<number> {
    const existing = this.interactions.get(sessionId) ?? [];
    existing.push(...events);
    this.interactions.set(sessionId, existing);
    return events.length;
  }

  async getInteractionCount(sessionId: string): Promise<number> {
    return this.interactions.get(sessionId)?.length ?? 0;
  }
}
