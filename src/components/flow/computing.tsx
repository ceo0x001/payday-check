"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * The build beat before the result.
 *
 * This is a labour illusion, but an honest one: we really are computing, and
 * the pause does real work — it separates "answering questions" from
 * "receiving something", which is what makes the result land as a finding
 * rather than a form submission.
 */

const LINES = [
  "Reading your month…",
  "Looking at the order things leave…",
  "Comparing your short weeks…",
  "Writing what we noticed…",
];

const STEP_MS = 620;

export function Computing({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion();
  const [i, setI] = React.useState(0);

  React.useEffect(() => {
    if (reduce) {
      const t = setTimeout(onDone, 400);
      return () => clearTimeout(t);
    }
    if (i >= LINES.length) {
      const t = setTimeout(onDone, 320);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setI((n) => n + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [i, onDone, reduce]);

  return (
    <main className="bloom flex min-h-[100dvh] flex-col items-center justify-center px-8">
      <div className="relative mb-10 flex size-20 items-center justify-center">
        <motion.span
          className="border-gold-vivid/25 absolute inset-0 rounded-full border"
          animate={reduce ? {} : { scale: [1, 1.35], opacity: [0.7, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.span
          className="border-gold-vivid/40 absolute inset-2 rounded-full border"
          animate={reduce ? {} : { scale: [1, 1.25], opacity: [0.8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
        />
        <span className="bg-gold-vivid size-2.5 rounded-full" />
      </div>

      <div className="h-8" role="status" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-muted text-center text-[17px]"
          >
            {LINES[Math.min(i, LINES.length - 1)]}
          </motion.p>
        </AnimatePresence>
      </div>
    </main>
  );
}
