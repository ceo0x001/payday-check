import "server-only";
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import type { ZodType } from "zod";

/** Shared helpers for the route handlers. */

export function ok<T extends object>(body: T = {} as T) {
  return NextResponse.json({ ok: true, ...body });
}

export function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function parse<T>(
  req: Request,
  schema: ZodType<T>,
): Promise<{ data: T } | { error: NextResponse }> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return { error: bad("Malformed body") };
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    return { error: bad("Invalid body", 422) };
  }
  return { data: result.data };
}

/**
 * We never store an IP address. This hash exists only to rate-limit and to
 * classify device type — it is salted per-deployment and one-way.
 */
export function fingerprint(req: Request): string {
  const salt = process.env.ANALYTICS_SALT ?? "payday-check-dev-salt";
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const ua = req.headers.get("user-agent") ?? "";
  return createHash("sha256").update(`${salt}:${ip}:${ua}`).digest("hex").slice(0, 32);
}

export function uaHash(req: Request): string {
  const salt = process.env.ANALYTICS_SALT ?? "payday-check-dev-salt";
  const ua = req.headers.get("user-agent") ?? "";
  return createHash("sha256").update(`${salt}:${ua}`).digest("hex").slice(0, 24);
}

/* ------------------------------------------------------------------ */
/* Rate limiting                                                       */
/* ------------------------------------------------------------------ */

/**
 * In-memory fixed-window limiter. Adequate for a launch-scale campaign on a
 * single region; swap for Upstash Redis if this ever runs multi-instance —
 * see README. Deliberately generous, because a legitimate respondent fires
 * ~50 writes in six minutes.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const b = buckets.get(key);

  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    // Opportunistic sweep so the map can't grow without bound.
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k);
    }
    return true;
  }

  if (b.count >= limit) return false;
  b.count += 1;
  return true;
}
