import "server-only";
import { createSign } from "node:crypto";

/**
 * Server-side Google Sheets export via a service-account JWT — two plain
 * REST calls (token exchange, then the Sheets API), no `googleapis`
 * dependency.
 *
 * This is a convenience mirror, not a source of truth: Supabase remains
 * authoritative. If Google is unreachable or unconfigured, every call
 * degrades to a silent no-op — a sheet-export outage must never break the
 * experience for a respondent.
 *
 * Column layout (see supabase migration for the equivalent source data):
 *   A timestamp · B currency · C archetype · D squeeze_day · E cycle_days ·
 *   F hypothesis_signal · G wish · H said_no · I tool_gap ·
 *   J joined_waitlist · K session_id (internal correlation column)
 */

interface ServiceAccountEnv {
  email: string;
  privateKey: string;
  sheetId: string;
  tab: string;
}

function env(): ServiceAccountEnv | null {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!email || !privateKey || !sheetId) return null;
  return { email, privateKey, sheetId, tab: process.env.GOOGLE_SHEET_TAB || "Sheet1" };
}

export function sheetsConfigured(): boolean {
  return env() !== null;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function accessToken(e: ServiceAccountEnv): Promise<string | null> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 30_000) {
    return cachedToken.token;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: e.email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claims}`;

  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(e.privateKey).toString("base64url");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });

  if (!res.ok) {
    console.error("[sheets] token exchange failed", await res.text());
    return null;
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.token;
}

function base64url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

/** Appends one row at the end of the configured tab. Never throws. */
export async function appendRow(values: (string | number | null)[]): Promise<void> {
  const e = env();
  if (!e) return;
  try {
    const token = await accessToken(e);
    if (!token) return;

    const range = encodeURIComponent(`${e.tab}!A:A`);
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${e.sheetId}/values/${range}:append?valueInputOption=USER_ENTERED`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: [values.map((v) => v ?? "")] }),
      },
    );
    if (!res.ok) console.error("[sheets] append failed", await res.text());
  } catch (err) {
    console.error("[sheets] append threw", err);
  }
}

/**
 * Finds the row whose session_id (column K) matches and flips
 * `joined_waitlist` (column J) to "yes". Best-effort: if the row can't be
 * found — e.g. the append from `/api/result` hasn't landed yet — this
 * silently does nothing rather than fighting a race.
 */
export async function markJoinedWaitlist(sessionId: string): Promise<void> {
  const e = env();
  if (!e) return;
  try {
    const token = await accessToken(e);
    if (!token) return;

    const idRange = encodeURIComponent(`${e.tab}!K2:K`);
    const idRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${e.sheetId}/values/${idRange}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!idRes.ok) return;

    const idData = (await idRes.json()) as { values?: string[][] };
    const rowOffset = (idData.values ?? []).findIndex((row) => row[0] === sessionId);
    if (rowOffset === -1) return;

    const rowNumber = rowOffset + 2; // +1 header, +1 to move from 0-index to 1-index
    const cellRange = encodeURIComponent(`${e.tab}!J${rowNumber}`);
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${e.sheetId}/values/${cellRange}?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: [["yes"]] }),
      },
    );
    if (!res.ok) console.error("[sheets] mark waitlist failed", await res.text());
  } catch (err) {
    console.error("[sheets] mark waitlist threw", err);
  }
}
