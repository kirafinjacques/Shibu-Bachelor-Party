/* Admin dashboard for SA's Bachelor Party — talks to the Apps Script in apps-script/Code.gs. */
const API = window.RSVP_API_URL;
const SITE_URL = location.origin + location.pathname.replace(/admin\.html$/, "");
const KEY_STORE = "sa-admin-key";
const $ = (id) => document.getElementById(id);

let key = "";
let guests = [];
try { key = sessionStorage.getItem(KEY_STORE) || ""; } catch { /* storage blocked */ }

/* ---------------------------------- API ---------------------------------- */
async function call(action, payload = {}) {
  if (!API) throw new Error("RSVP_API_URL is empty in rsvp-config.js — finish the Google setup in the README first.");
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, key, ...payload }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Request failed");
  return data;
}

/* --------------------------------- Helpers -------------------------------- */
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// Indian numbers typed as 10 digits get the +91 country code.
const waNumber = (phone) => {
  const d = String(phone || "").replace(/\D/g, "").replace(/^0+/, "");
  return d.length === 10 ? `91${d}` : d;
};
const inviteLink = (g) => `${SITE_URL}?${new URLSearchParams({ to: g.name, i: g.id, ...(g.side ? { s: g.side } : {}) })}`;
const inviteMessage = (g) =>
  `Hi ${g.name}! 🥂\n\nYou're invited to Shibu & Abhisha's Bachelor Party 🎉\n📅 23.12.2026 · 3PM–10PM\n📍 Avoki Resort, Kerala\n\nOpen your personal invitation & RSVP here:\n${inviteLink(g)}`;
const waLink = (g) => {
  const n = waNumber(g.phone);
  const text = encodeURIComponent(inviteMessage(g));
  return n ? `https://wa.me/${n}?text=${text}` : `https://api.whatsapp.com/send?text=${text}`;
};
const toast = (msg) => {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove("show"), 2200);
};
const copy = async (text) => {
  try { await navigator.clipboard.writeText(text); toast("Link copied"); }
  catch { window.prompt("Copy this link:", text); }
};

/* ------------------------------ Merge + render ----------------------------- */
function merge(invites, rsvps) {
  const byInvite = new Map(rsvps.filter((r) => r.inviteId).map((r) => [r.inviteId, r]));
  const invited = invites.map((inv) => ({ ...inv, invited: true, rsvp: byInvite.get(inv.id) || null }));
  const known = new Set(invites.map((i) => i.id));
  const walkIns = rsvps
    .filter((r) => !r.inviteId || !known.has(r.inviteId))
    .map((r) => ({ id: "", name: r.name, side: r.side, phone: r.phone, createdAt: r.updatedAt, invited: false, rsvp: r }));
  return [...invited, ...walkIns].map((g) => ({
    ...g,
    side: g.rsvp?.side || g.side || "",
    phone: g.rsvp?.phone || g.phone || "",
    people: g.rsvp?.attending === "Yes" ? Number(g.rsvp.people) || 1 : 0,
    status: !g.rsvp ? "Pending" : g.rsvp.attending === "Yes" ? "Attending" : "Declined",
  }));
}

function renderStats() {
  const sum = (list) => list.reduce((n, g) => n + g.people, 0);
  const attending = guests.filter((g) => g.status === "Attending");
  const groom = sum(attending.filter((g) => g.side === "Groom"));
  const bride = sum(attending.filter((g) => g.side === "Bride"));
  $("sHeadcount").textContent = sum(attending);
  $("sAttendingGuests").textContent = `${attending.length} RSVP${attending.length === 1 ? "" : "s"} said yes`;
  $("sInvited").textContent = guests.filter((g) => g.invited).length;
  $("sResponded").textContent = guests.filter((g) => g.rsvp).length;
  $("sPending").textContent = guests.filter((g) => g.status === "Pending").length;
  $("sDeclined").textContent = guests.filter((g) => g.status === "Declined").length;
  $("sGroom").textContent = groom;
  $("sBride").textContent = bride;
  const total = groom + bride;
  $("barGroom").style.flexGrow = total ? groom : 1;
  $("barBride").style.flexGrow = total ? bride : 1;
}

