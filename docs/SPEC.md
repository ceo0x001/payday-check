# The 6-Minute Payday Check — Product Specification

**Version** 1.0 · **Status** Build spec · **Owner** Founding team
**One line** An interactive, mobile-first financial self-assessment that answers: *"Can your salary actually reach payday?"*

---

## 0. The part where I challenge you

You asked me to validate one hypothesis:

> *Salary earners don't struggle because they can't budget — they struggle because they can't see the future consequences of today's spending decisions.*

**That sentence is a conclusion, not a hypothesis.** If I design 21 questions around it, 21 questions will confirm it, and you will raise money on a finding you manufactured. The most expensive mistake a pre-product startup can make is building an instrument that can only return "yes."

So this experience is designed to **falsify** it. There are at least six live explanations for why a salaried person runs out of money before payday, and they imply completely different companies:

| # | Hypothesis | What it means | What you'd have to build |
|---|---|---|---|
| **H1** | **Visibility** (yours) | They can't see forward consequences | A forecasting / simulation layer |
| **H2** | **Adequacy** | The salary genuinely does not cover the obligations | Income tools, not budgeting tools. Possibly not a venture business |
| **H3** | **Lumpiness** | Income is monthly; obligations are irregular and clustered | A smoothing / sinking-fund product |
| **H4** | **Obligation** | Money leaves via other people's non-negotiable needs | Boundary and negotiation tools, family-aware accounts |
| **H5** | **Regulation** | They *can* see the consequence and spend anyway | Friction, commitment devices — foresight alone changes nothing |
| **H6** | **Treadmill** | Last cycle's borrowing eats this cycle's buffer | Debt-exit sequencing, not forecasting |

Every act of this experience is instrumented to separate these. **Question `inevitability` (Act 5) is the single question that decides your company.** If fewer than ~40% of respondents land in H1, your founding hypothesis is wrong — and this instrument will tell you *which* of the other five is right, which is worth far more than a confirmation.

**Three more challenges, taken as decisions in this spec:**

1. **Six minutes is a long time, and that's on purpose — but it must be *engineered*, not endured.** The labor-illusion effect means people value a 6-minute assessment more than a 60-second quiz, and the title is a promise. But median completion must land at **5:00–5:30**, and *perceived* time must be lower than actual. Mechanisms: one question per screen, tap-first answers (only one required text field in the whole flow), six named chapters instead of one long bar (goal-gradient effect fires six times, not once), and honest time-remaining rather than a percentage.

2. **We never ask for an exact salary, and mostly not for salary at all.** It is the single largest drop-off risk and the fastest way to feel like a data-harvesting funnel. Instead, amounts are asked as **fractions of a month's pay** ("less than a tenth" … "more than half"). This sidesteps privacy, sidesteps currency, and — critically — produces data that is **directly comparable between Lagos and Chicago**. Absolute salary is asked once, last, in bands, fully skippable.

3. **We must be willing to tell some users we can't help them.** A user whose fixed obligations exceed their income does not have a discipline problem, and selling them a visibility product is a lie. The results engine has a dedicated archetype (**The Tightrope**) whose output explicitly says *"nothing here is a discipline problem."* This will lower waitlist conversion by a few points and is the single most trust-building decision in the product.

**Cut without ceremony:** account creation, bank linking, NPS, "rate these features 1–5", any mention of what we're building before the user has told us what they want, exact-salary-on-screen-two, "how did you hear about us" (that's a UTM, not a question), and a consent wall (replaced by one honest line).

---

## 1. Strategy

### 1.1 What this actually is
Three products wearing one coat:

1. **A research instrument** that produces structured, comparable data on why salary earners miss payday.
2. **A gift to the user** — a genuinely useful mirror they get for free, immediately, with no signup.
3. **The first artifact of the brand.** Whatever we ship later, this is how people meet us. It must feel like a company worth trusting with money.

