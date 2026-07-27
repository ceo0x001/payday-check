"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, EyeOff, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CURRENCIES } from "@/lib/locale";
import { cn, tick } from "@/lib/utils";
import { loadSession, saveSession, track } from "@/lib/store";
import type { Currency } from "@/lib/types";

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
});

/**
 * The promise, made in one line, with the objections answered before they're
 * raised. The three trust markers exist because "financial assessment" makes
 * people brace for a bank login and a sales call.
 *
 * The currency choice doubles as the first micro-commitment: one small tap
 * before the real work measurably raises completion.
 */
export function Landing() {
  const router = useRouter();
  const [currency, setCurrency] = React.useState<Currency>("NGN");
  const [hasSession, setHasSession] = React.useState(false);

  React.useEffect(() => {
    const s = loadSession();
    if (s && !s.completed && Object.keys(s.answers).length > 0) {
      // localStorage doesn't exist on the server, so this can't be read during
      // render without a hydration mismatch. One-time boot sync.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasSession(true);
      if (s.currency) setCurrency(s.currency);
    }
    track(null, "session_start", { entry: "landing" });
  }, []);

  const start = () => {
    const existing = loadSession();
    saveSession({
      sessionId: null,
      answers: {},
      index: 0,
      startedAt: Date.now(),
      updatedAt: Date.now(),
      completed: false,
      ...(hasSession && existing ? existing : {}),
      currency,
    });
    router.push("/check");
  };

  return (
    <main className="bloom relative flex min-h-[100dvh] flex-col">
      <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col px-6">
        <motion.p
          {...fade(0.05)}
          className="text-gold safe-top pt-6 text-[13px] tracking-[0.18em] uppercase"
        >
          Payday Check
        </motion.p>

        <div className="flex flex-1 flex-col justify-center py-10">
          <motion.h1
            {...fade(0.12)}
            className="display text-[40px] font-semibold sm:text-[48px]"
          >
            Can your salary actually reach payday?
          </motion.h1>

          <motion.p
            {...fade(0.22)}
            className="text-muted mt-5 text-[18px] leading-relaxed"
          >
            Six minutes, twenty-one questions, and an honest read on where your
            money actually goes — and why the last week of the month feels the
            way it does.
          </motion.p>

          <motion.div {...fade(0.32)} className="mt-9">
            <p className="text-faint mb-3 text-[14px]">
              Which currency do you earn in?
            </p>
            <div
              role="radiogroup"
              aria-label="Currency"
              className="border-separator bg-surface flex gap-1 rounded-full border p-1"
            >
              {CURRENCIES.map((c) => {
                const active = currency === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => {
                      tick();
                      setCurrency(c.code);
                    }}
                    className={cn(
                      "relative flex h-12 flex-1 items-center justify-center gap-2 rounded-full text-[16px] transition-colors duration-200",
                      active ? "text-on-gold" : "text-muted hover:text-text",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="currency-pill"
                        className="bg-gold-vivid absolute inset-0 rounded-full"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    <span className="relative flex items-center gap-1.5">
                      <span className="text-[17px] font-semibold">{c.symbol}</span>
                      <span className="font-medium">{c.name}</span>
                      <span
                        className={cn(
                          "text-[13px]",
                          active ? "text-on-gold/60" : "text-faint",
                        )}
                      >
                        {c.blurb}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>

        <motion.div {...fade(0.42)} className="safe-bottom pb-2">
          <Button size="lg" full onClick={start} variant="primary">
            {hasSession ? "Pick up where you left off" : "Start my check"}
          </Button>

          <ul className="text-faint mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px]">
            <Marker icon={<Lock className="size-3.5" />}>No bank access</Marker>
            <Marker icon={<EyeOff className="size-3.5" />}>
              No exact salary
            </Marker>
            <Marker icon={<Clock3 className="size-3.5" />}>No signup</Marker>
          </ul>

          <p className="text-faint/80 mt-4 text-center text-[12px] leading-relaxed">
            Answers are stored anonymously and used to understand how salary
            earners manage the month. Nothing here is financial advice.
          </p>
        </motion.div>
      </div>
    </main>
  );
}

function Marker({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-1.5">
      <span className="text-gold/70" aria-hidden>
        {icon}
      </span>
      {children}
    </li>
  );
}
