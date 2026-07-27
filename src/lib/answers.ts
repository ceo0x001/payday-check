import type { AnswerMap, AnswerValue } from "./types";

/** Typed accessors over the answer map. All tolerate missing/skipped answers. */

export function single(a: AnswerMap, id: string): string | null {
  const v = a[id];
  return v?.kind === "single" ? v.value : null;
}

export function values(a: AnswerMap, id: string): string[] {
  const v = a[id];
  if (v?.kind === "multi" || v?.kind === "ordered-multi") return v.values;
  return [];
}

export function num(a: AnswerMap, id: string): number | null {
  const v = a[id];
  return v?.kind === "number" ? v.value : null;
}

export function text(a: AnswerMap, id: string): string | null {
  const v = a[id];
  if (v?.kind === "text") return v.value.trim() || null;
  if ((v?.kind === "single" || v?.kind === "multi") && v.text) {
    return v.text.trim() || null;
  }
  return null;
}

export function has(a: AnswerMap, id: string, value: string): boolean {
  return values(a, id).includes(value) || single(a, id) === value;
}

export function isAnswered(v: AnswerValue | undefined): boolean {
  if (!v) return false;
  switch (v.kind) {
    case "skipped":
      return true;
    case "single":
      return v.value.length > 0;
    case "multi":
    case "ordered-multi":
      return v.values.length > 0;
    case "number":
      return Number.isFinite(v.value);
    case "text":
      return v.value.trim().length > 0;
  }
}

/** Days in the user's pay cycle — the denominator for every derived metric. */
export function cycleDaysFor(a: AnswerMap): number {
  switch (single(a, "pay_rhythm")) {
    case "weekly":
      return 7;
    case "semi_monthly":
      return 15;
    case "monthly":
    case "irregular":
    default:
      return 30;
  }
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

/** "1 time" / "3 times" — small dignity in getting plurals right. */
export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}