If a question doesn't serve #1 *and* survive #2's "would a user resent answering this?" test, it's cut.

### 1.2 Positioning
Not a budgeting app. Not a quiz. **A check-up.** The mental model is a health screening: short, structured, slightly serious, and it tells you something true about yourself.

### 1.3 Success metrics
| Metric | Target | Why |
|---|---|---|
| Start rate (landing → Q1) | ≥ 60% | Tests the promise |
| Completion rate (Q1 → result) | ≥ 55% | Interactive-quiz benchmark is ~40%; below 45% the instrument is too long |
| Median completion time | 5:00–5:30 | Honours the title |
| Waitlist conversion (result → email) | ≥ 30% | |
| **Interview opt-in** (of waitlist) | **≥ 25%** | **The real metric.** Emails are vanity; 20 conversations is a company |
| Organic share rate | ≥ 8% | Proxy for "that was beautiful" |
| Required-text answer rate | ≥ 85% | If people skip `wish`, the flow lost them before Act 5 |

### 1.4 Non-goals
No predictions. No "you will run out on the 22nd." No financial advice. No scores out of 100 that imply a credit judgement. The engine **reflects**, it does not **forecast** — this is both an integrity line and a regulatory one.

---

## 2. Experience architecture

### 2.1 The spine

```
Landing ──▶ Currency ──▶ Act 1 ──▶ Act 2 ──▶ Act 3 ──▶ Act 4 ──▶ Act 5 ──▶ Act 6 ──▶ Reading… ──▶ Result ──▶ Waitlist ──▶ Confirmed
             (₦ / $)     Shape     Where it    The gap    What you    The       Just
                         of your   goes        months     already do  moment    enough
                         month                                                  context
```

### 2.2 Chapters, as the user sees them

| Act | Label shown | Qs | Target time | Job |
|---|---|---|---|---|
| 1 | Your month | 3 | 0:20–1:30 | Rhythm, the Squeeze Point, severity |
| 2 | Where it goes | 4 | 1:30–2:45 | Outflow order, shocks, non-negotiables |
| 3 | The short weeks | 4 | 2:45–3:45 | Coping, emotion, treadmill |
| 4 | What you already do | 3 | 3:45–4:40 | Tools, homemade mechanisms |
| 5 | The moment | 2 | 4:40–5:20 | **Hypothesis discrimination** + unprompted need |
| 6 | About you | 4 | 5:20–5:50 | Segmentation. Last. All skippable |

**21 questions ≈ 17s each.** Sixteen are pure taps.

### 2.3 Pacing rules
- **One question per screen.** Always. No exceptions, no two-parters visible at once.
- **Auto-advance on single-select** after a 280ms confirmation beat (the chip fills, then the screen leaves). This is what makes it feel fast.
- **Multi-select and sliders require an explicit Continue** — auto-advance there feels like being rushed.
- **Reflection cards** after Acts 1, 3 and 4. No question, no data — a single sentence that reflects *their own answer* back. They are the rest-stops that make 6 minutes survivable.
- **Reflection cards never fabricate a benchmark.** We do not have a dataset yet, so we never say "72% of people…". We say what we actually know: what they just told us.

### 2.4 Progress indicator
Three layers, because a bare percentage is demotivating in the middle third:
1. A 2px hairline bar, spring-animated, at the very top.
2. Chapter text: `Where it goes · 2 of 4` — resets six times, so the goal always feels near.
3. A time chip: `about 4 min left`, computed from median dwell so far, rounded down and never allowed to go up.

### 2.5 Navigation & state
- **Back** is always available; answers are preserved and re-editable.
- **Every answer writes immediately** to the server (fire-and-forget) and to `localStorage`. A user who abandons at Q14 still gives us 14 answers — most survey tools throw that away, and drop-offs are the most informative respondents we have.
- **Resume**: returning within 7 days restores the session and offers *"Pick up where you left off?"*

