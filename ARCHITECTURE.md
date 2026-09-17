# Architecture

## Components

```
[React SPA (GitHub Pages)] ──HTTPS──> [Fastify API (Render/Fly)] ──> [Store]
                                        │
                                        ├──> [Model API] (M2: classification + constrained generation)
                                        └──> [Supabase Auth] (planned: magic link)
```

- **web** (`apps/web`): session flow UI, diagnostic renderer, waveform widget (canvas), progress bar. Holds no learner state beyond the session id and a device id.
- **api** (`apps/api`): session lifecycle, deterministic next-step policy (`policy.ts`), attempt classification (`classifier.ts`), widget telemetry intake. The authority on correctness and on "what comes next".
- **shared** (`packages/shared`): the API contract as TypeScript types. Imported by both sides; drift fails the build.
- **store** (`apps/api/src/store.ts`): persistence boundary. `MemoryStore` today; Postgres (Supabase) via `supabase/schema.sql` when `DATABASE_URL` is set.

## API boundaries

| Method | Route | Purpose |
|---|---|---|
| POST | `/sessions` | Create session for the device-id learner → `{ sessionId }` |
| GET | `/sessions/:id/next` | Deterministic next step (policy over session state) |
| POST | `/sessions/:id/attempts` | Submit answer → server classifies, records, advances, returns feedback + next step |
| POST | `/sessions/:id/interactions` | Batched widget telemetry → `{ accepted }` |
| GET | `/health` | Liveness |

Identity travels as `x-device-id`; the server upserts the learner. CORS is locked to `WEB_ORIGIN`.

## Data model

`learners → sessions → attempts`, plus `widget_interactions` (telemetry) and `mastery` (per-misconception strength, M3). Content tables (`concepts`, `misconceptions`, `diagnostic_items`) are seeded from `apps/api/src/seed.ts` — the authored taxonomy is versioned in code, not generated.

## The adaptive loop (deterministic)

1. Screening: 4 multiple-choice diagnostics (d1, d3, d5, d7), one per misconception.
2. Misses per misconception are counted server-side.
3. Explanation + manipulation target the weakest misconception.
4. Follow-up item ids are **frozen** when screening ends (`freezeFollowups`) so later misses can't reshuffle the remaining plan.
5. Follow-ups: free-text items for the two weakest misconceptions.

The model (M2) is a function the policy calls — classification and constrained generation only. It never picks the next step.

## Failure modes

| Failure | Behavior |
|---|---|
| Model timeout (M2) | Fall back to rules classifier; mark `classifierSource: "fallback"`; continue |
| Low confidence (<0.6) | Targeted clarifying question instead of a guessed label |
| DB unreachable | Retryable 5xx; never silently drop an attempt |
| Auth outage | Anonymous device-id mode (already the default) |
| Cost spike | Per-learner daily model-call budget; cache identical classifications |
| Widget JS error | Step still completable via Continue; telemetry gap is logged, not fatal |

## What stays deterministic

Taxonomy, diagnostic bank, waveform math, scoring, next-step policy, session state. These must be debuggable, testable, and free. If every model call failed, the product still teaches — with dumber feedback.
