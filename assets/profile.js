// ── CONFIG ───────────────────────────────────────────────────
const SUPABASE_URL      = "https://zaaqlfxtymuafalkeftd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphYXFsZnh0eW11YWZhbGtlZnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4Nzg2NjMsImV4cCI6MjEwMTQ1NDY2M30.NKBBX7Qcb4T22tvAjjAzh4Scmbt-bJN1kb1ADBr6Bro";

const _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession:     true,
    storageKey:         "wf-session",
    autoRefreshToken:   true,
    detectSessionInUrl: false,
  },
});

// ── Theme ─────────────────────────────────────────────────────
(function initTheme() {
  const root = document.documentElement;
  const btns = document.querySelectorAll("[data-theme-toggle]");
  function set(t) {
    const isDark = t === "dark";
    isDark ? root.setAttribute("data-theme","dark") : root.removeAttribute("data-theme");
    btns.forEach(b => b.setAttribute("aria-pressed", String(isDark)));
    try { localStorage.setItem("wf-theme", t); } catch(_){}
  }
  let saved; try { saved = localStorage.getItem("wf-theme"); } catch(_){}
  set(saved === "dark" ? "dark" : "light");
  btns.forEach(b => b.addEventListener("click", () =>
    set(root.getAttribute("data-theme")==="dark" ? "light" : "dark")
  ));
})();

// ── Toast ─────────────────────────────────────────────────────
function toast(msg, type = "success") {
  const c = document.getElementById("toast-container");
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = msg;
  c.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

// ── Modal helpers ─────────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }
document.querySelectorAll(".modal-backdrop").forEach(bd =>
  bd.addEventListener("click", e => { if (e.target === bd) bd.classList.remove("open"); })
);

// ── Auth state ────────────────────────────────────────────────
_sb.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
    window.location.replace("../login.html");
  }
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  await _sb.auth.signOut();
  window.location.href = "../login.html";
});

// ══════════════════════════════════════════════════════════════
//  TOTP UTILITIES
// ══════════════════════════════════════════════════════════════

// Base32 charset (RFC 4648) — uppercased A-Z + 2-7
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
// Backup code charset — no ambiguous chars (0/O, 1/I/l)
const BC  = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateTOTPSecret() {
  const rand = crypto.getRandomValues(new Uint8Array(8));
  const suffix = Array.from(rand).map(b => B32[b % 32]).join("");
  return "WATEFORM" + suffix; // 16 base32 chars = 80 bits
}

function base32ToBytes(base32) {
  const s = base32.toUpperCase().replace(/=+$/, "");
  let bits = 0, bitsLen = 0;
  const bytes = [];
  for (const c of s) {
    const idx = B32.indexOf(c);
    if (idx < 0) continue;
    bits = (bits << 5) | idx;
    bitsLen += 5;
    if (bitsLen >= 8) {
      bitsLen -= 8;
      bytes.push((bits >> bitsLen) & 0xff);
    }
  }
  return new Uint8Array(bytes);
}

async function computeTOTP(secret, timeOffset = 0) {
  const keyBytes = base32ToBytes(secret);
  const counter  = Math.floor((Date.now() / 1000 + timeOffset) / 30);

  const buf  = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setUint32(0, Math.floor(counter / 0x100000000), false);
  view.setUint32(4, counter >>> 0, false);

  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyBytes, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, buf));

  const offset = sig[19] & 0x0f;
  const code   = (
    ((sig[offset]     & 0x7f) << 24) |
    ((sig[offset + 1] & 0xff) << 16) |
    ((sig[offset + 2] & 0xff) <<  8) |
    (sig[offset + 3]  & 0xff)
  ) % 1_000_000;

  return String(code).padStart(6, "0");
}

async function verifyTOTP(secret, userCode) {
  // Toleransi ±1 window (30 detik) untuk clock drift
  for (const offset of [0, -30, 30]) {
    if (await computeTOTP(secret, offset) === userCode.trim()) return true;
  }
  return false;
}

// ── Backup codes ─────────────────────────────────────────────
function generateBackupCodes(count = 12) {
  return Array.from({ length: count }, () => {
    const bytes = crypto.getRandomValues(new Uint8Array(5));
    return Array.from(bytes).map(b => BC[b % BC.length]).join("");
  });
}

async function sha256hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
}

// ══════════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════════
let _currentUser = null;

