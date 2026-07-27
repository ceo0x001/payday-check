"use client";

import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { cn, formatRemaining } from "@/lib/utils";

interface ProgressHeaderProps {
  progress: number; // 0..1 overall
  actLabel: string;
  /** Omitted on reflection steps, which aren't questions. */
  position?: { index: number; total: number };
  secondsRemaining: number;
  canGoBack: boolean;
  onBack: () => void;
}

/**
 * Three layers, because a bare percentage is demotivating in the middle third:
 * a hairline bar, a chapter counter that resets six times (so the goal always
 * feels near), and an honest time estimate that is never allowed to increase.
 */
export function ProgressHeader({
  progress,
  actLabel,
  position,
  secondsRemaining,
  canGoBack,
  onBack,
}: ProgressHeaderProps) {
  return (
    <header className="bg-bg/85 sticky top-0 z-30 backdrop-blur-xl">
      <div className="bg-separator h-[2px] w-full">
        <motion.div
          className="bg-gold-vivid h-full origin-left"
          initial={false}
          animate={{ scaleX: Math.max(progress, 0.015) }}
          style={{ width: "100%" }}
          transition={{ type: "spring", stiffness: 180, damping: 28 }}
        />
      </div>

      <div className="safe-top mx-auto flex w-full max-w-[560px] items-center justify-between gap-3 px-4 pb-3">
        <button
          type="button"
          onClick={onBack}
          disabled={!canGoBack}
          aria-label="Previous question"
          className={cn(
            "-ml-2 flex size-10 items-center justify-center rounded-full transition-opacity",
            canGoBack
              ? "text-muted hover:text-text active:scale-95"
              : "pointer-events-none opacity-0",
          )}
        >
          <ChevronLeft className="size-6" strokeWidth={2} />
        </button>

        <p
          className="text-muted min-w-0 flex-1 truncate text-center text-[13px] tracking-wide"
          aria-live="polite"
        >
          <span className="text-text/85">{actLabel}</span>
          {position && (
            <span className="text-faint">
              {" · "}
              {position.index} of {position.total}
            </span>
          )}
        </p>

        <span className="text-faint w-[92px] shrink-0 text-right text-[11.5px] whitespace-nowrap tabular-nums">
          {formatRemaining(secondsRemaining)}
        </span>
      </div>
    </header>
  );
}
