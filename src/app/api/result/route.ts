import { z } from "zod";
import { after } from "next/server";
import { bad, fingerprint, ok, parse, rateLimit } from "@/lib/api";
import { db } from "@/lib/supabase";
import { appendRow } from "@/lib/sheets";

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

  const { data: session } = await supabase
    .from("sessions")
    .update({ completed_at: new Date().toISOString(), duration_ms: durationMs })
    .eq("id", sessionId)
    .select("currency")
    .single();

  // Sheets export is a convenience mirror — never let it hold up the
  // response, and never let its failure surface to the respondent.
  after(async () => {
    const { data: texts } = await supabase
      .from("answers")
      .select("question_id, value")
      .eq("session_id", sessionId)
      .in("question_id", ["wish", "said_no", "tool_gap"]);

    const textFor = (id: string) => {
      const row = texts?.find((t) => t.question_id === id);
      const value = row?.value as { kind?: string; value?: string } | undefined;
      return value?.kind === "text" ? (value.value ?? "") : "";
    };

    await appendRow([
      new Date().toISOString(),
      session?.currency ?? "",
      r.archetype,
      r.squeezeDay,
      r.cycleDays,
      r.hypothesis,
      textFor("wish"),
      textFor("said_no"),
      textFor("tool_gap"),
      "no",
      sessionId,
    ]);
  });

  return ok();
}
