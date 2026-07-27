/**
 * Core domain types for The 6-Minute Payday Check.
 *
 * The instrument is data, not JSX — see `questions.ts`. These types are the
 * contract between the instrument, the results engine, and the API layer.
 */

export type Currency = "NGN" | "USD";

/** Which locale option-pack a question should pull from. */
export type LocaleKey = Currency;

export type QuestionKind =
  | "single" // one choice, auto-advances
  | "multi" // many choices, explicit continue
  | "ordered-multi" // many choices, selection order is captured
  | "day-dial" // the signature 1..N day selector
  | "stepper" // bounded integer
  | "text" // free text
  | "reflection"; // no input — a rest stop

export type ActId = 1 | 2 | 3 | 4 | 5 | 6;

export interface Choice {
  /** Stable analysis key. Never change these once data exists. */
  value: string;
  label: string;
  /** Rendered smaller under the label. */
  hint?: string;
  /** Deselects every other option when picked (e.g. "None of these"). */
  exclusive?: boolean;
  /** Reveals an optional free-text box when selected. */
  opensText?: boolean;
}

/** A snapshot of answers so far, used by branching predicates. */
export type AnswerMap = Record<string, AnswerValue | undefined>;

export type AnswerValue =
  | { kind: "single"; value: string; text?: string }
  | { kind: "multi"; values: string[]; text?: string }
  | { kind: "ordered-multi"; values: string[] }
  | { kind: "number"; value: number }
  | { kind: "text"; value: string }
  | { kind: "skipped" };

export interface Question {
  id: string;
  /** Bump when wording changes materially, so analysis stays honest. */
  version: number;
  act: ActId;
  kind: QuestionKind;
  prompt: string;
  /** Supporting line under the prompt. */
  subtitle?: string;
  /** Small italic line under the input — reassurance, not instruction. */
  helper?: string;
  /** Static options, or a locale-aware resolver. */
  choices?: Choice[] | ((currency: Currency) => Choice[]);
  /** Adaptive prompt — overrides `prompt` when it returns a string. */
  adaptivePrompt?: (answers: AnswerMap) => string | undefined;
  /** Return false to skip this question entirely. */
  showIf?: (answers: AnswerMap) => boolean;
  /** Users may move past without answering. */
  skippable?: boolean;
  /** `stepper` bounds. */
  min?: number;
  max?: number;
  /** `day-dial` length — adapts to the user's pay cycle (7 / 15 / 30). */
  dialDays?: (answers: AnswerMap) => number;
  /** `text` config. */
  placeholder?: string;
  maxLength?: number;
  /** Multi-select cap, if any. */
  maxSelections?: number;
  /** Reflection copy, computed from what they just told us. */
  reflection?: (answers: AnswerMap, currency: Currency) => ReflectionCopy;
}

export interface ReflectionCopy {
  eyebrow: string;
  headline: string;
  body: string;
}

/* ------------------------------------------------------------------ */
/* Results engine                                                      */
/* ------------------------------------------------------------------ */

export type ArchetypeId =
  | "steady_hand"
  | "tightrope"
  | "treadmill"
  | "provider"
  | "ambush"
  | "front_loader"
  | "slow_leak";

/**
 * The six competing explanations. Stored, never shown to the user.
 * The distribution across respondents is the actual research deliverable.
 */
export type HypothesisSignal =
  | "H1_visibility"
  | "H2_adequacy"
  | "H3_lumpiness"
  | "H4_obligation"
  | "H5_regulation"
  | "H6_treadmill";

export interface Signals {
  steady: boolean;
  tightrope: boolean;
  treadmill: boolean;
  provider: boolean;
  ambush: boolean;
  frontload: boolean;
  slowLeak: boolean;
  borrowed: boolean;
  absorbs: boolean;
  savingsRank: number | null;
  debtFirst: boolean;
  normalisedBorrowing: boolean;
}

export interface Archetype {
  id: ArchetypeId;
  name: string;
  /** One line, shown directly under the name. */
  definition: string;
  /** The single biggest cash-flow challenge, in one sentence. */
  challenge: string;
}

export interface ResultNote {
  /** Short label, e.g. "Your first 72 hours". */
  label: string;
  /** The observation — always traceable to something they said. */
  body: string;
}

export interface CheckResult {
  archetype: Archetype;
  secondary: Archetype | null;
  cycleDays: number;
  squeezeDay: number | null;
  runwayPct: number | null;
  tightDays: number | null;
  irregularIncome: boolean;
  /** "What we noticed" — 2–3 evidence lines quoting their own answers. */
  notes: ResultNote[];
  /** Always present. Never generic. */
  strength: string;
  /** Tightrope only: the refusal to sell a fix. */
  honestNote: string | null;
  signals: Signals;
  hypothesis: HypothesisSignal;
  /** Short line for the share card. */
  shareLine: string;
}

/* ------------------------------------------------------------------ */
/* Telemetry                                                           */
/* ------------------------------------------------------------------ */

export interface AnswerTelemetry {
  dwellMs: number;
  changeCount: number;
  skipped: boolean;
}

export type AnalyticsEvent =
  | "session_start"
  | "currency_selected"
  | "question_shown"
  | "question_answered"
  | "question_skipped"
  | "question_back"
  | "flow_abandoned"
  | "result_computed"
  | "result_viewed"
  | "share_clicked"
  | "waitlist_shown"
  | "waitlist_submitted"
  | "interview_opt_in"
  | "resumed";
