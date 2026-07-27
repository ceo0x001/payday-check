import { describe, expect, it } from "vitest";
import { computeResult } from "./engine";
import { visibleQuestions, QUESTIONS } from "./questions";
import type { AnswerMap, Currency } from "./types";

/**
 * Engine tests, written as personas rather than unit cases.
 *
 * The thing that must never break is the *priority order*: we can tolerate
 * calling a Front-Loader a Slow Leak, but we must never tell someone whose
 * income is the binding constraint that they have a discipline problem.
 */

const A = {
  single: (value: string, text?: string) => ({ kind: "single" as const, value, text }),
  multi: (...values: string[]) => ({ kind: "multi" as const, values }),
  ordered: (...values: string[]) => ({ kind: "ordered-multi" as const, values }),
  num: (value: number) => ({ kind: "number" as const, value }),
  text: (value: string) => ({ kind: "text" as const, value }),
};

const base: AnswerMap = {
  pay_rhythm: A.single("monthly"),
  squeeze_day: A.num(18),
  reach_months: A.num(3),
  first_72: A.ordered("rent", "food", "transport"),
  shocks: A.multi("none"),
  cant_cut: A.single("rent"),
  coping: A.multi("wait"),
  tracking: A.single("head"),
  mechanisms: A.multi("none"),
  inevitability: A.single("hindsight"),
  wish: A.text("Tell me before I overspend"),
};

const run = (patch: AnswerMap = {}, currency: Currency = "NGN") =>
  computeResult({ ...base, ...patch }, currency);

/* ------------------------------------------------------------------ */

describe("derived metrics", () => {
  it("computes runway from the squeeze day and the pay cycle", () => {
    const r = run({ squeeze_day: A.num(18) });
    expect(r.cycleDays).toBe(30);
    expect(r.tightDays).toBe(12);
    expect(r.runwayPct).toBeCloseTo(0.6);
  });

  it("adapts the cycle to a weekly pay rhythm", () => {
    const r = run({ pay_rhythm: A.single("weekly"), squeeze_day: A.num(5) });
    expect(r.cycleDays).toBe(7);
    expect(r.tightDays).toBe(2);
  });

  it("flags irregular income without breaking the 30-day frame", () => {
    const r = run({ pay_rhythm: A.single("irregular") });
    expect(r.irregularIncome).toBe(true);
    expect(r.cycleDays).toBe(30);
  });
});

describe("archetype priority", () => {
  it("recognises someone who consistently reaches payday", () => {
    const r = run({ reach_months: A.num(6), coping: A.multi("savings") });
    expect(r.archetype.id).toBe("steady_hand");
  });

  it("puts income adequacy above every behavioural explanation", () => {
    // This person also looks like a Treadmill and a Front-Loader. They must
    // still be told the truth: the constraint is arithmetic, not discipline.
    const r = run({
      inevitability: A.single("never_enough"),
      squeeze_day: A.num(9),
      first_72: A.ordered("rent", "debt", "food", "transport", "family"),
      coping: A.multi("loan_app", "borrow_people"),
      borrow_aftermath: A.single("rolled"),
      reach_months: A.num(0),
    });
    expect(r.archetype.id).toBe("tightrope");
    expect(r.honestNote).toContain("is a discipline problem");
    expect(r.honestNote).toContain("selling you something");
  });

  it("detects the debt treadmill from the aftermath question, not the borrowing", () => {
    const clean = run({
      coping: A.multi("loan_app"),
      borrow_aftermath: A.single("fine"),
    });
    expect(clean.archetype.id).not.toBe("treadmill");

    const stuck = run({
      coping: A.multi("loan_app"),
      borrow_aftermath: A.single("short_again"),
    });
    expect(stuck.archetype.id).toBe("treadmill");
  });

  it("identifies the provider from dependants or the outflow order", () => {
    expect(run({ dependants: A.single("6plus") }).archetype.id).toBe("provider");
    expect(
      run({ first_72: A.ordered("family", "rent", "food") }).archetype.id,
    ).toBe("provider");
    expect(run({ cant_cut: A.single("family") }).archetype.id).toBe("provider");
  });

  it("requires a shock to be materially large before calling it an ambush", () => {
    const small = run({
      shocks: A.multi("vehicle"),
      shock_size: A.single("tenth"),
    });
    expect(small.archetype.id).not.toBe("ambush");

    const big = run({ shocks: A.multi("vehicle"), shock_size: A.single("third") });
    expect(big.archetype.id).toBe("ambush");
  });

  it("calls a fast, crowded first 72 hours a front-load", () => {
    const r = run({
      squeeze_day: A.num(12),
      first_72: A.ordered("rent", "food", "transport", "data", "self"),
    });
    expect(r.archetype.id).toBe("front_loader");
  });

  it("falls back to the slow leak when nothing else fires", () => {
    expect(run().archetype.id).toBe("slow_leak");
  });
});

