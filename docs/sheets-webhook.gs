/**
 * Payday Check → Google Sheets webhook.
 *
 * Setup:
 *   1. Open the target Google Sheet.
 *   2. Extensions → Apps Script.
 *   3. Delete anything in the editor and paste this whole file.
 *   4. Replace SHARED_SECRET below with a long random string of your own —
 *      it's how the app proves a request actually came from your deployment,
 *      since this URL is otherwise a public POST endpoint.
 *   5. Deploy → New deployment → gear icon → Web app.
 *        Execute as:      Me
 *        Who has access:  Anyone
 *      Deploy, authorize when prompted, then copy the Web app URL — it ends
 *      in /exec. That's GOOGLE_SHEETS_WEBHOOK_URL.
 *   6. Add a header row to row 1 of the sheet:
 *        timestamp | currency | archetype | squeeze_day | cycle_days |
 *        hypothesis_signal | wish | said_no | tool_gap | joined_waitlist |
 *        session_id
 *
 * Whenever you edit this script, you must create a NEW deployment version
 * (Deploy → Manage deployments → edit → New version) for changes to take
 * effect at the existing /exec URL.
 */

const SHARED_SECRET = "REPLACE_WITH_YOUR_OWN_LONG_RANDOM_STRING";

// Column J (joined_waitlist) and column K (session_id), 1-indexed.
const JOINED_WAITLIST_COL = 10;
const SESSION_ID_COL = 11;

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json({ ok: false, error: "bad json" });
  }

  if (body.secret !== SHARED_SECRET) {
    return json({ ok: false, error: "unauthorized" });
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  if (body.action === "append") {
    sheet.appendRow(body.row);
    return json({ ok: true });
  }

  if (body.action === "markWaitlist") {
    const rowIndex = findRowBySessionId(sheet, body.sessionId);
    if (rowIndex === -1) return json({ ok: true, found: false });
    sheet.getRange(rowIndex, JOINED_WAITLIST_COL).setValue("yes");
    return json({ ok: true, found: true });
  }

  return json({ ok: false, error: "unknown action" });
}

function findRowBySessionId(sheet, sessionId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const ids = sheet.getRange(2, SESSION_ID_COL, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] === sessionId) return i + 2; // +1 header, +1 to 1-index
  }
  return -1;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
