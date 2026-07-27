import "server-only";

/**
 * Server-side Google Sheets export via an Apps Script web-app webhook.
 *
 * Originally this used a GCP service-account JWT, but org policy
 * (`iam.managed.disableServiceAccountKeyCreation`) blocks key downloads on
 * many Google Cloud orgs by default and that isn't something a project owner
 * can toggle without org-admin rights. An Apps Script deployment, bound to a
 * personal Google account, sidesteps that entirely — no service account, no
 * IAM, nothing for an org policy to block.
 *
 * This is a convenience mirror, not a source of truth: Supabase remains
 * authoritative. If the webhook is unreachable or unconfigured, every call
 * degrades to a silent no-op — a sheet-export outage must never break the
 * experience for a respondent.
 *
 * Column layout (see supabase migration for the equivalent source data):
 *   A timestamp · B currency · C archetype · D squeeze_day · E cycle_days ·
 *   F hypothesis_signal · G wish · H said_no · I tool_gap ·
 *   J joined_waitlist · K session_id (internal correlation column)
 */

function config(): { url: string; secret: string } | null {
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  const secret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET;
  if (!url || !secret) return null;
  return { url, secret };
}

export function sheetsConfigured(): boolean {
  return config() !== null;
}

async function call(body: Record<string, unknown>): Promise<void> {
  const c = config();
  if (!c) return;
  try {
    // Apps Script's redirect on POST needs `redirect: "follow"` (fetch's
    // default) — it 302s from the /exec URL to the actual execution.
    const res = await fetch(c.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, secret: c.secret }),
    });
    const text = await res.text();
    if (!res.ok || !text.includes('"ok":true')) {
      console.error("[sheets] webhook call failed", res.status, text.slice(0, 300));
    }
  } catch (err) {
    console.error("[sheets] webhook call threw", err);
  }
}

/** Appends one row at the end of the sheet. Never throws. */
export async function appendRow(values: (string | number | null)[]): Promise<void> {
  await call({ action: "append", row: values.map((v) => v ?? "") });
}

/**
 * Flips `joined_waitlist` (column J) to "yes" on the row whose session_id
 * (column K) matches. Best-effort: if the row can't be found — e.g. the
 * append from `/api/result` hasn't landed yet — this does nothing.
 */
export async function markJoinedWaitlist(sessionId: string): Promise<void> {
  await call({ action: "markWaitlist", sessionId });
}
