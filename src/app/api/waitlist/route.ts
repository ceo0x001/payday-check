import { NextResponse } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import { bad, fingerprint, ok, parse, rateLimit } from "@/lib/api";
import { db } from "@/lib/supabase";
import { markJoinedWaitlist } from "@/lib/sheets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  sessionId: z.uuid().nullable(),
  email: z.email().max(254),
  firstName: z.string().max(80).nullable().optional(),
  wantsInterview: z.boolean(),
  currency: z.enum(["NGN", "USD"]),
});

export async function POST(req: Request) {
  if (!rateLimit(`waitlist:${fingerprint(req)}`, 5, 60 * 60 * 1000)) {
    return bad("Too many signups", 429);
  }

  const parsed = await parse(req, Body);
  if ("error" in parsed) return parsed.error;
  const d = parsed.data;
  const email = d.email.trim().toLowerCase();

  const supabase = db();
  if (!supabase) {
    // Unconfigured backend: the user still gets a clean confirmation.
    return NextResponse.json({ ok: true, position: null });
  }

  const { data, error } = await supabase
    .from("waitlist")
    .upsert(
      {
        session_id: d.sessionId,
        email,
        first_name: d.firstName?.trim() || null,
        wants_interview: d.wantsInterview,
        currency: d.currency,
      },
      { onConflict: "email" },
    )
    .select("position")
    .single();

  if (error) {
    console.error("[waitlist] upsert failed", error.message);
    return bad("Could not join the list", 500);
  }

  if (d.sessionId) {
    after(() => markJoinedWaitlist(d.sessionId as string));
  }

  // `position` is a real sequence from the database — we never invent it.
  return ok({ position: data?.position ?? null });
}
