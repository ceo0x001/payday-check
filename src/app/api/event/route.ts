import { z } from "zod";
import { bad, fingerprint, ok, parse, rateLimit } from "@/lib/api";
import { db } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EVENTS = [
  "session_start",
  "currency_selected",
  "question_shown",
  "question_answered",
  "question_skipped",
  "question_back",
  "flow_abandoned",
  "result_computed",
  "result_viewed",
  "share_clicked",
  "waitlist_shown",
  "waitlist_submitted",
  "interview_opt_in",
  "resumed",
] as const;

const Body = z.object({
  sessionId: z.uuid().nullable(),
  name: z.enum(EVENTS),
  props: z.record(z.string(), z.unknown()).optional().default({}),
});

export async function POST(req: Request) {
  if (!rateLimit(`event:${fingerprint(req)}`, 600, 60 * 60 * 1000)) {
    // Silently accept rather than error — analytics must never surface to a user.
    return ok();
  }

  const parsed = await parse(req, Body);
  if ("error" in parsed) return bad("Invalid event", 422);
  const d = parsed.data;

  const supabase = db();
  if (!supabase) return ok();

  const { error } = await supabase.from("events").insert({
    session_id: d.sessionId,
    name: d.name,
    props: d.props,
  });

  if (error) console.error("[event] insert failed", error.message);
  return ok();
}
