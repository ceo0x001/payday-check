import { z } from "zod";
import { bad, fingerprint, ok, parse, rateLimit } from "@/lib/api";
import { db } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ARCHETYPES = [
  "steady_hand",
  "tightrope",
  "treadmill",
  "provider",
  "ambush",
  "front_loader",
  "slow_leak",
] as const;

const HYPOTHESES = [
  "H1_visibility",
  "H2_adequacy",
  "H3_lumpiness",
  "H4_obligation",
  "H5_regulation",
  "H6_treadmill",
] as const;

const Body = z.object({
  sessionId: z.uuid(),
  durationMs: z.number().int().min(0),
  result: z.object({
    archetype: z.enum(ARCHETYPES),
    secondaryArchetype: z.enum(ARCHETYPES).nullable(),
    cycleDays: z.number().int().min(1).max(31),
    squeezeDay: z.number().int().min(1).max(31).nullable(),
    runwayPct: z.number().min(0).max(1).nullable(),
    tightDays: z.number().int().min(0).max(31).nullable(),
    hypothesis: z.enum(HYPOTHESES),
    signals: z.record(z.string(), z.unknown()),
    headline: z.string().max(200),
  }),
});

export async function POST(req: Request) {
  if (!rateLimit(`result:${fingerprint(req)}`, 30, 60 * 60 * 1000)) {
    return bad("Too many results", 429);
  }

  const parsed = await parse(req, Body);
  if ("error" in parsed) return parsed.error;
  const { sessionId, durationMs, result: r } = parsed.data;

  const supabase = db();
  if (!supabase) return ok();

  const { error } = await supabase.from("results").upsert(
    {
      session_id: sessionId,
      archetype: r.archetype,
      secondary_archetype: r.secondaryArchetype,
      cycle_days: r.cycleDays,
      squeeze_day: r.squeezeDay,
      runway_pct: r.runwayPct,
      tight_days: r.tightDays,
      hypothesis_signal: r.hypothesis,
      signals: r.signals,
      headline: r.headline,
    },
    { onConflict: "session_id" },
  );

  if (error) console.error("[result] upsert failed", error.message);

  await supabase
    .from("sessions")
    .update({ completed_at: new Date().toISOString(), duration_ms: durationMs })
    .eq("id", sessionId);

  return ok();
}