describe("hypothesis tagging", () => {
  it("separates knowing-and-doing-anyway from not being able to see it", () => {
    const regulation = run({
      inevitability: A.single("exact_moment"),
      knew: A.single("knew_anyway"),
    });
    expect(regulation.hypothesis).toBe("H5_regulation");

    const visibility = run({
      inevitability: A.single("exact_moment"),
      knew: A.single("no_idea"),
    });
    expect(visibility.hypothesis).toBe("H1_visibility");
  });

  it("tags an income constraint as adequacy, whatever else is going on", () => {
    expect(run({ inevitability: A.single("never_enough") }).hypothesis).toBe(
      "H2_adequacy",
    );
  });

  it("tags the treadmill and the provider distinctly", () => {
    expect(
      run({ coping: A.multi("loan_app"), borrow_aftermath: A.single("rolled") })
        .hypothesis,
    ).toBe("H6_treadmill");
    expect(run({ dependants: A.single("6plus") }).hypothesis).toBe(
      "H4_obligation",
    );
  });

  it("defaults to the founding hypothesis only when nothing contradicts it", () => {
    expect(run().hypothesis).toBe("H1_visibility");
  });
});

describe("result copy", () => {
  it("always produces a strength, even for the bleakest answers", () => {
    const bleak = run({
      reach_months: A.num(0),
      inevitability: A.single("never_enough"),
      mechanisms: A.multi("none"),
      tracking: A.single("none"),
      coping: A.multi("eat_less"),
    });
    expect(bleak.strength.length).toBeGreaterThan(20);
  });

  it("names the user's own mechanisms back to them when they have some", () => {
    const r = run({ mechanisms: A.multi("ajo", "cash_apart") });
    expect(r.strength).toContain("ajo");
  });

  it("only writes the honest note for the tightrope", () => {
    expect(run().honestNote).toBeNull();
    expect(run({ inevitability: A.single("never_enough") }).honestNote).not.toBeNull();
  });

  it("notices when savings never appears in the first 72 hours", () => {
    const r = run({ first_72: A.ordered("rent", "food", "transport") });
    expect(r.notes[0].body).toContain("Savings didn't appear");
  });

  it("opens every observation with a capital letter", () => {
    // The option labels are written to stand alone, so they have to be
    // re-cased when they're spliced into a sentence.
    const r = run({
      first_72: A.ordered("debt", "rent", "family"),
      coping: A.multi("loan_app"),
      borrow_aftermath: A.single("rolled"),
    });
    for (const n of r.notes) {
      expect(n.body[0]).toBe(n.body[0].toUpperCase());
    }
    expect(r.notes[0].body).toMatch(/^Paying back what I borrowed, then rent/);
  });

  it("credits paying yourself first when savings is near the front", () => {
    const r = run({ first_72: A.ordered("savings", "rent", "food") });
    expect(r.notes[0].body).toContain("paying yourself");
  });

  it("keeps the share line free of anything personal", () => {
    const r = run({ squeeze_day: A.num(14) });
    expect(r.shareLine).toBe("My money starts thinning around day 14 of 30.");
  });

  it("never shows more than three observations", () => {
    const r = run({
      first_72: A.ordered("debt", "rent", "family", "food"),
      shocks: A.multi("vehicle", "health"),
      shock_size: A.single("half"),
      coping: A.multi("loan_app", "borrow_people"),
      borrow_aftermath: A.single("rolled"),
      dependants: A.single("6plus"),
    });
    expect(r.notes.length).toBeLessThanOrEqual(3);
  });

  it("works in both locales", () => {
    const usd = run(
      { first_72: A.ordered("rent", "childcare"), coping: A.multi("bnpl", "overdraft") },
      "USD",
    );
    expect(usd.notes.length).toBeGreaterThan(0);
    expect(usd.archetype.name).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ */

describe("the instrument", () => {
  it("hides the shock-size follow-up unless a shock was reported", () => {
    const ids = (a: AnswerMap) => visibleQuestions(a).map((q) => q.id);
    expect(ids({ shocks: A.multi("none") })).not.toContain("shock_size");
    expect(ids({ shocks: A.multi("vehicle") })).toContain("shock_size");
  });

  it("only asks about borrowing when the user said they borrow", () => {
    const ids = (a: AnswerMap) => visibleQuestions(a).map((q) => q.id);
    expect(ids({ coping: A.multi("eat_less") })).not.toContain("borrow_aftermath");
    expect(ids({ coping: A.multi("loan_app") })).toContain("borrow_aftermath");
  });

  it("only asks the follow-up moment question when there was a moment", () => {
    const ids = (a: AnswerMap) => visibleQuestions(a).map((q) => q.id);
    expect(ids({ inevitability: A.single("hindsight") })).not.toContain("knew");
    expect(ids({ inevitability: A.single("exact_moment") })).toContain("knew");
  });

  it("keeps the promised length: 21 questions, one required text field", () => {
    const asked = QUESTIONS.filter((q) => q.kind !== "reflection");
    expect(asked).toHaveLength(21);

    const requiredText = asked.filter((q) => q.kind === "text" && !q.skippable);
    expect(requiredText.map((q) => q.id)).toEqual(["wish"]);
  });

  it("asks demographics last and lets every one of them be skipped", () => {
    const act6 = QUESTIONS.filter((q) => q.act === 6);
    expect(act6.every((q) => q.skippable)).toBe(true);
    expect(QUESTIONS.at(-1)?.act).toBe(6);
  });

  it("has no duplicate question ids", () => {
    const ids = QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
