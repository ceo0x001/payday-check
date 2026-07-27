"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChipProps {
  label: string;
  hint?: string;
  selected: boolean;
  onSelect: () => void;
  /** Semantics differ: single-select is a radio, multi-select is a checkbox. */
  role: "radio" | "checkbox";
  /** Selection-order badge for ordered-multi questions. */
  order?: number;
  disabled?: boolean;
  index?: number;
}

/**
 * The workhorse of the whole flow — 16 of 21 questions are answered by
 * tapping one of these. Full-width rows rather than a grid: they're easier
 * to hit one-handed, and long labels don't need to be truncated.
 */
export const Chip = React.memo(function Chip({
  label,
  hint,
  selected,
  onSelect,
  role,
  order,
  disabled,
  index = 0,
}: ChipProps) {
  return (
    <motion.button
      type="button"
      role={role}
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: Math.min(index * 0.028, 0.28),
        duration: 0.32,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileTap={{ scale: 0.975 }}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-[var(--radius-chip)] border px-4 py-4 text-left",
        "min-h-[56px] transition-colors duration-200",
        selected
          ? "border-gold-vivid/55 bg-gold-soft"
          : "border-separator bg-surface hover:border-separator-strong hover:bg-surface-2",
        disabled && "pointer-events-none opacity-35",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-6 shrink-0 items-center justify-center border transition-all duration-200",
          role === "radio" ? "rounded-full" : "rounded-[7px]",
          selected
            ? "border-gold-vivid bg-gold-vivid text-on-gold"
            : "border-separator-strong bg-transparent text-transparent",
        )}
      >
        {order != null ? (
          <span className="text-[12px] leading-none font-semibold tabular-nums">
            {order}
          </span>
        ) : (
          <Check className="size-3.5" strokeWidth={3.5} />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block text-[16px] leading-snug transition-colors",
            selected ? "text-text font-medium" : "text-text/90",
          )}
        >
          {label}
        </span>
        {hint && (
          <span className="text-faint mt-0.5 block text-[13px] leading-snug">
            {hint}
          </span>
        )}
      </span>
    </motion.button>
  );
});
