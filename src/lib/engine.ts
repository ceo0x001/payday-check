import {
  ABSORB_VALUES,
  BORROW_VALUES,
  CANT_CUT,
  COPING,
  FIRST_72,
  LOW_SALARY_BANDS,
  MECHANISM_SHORT,
  TRACKING,
  pack,
} from "./locale";
import { cycleDaysFor, num, plural, single, text, values } from "./answers";
import type {
  AnswerMap,
  Archetype,
  ArchetypeId,
  CheckResult,
  Currency,
  HypothesisSignal,
  ResultNote,
  Signals,
} from "./types";

/**
 * THE RESULTS ENGINE.
 *
 * Rules, not predictions. Every line this produces traces back to something
 * the user actually told us. There is no forecast, no score out of 100, and
 * no red anywhere — those all imply an authority we don't have and a
 * judgement we haven't earned.
 *
 * The archetype resolution order is deliberate and load-bearing: it exists so
 * that we can never tell someone whose income is the binding constraint that
 * they have a discipline problem.
 */

/* ------------------------------------------------------------------ */
/* Signals                                                             */
/* ------------------------------------------------------------------ */

export function computeSignals(a: AnswerMap): Signals {
  const coping = values(a, "coping");
  const borrowed = coping.some((v) => BORROW_VALUES.has(v));
  const absorbs = coping.some((v) => ABSORB_VALUES.has(v));

  const aftermath = single(a, "borrow_aftermath");
  const treadmill =
    borrowed &&
    !!aftermath &&
    ["short_again", "partial", "rolled", "still_owing"].includes(aftermath);

  const shocks = values(a, "shocks").filter((v) => v !== "none");
  const shockSize = single(a, "shock_size");
  const ambush =
    shocks.length > 0 && !!shockSize && ["third", "half", "more"].includes(shockSize);

  const first72 = values(a, "first_72");
  const savingsRank = first72.indexOf("savings");
  const debtRank = first72.indexOf("debt");

  const dependants = single(a, "dependants");
  const provider =
    dependants === "4_5" ||
    dependants === "6plus" ||
    first72.slice(0, 3).includes("family") ||
    single(a, "cant_cut") === "family";

  const cycle = cycleDaysFor(a);
  const squeeze = num(a, "squeeze_day");
  const runwayPct = squeeze != null ? squeeze / cycle : null;

  const frontload =
    runwayPct != null && runwayPct <= 0.5 && first72.length >= 4;

  const reach = num(a, "reach_months") ?? 3;
  const inevitability = single(a, "inevitability");

  const steady = reach >= 5 && !borrowed;

  const tightrope =
    inevitability === "never_enough" ||
    (reach <= 1 &&
      shocks.length === 0 &&
      !treadmill &&
      LOW_SALARY_BANDS.has(single(a, "salary_band") ?? ""));

  return {
    steady,
    tightrope,
    treadmill,
    provider,
    ambush,
    frontload,
    slowLeak: !steady && !tightrope && !treadmill && !provider && !ambush && !frontload,
    borrowed,
    absorbs,
    savingsRank: savingsRank === -1 ? null : savingsRank,
    debtFirst: debtRank !== -1 && debtRank < 3,
    normalisedBorrowing: values(a, "borrow_feeling").includes("normal"),
  };
}

/* ------------------------------------------------------------------ */
/* Archetypes                                                          */
/* ------------------------------------------------------------------ */

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  steady_hand: {
    id: "steady_hand",
    name: "The Steady Hand",
    definition: "You reach payday. That's rarer than you'd think.",
    challenge:
      "Getting through the month isn't the problem. It's that the whole system holding it together lives in your head, and nowhere else.",
  },
  tightrope: {
    id: "tightrope",
    name: "The Tightrope",
    definition: "Your fixed costs sit very close to your income.",
    challenge:
      "Arithmetic, not behaviour. There isn't enough slack between what has to go out and what comes in.",
  },
  treadmill: {
    id: "treadmill",
    name: "The Treadmill",
    definition: "Last month's shortfall is eating this month's salary.",
    challenge:
      "Repayment now competes with living. Every month starts smaller than the one before it closed.",
  },
  provider: {
    id: "provider",
    name: "The Provider",
    definition: "Your money is doing more than one person's job.",
    challenge:
      "Not spending — your income is quietly funding decisions you don't get to make.",
  },
  ambush: {
    id: "ambush",
    name: "The Ambush Payer",
    definition: "You don't overspend. You get ambushed.",
    challenge:
      "Timing. Your income arrives evenly; the things it has to cover do not.",
  },
  front_loader: {
    id: "front_loader",
    name: "The Front-Loader",
    definition: "Your month has two halves, and they don't look alike.",
    challenge:
      "The first 72 hours. By the time the month properly begins, most of the decisions have already been made.",
  },
  slow_leak: {
    id: "slow_leak",
    name: "The Slow Leak",
    definition: "No single villain. A hundred small exits.",
    challenge:
      "Nothing is ever big enough to notice — until all of it together is.",
  },
};