async function init() {
  let { data: { session } } = await _sb.auth.getSession();
  if (!session) {
    const { data: refreshed } = await _sb.auth.refreshSession();
    session = refreshed?.session ?? null;
  }
  if (!session) { window.location.replace("../login.html"); return; }
  _currentUser = session.user;

  const { data: profile } = await _sb.from("profiles")
    .select("*").eq("id", _currentUser.id).single();

  const initials = (profile?.full_name || "?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  document.getElementById("profile-avatar").textContent   = initials;
  document.getElementById("profile-name").textContent     = profile?.full_name || "User";
  document.getElementById("profile-handle").textContent   = "@" + (profile?.username || "");
  document.getElementById("profile-email").value          = _currentUser.email || "";
  document.getElementById("profile-username-input").value = profile?.username || "";

  // Cek jika baru login dengan backup code → tampilkan kode baru
  const newCodes = sessionStorage.getItem("wf-new-backup-codes");
  if (newCodes) {
    sessionStorage.removeItem("wf-new-backup-codes");
    showBackupCodesModal(JSON.parse(newCodes), true);
  }

  await init2FA();
}
init();

// ══════════════════════════════════════════════════════════════
//  2FA MANAGEMENT
// ══════════════════════════════════════════════════════════════
let _tfaSecret  = null; // secret yang sedang dalam proses setup
let _confirmCb  = null; // callback setelah confirm modal berhasil

async function init2FA() {
  const { data: row } = await _sb.from("user_2fa")
    .select("enabled").eq("user_id", _currentUser.id).maybeSingle();

  render2FAStatus(row?.enabled === true);
}

function render2FAStatus(enabled) {
  const badge   = document.getElementById("tfa-badge");
  const desc    = document.getElementById("tfa-desc");
  const actions = document.getElementById("tfa-actions");
  const btn     = document.getElementById("tfa-toggle-btn");

  if (enabled) {
    badge.className   = "tfa-badge on";
    badge.innerHTML   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="11" height="11"><polyline points="20 6 9 17 4 12"/></svg> Enabled`;
    desc.textContent  = "Your account is protected with two-factor authentication.";
    btn.textContent   = "Disable 2FA";
    btn.className     = "btn btn-danger btn-sm";
    actions.style.display = "";
  } else {
    badge.className   = "tfa-badge off";
    badge.innerHTML   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="11" height="11"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg> Not enabled`;
    desc.textContent  = "Add an extra layer of security using an authenticator app (Google Authenticator, Authy, etc.).";
    btn.textContent   = "Enable 2FA";
    btn.className     = "btn btn-ghost btn-sm";
    actions.style.display = "none";
  }
}

// ── Enable 2FA ────────────────────────────────────────────────
document.getElementById("tfa-toggle-btn").addEventListener("click", async () => {
  const { data: row } = await _sb.from("user_2fa")
    .select("enabled").eq("user_id", _currentUser.id).maybeSingle();

  if (row?.enabled) {
    // Nonaktifkan — minta konfirmasi TOTP dulu
    openConfirmModal("Enter your 6-digit code to disable 2FA.", async (code) => {
      const { data: tfaRow } = await _sb.from("user_2fa")
        .select("secret").eq("user_id", _currentUser.id).single();
      if (!(await verifyTOTP(tfaRow.secret, code))) return false;

      await _sb.from("user_2fa").update({ enabled: false }).eq("user_id", _currentUser.id);
      await _sb.from("user_2fa_backup_codes").delete().eq("user_id", _currentUser.id);
      toast("Two-factor authentication disabled.");
      render2FAStatus(false);
      return true;
    });
  } else {
    openSetupModal();
  }
});

// ── Regen backup codes ────────────────────────────────────────
document.getElementById("tfa-regen-btn").addEventListener("click", () => {
  openConfirmModal("Enter your 6-digit code to regenerate backup codes.", async (code) => {
    const { data: tfaRow } = await _sb.from("user_2fa")
      .select("secret").eq("user_id", _currentUser.id).single();
    if (!(await verifyTOTP(tfaRow.secret, code))) return false;

    const codes = await saveNewBackupCodes();
    toast("Backup codes regenerated.");
    showBackupCodesModal(codes, false);
    return true;
  });
});

// ── Setup modal ───────────────────────────────────────────────
function openSetupModal() {
  if (typeof QRCode === "undefined") {
    toast("Failed to load QR code library — check your connection and try again.", "error");
    return;
  }

  _tfaSecret = generateTOTPSecret();

  // Tampilkan secret
  document.getElementById("tfa-secret-display").textContent = _tfaSecret;
  document.getElementById("tfa-setup-error").style.display  = "none";
  document.getElementById("tfa-verify-input").value         = "";

  // Generate QR code
  const email  = _currentUser.email || "user";
  const uri    = `otpauth://totp/WateForm:${encodeURIComponent(email)}?secret=${_tfaSecret}&issuer=WateForm&algorithm=SHA1&digits=6&period=30`;
  const canvas = document.getElementById("tfa-qr-canvas");
  QRCode.toCanvas(canvas, uri, { width: 160, margin: 1, color: { dark: "#000", light: "#fff" } });

  openModal("tfa-setup-modal");
  setTimeout(() => document.getElementById("tfa-verify-input").focus(), 150);
}

document.getElementById("tfa-copy-secret-btn").addEventListener("click", () => {
  navigator.clipboard.writeText(_tfaSecret || "").then(() => toast("Secret key copied."));
});

// Auto-submit saat 6 digit terisi
document.getElementById("tfa-verify-input").addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/\D/g,"");
  if (e.target.value.length === 6) document.getElementById("tfa-setup-confirm").click();
});

