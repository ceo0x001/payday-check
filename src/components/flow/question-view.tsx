"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Chip } from "@/components/ui/chip";
import { DayDial } from "./day-dial";
import { Stepper } from "./stepper";
import { TextAnswer } from "./text-answer";
import { Reflection } from "./reflection";
import { resolveChoices, resolvePrompt } from "@/lib/questions";
import type { AnswerMap, AnswerValue, Currency, Question } from "@/lib/types";
import { tick } from "@/lib/utils";

interface QuestionViewProps {
  question: Question;
  answers: AnswerMap;
  currency: Currency;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
  /** Single-selects auto-advance after a short confirmation beat. */
  onCommit: () => void;
}

const enter = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -14 },
  transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] as const },
};

export function QuestionView({
  question: q,
  answers,
  currency,
  value,
  onChange,
  onCommit,
}: QuestionViewProps) {
  const choices = React.useMemo(() => resolveChoices(q, currency), [q, currency]);
  const prompt = resolvePrompt(q, answers);

  if (q.kind === "reflection" && q.reflection) {
    return <Reflection copy={q.reflection(answers, currency)} />;
  }

  return (
    <motion.div key={q.id} {...enter} className="flex flex-col">
      <header className="mb-7">
        <h1 className="prompt text-[26px] font-semibold sm:text-[30px]">{prompt}</h1>
        {q.subtitle && (
          <p className="text-muted mt-2.5 text-[16px]">{q.subtitle}</p>
        )}
      </header>

      <Body
        q={q}
        answers={answers}
        choices={choices}
        value={value}
        onChange={onChange}
        onCommit={onCommit}
      />

      {q.helper && (
        <p className="text-faint mt-5 text-[14px] leading-relaxed italic">
          {q.helper}
        </p>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */

function Body({
  q,
  answers,
  choices,
  value,
  onChange,
  onCommit,
}: {
  q: Question;
  answers: AnswerMap;
  choices: ReturnType<typeof resolveChoices>;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
  onCommit: () => void;
}) {
  switch (q.kind) {
    case "single":
      return (
        <SingleSelect
          q={q}
          choices={choices}
          value={value}
          onChange={onChange}
          onCommit={onCommit}
        />
      );

    case "multi":
    case "ordered-multi":
      return (
        <MultiSelect q={q} choices={choices} value={value} onChange={onChange} />
      );

    case "day-dial":
      return (
        <div className="flex justify-center py-2">
          <DayDial
            days={q.dialDays?.(answers) ?? 30}
            value={value?.kind === "number" ? value.value : null}
            onChange={(d) => onChange({ kind: "number", value: d })}
          />
        </div>
      );

    case "stepper":
      return (
        <Stepper
          min={q.min ?? 0}
          max={q.max ?? 6}
          value={value?.kind === "number" ? value.value : null}
          onChange={(n) => onChange({ kind: "number", value: n })}
        />
      );

    case "text":
      return (
        <TextAnswer
          value={value?.kind === "text" ? value.value : ""}
          onChange={(v) => onChange({ kind: "text", value: v })}
          placeholder={q.placeholder}
          maxLength={q.maxLength}
        />
      );

    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */

function SingleSelect({
  q,
  choices,
  value,
  onChange,
  onCommit,
}: {
  q: Question;
  choices: ReturnType<typeof resolveChoices>;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
  onCommit: () => void;
}) {
  const selected = value?.kind === "single" ? value.value : null;
  const openText = choices.find((c) => c.value === selected)?.opensText;
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const pick = (v: string, opens: boolean) => {
    onChange({
      kind: "single",
      value: v,
      // Defining `text` (even as "") is what suppresses auto-advance and
      // reveals the Continue button, so the user can actually type.
      text: opens ? (value?.kind === "single" ? (value.text ?? "") : "") : undefined,
    });
    if (opens) return; // let them type before we move on
    // A 300ms beat lets the chip visibly fill before the screen leaves.
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(onCommit, 300);
  };

  return (
    <div>
      <div role="radiogroup" aria-label={q.prompt} className="flex flex-col gap-2.5">
        {choices.map((c, i) => (
          <Chip
            key={c.value}
            role="radio"
            index={i}
            label={c.label}
            hint={c.hint}
            selected={selected === c.value}
            onSelect={() => pick(c.value, !!c.opensText)}
          />
        ))}
      </div>

      {openText && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="overflow-hidden pt-3"
        >
          <TextAnswer
            value={value?.kind === "single" ? (value.text ?? "") : ""}
            onChange={(t) =>
              onChange({ kind: "single", value: selected as string, text: t })
            }
            placeholder="What is it?"
            maxLength={120}
            autoFocus
          />
        </motion.div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function MultiSelect({
  q,
  choices,
  value,
  onChange,
}: {
  q: Question;
  choices: ReturnType<typeof resolveChoices>;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
}) {
  const ordered = q.kind === "ordered-multi";
  const current =
    value?.kind === "multi" || value?.kind === "ordered-multi" ? value.values : [];

  const toggle = (v: string) => {
    tick();
    const choice = choices.find((c) => c.value === v);
    let next: string[];

    if (choice?.exclusive) {
      // "None of these" clears everything else.
      next = current.includes(v) ? [] : [v];
    } else {
      const withoutExclusive = current.filter(
        (x) => !choices.find((c) => c.value === x)?.exclusive,
      );
      next = withoutExclusive.includes(v)
        ? withoutExclusive.filter((x) => x !== v)
        : [...withoutExclusive, v];
    }

    if (q.maxSelections && next.length > q.maxSelections) return;

    onChange(
      ordered
        ? { kind: "ordered-multi", values: next }
        : { kind: "multi", values: next },
    );
  };

  return (
    <div role="group" aria-label={q.prompt} className="flex flex-col gap-2.5">
      {choices.map((c, i) => {
        const idx = current.indexOf(c.value);
        return (
          <Chip
            key={c.value}
            role="checkbox"
            index={i}
            label={c.label}
            hint={c.hint}
            selected={idx !== -1}
            // The order badge is the entire point of `first_72`.
            order={ordered && idx !== -1 ? idx + 1 : undefined}
            onSelect={() => toggle(c.value)}
          />
        );
      })}
    </div>
  );
}