/** Strict priority. Order protects users more than it maximises accuracy. */
const PRIORITY: Array<[ArchetypeId, (s: Signals) => boolean]> = [
  ["steady_hand", (s) => s.steady],
  ["tightrope", (s) => s.tightrope],
  ["treadmill", (s) => s.treadmill],
  ["provider", (s) => s.provider],
  ["ambush", (s) => s.ambush],
  ["front_loader", (s) => s.frontload],
  ["slow_leak", () => true],
];

function resolveArchetype(s: Signals): { primary: Archetype; secondary: Archetype | null } {
  const matches = PRIORITY.filter(([, test]) => test(s)).map(([id]) => id);
  const primary = ARCHETYPES[matches[0] ?? "slow_leak"];
  const secondaryId = matches.find((id) => id !== primary.id && id !== "slow_leak");
  return {
    primary,
    secondary: secondaryId ? ARCHETYPES[secondaryId] : null,
  };
}

/* ------------------------------------------------------------------ */
/* Hypothesis tagging — stored, never shown                            */
/* ------------------------------------------------------------------ */

/**
 * Which of the six competing explanations does this respondent support?
 *
 * This is the reason the product exists. Read the distribution across ~200
 * completions before writing another line of product code.
 */
export function tagHypothesis(a: AnswerMap, s: Signals): HypothesisSignal {
  const inevitability = single(a, "inevitability");
  const knew = single(a, "knew");

  // The user told us directly that income is the constraint.
  if (inevitability === "never_enough") return "H2_adequacy";

  // They could see it coming and spent anyway — foresight tooling won't help.
  if (inevitability === "exact_moment" && knew === "knew_anyway") return "H5_regulation";

  // Debt service is the binding constraint.
  if (s.treadmill) return "H6_treadmill";

  // Other people's needs drive the outflow.
  if (s.provider && !s.frontload) return "H4_obligation";

  // Regular income, irregular obligations.
  if (s.ambush) return "H3_lumpiness";

  // "I had a feeling but wasn't sure" / "only in hindsight" / "the whole month"
  // — the founding hypothesis, cleanly isolated.
  return "H1_visibility";
}

/* ------------------------------------------------------------------ */
/* Copy generation                                                     */
/* ------------------------------------------------------------------ */

function labelFor(list: { value: string; label: string }[], v: string | null): string | null {
  if (!v) return null;
  return list.find((c) => c.value === v)?.label ?? null;
}

