import {
  CANT_CUT,
  COPING,
  FIRST_72,
  MECHANISM_SHORT,
  MECHANISMS,
  SALARY_BANDS,
  SHOCKS,
  TRACKING,
  USES_TOOL,
  BORROW_VALUES,
  pack,
} from "./locale";
import { cycleDaysFor, num, ordinal, single, values } from "./answers";
import type { ActId, AnswerMap, Currency, Question } from "./types";

/**
 * THE INSTRUMENT.
 *
 * Twenty-one questions, six acts, roughly six minutes. Sixteen are pure taps.
 * Exactly one free-text field is required.
 *
 * Every question here is designed to *discriminate between* the six competing
 * explanations for missing payday (see docs/SPEC.md §0) rather than confirm
 * any one of them. If you change wording, bump `version` — otherwise the
 * longitudinal analysis quietly lies to you.
 */

export const ACTS: Record<ActId, { label: string; blurb: string }> = {
  1: { label: "Your month", blurb: "The shape of it" },
  2: { label: "Where it goes", blurb: "The first days" },
  3: { label: "The short weeks", blurb: "When it runs out" },
  4: { label: "What you already do", blurb: "Your own system" },
  5: { label: "The moment", blurb: "Looking back" },
  6: { label: "About you", blurb: "Just enough context" },
};

const borrowed = (a: AnswerMap) =>
  values(a, "coping").some((v) => BORROW_VALUES.has(v));

