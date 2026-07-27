import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { bad, fingerprint, ok, parse, rateLimit, uaHash } from "@/lib/api";
import { db } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  currency: z.enum(["NGN", "USD"]),
  referrer: z.string().max(500).optional().default(""),
  utm: z.record(z.string(), z.string().max(200).nullable()).optional().default({}),
  deviceClass: z.string().max(32).optional().default("unknown"),
});

export async function POST(req: Request) {
  if (!rateLimit(`session:${fingerprint(req)}`, 20, 60 * 60 * 1000)) {
    return bad("Too many sessions", 429);
  }

  const parsed = await parse(req, Body);
  if ("error" in parsed) return parsed.error;
  const { currency, referrer, utm, deviceClass } = parsed.data;

  const sessionId = randomUUID();
  const supabase = db();

  // No backend configured yet: hand back a client-side id so the whole
  // experience still works. We simply lose the data point.
  if (!supabase) return NextResponse.json({ ok: true, sessionId });

  const { error } = await supabase.from("sessions").insert({
    id: sessionId,
    currency,
    referrer: referrer.slice(0, 500),
    utm_source: utm.utm_source ?? null,
    utm_medium: utm.utm_medium ?? null,
    utm_campaign: utm.utm_campaign ?? null,
    utm_content: utm.utm_content ?? null,
    device_class: deviceClass,
    ua_hash: uaHash(req),
  });

  if (error) {
    // Never let telemetry break the experience.
    console.error("[session] insert failed", error.message);
    return NextResponse.json({ ok: true, sessionId });
  }

  return ok({ sessionId });
}
