"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ProgressHeader } from "./progress-header";
import { QuestionView } from "./question-view";
import { Computing } from "./computing";
import { ResultView } from "@/components/result/result-view";
import {
  ACTS,
  actPosition,
  estimateSecondsRemaining,
  visibleQuestions,
} from "@/lib/questions";
import { computeResult } from "@/lib/engine";
import {
  clearSession,
  createSession,
  deviceClass,
  loadSession,
  readUtm,
  saveSession,
  syncAnswer,
  track,
  useQuestionTelemetry,
} from "@/lib/store";
import type {
  AnswerMap,
  AnswerValue,
  CheckResult,
  Currency,
  Question,
} from "@/lib/types";

type Stage = "loading" | "flow" | "computing" | "result";

export function CheckFlow() {
  const router = useRouter();

  const [stage, setStage] = React.useState<Stage>("loading");
  const [currency, setCurrency] = React.useState<Currency>("NGN");
  const [answers, setAnswers] = React.useState<AnswerMap>({});
  const [index, setIndex] = React.useState(0);
  const [result, setResult] = React.useState<CheckResult | null>(null);
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [startedAt, setStartedAt] = React.useState(0);

  const questions = visibleQuestions(answers);
  const current: Question | undefined = questions[index];
  const telemetry = useQuestionTelemetry(current?.id ?? "none");

  /* ---------------- boot ---------------- */

  React.useEffect(() => {
    const s = loadSession();
    if (!s?.currency) {
      router.replace("/");
      return;
    }

    // Restoring from localStorage can't happen during render — it doesn't
    // exist on the server, and reading it in a lazy initialiser would produce
    // a hydration mismatch. This is the one legitimate boot-time sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrency(s.currency);
    setAnswers(s.answers ?? {});
    setIndex(s.index ?? 0);
    setStartedAt(s.startedAt ?? Date.now());
    setSessionId(s.sessionId);

    // Someone who already finished and came back should see their result,
    // not be marched through twenty-one questions again. Recomputed locally
    // from their stored answers — no round trip, no stale copy.
    if (s.completed && Object.keys(s.answers ?? {}).length > 0) {
      setResult(computeResult(s.answers, s.currency));
      setStage("result");
      track(s.sessionId, "result_viewed", { restored: true });
      return;
    }

    setStage("flow");

    if (!s.sessionId) {
      void createSession({
        currency: s.currency,
        referrer: document.referrer || "",
        utm: readUtm(),
        deviceClass: deviceClass(),
      }).then((id) => {
        setSessionId(id);
        track(id, "currency_selected", { currency: s.currency });
      });
    } else if (Object.keys(s.answers ?? {}).length > 0) {
      track(s.sessionId, "resumed", { at: s.index });
    }
  }, [router]);

  /* Durable on every step: a refresh or a phone call never costs progress. */
  React.useEffect(() => {
    if (stage === "loading") return;
    saveSession({
      sessionId,
      currency,
      answers,
      index,
      startedAt,
      updatedAt: Date.now(),
      completed: stage === "result" || stage === "computing",
    });
  }, [stage, sessionId, currency, answers, index, startedAt]);

  /* Drop-offs are respondents, not losses — record where they left. */
  React.useEffect(() => {
    if (stage !== "flow") return;
    const questionId = current?.id;
    const answered = Object.keys(answers).length;
    const onHide = () => {
      if (document.visibilityState === "hidden") {
        track(sessionId, "flow_abandoned", { questionId, index, answered });
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [stage, current?.id, index, answers, sessionId]);

  React.useEffect(() => {
    if (stage !== "flow" || !current) return;
    track(sessionId, "question_shown", { questionId: current.id, index });
  }, [stage, current, index, sessionId]);

  /* ---------------- actions ---------------- */

  function setValue(v: AnswerValue) {
    if (!current) return;
    telemetry.noteChange();
    setAnswers((prev) => ({ ...prev, [current.id]: v }));
  }

  function finish(finalAnswers: AnswerMap) {
    const computed = computeResult(finalAnswers, currency);
    setResult(computed);
    setStage("computing");

    const durationMs = Date.now() - startedAt;
    track(sessionId, "result_computed", {
      archetype: computed.archetype.id,
      hypothesis: computed.hypothesis,
      durationMs,
    });

    void fetch("/api/result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        sessionId,
        durationMs,
        result: {
          archetype: computed.archetype.id,
          secondaryArchetype: computed.secondary?.id ?? null,
          cycleDays: computed.cycleDays,
          squeezeDay: computed.squeezeDay,
          runwayPct: computed.runwayPct,
          tightDays: computed.tightDays,
          hypothesis: computed.hypothesis,
          signals: computed.signals,
          headline: computed.archetype.name,
        },
      }),
    }).catch(() => {
      /* the user still gets their result */
    });
  }

  function commit(skipped = false) {
    if (!current) return;

    const value: AnswerValue = skipped
      ? { kind: "skipped" }
      : (answers[current.id] ?? { kind: "skipped" });

    if (current.kind !== "reflection") {
      const t = telemetry.read();
      syncAnswer({
        sessionId,
        questionId: current.id,
        questionVersion: current.version,
        value,
        dwellMs: t.dwellMs,
        changeCount: t.changeCount,
        skipped,
      });
      track(sessionId, skipped ? "question_skipped" : "question_answered", {
        questionId: current.id,
        dwellMs: t.dwellMs,
        changeCount: t.changeCount,
      });
    }

    const nextAnswers = skipped ? { ...answers, [current.id]: value } : answers;
    if (skipped) setAnswers(nextAnswers);

    // Recomputed against the new answers, because a branch may have opened
    // or closed as a result of this very answer.
    const list = visibleQuestions(nextAnswers);
    const nextIndex = list.findIndex((q) => q.id === current.id) + 1;

    if (nextIndex >= list.length) finish(nextAnswers);
    else setIndex(nextIndex);
  }

  function back() {
    if (index === 0) return;
    track(sessionId, "question_back", { from: current?.id });
    setIndex((i) => Math.max(i - 1, 0));
  }

  /* ---------------- render ---------------- */

  if (stage === "loading") {
    return <div className="min-h-[100dvh]" aria-busy="true" />;
  }

  if (stage === "computing" && result) {
    return (
      <Computing
        onDone={() => {
          setStage("result");
          track(sessionId, "result_viewed", { archetype: result.archetype.id });
        }}
      />
    );
  }

  if (stage === "result" && result) {
    return (
      <ResultView
        result={result}
        currency={currency}
        sessionId={sessionId}
        onRestart={() => {
          clearSession();
          router.push("/");
        }}
      />
    );
  }

  if (!current) return null;

  const value = answers[current.id];
  const position =
    current.kind === "reflection" ? undefined : actPosition(current, answers);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <ProgressHeader
        progress={index / Math.max(questions.length, 1)}
        actLabel={ACTS[current.act].label}
        position={position}
        secondsRemaining={estimateSecondsRemaining(answers, index)}
        canGoBack={index > 0}
        onBack={back}
      />

      <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col px-6 pt-6">
        <AnimatePresence mode="wait" initial={false}>
          <QuestionView
            key={current.id}
            question={current}
            answers={answers}
            currency={currency}
            value={value}
            onChange={setValue}
            onCommit={() => commit(false)}
          />
        </AnimatePresence>

        {/* Breathing room above the fixed footer. */}
        <div className="h-28" aria-hidden />
      </main>

      <Footer
        question={current}
        value={value}
        onContinue={() => commit(false)}
        onSkip={() => commit(true)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function canContinue(q: Question, v: AnswerValue | undefined): boolean {
  switch (q.kind) {
    case "reflection":
      return true;
    case "single":
      return v?.kind === "single";
    case "multi":
    case "ordered-multi":
      return (
        (v?.kind === "multi" || v?.kind === "ordered-multi") && v.values.length > 0
      );
    case "day-dial":
    case "stepper":
      return v?.kind === "number";
    case "text":
      return !!q.skippable || (v?.kind === "text" && v.value.trim().length >= 2);
    default:
      return false;
  }
}

/**
 * Single-selects auto-advance, so a button would only be in the way — except
 * when the chosen option opened a text box, where auto-advance is suppressed
 * so the user can actually type.
 */
function showsContinue(q: Question, v: AnswerValue | undefined): boolean {
  if (q.kind !== "single") return true;
  return v?.kind === "single" && v.text !== undefined;
}

function Footer({
  question,
  value,
  onContinue,
  onSkip,
}: {
  question: Question;
  value: AnswerValue | undefined;
  onContinue: () => void;
  onSkip: () => void;
}) {
  const enabled = canContinue(question, value);
  const visible = showsContinue(question, value);
  const skippable = question.skippable && question.kind !== "reflection";

  if (!visible && !skippable) return null;

  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="from-bg via-bg/95 safe-bottom fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t to-transparent pt-8"
    >
      <div className="mx-auto w-full max-w-[560px] px-6">
        {visible && (
          <Button size="lg" full disabled={!enabled} onClick={onContinue}>
            {question.kind === "reflection" ? "Continue" : "Next"}
          </Button>
        )}
        {skippable && (
          <button
            type="button"
            onClick={onSkip}
            className="text-faint hover:text-muted mx-auto mt-3 block text-[14px] transition-colors"
          >
            Skip this one
          </button>
        )}
      </div>
    </motion.footer>
  );
}