---

## 3. The instrument — every question, and why it exists

> **Notation:** `id` · type · *purpose* · **signal it feeds**

### Gate — Currency
**`currency`** · 2-way toggle, part of the landing card
> **Which currency do you earn in?** — ₦ Naira · $ Dollar

*Purpose:* Sets the locale pack — currency symbol, borrowing options, expense categories, tracking tools. Nigeria-first, globally shaped.
**Feeds:** `locale`, and every option list downstream.
*Design note:* framed as a warm question, not a settings menu. It doubles as the first micro-commitment — a tap before the real work begins raises completion (foot-in-the-door).

---

### ACT 1 — Your month

**`pay_rhythm`** · single-select
> **How does money arrive for you?**
> Once a month · Twice a month · Every week · It varies

*Why:* Sets `cycle_days` (30 / 15 / 7 / 30+flag) — the denominator for everything. "It varies" is not a footnote; irregular-income salary earners are a distinct segment with a different product.
**Feeds:** `cycle_days`, `irregular_income`.

**`squeeze_day`** · **the signature interaction** — a 30-day dial
> **Drag to the day your money starts feeling tight.**
> *There's no wrong answer here. Most people know it instantly.*

*Why:* This is the emotional and analytical centre of the product. It is a single gesture that produces the primary metric, and it is the moment the user realises this thing is about *them*. Asking "what day?" rather than "how much?" gets a fast, honest, low-shame answer — people who would never disclose a salary will tell you it's the 17th without hesitation.
**Feeds:** `squeeze_day` → **Runway**, **Tight Days**.
*Falsification value:* a squeeze day at 90%+ of cycle identifies the control group we need most.

**`reach_months`** · 0–6 stepper
> **In the last 6 months, how many times did you reach payday without borrowing, dipping into savings, or skipping something you needed?**

*Why:* Frequency and severity, asked **behaviourally**. Never "do you manage money well?" — self-report on competence is worthless. This is episodic, countable, and bounded. It is also the gate for **The Steady Hand** archetype.
**Feeds:** `severity`, control-group flag.

*→ Reflection card: reflects their squeeze day back in plain language.*

---

### ACT 2 — Where it goes

**`first_72`** · multi-select, **capture order of selection**
> **In the first 72 hours after you're paid, what leaves first?**
> *Tap them in the order they happen.*

Options (₦): Rent or housing · School fees · Paying back what I borrowed · Family or people who depend on me · Food shopping for the month · Transport / fuel · Tithe or offering · Data and airtime · Subscriptions · Savings · Something for myself
Options ($): Rent or mortgage · Credit card or loan payment · Family I support · Groceries · Gas / commute · Subscriptions · Savings · Something for myself · Childcare · Insurance

*Why:* Order is the insight, not the items. **Where "Savings" sits in the sequence is one of the strongest predictors in the entire instrument** — pay-yourself-first behaviour is visible here without ever asking a leading question about it. Selecting ≥4 items with a low squeeze day is the Front-Loader signature. Presence of "Paying back what I borrowed" in the first three positions is a hard Treadmill flag.
**Feeds:** `frontload`, `savings_rank`, `debt_first`, `provider`.

**`shocks`** · multi-select
> **Which of these landed on you last month that you hadn't planned for?**
> Vehicle or transport repair · Health / medical · Family emergency · School or tuition · A gift, wedding or funeral · Phone or device · Rent increase · Job or income change · None of these

*Why:* Directly tests **H3 (lumpiness)**. If people miss payday primarily in shock months, the product is a sinking fund, not a forecast. "A gift, wedding or funeral" is deliberately included — in Nigerian and many diaspora contexts, social-event obligations are a major, systematically under-measured outflow.
**Feeds:** `ambush`, `shock_count`.

**`shock_size`** · single-select · *shown only if `shocks` ≠ none*
> **Roughly how big was the biggest one?**
> Less than a tenth of a month's pay · Around a fifth · Around a third · About half · More than half a month's pay

