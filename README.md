# Fourier Tutor


<img width="672" height="384" alt="image" src="https://github.com/user-attachments/assets/5a72aea5-6858-4fb5-ba47-87d8f42a0c85" />

---

An adaptive technical learning tool. V1 teaches one concept domain — Fourier / sine waves — by diagnosing a learner's specific misconception, targeting it with an interactive explanation, and adapting the follow-up based on what they got wrong.

This is a product-engineering flagship: the goal is coherent ownership across frontend, backend, database, AI integration, evaluation, and deployment — not maximum complexity.

## Quickstart

Prereqs: Node 20+.

```bash
npm install

# terminal 1 — API on :3001
npm run dev:api

# terminal 2 — web on :5173
npm run dev:web
```

Open http://localhost:5173. No database or API keys needed locally: the API runs on an in-memory store (sessions are lost on restart — a documented limitation, not an accident).

```bash
npm run typecheck   # all workspaces
npm run test        # all workspaces
npm run build       # all workspaces
```

## How it works

1. **Screening** — four multiple-choice diagnostics, one per misconception (m1–m4).
2. **Explanation** — targets the weakest misconception so far, stated as wrong-model vs. correct-model.
3. **Manipulation** — the waveform widget (frequency / amplitude / phase sliders); every slider move is logged.
4. **Follow-up** — free-text questions for the two weakest misconceptions, classified by the rules engine.
5. **Done** — progress saved per session.

The next-step policy is deterministic and lives server-side (`apps/api/src/policy.ts`). The classifier (`apps/api/src/classifier.ts`) maps free-text answers to the authored misconception taxonomy — currently keyword rules shaped like the future model classifier's interface (`{ misconceptionId, confidence, source }`), so the model swap in M2 touches one file.

## Repo map

```
apps/web        Vite + React + TS. Session flow UI, waveform widget.
apps/api        Fastify + TS. Sessions, deterministic policy, classifier, telemetry.
packages/shared The API contract. The client never decides correctness.
supabase/       Postgres schema for the real store (in-memory is the local default).
ARCHITECTURE.md Components, API, data model, failure modes.
DECISIONS.md    Decision log — the four-field format, kept from day one.
```

## Known limitations (V1)

- In-memory store: sessions vanish on API restart. Postgres schema is written; the swap is one `Store` implementation.
- Anonymous device-id identity only — no cross-device progress yet (magic link is the planned upgrade).
- Rules-based classifier, not a model yet; free-text accuracy is keyword-deep.
- Single concept domain by design (see DECISIONS.md D1).

## Deploy outline

- Web → GitHub Pages (`apps/web` build output; `VITE_API_URL` points at the API).
- API → Render/Fly (`apps/api`; set `WEB_ORIGIN=https://isaiahcampusano.github.io` and `PORT`).
- DB/Auth → Supabase (run `supabase/schema.sql`, set `DATABASE_URL`).
