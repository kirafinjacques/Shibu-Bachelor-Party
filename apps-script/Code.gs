/**
 * SA's Bachelor Party — RSVP + guest list backend (Google Apps Script).
 *
 * One-time setup (see README "RSVP & admin dashboard"):
 *   1. Create a Google Sheet → Extensions → Apps Script → paste this file.
 *   2. Run `setup` once (authorise when asked). It creates the "Invites" and "RSVPs" tabs.
 *   3. Project Settings → Script Properties → add ADMIN_KEY = <your secret passcode>.
 *   4. Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone.
 *      Copy the /exec URL into rsvp-config.js.
 *
 * All requests are POSTed as JSON text (Content-Type: text/plain) to avoid CORS preflight.
 *   { action: "rsvp", ... }                       public — guest RSVP (insert or update)
 *   { action: "list", key }                       admin  — all invites + RSVPs
 *   { action: "createInvite", key, name, side, phone }
 *   { action: "deleteInvite", key, id }
 */

const INVITES = "Invites";
const RSVPS = "RSVPs";
const INVITE_HEADERS = ["id", "name", "side", "phone", "createdAt"];
const RSVP_HEADERS = ["updatedAt", "inviteId", "name", "side", "attending", "people", "phone"];
const SIDES = ["Groom", "Bride"];
const MAX_PEOPLE = 5;

function setup() {
  const ss = SpreadsheetApp.getActive();
  [[INVITES, INVITE_HEADERS], [RSVPS, RSVP_HEADERS]].forEach(([name, headers]) => {
    const sheet = ss.getSheetByName(name) || ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
    sheet.setFrozenRows(1);
    // Store everything as plain text so phone numbers keep their digits.
    sheet.getRange(1, 1, sheet.getMaxRows(), headers.length).setNumberFormat("@");
  });
  if (!PropertiesService.getScriptProperties().getProperty("ADMIN_KEY")) {
    Logger.log("Now add ADMIN_KEY in Project Settings → Script Properties.");
  }
}

function doGet() {
  return json({ ok: true, service: "sa-rsvp" });
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json({ ok: false, error: "Bad request" });
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (body.action === "rsvp") return json(saveRsvp(body));
    if (!isAdmin(body.key)) return json({ ok: false, error: "unauthorized" });
    if (body.action === "list") return json({ ok: true, invites: readRows(INVITES), rsvps: readRows(RSVPS) });
    if (body.action === "createInvite") return json(createInvite(body));
    if (body.action === "deleteInvite") return json(deleteInvite(body));
    return json({ ok: false, error: "Unknown action" });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    lock.releaseLock();
  }
}

/* --------------------------------- Actions -------------------------------- */

function saveRsvp(b) {
  if (b.website) return { ok: true }; // honeypot: silently ignore bots
  const name = clean(b.name, 60);
  const side = SIDES.indexOf(b.side) >= 0 ? b.side : "";
  const attending = b.attending === "No" ? "No" : b.attending === "Yes" ? "Yes" : "";
  if (!name || !side || !attending) return { ok: false, error: "Please fill in your name, side and response." };
  const people = attending === "Yes" ? Math.min(MAX_PEOPLE, Math.max(1, parseInt(b.people, 10) || 1)) : 0;
  const phone = digits(b.phone);
  const inviteId = clean(b.inviteId, 16).replace(/[^a-zA-Z0-9]/g, "");
  const row = [new Date().toISOString(), inviteId, name, side, attending, String(people), phone];

  const sheet = sheetOf(RSVPS);
  const values = sheet.getDataRange().getValues();
  // Same invite (or, for walk-ins, same phone or same name) → update instead of duplicating.
  let found = -1;
  for (let r = 1; r < values.length; r++) {
    const v = values[r];
    if (inviteId ? String(v[1]) === inviteId
        : !v[1] && (phone ? digits(v[6]) === phone : String(v[2]).toLowerCase() === name.toLowerCase())) {
      found = r + 1;
      break;
    }
  }
  if (found > 0) sheet.getRange(found, 1, 1, row.length).setValues([row]);
  else sheet.appendRow(row);
  return { ok: true, updated: found > 0 };
}

function createInvite(b) {
  const name = clean(b.name, 60);
  if (!name) return { ok: false, error: "Name is required." };
  const invite = {
    id: Utilities.getUuid().replace(/-/g, "").slice(0, 10),
    name: name,
    side: SIDES.indexOf(b.side) >= 0 ? b.side : "",
    phone: digits(b.phone),
    createdAt: new Date().toISOString(),
  };
  sheetOf(INVITES).appendRow(INVITE_HEADERS.map((h) => invite[h]));
  return { ok: true, invite: invite };
}

function deleteInvite(b) {
  const sheet = sheetOf(INVITES);
  const values = sheet.getDataRange().getValues();
  for (let r = values.length - 1; r >= 1; r--) {
    if (String(values[r][0]) === String(b.id)) {
      sheet.deleteRow(r + 1);
      return { ok: true };
    }
  }
  return { ok: false, error: "Invite not found." };
}

/* --------------------------------- Helpers -------------------------------- */

function isAdmin(key) {
  const real = PropertiesService.getScriptProperties().getProperty("ADMIN_KEY");
  return Boolean(real) && key === real;
}

function sheetOf(name) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sheet) throw new Error('Sheet "' + name + '" missing — run setup() once.');
  return sheet;
}

function readRows(name) {
  const values = sheetOf(name).getDataRange().getValues();
  const headers = values.shift() || [];
  return values
    .filter((v) => v.some((c) => c !== ""))
    .map((v) => Object.fromEntries(headers.map((h, i) => [h, String(v[i])])));
}

// Trim, cap length and neutralise spreadsheet formulas (=, +, -, @).
function clean(value, max) {
  return String(value == null ? "" : value).trim().slice(0, max).replace(/^[=+\-@\s]+/, "");
}

function digits(value) {
  return String(value == null ? "" : value).replace(/\D/g, "").slice(0, 15);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
