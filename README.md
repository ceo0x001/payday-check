# The 6-Minute Payday Check

An interactive, mobile-first financial self-assessment that answers one question:
**"Can your salary actually reach payday?"**

Nigeria-first (₦), globally shaped ($). No signup, no bank connection, no exact salary.

The full product specification — research design, every question and why it exists,
the results engine, and the analytics strategy — is in **[docs/SPEC.md](docs/SPEC.md)**.
Read that first; this file is just how to run it.

---

## What this actually is

Three things wearing one coat:

1. **A research instrument** designed to *falsify*, not confirm, the founding hypothesis.
2. **A gift to the user** — a genuinely useful mirror, delivered free and immediately.
3. **The first artifact of the brand.**

The central design constraint: the instrument must be able to return "you were wrong."
There are six competing explanations for why a salaried person misses payday, and each
implies a different company. Every result is tagged with which one it supports
(`results.hypothesis_signal`). **That distribution is the deliverable** — see
`v_hypothesis_distribution`.

---

## Getting started

```bash
pnpm install
```

```bash
pnpm dev
```

The app runs fully without a backend. Every write degrades to a no-op, so you can
demo the entire experience before a Supabase project exists.

### Connecting Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) in the SQL editor.
3. Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side only. Never exposed to the client |
| `ANALYTICS_SALT` | Any long random string, for one-way hashing |

**Security posture.** The browser never talks to Supabase. RLS is enabled with *no anon
policies at all* — deny by default — and every write goes through a Next.js route handler
using the service-role key, with zod validation and per-session rate limiting. This is
stricter than the usual anon-key pattern and removes the entire class of client-side
policy bugs. The anon key isn't needed and isn't shipped.

---

## Scripts

```bash
pnpm test
```

| Script | What it does |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` | Production build |
| `pnpm test` | Results-engine and instrument tests |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint, including the React Compiler rules |

---

## Architecture

```
src/
├── app/
│   ├── page.tsx                  landing + currency gate
│   ├── check/page.tsx            the flow
│   └── api/{session,answer,result,waitlist,event}/route.ts
├── components/
│   ├── flow/                     day-dial, question-view, progress, computing
│   ├── result/                   result-view, waitlist-form
│   └── ui/                       button, chip
├── lib/
│   ├── questions.ts              THE INSTRUMENT — 21 questions, as data
│   ├── engine.ts                 signals → archetype → copy → hypothesis tag
│   ├── locale.ts                 ₦ / $ option packs
│   ├── store.ts                  state, localStorage, incremental sync
│   └── api.ts, supabase.ts       validation, rate limiting, server client
└── supabase/migrations/
```

**The instrument is data, not JSX.** `questions.ts` is a typed array with branching
predicates. Changing a question is a one-line edit — which matters, because after the
first fifty responses you *will* rewrite three of them. Bump `version` when you do, or
the longitudinal analysis quietly lies to you.

**The engine reflects, it never forecasts.** No predictions, no score out of 100, and no
red anywhere in the palette. One archetype — The Tightrope — explicitly refuses to sell a
fix to people whose constraint is income rather than behaviour.

---

## Things that are deliberate, not oversights

- **Answers are written the moment they're given, not on submit.** A user who abandons at
  Q14 still gives us 14 answers. Drop-offs are the most informative respondents we have.
- **Demographics come last and are all skippable**, with an equally-weighted "prefer not
  to say". Asking first signals extraction.
- **Amounts are asked as fractions of a month's pay**, never absolute figures. Costs the
  user no privacy, and makes Lagos and Chicago directly comparable.
- **The result is delivered in full before the email is requested.** No gate.
- **The result screen animates on mount, not on scroll.** `whileInView` looked better but
  gates the product's payoff on an IntersectionObserver callback.
- **Only one free-text field is required** (`wish`), placed at ~85% depth.

---

## Analysis views

Created by the migration, ready to query:

| View | Question it answers |
|---|---|
| `v_hypothesis_distribution` | **Which company should we build?** |
| `v_dropoff_by_question` | Which question is breaking the experience? |
| `v_question_health` | Dwell, revision rate, skip rate per question |
| `v_funnel` | Start → complete, median duration |
| `v_completion_by_archetype` | Are Tightrope users abandoning before the result? |
| `v_verbatims` | The corpus from `wish`, `said_no`, `tool_gap` |

---

## Deploying

Push to GitHub, import in Vercel, add the three environment variables. No other
configuration needed.

One caveat: rate limiting is in-memory, which is fine for a single-region launch but
becomes per-instance if you scale horizontally. Swap `rateLimit()` in
[`src/lib/api.ts`](src/lib/api.ts) for Upstash Redis if that day comes.
