# Decisions

Four-field format, written the day the decision is made. Newest last.

## D1 — One concept domain for V1 (Fourier / sine waves)

- **Decision:** V1 teaches exactly one concept domain with an authored misconception taxonomy (m1–m4).
- **Alternatives:** Arbitrary concepts via pure LLM generation.
- **Reason:** A finite taxonomy makes classification evaluable, the widget deterministic, and the content debuggable. "Any concept" is a research project.
- **Tradeoff:** Narrower demo surface; "any concept" becomes the V2 story.

## D2 — Supabase for Postgres + Auth (planned)

- **Decision:** Postgres + Auth via Supabase when the real store lands.
- **Alternatives:** SQLite+Prisma, Neon+Lucia, Firebase.
- **Reason:** One free tier, real SQL, real auth, zero ops.
- **Tradeoff:** Vendor coupling; schema is written to be portable if we migrate.

## D3 — Model as classifier, not conversationalist

- **Decision:** The model (M2) classifies free-text answers into the fixed taxonomy and generates constrained follow-ups from templates. It never drives the session.
- **Alternatives:** Open-ended tutoring chat.
- **Reason:** Fixed label sets are evaluable; a deterministic policy stays debuggable and cheap.
- **Tradeoff:** Less "magical" demo surface.

## D4 — Separate web/API deploys

- **Decision:** GitHub Pages (web) + Render/Fly (API), real API boundary with CORS and env separation.
- **Alternatives:** Vercel for web, or single box serving both.
- **Reason:** Pages is where your portfolio already lives — zero new platform to learn; the API boundary is what matters for the interview story, not which static host.
- **Tradeoff:** Project Pages need the `/fourier-tutor/` base path (set in vite config); API still needs a real host.

## D5 — TypeScript everywhere

- **Decision:** TS in web, API, and shared contract.
- **Alternatives:** JS frontend + Python backend.
- **Reason:** One language; shared types make the API contract compile-time checked.
- **Tradeoff:** Gives up Python's ML ecosystem (irrelevant — the model is API-based).

## D6 — Kept Codex's fresh widget instead of porting fourier-transform

- **Decision:** The M1 waveform widget is the simpler sine+overtone canvas Codex built, not a port of the fourier-transform repo's phasor/spectrum visualizer.
- **Alternatives:** Port the full visualizer now.
- **Reason:** Codex's widget is working, tested, and sufficient for the manipulation step; porting is a content upgrade, not a blocker.
- **Tradeoff:** Loses the spectrum/phasor richness that would attack m4 (square-wave harmonics) harder. Revisit when m4 follow-up pass rates disappoint.

## D7 — The server decides correctness; the client never sends it

- **Decision:** Removed `correct` from `SubmitAttemptRequest`. Codex's draft had the client computing `correct: responseText.trim().length > 0` and sending it.
- **Alternatives:** Trust the client flag.
- **Reason:** Correctness is a trust boundary. A client-computed flag is both a cheating vector and a lie in the data — every evaluation metric downstream would be corrupt.
- **Tradeoff:** Slightly more server code; none, really.

## D8 — In-memory store behind the Store interface

- **Decision:** Local dev runs on `MemoryStore`; Postgres schema (`supabase/schema.sql`) is written and the swap is one implementation of the `Store` interface.
- **Alternatives:** Require Supabase from day one.
- **Reason:** Zero-config local loop; no blocked onboarding.
- **Tradeoff:** Sessions lost on restart. Documented in README as a limitation, not a surprise.

## D9 — Anonymous device-id identity first

- **Decision:** Learners are identified by the `x-device-id` header (localStorage UUID), upserted server-side. Magic-link auth deferred.
- **Alternatives:** Magic link now.
- **Reason:** Matches the built frontend; removes the auth provider from the critical path to a first live deploy.
- **Tradeoff:** No cross-device progress; device IDs are forgeable (fine for a learning product, noted).
