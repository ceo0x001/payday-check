"use client";

import * as React from "react";
import type {
  AnalyticsEvent,
  AnswerMap,
  AnswerValue,
  Currency,
} from "./types";

/**
 * Session state, persisted locally and mirrored to the server as it happens.
 *
 * The important decision here: **every answer is written the moment it is
 * given**, not at the end. A user who abandons at Q14 still gives us 14
 * answers. Most survey tools throw that away, and drop-offs are the most
 * informative respondents we have.
 */

const STORAGE_KEY = "payday-check.session.v1";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // resume window

export interface PersistedSession {
  sessionId: string | null;
  currency: Currency | null;
  answers: AnswerMap;
  index: number;
  startedAt: number;
  updatedAt: number;
  completed: boolean;
}

export function loadSession(): PersistedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSession;
    if (Date.now() - parsed.updatedAt > MAX_AGE_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(s: PersistedSession) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...s, updatedAt: Date.now() }),
    );
  } catch {
    /* private browsing, quota — never break the flow over telemetry */
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* no-op */
  }
}

/* ------------------------------------------------------------------ */
/* Server sync — always fire-and-forget                                */
/* ------------------------------------------------------------------ */

/**
 * Nothing in this module is allowed to block, slow, or break the experience.
 * If the backend is unreachable the user still completes the check and still
 * gets their result; we simply lose the data point.
 */
async function post<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function createSession(input: {
  currency: Currency;
  referrer: string;
  utm: Record<string, string | null>;
  deviceClass: string;
}): Promise<string | null> {
  const r = await post<{ sessionId: string }>("/api/session", input);
  return r?.sessionId ?? null;
}

export function syncAnswer(input: {
  sessionId: string | null;
  questionId: string;
  questionVersion: number;
  value: AnswerValue;
  dwellMs: number;
  changeCount: number;
  skipped: boolean;
}) {
  if (!input.sessionId) return;
  void post("/api/answer", input);
}

export function track(
  sessionId: string | null,
  name: AnalyticsEvent,
  props: Record<string, unknown> = {},
) {
  void post("/api/event", { sessionId, name, props });
}

/* ------------------------------------------------------------------ */
/* Attribution                                                         */
/* ------------------------------------------------------------------ */

export function readUtm(): Record<string, string | null> {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  return {
    utm_source: p.get("utm_source"),
    utm_medium: p.get("utm_medium"),
    utm_campaign: p.get("utm_campaign"),
    utm_content: p.get("utm_content"),
  };
}

export function deviceClass(): string {
  if (typeof window === "undefined") return "unknown";
  const w = window.innerWidth;
  const touch = "ontouchstart" in window;
  if (w < 640) return touch ? "phone" : "small";
  if (w < 1024) return "tablet";
  return "desktop";
}

/* ------------------------------------------------------------------ */
/* Per-question telemetry                                              */
/* ------------------------------------------------------------------ */

/**
 * Tracks dwell time and how many times an answer was revised.
 * High `changeCount` on a question means the *question* is ambiguous, not
 * that the user is indecisive — it's the signal we use to rewrite wording.
 */
export function useQuestionTelemetry(questionId: string) {
  // Initialised in the effect below rather than during render — reading the
  // clock while rendering is impure and the compiler is right to reject it.
  const shownAt = React.useRef(0);
  const changes = React.useRef(0);

  React.useEffect(() => {
    shownAt.current = Date.now();
    changes.current = 0;
  }, [questionId]);

  return {
    noteChange: () => {
      changes.current += 1;
    },
    read: () => ({
      dwellMs: Date.now() - shownAt.current,
      // The first answer isn't a change; only revisions count.
      changeCount: Math.max(changes.current - 1, 0),
    }),
  };
}
