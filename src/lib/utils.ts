import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * A short haptic tick on selection.
 * Android honours this; iOS Safari ignores it silently, which is fine —
 * it's an enhancement, never a signal the user depends on.
 */
export function tick(pattern: number | number[] = 8) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* no-op */
    }
  }
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

/** "about 4 min left" — never says 0, never counts back up. */
export function formatRemaining(seconds: number): string {
  if (seconds <= 45) return "almost there";
  const mins = Math.max(1, Math.round(seconds / 60));
  return `about ${mins} min left`;
}
