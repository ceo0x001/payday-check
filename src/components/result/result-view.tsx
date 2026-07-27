"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Sparkles, Share2, Check } from "lucide-react";
import { DayDial } from "@/components/flow/day-dial";
import { WaitlistForm } from "./waitlist-form";
import { runwaySentence } from "@/lib/engine";
import { track } from "@/lib/store";
import { cn, tick } from "@/lib/utils";
import type { CheckResult, Currency } from "@/lib/types";

interface ResultViewProps {
  result: CheckResult;
  currency: Currency;
  sessionId: string | null;
  onRestart: () => void;
}

/**
 * Deliberately animates on mount, not on scroll.
 *
 * `whileInView` looked nicer, but it gates the payoff of the entire product
 * on an IntersectionObserver callback — and when that misses (a backgrounded
 * tab, a restored scroll position, a fast flick), the user gets a blank
 * screen where their result should be. Not a trade worth making here.
 */
const reveal = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
});

/**
 * The result.
 *
 * Reflects, never predicts. Every line traces to something the user said.
 * Note the order: what we noticed → what's already working → the challenge.
 * Self-affirmation before threatening information measurably increases
 * receptivity, and in this case the affirmation is also simply true.
 */
export function ResultView({
  result,
  currency,
  sessionId,
  onRestart,
}: ResultViewProps) {
  return (
    <main className="bloom min-h-[100dvh]">
      <div className="mx-auto w-full max-w-[560px] px-6 pb-24">
        {/* ---------- Pattern ---------- */}
        <section className="safe-top pt-10">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-gold text-[13px] tracking-[0.18em] uppercase"
          >
            Your pattern
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="display mt-3 text-[40px] font-semibold sm:text-[46px]"
          >
            {result.archetype.name}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-muted mt-3 text-[19px] leading-relaxed"
          >
            {result.archetype.definition}
          </motion.p>

          {result.secondary && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-faint mt-3 text-[15px]"
            >
              With something of{" "}
              <span className="text-muted">{result.secondary.name}</span> showing
              up underneath.
            </motion.p>
          )}
        </section>

        {/* ---------- Runway ---------- */}
        {result.squeezeDay != null && (
          <motion.section
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex flex-col items-center"
          >
            <DayDial
              days={result.cycleDays}
              value={result.squeezeDay}
              onChange={() => {}}
              readOnly
              size={252}
            />
            <p className="text-muted mt-4 text-center text-[16px] leading-relaxed text-balance">
              {runwaySentence(result)}
            </p>
            {result.irregularIncome && (
              <p className="text-faint mt-2 text-center text-[13px]">
                Shown against a 30-day cycle, since your income date moves.
              </p>
            )}
          </motion.section>
        )}

        {/* ---------- What we noticed ---------- */}
        {result.notes.length > 0 && (
          <section className="mt-14">
            <motion.h2
              {...reveal(0.5)}
              className="text-faint mb-4 text-[13px] tracking-[0.16em] uppercase"
            >
              What we noticed
            </motion.h2>
            <div className="flex flex-col gap-3">
              {result.notes.map((n, i) => (
                <motion.div
                  key={n.label}
                  {...reveal(0.56 + i * 0.08)}
                  className="border-separator bg-surface rounded-[var(--radius-card)] border p-5"
                >
                  <p className="text-gold/85 mb-1.5 text-[13px] font-medium">
                    {n.label}
                  </p>
                  <p className="text-text/90 text-[16px] leading-relaxed">
                    {n.body}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ---------- Strength (always) ---------- */}
        <motion.section
          {...reveal(0.82)}
          className="border-mint-vivid/20 bg-mint-soft mt-4 rounded-[var(--radius-card)] border p-5"
        >
          <p className="text-mint mb-1.5 flex items-center gap-1.5 text-[13px] font-medium">
            <Sparkles className="size-3.5" aria-hidden />
            What&rsquo;s already working
          </p>
          <p className="text-text/90 text-[16px] leading-relaxed">
            {result.strength}
          </p>
        </motion.section>

        {/* ---------- Challenge ---------- */}
        <motion.section {...reveal(0.9)} className="mt-14">
          <h2 className="text-faint mb-3 text-[13px] tracking-[0.16em] uppercase">
            Your biggest cash-flow challenge
          </h2>
          <p className="prompt text-[24px] leading-snug font-medium sm:text-[27px]">
            {result.archetype.challenge}
          </p>
        </motion.section>

        {/* ---------- The honest part ---------- */}
        {result.honestNote && (
          <motion.section
            {...reveal(0.98)}
            className="border-separator-strong bg-surface-2 mt-8 rounded-[var(--radius-card)] border p-5"
          >
            <p className="text-amber mb-1.5 text-[13px] font-medium">
              The honest part
            </p>
            <p className="text-text/90 text-[16px] leading-relaxed">
              {result.honestNote}
            </p>
          </motion.section>
        )}

        {/* ---------- Share ---------- */}
        <motion.div {...reveal(1.04)} className="mt-10">
          <ShareButton result={result} sessionId={sessionId} />
        </motion.div>

        {/* ---------- Waitlist ---------- */}
        <motion.section {...reveal(1.1)} className="mt-16">
          <WaitlistForm
            sessionId={sessionId}
            currency={currency}
            archetype={result.archetype.name}
          />
        </motion.section>

        <motion.div {...reveal(1.16)} className="mt-12 text-center">
          <button
            type="button"
            onClick={onRestart}
            className="text-faint hover:text-muted text-[14px] transition-colors"
          >
            Start a fresh check
          </button>
          <p className="text-faint/70 mx-auto mt-6 max-w-[42ch] text-[12px] leading-relaxed">
            This is a reflection of what you told us, not a prediction and not
            financial advice. Nothing here was measured from your accounts.
          </p>
        </motion.div>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */

function ShareButton({
  result,
  sessionId,
}: {
  result: CheckResult;
  sessionId: string | null;
}) {
  const [copied, setCopied] = React.useState(false);

  // No personal data leaves in a share — archetype and runway only.
  const text = `I did The 6-Minute Payday Check. I'm ${result.archetype.name}. ${result.shareLine}`;
  const url =
    typeof window !== "undefined" ? window.location.origin : "";

  const onShare = async () => {
    tick();
    track(sessionId, "share_clicked", { archetype: result.archetype.id });
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "The 6-Minute Payday Check", text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* user dismissed the sheet — nothing to recover from */
    }
  };

  return (
    <button
      type="button"
      onClick={onShare}
      className={cn(
        "border-separator bg-surface hover:border-separator-strong flex w-full items-center justify-between gap-4 rounded-[var(--radius-card)] border p-5 text-left transition-colors active:scale-[0.99]",
      )}
    >
      <span className="min-w-0">
        <span className="text-text block text-[16px] font-medium">
          {copied ? "Copied to your clipboard" : "Share your pattern"}
        </span>
        <span className="text-faint mt-0.5 block text-[14px]">
          Just the pattern and the day. Nothing personal.
        </span>
      </span>
      <span className="bg-surface-2 text-gold flex size-10 shrink-0 items-center justify-center rounded-full">
        {copied ? (
          <Check className="size-4" strokeWidth={2.5} />
        ) : (
          <Share2 className="size-4" strokeWidth={2} />
        )}
      </span>
    </button>
  );
}