document.getElementById("tfa-setup-confirm").addEventListener("click", async () => {
  const code    = document.getElementById("tfa-verify-input").value.trim();
  const errEl   = document.getElementById("tfa-setup-error");
  const btn     = document.getElementById("tfa-setup-confirm");

  errEl.style.display = "none";
  if (code.length !== 6) { errEl.textContent = "Please enter the 6-digit code."; errEl.style.display = ""; return; }

  btn.disabled = true; btn.textContent = "Verifying…";

  const valid = await verifyTOTP(_tfaSecret, code);
  if (!valid) {
    errEl.textContent   = "Incorrect code. Check your authenticator app and try again.";
    errEl.style.display = "";
    btn.disabled = false; btn.textContent = "Verify & Enable";
    document.getElementById("tfa-verify-input").value = "";
    document.getElementById("tfa-verify-input").focus();
    return;
  }

  // Simpan ke DB
  const { error } = await _sb.from("user_2fa").upsert({
    user_id: _currentUser.id,
    secret:  _tfaSecret,
    enabled: true,
  }, { onConflict: "user_id" });

  if (error) {
    errEl.textContent   = "Failed to save. Please try again.";
    errEl.style.display = "";
    btn.disabled = false; btn.textContent = "Verify & Enable";
    return;
  }

  // Buat 12 backup codes
  const codes = await saveNewBackupCodes();

  btn.disabled = false; btn.textContent = "Verify & Enable";
  closeModal("tfa-setup-modal");
  render2FAStatus(true);
  toast("Two-factor authentication enabled!");
  showBackupCodesModal(codes, true);
});

[
  ["tfa-setup-close", "tfa-setup-modal"],
  ["tfa-setup-cancel", "tfa-setup-modal"],
].forEach(([btnId, modalId]) =>
  document.getElementById(btnId).addEventListener("click", () => closeModal(modalId))
);

// ── Confirm modal (untuk disable & regen) ─────────────────────
function openConfirmModal(desc, onConfirm) {
  _confirmCb = onConfirm;
  document.getElementById("tfa-confirm-desc").textContent   = desc;
  document.getElementById("tfa-confirm-error").style.display = "none";
  document.getElementById("tfa-confirm-input").value        = "";
  openModal("tfa-confirm-modal");
  setTimeout(() => document.getElementById("tfa-confirm-input").focus(), 150);
}

// Auto-submit
document.getElementById("tfa-confirm-input").addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/\D/g,"");
  if (e.target.value.length === 6) document.getElementById("tfa-confirm-ok").click();
});

document.getElementById("tfa-confirm-ok").addEventListener("click", async () => {
  const code  = document.getElementById("tfa-confirm-input").value.trim();
  const errEl = document.getElementById("tfa-confirm-error");
  const btn   = document.getElementById("tfa-confirm-ok");

  errEl.style.display = "none";
  if (code.length !== 6) { errEl.textContent = "Please enter the 6-digit code."; errEl.style.display = ""; return; }

  btn.disabled = true; btn.textContent = "Verifying…";

  const success = _confirmCb ? await _confirmCb(code) : false;

  btn.disabled = false; btn.textContent = "Confirm";

  if (success) {
    closeModal("tfa-confirm-modal");
  } else {
    errEl.textContent   = "Incorrect code. Please try again.";
    errEl.style.display = "";
    document.getElementById("tfa-confirm-input").value = "";
    document.getElementById("tfa-confirm-input").focus();
  }
});