*Why:* Magnitude, **relative to income**. No currency, no privacy cost, and cross-market comparable. A third-of-salary shock means something identical in Lagos and Chicago; ₦150,000 does not.
**Feeds:** `shock_severity`.

**`cant_cut`** · single-select + optional text
> **What's the one expense you'd cut if you could — but genuinely can't?**

*Why:* Surfaces *perceived* non-negotiables, which is where the gap between H1 and H4 lives. If the answer is overwhelmingly "family/people who depend on me," this is not a foresight company. The optional text field here is where the best verbatims in the whole study come from.
**Feeds:** `provider`, qualitative corpus.

---

### ACT 3 — The short weeks

**`coping`** · multi-select
> **When money runs short before payday, what do you actually do?**
> *Tap everything that's true. No judgement here — this is the most useful question in the whole check.*

Options (₦): Borrow from friends or family · Use a loan app · Ask for a salary advance at work · Draw from ajo / esusu / a contribution · Buy on credit from a shop or vendor · Sell something · Use my savings · Delay a bill · Eat less or eat cheaper · Cut transport / stay home · Just wait it out
Options ($): Credit card · Buy now, pay later · Overdraft my account · Cash advance app · Payday loan · Borrow from friends or family · Ask work for an advance · Sell something · Use my savings · Delay a bill · Cut back on food · Just wait it out

*Why:* The coping repertoire is the competitive landscape. Every item is an incumbent. It also splits the population into **borrowers** (branching to the treadmill questions) and **absorbers** (who cut consumption instead — a group whose costs are invisible in financial data and severe in real life).
**Feeds:** `borrowed`, `absorbs`, `treadmill` precursor.
*Microcopy note:* the "no judgement" line is load-bearing. This question has the highest shame potential in the flow and the highest information value; the copy has to buy the honesty.

**`borrow_feeling`** · multi-select emotion chips · *only if `coping` includes a borrow option*
> **How did that feel?**
> Relieved · Stressed · Embarrassed · Completely normal · Resentful · In control · Numb about it

*Why:* Emotional triggers, asked at the point of actual behaviour rather than in the abstract. **"Completely normal" is the most commercially significant answer in this question** — if borrowing has been normalised, a product that frames it as failure will be rejected. Includes positive options so it isn't a shame-funnel.
**Feeds:** `emotional_load`, `normalisation`.

**`borrow_aftermath`** · single-select · *only if borrowed*
> **And what happened at the next payday?**
> Paid it back and was fine · Paid it back and was immediately short again · Paid back some of it · Rolled it over or borrowed again · Still owing it now

*Why:* **The treadmill detector, and the most decision-relevant question in the study.** Options 2–5 mean the user is in a self-reinforcing debt cycle where the binding constraint is debt service, not foresight — H6, not H1. Forecasting is close to useless for these users; sequencing and consolidation are not.
**Feeds:** `treadmill`.

**`said_no`** · optional short text
> **What's the last thing you said no to because of money?**
> *One line is enough. Skip if you'd rather not.*

*Why:* Two jobs. Research: the highest-quality verbatims in the study — concrete, emotional, quotable in a pitch deck in a way that no multiple-choice ever is. Experience: this is the emotional low point of the journey by design, and it is placed immediately before Act 4, which restores agency by asking what they're already doing right. That contour — name the cost, then name the competence — is what makes the ending land instead of stinging.
**Feeds:** qualitative corpus, `emotional_load`.

*→ Reflection card, calibrated to whether they borrowed.*

---

### ACT 4 — What you already do

**`tracking`** · single-select
> **How do you keep track of your money right now?**
> In my head · Notes app · A spreadsheet · My bank's app · A budgeting app · A physical notebook · My partner handles it · I don't really track it

