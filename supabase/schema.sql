-- Fourier Tutor schema — run once in the Supabase SQL editor.
-- The API talks to storage through the Store interface (apps/api/src/store.ts);
-- point the Postgres implementation at these tables when DATABASE_URL is set.
-- RLS is enabled; the API uses the service-role key server-side.

create table if not exists learners (
  id uuid primary key default gen_random_uuid(),
  device_id text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists concepts (
  id text primary key,
  slug text unique not null,
  title text not null
);

create table if not exists misconceptions (
  id text primary key,
  concept_id text not null references concepts(id),
  label text not null,
  wrong_model text not null,
  correct_model text not null,
  widget_hint text not null
);

create table if not exists diagnostic_items (
  id text primary key,
  concept_id text not null references concepts(id),
  misconception_id text not null references misconceptions(id),
  prompt text not null,
  choices jsonb,
  correct_choice integer,
  distractor_misconceptions jsonb
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references learners(id),
  concept_id text not null references concepts(id),
  step_index integer not null default 0,
  misses jsonb not null default '{}'::jsonb,
  followup_item_ids jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
create index if not exists sessions_learner_idx on sessions(learner_id);

create table if not exists attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id),
  item_id text not null references diagnostic_items(id),
  response_text text not null,
  correct boolean not null,
  misconception_id text references misconceptions(id),
  confidence double precision,
  classifier_source text,
  latency_ms integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists attempts_session_idx on attempts(session_id);

create table if not exists widget_interactions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id),
  widget_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists widget_interactions_session_idx on widget_interactions(session_id);

create table if not exists mastery (
  learner_id uuid not null references learners(id),
  concept_id text not null references concepts(id),
  misconception_id text not null references misconceptions(id),
  strength double precision not null default 0.5,
  attempts_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (learner_id, concept_id, misconception_id)
);

alter table learners enable row level security;
alter table concepts enable row level security;
alter table misconceptions enable row level security;
alter table diagnostic_items enable row level security;
alter table sessions enable row level security;
alter table attempts enable row level security;
alter table widget_interactions enable row level security;
alter table mastery enable row level security;

-- Seed: one concept domain for V1 (matches apps/api/src/seed.ts).
insert into concepts (id, slug, title)
values ('fourier-sine-waves', 'fourier-sine-waves', 'Fourier & sine waves')
on conflict (id) do nothing;
