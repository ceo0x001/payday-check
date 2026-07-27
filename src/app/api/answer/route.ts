import { z } from "zod";
import { bad, fingerprint, ok, parse, rateLimit } from "@/lib/api";
import { db } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Answers are written the moment they're given, not at the end.
 *
 * A user who abandons at Q14 still gives us 14 answers. Most survey tools
 * throw that away — and drop-offs are the most informative respondents we
 * have, because they tell us which question broke the experience.
 */

const Value = z.union([
  z.object({ kind: z.literal("single"), value: z.string().max(64), text: z.string().max(400).optional() }),
  z.object({ kind: z.literal("multi"), values: z.array(z.string().max(64)).max(32), text: z.string().max(400).optional() }),
  z.object({ kind: z.literal("ordered-multi"), values: z.array(z.string().max(64)).max(32) }),
  z.object({ kind: z.literal("number"), value: z.number().finite() }),
  z.object({ kind: z.literal("text"), value: z.string().max(2000) }),
  z.object({ kind: z.literal("skipped") }),
]);

const Body = z.object({
  sessionId: z.uuid(),
  questionId: z.string().max(64),
  questionVersion: z.number().int().min(1).max(999),
  value: Value,
  dwellMs: z.number().int().min(0).max(60 * 60 * 1000),
  changeCount: z.number().int().min(0).max(999),
  skipped: z.boolean(),
});

export async function POST(req: Request) {
  // ~50 writes per respondent in six minutes; 400/hour is generous but bounded.
  if (!rateLimit(`answer:${fingerprint(req)}`, 400, 60 * 60 * 1000)) {
    return bad("Too many writes", 429);
  }

  const parsed = await parse(req, Body);
  if ("error" in parsed) return parsed.error;
  const d = parsed.data;

  const supabase = db();
  if (!supabase) return ok();

  const { error } = await supabase.from("answers").upsert(
    {
      session_id: d.sessionId,
      question_id: d.questionId,
      question_version: d.questionVersion,
      value: d.value,
      dwell_ms: d.dwellMs,
      change_count: d.changeCount,
      skipped: d.skipped,
      answered_at: new Date().toISOString(),
    },
    { onConflict: "session_id,question_id" },
  );

  if (error) console.error("[answer] upsert failed", error.message);

  // Lets us see exactly where an abandoned session stopped.
  await supabase
    .from("sessions")
    .update({ last_question_id: d.questionId })
    .eq("id", d.sessionId);

  return ok();
}