*Why:* Incumbent + sophistication. "In my head" is the true market leader and the real competitor. "My partner handles it" identifies a household-unit user that most fintech ignores entirely.
**Feeds:** `tool_sophistication`, competitor map.

**`tool_gap`** · **adaptive** short text
> If they use a tool → **What does it still not do for you?**
> If they don't → **What's stopped you from using one?**

*Why:* Adaptive branching means both answers are useful and neither is a non-sequitur. This is the clearest product-requirements signal in the instrument, and asking it as a *gap* rather than a *wish* avoids the feature-request trap — people describe wishes as features and gaps as jobs.
**Feeds:** product requirements, churn causes.

**`mechanisms`** · multi-select
> **Which of these do you already do?**
> Keep money in a separate account so I don't touch it · Pay everything the day I'm paid · Give money to someone to hold for me · Ajo / esusu / a savings group · Keep some as cash, away from the app · Automatic savings · Buy in bulk early in the month · Use a separate phone or account for spending · None of these

*Why:* **The most under-asked question in consumer fintech.** Homemade coping mechanisms are unfunded, unmarketed, high-friction solutions people invented themselves — which means they reveal the job-to-be-done with almost no contamination. Every item here is a feature someone already wants badly enough to build by hand.
**Feeds:** `self_efficacy` (guarantees a strength in the result), product roadmap.

*→ Reflection card naming their mechanism back to them, or acknowledging its absence without judgement.*

---

### ACT 5 — The moment

**`inevitability`** · single-select · **the hypothesis test**
> **Think about the last time you ran short. Looking back, was there a moment where it became inevitable?**
> I can point to the exact moment · Only in hindsight — I couldn't see it then · No, it was the whole month adding up · No — the money was never going to be enough

*Why:* This one question discriminates between all six hypotheses, and it does it without ever mentioning forecasting, apps, visibility, or us:
- *Exact moment* → they had the information → **H5 (regulation)**, not H1
- *Only in hindsight* → **H1 (visibility)** — the founding hypothesis, cleanly isolated
- *Whole month* → **H1/H6** — diffuse accumulation
- *Never enough* → **H2 (adequacy)** — no visibility product helps this person

**Feeds:** `hypothesis_signal`, `archetype`.

**`knew`** · single-select · *only if "exact moment"*
> **At that moment, did you know?**
> I knew, and I did it anyway · I had a feeling but wasn't sure · I had no idea

*Why:* Splits H1 from H5 with no ambiguity left. **"I knew and I did it anyway" is the answer that should frighten us most** — it means a beautiful forecasting product changes nothing, and the company needs commitment devices and friction instead. We need to know that in month one, not month eighteen.
**Feeds:** `hypothesis_signal` (final arbitration).

**`wish`** · **the only required text field**
> **If someone who could see your money could warn you about one thing each month — what would you want them to warn you about?**
> *There's no right answer. First thing that comes to mind.*

*Why:* This is "what do you wish existed," rewritten three ways to remove three biases. **"A trusted person"** instead of "an app" gets a job-to-be-done rather than a feature list. **"Warn you about"** elicits the anticipated pain rather than an imagined UI. And it sits **before any mention of our product** — nothing in the preceding 18 questions has hinted at what we're building, so the answer is uncontaminated.
*Design note:* the only required free text in the flow, placed at ~85% depth where sunk cost is maximal and fatigue hasn't yet won. Placeholder rotates with light examples to defeat blank-page paralysis without leading the answer.
**Feeds:** the roadmap. This is the corpus you'll re-read fifty times.

---

### ACT 6 — About you
*All four skippable, all with an equally-weighted "Prefer not to say." Demographics last, always — asking them first signals extraction, asking them last signals context.*

**`salary_band`** · currency-aware bands · skippable — cross-tab for H2
**`dependants`** · 0 / 1–2 / 3–5 / 6+ — the H4 test; the strongest single predictor of provider pressure
**`work_type`** · Private salaried / Public sector / Salary + side income / Contract or gig · — side-income earners have a fundamentally different cash rhythm
**`location`** · country + optional city — market sizing

