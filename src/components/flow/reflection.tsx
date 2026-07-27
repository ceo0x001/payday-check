"use client";

import { motion } from "framer-motion";
import type { ReflectionCopy } from "@/lib/types";

/**
 * A rest stop. No question, no input — one sentence that reflects the user's
 * own answer back at them.
 *
 * These never fabricate a benchmark. We have no dataset yet, so we never say
 * "72% of people…". We say only what we actually know: what they just told us.
 */
export function Reflection({ copy }: { copy: ReflectionCopy }) {
  return (
    <div className="flex min-h-[54vh] flex-col justify-center">
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="text-gold mb-4 text-[13px] tracking-[0.14em] uppercase"
      >
        {copy.eyebrow}
      </motion.p>

      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="display text-[30px] font-semibold sm:text-[34px]"
      >
        {copy.headline}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-muted mt-4 text-[17px] leading-relaxed"
      >
        {copy.body}
      </motion.p>
    </div>
  );
}