export const QUESTIONS: Question[] = [
  /* ============================ ACT 1 ============================ */
  {
    id: "pay_rhythm",
    version: 1,
    act: 1,
    kind: "single",
    prompt: "How does money arrive for you?",
    subtitle: "We'll shape the rest of the check around your cycle.",
    choices: [
      { value: "monthly", label: "Once a month" },
      { value: "semi_monthly", label: "Twice a month" },
      { value: "weekly", label: "Every week" },
      { value: "irregular", label: "It varies", hint: "Salary plus other income, or an unpredictable date" },
    ],
  },

  {
    id: "squeeze_day",
    version: 1,
    act: 1,
    kind: "day-dial",
    prompt: "Drag to the day your money starts feeling tight.",
    adaptivePrompt: (a) => {
      const r = single(a, "pay_rhythm");
      if (r === "weekly") return "Drag to the day of your week when money starts feeling tight.";
      if (r === "semi_monthly") return "Drag to the day in your pay period when money starts feeling tight.";
      return "Drag to the day of the month your money starts feeling tight.";
    },
    helper: "There's no wrong answer. Most people know it instantly.",
    dialDays: cycleDaysFor,
  },

  {
    id: "reach_months",
    version: 1,
    act: 1,
    kind: "stepper",
    prompt:
      "In the last 6 months, how many times did you reach payday without borrowing, dipping into savings, or skipping something you needed?",
    helper: "A rough count is fine.",
    min: 0,
    max: 6,
  },

  {
    id: "reflect_1",
    version: 1,
    act: 1,
    kind: "reflection",
    prompt: "",
    reflection: (a) => {
      const cycle = cycleDaysFor(a);
      const day = num(a, "squeeze_day") ?? Math.round(cycle * 0.6);
      const pct = day / cycle;
      const tight = Math.max(cycle - day, 0);
      const unit = cycle === 7 ? "week" : cycle === 15 ? "pay period" : "month";

      if (pct >= 0.85) {
        return {
          eyebrow: "Noted",
          headline: `Day ${day} of ${cycle}.`,
          body: `You get most of the way there. That's genuinely uncommon, and it makes what you tell us next especially useful — we learn as much from the months that work as the ones that don't.`,
        };
      }
      if (pct >= 0.6) {
        return {
          eyebrow: "Noted",
          headline: `Day ${day} of ${cycle}.`,
          body: `So roughly ${tight} days of every ${unit} happen in the tight zone. Let's find out what's driving that.`,
        };
      }
      if (pct >= 0.35) {
        return {
          eyebrow: "Noted",
          headline: `Day ${day} of ${cycle}.`,
          body: `That means about half your ${unit} is spent stretching. It's a long time to hold your breath — and it usually has a specific cause, not a general one.`,
        };
      }
      return {
        eyebrow: "Noted",
        headline: `Day ${day} of ${cycle}.`,
        body: `That's early, and it's a lot to carry. Nothing in the next few minutes is going to judge you for it — we're just trying to find where it actually goes.`,
      };
    },
  },

  /* ============================ ACT 2 ============================ */
  {
    id: "first_72",
    version: 1,
    act: 2,
    kind: "ordered-multi",
    prompt: "In the first 72 hours after you're paid, what leaves first?",
    subtitle: "Tap them in the order they happen.",
    helper: "The order matters more than the amounts.",
    choices: (c: Currency) => pack(FIRST_72, c),
  },

  {
    id: "shocks",
    version: 1,
    act: 2,
    kind: "multi",
    prompt: "Which of these landed on you last month that you hadn't planned for?",
    choices: (c: Currency) => pack(SHOCKS, c),
  },

  {
    id: "shock_size",
    version: 1,
    act: 2,
    kind: "single",
    prompt: "Roughly how big was the biggest one?",
    helper: "As a share of one month's pay. We never ask for the actual figure.",
    showIf: (a) => {
      const v = values(a, "shocks");
      return v.length > 0 && !v.includes("none");
    },
    choices: [
      { value: "tenth", label: "Less than a tenth of a month's pay" },
      { value: "fifth", label: "Around a fifth" },
      { value: "third", label: "Around a third" },
      { value: "half", label: "About half" },
      { value: "more", label: "More than half a month's pay" },
    ],
  },

  {
    id: "cant_cut",
    version: 1,
    act: 2,
    kind: "single",
    prompt: "What's the one expense you'd cut if you could — but genuinely can't?",
    choices: (c: Currency) => pack(CANT_CUT, c),
  },

  /* ============================ ACT 3 ============================ */
  {
    id: "coping",
    version: 1,
    act: 3,
    kind: "multi",
    prompt: "When money runs short before payday, what do you actually do?",
    subtitle: "Tap everything that's true.",
    helper: "No judgement here. This is the most useful question in the whole check.",
    choices: (c: Currency) => pack(COPING, c),
  },

  {
    id: "borrow_feeling",
    version: 1,
    act: 3,
    kind: "multi",
    prompt: "How did that feel?",
    subtitle: "Pick as many as fit.",
    showIf: borrowed,
    choices: [
      { value: "relieved", label: "Relieved" },
      { value: "stressed", label: "Stressed" },
      { value: "embarrassed", label: "Embarrassed" },
      { value: "normal", label: "Completely normal" },
      { value: "resentful", label: "Resentful" },
      { value: "in_control", label: "In control" },
      { value: "numb", label: "Numb about it" },
    ],
  },

  {
    id: "borrow_aftermath",
    version: 1,
    act: 3,
    kind: "single",
    prompt: "And what happened at the next payday?",
    showIf: borrowed,
    choices: [
      { value: "fine", label: "Paid it back and was fine" },
      { value: "short_again", label: "Paid it back and was immediately short again" },
      { value: "partial", label: "Paid back some of it" },
      { value: "rolled", label: "Rolled it over, or borrowed again" },
      { value: "still_owing", label: "Still owing it now" },
    ],
  },

  {
    id: "said_no",
    version: 1,
    act: 3,
    kind: "text",
    prompt: "What's the last thing you said no to because of money?",
    helper: "One line is enough. Skip it if you'd rather not.",
    skippable: true,
    maxLength: 240,
    placeholder: "A trip, a dentist visit, a friend's wedding…",
  },

  {
    id: "reflect_2",
    version: 1,
    act: 3,
    kind: "reflection",
    reflection: (a) => {
      if (borrowed(a)) {
        const after = single(a, "borrow_aftermath");
        if (after && after !== "fine") {
          return {
            eyebrow: "Thank you for that",
            headline: "That part is hard to say out loud.",
            body: "It's also the part almost nobody measures properly — which is exactly why we asked. Two more short sections.",
          };
        }
        return {
          eyebrow: "Thank you for that",
          headline: "That's useful, and it's honest.",
          body: "Borrowing to bridge a gap is a strategy, not a failure. What matters is what it costs you. Two more short sections.",
        };
      }
      return {
        eyebrow: "Thank you for that",
        headline: "You absorb it yourself.",
        body: "That's a real cost too, and it rarely shows up in anyone's data. Two more short sections.",
      };
    },
    prompt: "",
  },

  /* ============================ ACT 4 ============================ */
  {
    id: "tracking",
    version: 1,
    act: 4,
    kind: "single",
    prompt: "How do you keep track of your money right now?",
    choices: (c: Currency) => pack(TRACKING, c),
  },

  {
    id: "tool_gap",
    version: 1,
    act: 4,
    kind: "text",
    prompt: "What's stopped you from using one?",
    adaptivePrompt: (a) => {
      const t = single(a, "tracking");
      if (t && USES_TOOL.has(t)) return "What does it still not do for you?";
      if (t === "partner") return "What would make that easier for the two of you?";
      return "What's stopped you from using one?";
    },
    helper: "A sentence is plenty.",
    skippable: true,
    maxLength: 300,
    placeholder: "Type whatever comes to mind…",
  },

  {
    id: "mechanisms",
    version: 1,
    act: 4,
    kind: "multi",
    prompt: "Which of these do you already do?",
    subtitle: "The things people invent for themselves.",
    choices: (c: Currency) => pack(MECHANISMS, c),
  },

  {
    id: "reflect_3",
    version: 1,
    act: 4,
    kind: "reflection",
    prompt: "",
    reflection: (a) => {
      const m = values(a, "mechanisms").filter((v) => v !== "none");
      if (m.length >= 2) {
        return {
          eyebrow: "Worth noticing",
          headline: "You've built your own system.",
          body: `${m.length} different mechanisms, invented by you, with no app telling you to. That's not nothing — most people never get that far.`,
        };
      }
      if (m.length === 1) {
        const label = MECHANISM_SHORT[m[0]] ?? "that";
        return {
          eyebrow: "Worth noticing",
          headline: `You already do one thing on purpose.`,
          body: `${label.charAt(0).toUpperCase()}${label.slice(1)} is a deliberate choice, not an accident. Hold on to that — we'll come back to it.`,
        };
      }
      return {
        eyebrow: "Worth noticing",
        headline: "No system yet.",
        body: "That's the honest answer most people give, and it's not a character flaw. Last two questions — these are the ones we most want to hear.",
      };
    },
  },

  /* ============================ ACT 5 ============================ */
  {
    id: "inevitability",
    version: 1,
    act: 5,
    kind: "single",
    prompt:
      "Think about the last time you ran short. Looking back, was there a moment where it became inevitable?",
    choices: [
      { value: "exact_moment", label: "I can point to the exact moment" },
      { value: "hindsight", label: "Only in hindsight — I couldn't see it then" },
      { value: "whole_month", label: "No, it was the whole month adding up" },
      { value: "never_enough", label: "No — the money was never going to be enough" },
    ],
  },

  {
    id: "knew",
    version: 1,
    act: 5,
    kind: "single",
    prompt: "At that moment, did you know?",
    showIf: (a) => single(a, "inevitability") === "exact_moment",
    choices: [
      { value: "knew_anyway", label: "I knew, and I did it anyway" },
      { value: "feeling", label: "I had a feeling, but wasn't sure" },
      { value: "no_idea", label: "I had no idea" },
    ],
  },

  {
    id: "wish",
    version: 1,
    act: 5,
    kind: "text",
    prompt:
      "If someone who could see your money could warn you about one thing each month — what would you want them to warn you about?",
    helper: "There's no right answer. First thing that comes to mind.",
    maxLength: 400,
    placeholder: "Tell me before…",
  },

  /* ============================ ACT 6 ============================ */
  {
    id: "salary_band",
    version: 1,
    act: 6,
    kind: "single",
    prompt: "Roughly what do you take home each month?",
    helper: "Only used to understand patterns across groups. Skip freely.",
    skippable: true,
    choices: (c: Currency) => pack(SALARY_BANDS, c),
  },

  {
    id: "dependants",
    version: 1,
    act: 6,
    kind: "single",
    prompt: "How many people rely on your income?",
    subtitle: "Including yourself.",
    skippable: true,
    choices: [
      { value: "1", label: "Just me" },
      { value: "2_3", label: "2 – 3 people" },
      { value: "4_5", label: "4 – 5 people" },
      { value: "6plus", label: "6 or more" },
    ],
  },

  {
    id: "work_type",
    version: 1,
    act: 6,
    kind: "single",
    prompt: "What kind of work is it?",
    skippable: true,
    choices: [
      { value: "private", label: "Private sector, salaried" },
      { value: "public", label: "Public sector" },
      { value: "salary_side", label: "Salary plus side income" },
      { value: "contract", label: "Contract or gig" },
      { value: "other", label: "Something else" },
    ],
  },

  {
    id: "age_band",
    version: 1,
    act: 6,
    kind: "single",
    prompt: "And roughly how old are you?",
    helper: "Last one. Then we'll show you what we found.",
    skippable: true,
    choices: [
      { value: "u25", label: "Under 25" },
      { value: "25_34", label: "25 – 34" },
      { value: "35_44", label: "35 – 44" },
      { value: "45_54", label: "45 – 54" },
      { value: "55plus", label: "55 or older" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Flow helpers                                                        */
/* ------------------------------------------------------------------ */

/** The questions actually shown, given what's been answered so far. */
export function visibleQuestions(answers: AnswerMap): Question[] {
  return QUESTIONS.filter((q) => (q.showIf ? q.showIf(answers) : true));
}

export function resolveChoices(q: Question, currency: Currency) {
  if (!q.choices) return [];
  return typeof q.choices === "function" ? q.choices(currency) : q.choices;
}

export function resolvePrompt(q: Question, answers: AnswerMap): string {
  return q.adaptivePrompt?.(answers) ?? q.prompt;
}

/** Position within the act, counting only real questions. */
export function actPosition(
  q: Question,
  answers: AnswerMap,
): { index: number; total: number } {
  const inAct = visibleQuestions(answers).filter(
    (x) => x.act === q.act && x.kind !== "reflection",
  );
  return {
    index: inAct.findIndex((x) => x.id === q.id) + 1,
    total: inAct.length,
  };
}

/** Median seconds a question takes, used for the honest time-remaining chip. */
export const SECONDS_PER_QUESTION: Record<string, number> = {
  "day-dial": 22,
  "ordered-multi": 30,
  multi: 20,
  single: 12,
  stepper: 14,
  text: 34,
  reflection: 6,
};

export function estimateSecondsRemaining(
  answers: AnswerMap,
  currentIndex: number,
): number {
  const list = visibleQuestions(answers);
  return list
    .slice(currentIndex)
    .reduce((s, q) => s + (SECONDS_PER_QUESTION[q.kind] ?? 15), 0);
}

/** For the ordered-multi renderer: 1st, 2nd, 3rd badges. */
export { ordinal };
