"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TextAnswerProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  /** Rotating example prompts, to defeat blank-page paralysis without leading. */
  autoFocus?: boolean;
}

/**
 * The only required free-text field in the flow is `wish`; everything else
 * here is optional. Auto-growing so the box never scrolls under the thumb,
 * and 17px so iOS doesn't zoom the viewport on focus.
 */
export function TextAnswer({
  value,
  onChange,
  placeholder,
  maxLength = 400,
  autoFocus = false,
}: TextAnswerProps) {
  const ref = React.useRef<HTMLTextAreaElement>(null);

  const resize = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 260)}px`;
  }, []);

  React.useEffect(resize, [value, resize]);

  const remaining = maxLength - value.length;

  return (
    <div className="w-full">
      <textarea
        ref={ref}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder={placeholder}
        rows={3}
        maxLength={maxLength}
        enterKeyHint="done"
        autoCapitalize="sentences"
        autoCorrect="on"
        spellCheck
        className={cn(
          "border-separator bg-surface text-text w-full resize-none rounded-[22px] border px-5 py-4",
          "text-[17px] leading-relaxed",
          "focus:border-gold-vivid/45 outline-none transition-colors duration-200",
        )}
      />
      <div className="mt-2 flex justify-end">
        <span
          className={cn(
            "text-[12px] tabular-nums transition-opacity",
            remaining < 40 ? "text-amber opacity-100" : "text-faint opacity-0",
          )}
        >
          {remaining}
        </span>
      </div>
    </div>
  );
}
