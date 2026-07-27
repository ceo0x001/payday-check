"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn, tick } from "@/lib/utils";

interface StepperProps {
  min: number;
  max: number;
  value: number | null;
  onChange: (n: number) => void;
}

const SCALE_COPY: Record<number, string> = {
  0: "Not once",
  1: "Once",
  2: "Twice",
  3: "Half the time",
  4: "Most months",
  5: "Nearly every month",
  6: "Every single month",
};

/**
 * A segmented 0–6 selector rather than a plus/minus stepper: counting to six
 * with a "+" button is four taps of friction for no benefit. One tap, done.
 */
export function Stepper({ min, max, value, onChange }: StepperProps) {
  const steps = React.useMemo(
    () => Array.from({ length: max - min + 1 }, (_, i) => min + i),
    [min, max],
  );

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Number of months"
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((n, i) => {
          const selected = value === n;
          return (
            <motion.button
              key={n}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${n}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                tick();
                onChange(n);
              }}
              className={cn(
                "flex h-14 items-center justify-center rounded-[var(--radius-chip)] border text-[19px] font-medium tabular-nums transition-colors duration-200",
                selected
                  ? "border-gold-vivid/55 bg-gold-soft text-text"
                  : "border-separator bg-surface text-text/75 hover:border-separator-strong hover:bg-surface-2",
              )}
            >
              {n}
            </motion.button>
          );
        })}
      </div>

      <p
        aria-live="polite"
        className={cn(
          "mt-4 text-center text-[15px] transition-colors",
          value == null ? "text-faint" : "text-muted",
        )}
      >
        {value == null ? "Tap a number" : (SCALE_COPY[value] ?? `${value} times`)}
      </p>
    </div>
  );
}