[
  ["tfa-confirm-close", "tfa-confirm-modal"],
  ["tfa-confirm-cancel", "tfa-confirm-modal"],
].forEach(([btnId, modalId]) =>
  document.getElementById(btnId).addEventListener("click", () => closeModal(modalId))
);

// ── Backup codes modal ────────────────────────────────────────
let _currentBackupCodes = [];

function showBackupCodesModal(codes, isNew) {
  _currentBackupCodes = codes;

  const grid = document.getElementById("tfa-backup-grid");
  grid.innerHTML = codes.map(c =>
    `<div class="backup-code-item">${c.slice(0,2)}&thinsp;${c.slice(2,3)}&thinsp;${c.slice(3)}</div>`
  ).join("");

  document.getElementById("tfa-backup-title").querySelector("h3").textContent =
    isNew ? "Save your backup codes" : "New backup codes";

  openModal("tfa-backup-modal");
}

document.getElementById("tfa-backup-download").addEventListener("click", () => {
  const date = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
  const lines = [
    "WateForm — Backup Codes",
    `Generated: ${date}`,
    "",
    "Use these codes to log in if you lose access to your authenticator app.",
    "Each code can only be used ONCE. Using any code regenerates all 12.",
    "",
    ...(_currentBackupCodes.map((c, i) => `${String(i+1).padStart(2," ")}. ${c}`)),
    "",
    "Keep this file in a safe place.",
  ].join("\n");

  const a = Object.assign(document.createElement("a"), {
    href:     URL.createObjectURL(new Blob([lines], { type: "text/plain" })),
    download: "wateform-backup-codes.txt",
  });
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById("tfa-backup-copy").addEventListener("click", () => {
  const text = _currentBackupCodes.join("\n");
  navigator.clipboard.writeText(text).then(() => toast("Backup codes copied."));
});

document.getElementById("tfa-backup-done").addEventListener("click", () => closeModal("tfa-backup-modal"));
document.getElementById("tfa-backup-close").addEventListener("click", () => closeModal("tfa-backup-modal"));

// ── Helper: buat & simpan 12 backup codes baru ────────────────
async function saveNewBackupCodes() {
  const codes  = generateBackupCodes(12);
  const hashes = await Promise.all(codes.map(c => sha256hex(c)));

  // Hapus semua kode lama
  await _sb.from("user_2fa_backup_codes").delete().eq("user_id", _currentUser.id);

  // Insert kode baru
  const rows = hashes.map(h => ({ user_id: _currentUser.id, code_hash: h }));
  await _sb.from("user_2fa_backup_codes").insert(rows);

  return codes; // kembalikan plaintext agar bisa ditampilkan ke user
}

// ══════════════════════════════════════════════════════════════
//  DELETE ACCOUNT
// ══════════════════════════════════════════════════════════════
(function initDeleteAccount() {
  const modal      = document.getElementById("delete-account-modal");
  const input      = document.getElementById("delete-confirm-input");
  const confirmBtn = document.getElementById("delete-confirm-btn");
  const errorEl    = document.getElementById("delete-modal-error");

  function openDel() {
    input.value = "";
    confirmBtn.disabled = true;
    if (errorEl) { errorEl.textContent = ""; errorEl.style.display = "none"; }
    openModal("delete-account-modal");
    setTimeout(() => input.focus(), 50);
  }
  function closeDel() {
    closeModal("delete-account-modal");
    input.value = "";
    confirmBtn.disabled = true;
  }

  document.getElementById("delete-account-btn").addEventListener("click", openDel);
  document.getElementById("delete-modal-close").addEventListener("click", closeDel);
  document.getElementById("delete-modal-cancel").addEventListener("click", closeDel);

  input.addEventListener("input", () => {
    confirmBtn.disabled = input.value.trim() !== "DELETE";
    if (errorEl) { errorEl.textContent = ""; errorEl.style.display = "none"; }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !confirmBtn.disabled) confirmBtn.click();
    if (e.key === "Escape") closeDel();
  });

  confirmBtn.addEventListener("click", async () => {
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Deleting…";
    if (errorEl) { errorEl.textContent = ""; errorEl.style.display = "none"; }

    try {
      const { data: { session } } = await _sb.auth.getSession();
      if (!session?.access_token) throw new Error("No active session");

      const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-user`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete account");

      await _sb.auth.signOut();
      window.location.href = "../login.html?deleted=1";
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = "Failed to delete account. Please try again or contact support.";
        errorEl.style.display = "block";
      }
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Delete my account";
    }
  });
})();