---

## 4. The results engine

### 4.1 Design principles
1. **Reflect, never predict.** Every line traces to something the user said. No "you'll run out on the 22nd."
2. **No red. Ever.** Red is judgement. The palette tops out at warm amber.
3. **No score out of 100.** A number that looks like a credit score invites shame and implies an authority we don't have.
4. **Everyone gets a strength, first.** Self-affirmation before threatening information measurably increases receptivity — and it's also just true. Anyone who finished this has done something most people avoid.
5. **The Tightrope gets the truth.** If income is the binding constraint, we say so.

### 4.2 Derived metrics

```
cycle_days   = { monthly: 30, semi_monthly: 15, weekly: 7, irregular: 30 }
runway_pct   = squeeze_day / cycle_days
tight_days   = cycle_days − squeeze_day
```

Presented as: *"Your money starts thinning around day 18 of 30 — about 12 days of every month spent in the tight zone."* Descriptive. Their own number, given back with structure.

### 4.3 Signals

| Signal | Condition |
|---|---|
| `steady` | `reach_months ≥ 5` and no borrowing in `coping` |
| `tightrope` | `inevitability = never_enough`, **or** (`reach_months ≤ 1` and no shocks and not treadmill) |
| `treadmill` | borrowed **and** `borrow_aftermath ∈ {short_again, partial, rolled, still_owing}` |
| `provider` | `dependants ≥ 3` **or** family in `first_72` top-3 **or** `cant_cut = family` |
| `ambush` | `shock_count ≥ 1` **and** `shock_size ∈ {third, half, more}` |
| `frontload` | `runway_pct ≤ 0.5` **and** `first_72.length ≥ 4` |
| `slow_leak` | fallback |

### 4.4 Archetypes — resolved in strict priority order

Priority matters more than accuracy here: it guarantees we never tell someone with an income problem that they have a discipline problem.

1. **The Steady Hand** — *You reach payday. That's rarer than you think.* (control group; our most valuable respondents)
2. **The Tightrope** — *This isn't a discipline problem.* → H2
3. **The Treadmill** — *Last month's shortfall is eating this month's salary.* → H6
4. **The Provider** — *Your money is doing more than one person's job.* → H4
5. **The Ambush Payer** — *You don't overspend. You get ambushed.* → H3
6. **The Front-Loader** — *Your month has two halves, and they don't look alike.* → H1/H3
7. **The Slow Leak** — *No villain. Just a hundred small exits.* → H1

### 4.5 Result screen composition

```
1. "Reading your month…"          staged 2.2s build, honest (we are computing)
2. Your pattern                   archetype name + one-line definition
3. Your runway                    the animated day-dial, replayed with their number
4. What we noticed                2–3 lines, each quoting their own answer back
5. What's already working         always present, never generic
6. Your biggest cash-flow challenge   one sentence, from the top signal
7. The honest part                Tightrope only — refuses to sell a fix
8. Share card                     archetype + runway, zero personal data
9. Waitlist invitation
```

### 4.6 Hypothesis tagging *(stored, never shown)*
Each result records `hypothesis_signal ∈ {H1…H6}` derived from `inevitability` × `knew` × dominant behavioural signal. The distribution across ~200 completions is the deliverable. **Read it before you write another line of product code.**

---

## 5. Waitlist — an invitation, not a funnel

**Framing:** *"We're building this with about 100 people first."* Scarcity that is true, or it isn't used.

**Fields:** email (required) · first name (optional, "what should we call you?") · **"Would you be willing to talk to us for 15 minutes?"** (yes/no).

That third field is the point. Emails are vanity metrics; twenty conversations is a company. Interview opt-in rate is the KPI we actually watch.

