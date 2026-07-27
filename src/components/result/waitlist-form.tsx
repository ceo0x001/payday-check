"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/store";
import { cn, tick } from "@/lib/utils";
import type { Currency } from "@/lib/types";

interface WaitlistFormProps {
  sessionId: string | null;
  currency: Currency;
  archetype: string;
}

/**
 * An invitation, not a funnel.
 *
 * The result is delivered in full *before* this is ever shown — no gate, no
 * interstitial, no "enter your email to see your score". If the result is
 * good the email is easy; if we have to trap people to get it, the result
 * wasn't good enough.
 *
 * The interview toggle is the point of this whole form. Emails are a vanity
 * metric; twenty conversations is a company.
 */
export function WaitlistForm({
  sessionId,
  currency,
  archetype,
}: WaitlistFormProps) {
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [wantsInterview, setWantsInterview] = React.useState(false);
  const [state, setState] = React.useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );
  const [position, setPosition] = React.useState<number | null>(null);

  const shown = React.useRef(false);
  React.useEffect(() => {
    if (shown.current) return;
    shown.current = true;
    track(sessionId, "waitlist_shown", { archetype });
  }, [sessionId, archetype]);

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || state === "sending") return;
    setState("sending");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          email: email.trim(),
          firstName: name.trim() || null,
          wantsInterview,
          currency,
        }),
      });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { position: number | null };
      setPosition(data.position);
      setState("done");
      track(sessionId, "waitlist_submitted", { wantsInterview });
      if (wantsInterview) track(sessionId, "interview_opt_in", {});
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="border-gold-vivid/25 bg-gold-soft rounded-[var(--radius-card)] border p-6"
      >
        <div className="bg-gold-vivid text-on-gold mb-4 flex size-10 items-center justify-center rounded-full">
          <Check className="size-5" strokeWidth={3} />
        </div>

        <h3 className="display text-[26px] font-semibold">
          {name ? `You're in, ${name}.` : "You're in."}
        </h3>

        {position != null && (
          <p className="text-muted mt-2 text-[16px]">
            You&rsquo;re number{" "}
            <span className="text-gold font-semibold tabular-nums">
              {position}
            </span>{" "}
            on the list.
          </p>
        )}

        <ul className="text-muted mt-5 flex flex-col gap-2.5 text-[15px] leading-relaxed">
          <Bullet>
            We&rsquo;ll email you once — when there&rsquo;s something real to
            try. Not a newsletter.
          </Bullet>
          <Bullet>
            The first hundred people shape what gets built. That&rsquo;s not a
            figure of speech.
          </Bullet>
          <Bullet>
            {wantsInterview
              ? "We'll reach out about a 15-minute conversation. Thank you — that part genuinely matters."
              : "If you change your mind about talking to us, just reply to the email."}
          </Bullet>
        </ul>
      </motion.div>
    );
  }

  return (
    <div className="border-separator bg-surface rounded-[var(--radius-card)] border p-6">
      <p className="text-gold mb-2 text-[13px] tracking-[0.16em] uppercase">
        What we&rsquo;re building
      </p>

      <h3 className="display text-[27px] font-semibold sm:text-[30px]">
        We&rsquo;re building this with about 100 people first.
      </h3>

      <p className="text-muted mt-3 text-[16px] leading-relaxed">
        You just described your month more precisely than most people ever do.
        We&rsquo;re building something for exactly this — and we&rsquo;d rather
        build it with you than at you.
      </p>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
          inputMode="email"
          required
        />
        <Field
          label="What should we call you?"
          type="text"
          value={name}
          onChange={setName}
          placeholder="Optional"
          autoComplete="given-name"
        />

        <button
          type="button"
          role="checkbox"
          aria-checked={wantsInterview}
          onClick={() => {
            tick();
            setWantsInterview((v) => !v);
          }}
          className={cn(
            "mt-1 flex items-start gap-3 rounded-[var(--radius-chip)] border p-4 text-left transition-colors",
            wantsInterview
              ? "border-gold-vivid/55 bg-gold-soft"
              : "border-separator bg-surface-2 hover:border-separator-strong",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[6px] border transition-colors",
              wantsInterview
                ? "border-gold-vivid bg-gold-vivid text-on-gold"
                : "border-separator-strong text-transparent",
            )}
          >
            <Check className="size-3" strokeWidth={3.5} />
          </span>
          <span>
            <span className="text-text block text-[15px] font-medium">
              I&rsquo;d talk to you for 15 minutes
            </span>
            <span className="text-faint mt-0.5 block text-[14px] leading-snug">
              A real conversation, no sales pitch. This is how the thing
              actually gets good.
            </span>
          </span>
        </button>

        <AnimatePresence>
          {state === "error" && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-amber text-[14px]"
            >
              That didn&rsquo;t go through. Try once more?
            </motion.p>
          )}
        </AnimatePresence>

        <Button
          type="submit"
          size="lg"
          full
          variant="gold"
          disabled={!valid || state === "sending"}
          className="mt-2"
        >
          {state === "sending" ? "One moment…" : "Join the early group"}
          {state !== "sending" && <ArrowRight className="size-4" />}
        </Button>

        <p className="text-faint mt-1 text-center text-[12px] leading-relaxed">
          One email when it&rsquo;s ready. No newsletter, no sharing your
          address, unsubscribe in one tap.
        </p>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Field({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  const id = React.useId();
  return (
    <div>
      <label htmlFor={id} className="text-faint mb-1.5 block text-[13px]">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-separator bg-surface-2 text-text focus:border-gold-vivid/45 h-14 w-full rounded-[var(--radius-chip)] border px-4 text-[17px] outline-none transition-colors"
        {...rest}
      />
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="bg-gold-vivid/60 mt-[9px] size-1.5 shrink-0 rounded-full" aria-hidden />
      <span>{children}</span>
    </li>
  );
}