function renderList() {
  const q = $("search").value.trim().toLowerCase();
  const side = $("fSide").value;
  const status = $("fStatus").value;
  const order = { Attending: 0, Pending: 1, Declined: 2 };
  const shown = guests
    .filter((g) => (!side || g.side === side) && (!status || g.status === status))
    .filter((g) => !q || g.name.toLowerCase().includes(q) || g.phone.includes(q.replace(/\D/g, "") || "\u0000"))
    .sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name));

  $("guestCount").textContent = `${shown.length} of ${guests.length}`;
  $("empty").hidden = shown.length > 0;
  $("guestList").innerHTML = shown.map((g) => {
    const idx = guests.indexOf(g);
    const rsvpName = g.rsvp && g.invited && g.rsvp.name.toLowerCase() !== g.name.toLowerCase() ? `<small>RSVP'd as ${esc(g.rsvp.name)}</small>` : "";
    return `<li class="guest">
      <div class="g-main">
        <b>${esc(g.name)}</b>${rsvpName}
        <span class="g-meta">${g.side ? `<span class="tag tag-${esc(g.side.toLowerCase())}">${esc(g.side)}</span>` : ""}${g.invited ? "" : '<span class="tag">Walk-in</span>'}${g.phone ? `<span>+${esc(waNumber(g.phone))}</span>` : ""}</span>
      </div>
      <div class="g-status"><span class="status status-${g.status.toLowerCase()}">${g.status}</span>${g.people ? `<small>${g.people} ${g.people > 1 ? "people" : "person"}</small>` : ""}</div>
      ${g.invited ? `<div class="g-actions">
        <a class="icon-btn" href="${esc(waLink(g))}" target="_blank" rel="noreferrer" title="Send invite on WhatsApp" aria-label="Send ${esc(g.name)}'s invite on WhatsApp">💬</a>
        <button class="icon-btn" type="button" data-copy="${idx}" title="Copy invite link" aria-label="Copy ${esc(g.name)}'s invite link">🔗</button>
        <button class="icon-btn" type="button" data-delete="${idx}" title="Delete invite" aria-label="Delete ${esc(g.name)}'s invite">🗑</button>
      </div>` : ""}
    </li>`;
  }).join("");
}

async function load() {
  $("refresh").disabled = true;
  try {
    const data = await call("list");
    guests = merge(data.invites, data.rsvps);
    renderStats();
    renderList();
    $("updatedAt").textContent = `Updated ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    return true;
  } finally {
    $("refresh").disabled = false;
  }
}

/* --------------------------------- Login --------------------------------- */
async function unlock() {
  $("loginError").textContent = "";
  try {
    await load();
    try { sessionStorage.setItem(KEY_STORE, key); } catch { /* storage blocked */ }
    $("login").hidden = true;
    $("app").hidden = false;
  } catch (err) {
    key = "";
    try { sessionStorage.removeItem(KEY_STORE); } catch { /* storage blocked */ }
    $("login").hidden = false;
    $("app").hidden = true;
    $("loginError").textContent = err.message === "unauthorized" ? "Wrong passcode." : err.message;
  }
}

$("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  key = $("passcode").value;
  unlock();
});
$("logout").addEventListener("click", () => {
  key = "";
  try { sessionStorage.removeItem(KEY_STORE); } catch { /* storage blocked */ }
  location.reload();
});
$("refresh").addEventListener("click", () => load().then(() => toast("Up to date")).catch((err) => toast(err.message)));

/* ------------------------------ Create invite ----------------------------- */
let lastInvite = null;
$("inviteForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("inviteError").textContent = "";
  const name = $("iName").value.replace(/\s+/g, " ").trim();
  if (!name) return;
  $("iSubmit").disabled = true;
  try {
    const { invite } = await call("createInvite", { name, side: $("iSide").value, phone: $("iPhone").value });
    lastInvite = invite;
    $("shareName").textContent = invite.name;
    $("shareLink").value = inviteLink(invite);
    $("shareWa").href = waLink(invite);
    $("shareWa").textContent = invite.phone ? `Send to +${waNumber(invite.phone)} on WhatsApp` : "Send on WhatsApp";
    $("share").hidden = false;
    $("share").scrollIntoView({ behavior: "smooth", block: "nearest" });
    $("iName").value = "";
    $("iPhone").value = "";
    await load();
  } catch (err) {
    $("inviteError").textContent = err.message;
  } finally {
    $("iSubmit").disabled = false;
  }
});
$("shareCopy").addEventListener("click", () => copy($("shareLink").value));
if (navigator.share) {
  $("shareNative").hidden = false;
  $("shareNative").addEventListener("click", () => {
    if (lastInvite) navigator.share({ text: inviteMessage(lastInvite) }).catch(() => {});
  });
}

/* ------------------------------- Guest list ------------------------------- */
["search", "fSide", "fStatus"].forEach((id) => $(id).addEventListener("input", renderList));
$("guestList").addEventListener("click", async (e) => {
  const copyBtn = e.target.closest("[data-copy]");
  const delBtn = e.target.closest("[data-delete]");
  if (copyBtn) copy(inviteLink(guests[copyBtn.dataset.copy]));
  if (delBtn) {
    const g = guests[delBtn.dataset.delete];
    if (!confirm(`Delete the invite for ${g.name}? Their link will show as a walk-in if they RSVP.`)) return;
    try { await call("deleteInvite", { id: g.id }); await load(); toast("Invite deleted"); }
    catch (err) { toast(err.message); }
  }
});

$("exportCsv").addEventListener("click", () => {
  const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = [["Name", "Side", "Status", "People", "Phone", "Invited", "RSVP name", "Responded at", "Invite link"]]
    .concat(guests.map((g) => [g.name, g.side, g.status, g.people, g.phone, g.invited ? "Yes" : "Walk-in", g.rsvp?.name || "", g.rsvp?.updatedAt || "", g.invited ? inviteLink(g) : ""]));
  const blob = new Blob(["﻿" + rows.map((r) => r.map(cell).join(",")).join("\n")], { type: "text/csv" });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "sa-guest-list.csv" });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

/* ---------------------------------- Boot ---------------------------------- */
if (!API) $("loginError").textContent = "Not connected yet: add your Apps Script URL to rsvp-config.js (see README).";
else if (key) unlock();