**Confirmation:** real queue position from a live count (never fabricated), three honest bullets on what happens next, and a share prompt — placed *after* the ask, so it reads as an offer rather than a toll.

**No dark patterns.** No pre-checked boxes, no "no thanks, I like being broke" decline copy, no interstitial before the result. **The result is delivered in full before the email is ever requested.** If the result is good, the email is easy; if we have to trap people to get it, the result wasn't good enough.

---

## 6. Analytics

### 6.1 Events
`session_start` · `currency_selected` · `question_shown` · `question_answered` · `question_skipped` · `question_back` · `flow_abandoned` · `result_computed` · `result_viewed` · `share_clicked` · `waitlist_shown` · `waitlist_submitted` · `interview_opt_in` · `resumed`

### 6.2 Per-question telemetry
`dwell_ms` · `change_count` (answer revisions — a proxy for question ambiguity) · `skipped` · `reached_at`.

### 6.3 The dashboard that matters
1. **Drop-off by question** — this iterates the instrument itself. Any question above 8% drop-off gets rewritten or cut.
2. **Hypothesis distribution** — the reason the product exists.
3. **Median time per act** — if Act 3 runs long, it's too heavy.
4. **`change_count` outliers** — high revision means the question is unclear, not that the user is indecisive.
5. **Completion × archetype** — if Tightrope users abandon before the result, the copy is shaming them somewhere.

### 6.4 Privacy
No names required, no bank data, no exact salary required. IP is never stored; user-agent is hashed for device-class only. One honest line at the start, linked to a plain-English note — not a consent wall.

---

## 7. Data model

```sql
sessions (id uuid pk, token uuid, currency, locale, cycle_days,
          utm_source/medium/campaign, referrer, device_class, ua_hash,
          started_at, completed_at, duration_ms, resumed_count, last_question_id)

answers  (id, session_id fk, question_id, question_version, value jsonb,
          dwell_ms, change_count, skipped, answered_at)
          unique(session_id, question_id)

results  (session_id pk fk, archetype, secondary_archetype,
          cycle_days, squeeze_day, runway_pct, tight_days,
          hypothesis_signal, signals jsonb, headline, computed_at)

waitlist (id, session_id fk null, email citext unique, first_name,
          wants_interview bool, currency, position, created_at)

events   (id, session_id fk null, name, props jsonb, created_at)
```

**Why `value jsonb`:** question wording *will* change. A jsonb value plus `question_version` lets the instrument evolve without migrations or silently corrupted longitudinal analysis.

**Why one row per answer:** partial completions stay analysable. Drop-offs are respondents, not losses.

**Security posture:** RLS enabled with **no anon policies at all** — deny by default. The browser never touches Supabase. Every write goes through a Next.js Route Handler using the service-role key server-side, with zod validation and per-session rate limiting. This is stricter than the usual anon-key pattern and removes the entire class of client-side policy bugs.

---

## 8. Design system

**Feel:** bright, calm, quiet, expensive. An Apple health screening, not a fintech dashboard.

**Light by default, and it follows the system.** Wallet, Apple Card, Health and Fitness are
all light surfaces; a warm near-black reads as "crypto app" rather than "the company that
holds my money". The theme switches with the phone's appearance setting, because adapting
to the system is the most Apple behaviour there is — and the `theme-color` meta switches
with it, so the status bar never sits in a different theme from the page beneath it.

**Gold has two roles**, because one value can't clear contrast in both themes: `gold` is
text-safe (AA at small sizes on the background) and `gold-vivid` is for graphics and fills,
which only need 3:1. In dark they converge; in light they must not.