function lower(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function upper(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * "Paying back what I borrowed, then rent, then family."
 * The labels are written as standalone options, so the first one has to be
 * re-cased to open a sentence and the rest lowered to sit inside it.
 */
function sequence(labels: string[]): string {
  if (labels.length === 0) return "";
  const [first, ...rest] = labels;
  return [upper(first), ...rest.map(lower)].join(", then ");
}

/** 2–3 observations, each quoting the user's own answers back to them. */
function buildNotes(a: AnswerMap, s: Signals, currency: Currency): ResultNote[] {
  const notes: ResultNote[] = [];
  const first72 = values(a, "first_72");
  const f72Labels = pack(FIRST_72, currency);
  const copingLabels = pack(COPING, currency);

  // 1. The order of the first 72 hours — the highest-signal observation we have.
  if (first72.length > 0) {
    const top = first72
      .slice(0, 3)
      .map((v) => labelFor(f72Labels, v))
      .filter(Boolean) as string[];

    if (s.savingsRank === null && first72.length >= 3) {
      notes.push({
        label: "Your first 72 hours",
        body: `${sequence(top)}. Savings didn't appear at all — which means it isn't competing for the money, it's waiting for what's left.`,
      });
    } else if (s.savingsRank !== null && s.savingsRank <= 2) {
      notes.push({
        label: "Your first 72 hours",
        body: `Savings is in your first three. Whatever else is happening, you're paying yourself before the month gets a vote.`,
      });
    } else {
      notes.push({
        label: "Your first 72 hours",
        body: `${sequence(top)}. By the time those clear, the shape of your month is largely decided.`,
      });
    }
  }

  // 2. Debt position in the queue, or the shock, or the squeeze.
  if (s.debtFirst) {
    notes.push({
      label: "The order underneath",
      body: "Repayment is one of the first things out. That's discipline — but it also means each month opens with less room than the last one closed with.",
    });
  } else if (s.ambush) {
    const shocks = values(a, "shocks").filter((v) => v !== "none");
    notes.push({
      label: "Last month",
      body: `${plural(shocks.length, "unplanned expense")} landed, and the largest was a meaningful share of a month's pay. That isn't overspending — it's an income that arrives evenly meeting costs that don't.`,
    });
  } else if (s.provider) {
    notes.push({
      label: "Who it's for",
      body: "A significant part of your month is committed to people other than you. Most money tools quietly assume that isn't true.",
    });
  }

  // 3. Coping behaviour — what actually happens in the short weeks.
  const coping = values(a, "coping");
  if (s.borrowed) {
    const borrowLabels = coping
      .filter((v) => BORROW_VALUES.has(v))
      .map((v) => labelFor(copingLabels, v))
      .filter(Boolean) as string[];
    if (borrowLabels.length) {
      notes.push({
        label: "When it's short",
        body: `You bridge the gap${borrowLabels.length > 1 ? " a few ways" : ""} — ${lower(borrowLabels[0])}${
          borrowLabels.length > 1 ? `, among others` : ""
        }. ${
          s.normalisedBorrowing
            ? "And you told us it feels completely normal. That's worth saying plainly: it's a routine, not a crisis."
            : "The cost of that isn't only the money."
        }`,
      });
    }
  } else if (s.absorbs) {
    notes.push({
      label: "When it's short",
      body: "You don't borrow — you absorb it. You go without. That cost is invisible in every dataset in finance, and it's real.",
    });
  }

  return notes.slice(0, 3);
}

/** Always present, never generic. Self-affirmation before anything harder. */
function buildStrength(a: AnswerMap, s: Signals): string {
  const mechanisms = values(a, "mechanisms").filter((v) => v !== "none");
  const reach = num(a, "reach_months");
  const tracking = single(a, "tracking");

  if (mechanisms.length >= 2) {
    const named = mechanisms
      .slice(0, 2)
      .map((m) => MECHANISM_SHORT[m] ?? m)
      .join(" and ");
    return `You've built your own system — ${named} — with no app telling you to. Most people never get that far, and whatever you use next should be built on top of that, not instead of it.`;
  }
  if (mechanisms.length === 1) {
    const m = MECHANISM_SHORT[mechanisms[0]] ?? "a deliberate habit";
    return `You already do one thing on purpose: ${m}. That's a working instinct, and it's the right one.`;
  }
  if (s.savingsRank !== null && s.savingsRank <= 2) {
    return "Savings is near the front of your queue. That single ordering decision does more work than most budgeting advice ever will.";
  }
  if (reach != null && reach >= 3) {
    return `You reached payday ${plural(reach, "time")} out of the last six. That's a real floor, and it means the good months aren't luck — something you're doing is working.`;
  }
  if (tracking && tracking !== "none" && tracking !== "head") {
    return "You already look. Tracking anything at all puts you ahead of most people, who avoid the number entirely.";
  }
  return "You just spent six minutes looking directly at something most people work quite hard to avoid. That's not a small thing, and it's the part no product can do for you.";
}

/** The refusal to sell a fix. Tightrope only. */
function buildHonestNote(s: Signals, a: AnswerMap): string | null {
  if (!s.tightrope) return null;
  const dependants = single(a, "dependants");
  const many = dependants === "4_5" || dependants === "6plus";
  return `We want to be straight with you: nothing in this result is a discipline problem. When fixed obligations sit this close to income${
    many ? ", and several people depend on it," : ","
  } better visibility helps you plan — but it doesn't create money that isn't there. Anyone who tells you a budgeting app fixes this is selling you something. We'd rather be useful than flattering.`;
}

function buildShareLine(archetype: Archetype, cycle: number, squeeze: number | null): string {
  if (squeeze == null) return archetype.definition;
  return `My money starts thinning around day ${squeeze} of ${cycle}.`;
}

/* ------------------------------------------------------------------ */
/* Entry point                                                         */
/* ------------------------------------------------------------------ */

export function computeResult(a: AnswerMap, currency: Currency): CheckResult {
  const signals = computeSignals(a);
  const { primary, secondary } = resolveArchetype(signals);

  const cycleDays = cycleDaysFor(a);
  const squeezeDay = num(a, "squeeze_day");
  const runwayPct = squeezeDay != null ? squeezeDay / cycleDays : null;
  const tightDays = squeezeDay != null ? Math.max(cycleDays - squeezeDay, 0) : null;

  return {
    archetype: primary,
    secondary,
    cycleDays,
    squeezeDay,
    runwayPct,
    tightDays,
    irregularIncome: single(a, "pay_rhythm") === "irregular",
    notes: buildNotes(a, signals, currency),
    strength: buildStrength(a, signals),
    honestNote: buildHonestNote(signals, a),
    signals,
    hypothesis: tagHypothesis(a, signals),
    shareLine: buildShareLine(primary, cycleDays, squeezeDay),
  };
}

/** Descriptive runway sentence. Reflects, never predicts. */
export function runwaySentence(r: CheckResult): string {
  if (r.squeezeDay == null) return "";
  const unit = r.cycleDays === 7 ? "week" : r.cycleDays === 15 ? "pay period" : "month";
  if (r.tightDays === 0) {
    return `Your money holds all the way to day ${r.squeezeDay} of ${r.cycleDays}. You reach the end of the ${unit}.`;
  }
  return `Your money starts thinning around day ${r.squeezeDay} of ${r.cycleDays} — about ${plural(
    r.tightDays ?? 0,
    "day",
  )} of every ${unit} spent in the tight zone.`;
}

/** Used only by the internal research view. */
export function trackingLabel(a: AnswerMap, currency: Currency): string | null {
  return labelFor(pack(TRACKING, currency), single(a, "tracking"));
}

export function cantCutLabel(a: AnswerMap, currency: Currency): string | null {
  const v = single(a, "cant_cut");
  if (v === "other") return text(a, "cant_cut");
  return labelFor(pack(CANT_CUT, currency), v);
}
