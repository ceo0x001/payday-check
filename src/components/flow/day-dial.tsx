"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn, clamp, tick } from "@/lib/utils";

interface DayDialProps {
  days: number;
  value: number | null;
  onChange: (day: number) => void;
  /** Result screen replays the dial as a read-only figure. */
  readOnly?: boolean;
  size?: number;
}

const TAU = Math.PI * 2;

/** Day → angle in radians, with day N landing back at the top (a full cycle). */
function angleFor(day: number, days: number) {
  return (day / days) * TAU - Math.PI / 2;
}

function pointOn(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

/** SVG arc path from the top of the circle, clockwise, to `day`. */
function arcPath(cx: number, cy: number, r: number, day: number, days: number) {
  const start = -Math.PI / 2;
  const end = angleFor(day, days);
  const sweep = day / days;
  if (sweep <= 0) return "";
  // A single arc command can't describe a full circle; nudge the endpoint.
  const e = sweep >= 0.999 ? end - 0.001 : end;
  const p0 = pointOn(cx, cy, r, start);
  const p1 = pointOn(cx, cy, r, e);
  const largeArc = sweep > 0.5 ? 1 : 0;
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${largeArc} 1 ${p1.x} ${p1.y}`;
}

/**
 * THE DAY DIAL — the signature interaction of the whole product.
 *
 * One gesture produces the primary metric. Asking "what day?" rather than
 * "how much?" gets a fast, low-shame, honest answer: people who would never
 * disclose a salary will tell you it's the 17th without hesitating.
 *
 * The gold arc is the part of the cycle the money holds. The dim remainder is
 * the tight zone. Fully keyboard-operable, because a drag-only control would
 * lock out anyone who can't drag.
 */
export function DayDial({
  days,
  value,
  onChange,
  readOnly = false,
  size = 288,
}: DayDialProps) {
  const reduce = useReducedMotion();
  const ref = React.useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const lastEmitted = React.useRef<number | null>(null);

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 34;

  const day = value ?? Math.round(days * 0.6);
  const touched = value !== null;

  const dayFromPointer = React.useCallback(
    (clientX: number, clientY: number) => {
      const el = ref.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const dx = clientX - (rect.left + rect.width / 2);
      const dy = clientY - (rect.top + rect.height / 2);
      // Normalise so the top of the dial is 0 and it runs clockwise.
      const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
      const fromTop = (deg + 90 + 360) % 360;
      const d = Math.round((fromTop / 360) * days);
      return clamp(d === 0 ? days : d, 1, days);
    },
    [days],
  );

  const emit = React.useCallback(
    (d: number | null) => {
      if (d == null || d === lastEmitted.current) return;
      lastEmitted.current = d;
      tick(6);
      onChange(d);
    },
    [onChange],
  );

  const handlePointer = (e: React.PointerEvent) => {
    if (readOnly) return;
    emit(dayFromPointer(e.clientX, e.clientY));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (readOnly) return;
    const step = e.key === "PageUp" || e.key === "PageDown" ? 7 : 1;
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "PageUp") {
      next = clamp(day + step, 1, days);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown" || e.key === "PageDown") {
      next = clamp(day - step, 1, days);
    } else if (e.key === "Home") {
      next = 1;
    } else if (e.key === "End") {
      next = days;
    }
    if (next != null) {
      e.preventDefault();
      lastEmitted.current = null;
      emit(next);
    }
  };

  const handle = pointOn(cx, cy, r, angleFor(day, days));
  const ticks = React.useMemo(
    () => Array.from({ length: days }, (_, i) => i + 1),
    [days],
  );
  const majorEvery = days > 20 ? 5 : days > 10 ? 3 : 1;

  return (
    <div className="flex flex-col items-center">
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        // `rounded-full` so the focus ring traces the dial rather than
        // boxing it — a square outline around a circle looks broken.
        className={cn(
          "touch-none rounded-full select-none",
          !readOnly && "cursor-grab",
          dragging && "cursor-grabbing",
        )}
        role={readOnly ? "img" : "slider"}
        aria-label={readOnly ? undefined : "Day your money starts feeling tight"}
        aria-valuemin={readOnly ? undefined : 1}
        aria-valuemax={readOnly ? undefined : days}
        aria-valuenow={readOnly ? undefined : day}
        aria-valuetext={readOnly ? undefined : `Day ${day} of ${days}`}
        tabIndex={readOnly ? -1 : 0}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => {
          if (readOnly) return;
          (e.target as Element).setPointerCapture?.(e.pointerId);
          setDragging(true);
          handlePointer(e);
        }}
        onPointerMove={(e) => dragging && handlePointer(e)}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
      >
        {/* Tick ring — the cycle, drawn as days. */}
        <g>
          {ticks.map((t) => {
            const a = angleFor(t, days);
            const isMajor = t % majorEvery === 0 || t === days;
            const inner = pointOn(cx, cy, r - (isMajor ? 11 : 7), a);
            const outer = pointOn(cx, cy, r - 1, a);
            const passed = t <= day;
            return (
              <line
                key={t}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                strokeWidth={isMajor ? 2 : 1.25}
                strokeLinecap="round"
                stroke={passed ? "var(--gold-vivid)" : "var(--separator)"}
                strokeOpacity={passed ? 0.6 : 1}
                className="transition-[stroke] duration-200"
              />
            );
          })}
        </g>

        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--separator)"
          strokeWidth={3}
        />

        {/* The runway — how far the money holds. */}
        <path
          d={arcPath(cx, cy, r, day, days)}
          fill="none"
          stroke="var(--gold-vivid)"
          strokeWidth={3.5}
          strokeLinecap="round"
          opacity={touched || readOnly ? 1 : 0.4}
          className="transition-opacity duration-300"
        />

        {/* Handle */}
        <motion.g
          animate={{ x: handle.x, y: handle.y }}
          transition={
            reduce
              ? { duration: 0 }
              : { type: "spring", stiffness: 520, damping: 34, mass: 0.6 }
          }
        >
          {!touched && !readOnly && !reduce && (
            <motion.circle
              r={16}
              fill="none"
              stroke="var(--gold-vivid)"
              strokeWidth={1.5}
              animate={{ r: [13, 22], opacity: [0.5, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
            />
          )}
          <circle r={13} fill="var(--gold-vivid)" />
          <circle r={13} fill="none" stroke="var(--on-gold)" strokeOpacity={0.28} strokeWidth={1} />
          <circle r={4.5} fill="var(--on-gold)" opacity={0.85} />
        </motion.g>

        {/* Centre readout */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          className="fill-text"
          style={{
            fontSize: 54,
            fontWeight: 600,
            letterSpacing: "-0.04em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {day}
        </text>
        <text
          x={cx}
          y={cy + 24}
          textAnchor="middle"
          className="fill-muted"
          style={{ fontSize: 14, letterSpacing: "0.06em", textTransform: "uppercase" }}
        >
          {days === 7 ? `day of ${days}` : `of ${days}`}
        </text>
      </svg>

      {!readOnly && (
        <p
          aria-live="polite"
          className={cn(
            "mt-1 text-[14px] transition-colors duration-300",
            touched ? "text-muted" : "text-faint",
          )}
        >
          {touched
            ? day >= days
              ? "It holds all the way through"
              : `${days - day} ${days - day === 1 ? "day" : "days"} in the tight zone`
            : "Drag the dial, or use the arrow keys"}
        </p>
      )}
    </div>
  );
}