| Token | Light | Dark | Note |
|---|---|---|---|
| `bg` | `#FFFFFF` | `#000000` | page |
| `surface` / `surface-2` | `#F5F5F7` / `#EBEBF0` | `#1C1C1E` / `#2C2C2E` | Apple's grouped-background progression |
| `separator` | `rgba(60,60,67,.13)` | `rgba(84,84,88,.4)` | translucent, so it sits on any surface |
| `text` / `muted` / `faint` | `#1C1C1E` / `#5C5C63` / `#8A8A90` | `#FFFFFF` / `#A1A1A8` / `#737379` | label hierarchy |
| `gold` | `#8C6111` | `#E8B15C` | **text-safe** accent — 5.6:1 on white |
| `gold-vivid` | `#BE8626` | `#E8B15C` | graphics and fills — the dial, selection, progress |
| `on-gold` | `#1C1C1E` | `#1C1C1E` | text on a gold fill. Dark on gold in both themes |
| `mint` | `#1A7F57` | `#63D9A3` | positive only |
| `amber` | `#A8560A` | `#F2A66A` | caution ceiling — **no red exists in this palette** |

**Type:** system stack (`-apple-system`) so it renders as the native iPhone face. Display 34–40px, tight tracking. Body 17px — never below 16px, which would trigger iOS zoom-on-focus.

**Geometry:** 28px cards, 16px chips, full-round primary buttons, 56px minimum tap height (Apple's 44pt plus comfort).

**Motion:** spring `[0.22, 1, 0.36, 1]`, 240–320ms. Questions enter `y+16 / opacity 0`, exit `y−16`. Chips scale to `0.97` on press. The day-dial has inertia. `prefers-reduced-motion` collapses everything to opacity fades.

**Native feel:** `viewport-fit=cover` with `env(safe-area-inset-bottom)` on the sticky CTA, `overscroll-behavior: none`, no text selection on chips, a per-theme `theme-color`, `statusBarStyle: default` so iOS picks legible status-bar glyphs, PWA manifest so "Add to Home Screen" looks correct, and haptics via `navigator.vibrate` where supported.

**Accessibility:** semantic radio/checkbox groups, real labels, visible focus rings, `aria-live` progress announcements, full keyboard path, AA contrast throughout, and a keyboard-operable day-dial (arrow keys ±1, page keys ±7).

---

## 9. Architecture

```
src/
├── app/
│   ├── page.tsx                landing
│   ├── check/page.tsx          the flow
│   ├── api/session|answer|result|waitlist|event/route.ts
│   └── layout.tsx, globals.css
├── components/
│   ├── ui/                     shadcn-style primitives (Radix + cva)
│   ├── flow/                   QuestionCard, ChoiceGrid, MultiChoice,
│   │                           DayDial, Stepper, TextAnswer, Reflection,
│   │                           ProgressHeader
│   ├── result/                 ResultView, ShareCard, WaitlistForm
│   └── Landing.tsx
├── lib/
│   ├── questions.ts            the instrument, as data
│   ├── engine.ts               signals → archetype → copy
│   ├── locale.ts               ₦ / $ option packs
│   ├── store.ts                state + localStorage + sync
│   ├── analytics.ts, supabase.ts, types.ts
└── supabase/migrations/
```

**The instrument is data, not JSX.** `questions.ts` is a typed array with branching predicates. Changing a question is a one-line edit, not a component rewrite — which matters, because after the first 50 responses you *will* rewrite three of them.

---

## 10. What we'll know in three weeks

With ~200 completions:

- **The hypothesis distribution.** H1 dominant → build the forecast. H6 dominant → build debt sequencing. H2 dominant → the market can't pay for visibility and you need a different wedge. H5 dominant → build friction, not foresight.
- **The verbatim corpus** from `wish`, `said_no`, `tool_gap` — the actual product brief.
- **The homemade mechanisms** people already use, ranked — a feature roadmap validated before it's built.
- **The incumbent map** from `coping` and `tracking` — who we're actually replacing.
- **Twenty-plus people who said yes to a conversation.**

If the founding hypothesis survives that, it's worth building on. If it doesn't, we found out for the price of six minutes of other people's time instead of eighteen months of ours.
