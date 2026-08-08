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
  await initPhotoAndFrame(profile);
}
init();

// ══════════════════════════════════════════════════════════════
//  FOTO PROFIL & FRAME (plan-gated)
// ══════════════════════════════════════════════════════════════

// Plan → frame yang diizinkan (inklusif ke bawah)
// free: tidak ada frame; plus: bronze; pro: silver; ultimate: gold
const PLAN_FRAME_ALLOWED = {
  free:     [],
  plus:     ["bronze"],
  pro:      ["bronze", "silver"],
  ultimate: ["bronze", "silver", "gold"],
};
const PLAN_PHOTO_ALLOWED = ["plus", "pro", "ultimate"]; // free tidak boleh set foto

async function initPhotoAndFrame(profile) {
  // Ambil plan user
  const { data: subRow } = await _sb.from("subscriptions")
    .select("plan").eq("user_id", _currentUser.id).maybeSingle();
  const userPlan = subRow?.plan || "free";

  // ── Render badge plan di profil ──
  const badge = document.getElementById("plan-badge-inline");
  if (badge) {
    badge.textContent = userPlan;
    badge.className = "plan-badge-inline" + (userPlan !== "free" ? " plan-" + userPlan : "");
  }

  const canPhoto = PLAN_PHOTO_ALLOWED.includes(userPlan);
  const allowedFrames = PLAN_FRAME_ALLOWED[userPlan] || [];

  // ── Foto profil ──
  const photoUploadBtn  = document.getElementById("photo-upload-btn");
  const photoRemoveBtn  = document.getElementById("photo-remove-btn");
  const photoFileInput  = document.getElementById("photo-file-input");
  const photoHint       = document.getElementById("photo-hint");
  const photoLockedEl   = document.getElementById("photo-locked-notice");
  const photoPreviewEl  = document.getElementById("photo-preview");

  // Render current photo / initials di preview
  const initials = (profile?.full_name || "?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  if (profile?.photo_url) {
    photoPreviewEl.innerHTML = `<img src="${profile.photo_url}" style="width:100%;height:100%;object-fit:cover">`;
    // Also update main avatar in header
    const mainAvatar = document.getElementById("profile-avatar");
    if (mainAvatar) mainAvatar.innerHTML = `<img src="${profile.photo_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    if (photoRemoveBtn) photoRemoveBtn.style.display = "";
  } else {
    photoPreviewEl.textContent = initials;
    if (photoRemoveBtn) photoRemoveBtn.style.display = "none";
  }

  // Apply frame to main avatar
  applyFrameRing(profile?.avatar_frame || "");

  if (!canPhoto) {
    if (photoUploadBtn) { photoUploadBtn.disabled = true; photoUploadBtn.style.opacity = ".45"; photoUploadBtn.style.cursor = "not-allowed"; }
    if (photoLockedEl)  { photoLockedEl.style.display = ""; }
    if (photoHint)      { photoHint.style.display = "none"; }
  } else {
    photoUploadBtn?.addEventListener("click", () => photoFileInput?.click());
    photoFileInput?.addEventListener("change", async () => {
      const file = photoFileInput.files?.[0];
      if (!file) return;
      const MAX = 2 * 1024 * 1024; // 2MB
      if (file.size > MAX) { toast("Foto terlalu besar (max 2MB)", "error"); photoFileInput.value = ""; return; }

      photoUploadBtn.disabled = true; photoUploadBtn.textContent = "Uploading…";
      try {
        const ext  = file.name.split(".").pop().toLowerCase();
        const path = `avatars/${_currentUser.id}/photo.${ext}`;
        const { error: upErr } = await _sb.storage.from("avatars").upload(path, file, { upsert: true, cacheControl: "3600" });
        if (upErr) throw upErr;
        const { data: urlData } = _sb.storage.from("avatars").getPublicUrl(path);
        const photoUrl = urlData?.publicUrl + "?t=" + Date.now(); // cache-bust

        await _sb.from("profiles").update({ photo_url: photoUrl }).eq("id", _currentUser.id);
        photoPreviewEl.innerHTML = `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover">`;
        const mainAvatar = document.getElementById("profile-avatar");
        if (mainAvatar) mainAvatar.innerHTML = `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        if (photoRemoveBtn) photoRemoveBtn.style.display = "";
        toast("Foto profil diperbarui!");
      } catch(e) {
        toast("Gagal upload foto: " + (e.message || e), "error");
      } finally {
        photoUploadBtn.disabled = false; photoUploadBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Upload foto';
        photoFileInput.value = "";
      }
    });

    photoRemoveBtn?.addEventListener("click", async () => {
      photoRemoveBtn.disabled = true;
      await _sb.from("profiles").update({ photo_url: null }).eq("id", _currentUser.id);
      photoPreviewEl.textContent = initials;
      const mainAvatar = document.getElementById("profile-avatar");
      if (mainAvatar) mainAvatar.textContent = initials;
      photoRemoveBtn.style.display = "none";
      toast("Foto profil dihapus");
      photoRemoveBtn.disabled = false;
    });
  }

  // ── Frame ──
  const frameOptions  = document.querySelectorAll(".frame-option");
  const frameLockedEl = document.getElementById("frame-locked-notice");
  let currentFrame    = profile?.avatar_frame || "";

  // Mark current frame as selected
  frameOptions.forEach(opt => {
    const f = opt.dataset.frame;
    opt.classList.toggle("selected", f === currentFrame);
  });

  if (allowedFrames.length === 0) {
    // Free plan: lock all frames
    frameOptions.forEach(opt => {
      opt.style.opacity = ".45";
      opt.style.cursor = "not-allowed";
    });
    if (frameLockedEl) frameLockedEl.style.display = "";
  } else {
    frameOptions.forEach(opt => {
      const f = opt.dataset.frame;
      const isAllowed = f === "" || allowedFrames.includes(f);
      if (!isAllowed) {
        opt.style.opacity = ".4";
        opt.style.cursor = "not-allowed";
        opt.title = f === "gold" ? "Butuh paket Ultimate" : (f === "silver" ? "Butuh paket Pro" : "");
      } else {
        opt.style.cursor = "pointer";
        opt.addEventListener("click", async () => {
          currentFrame = f;
          frameOptions.forEach(o => o.classList.toggle("selected", o.dataset.frame === f));
          applyFrameRing(f);
          await _sb.from("profiles").update({ avatar_frame: f || null }).eq("id", _currentUser.id);
          toast(f ? `Frame ${f} dipasang!` : "Frame dihapus");
        });
      }
    });
  }
}

function applyFrameRing(frame) {
  const ring = document.getElementById("avatar-frame-ring");
  if (!ring) return;
  ring.className = "avatar-frame";
  if (frame) ring.classList.add(frame);
}

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
  const badge      = document.getElementById("tfa-badge");
  const desc       = document.getElementById("tfa-desc");
  const actions    = document.getElementById("tfa-actions");
  const enableBtn  = document.getElementById("tfa-toggle-btn");
  const disableBtn = document.getElementById("tfa-disable-btn");

  if (enabled) {
    badge.className        = "tfa-badge on";
    badge.innerHTML        = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="11" height="11"><polyline points="20 6 9 17 4 12"/></svg> Enabled`;
    if (desc) desc.textContent = "Your account is protected with two-factor authentication.";
    disableBtn.style.display  = "";
    enableBtn.style.display   = "none";
    actions.style.display     = "";
  } else {
    badge.className        = "tfa-badge off";
    badge.innerHTML        = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="11" height="11"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg> Not enabled`;
    if (desc) desc.textContent = "";
    disableBtn.style.display  = "none";
    enableBtn.style.display   = "";
    actions.style.display     = "none";
  }
}

// ── Enable 2FA ────────────────────────────────────────────────
document.getElementById("tfa-toggle-btn").addEventListener("click", () => {
  openSetupModal();
});
// ── Disable 2FA modal ─────────────────────────────────────────
document.getElementById("tfa-disable-btn").addEventListener("click", () => {
  document.getElementById("tfa-disable-password").value = "";
  document.getElementById("tfa-disable-code").value     = "";
  document.getElementById("tfa-disable-error").style.display = "none";
  openModal("tfa-disable-modal");
  setTimeout(() => document.getElementById("tfa-disable-password").focus(), 150);
});

document.getElementById("tfa-disable-code").addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/\D/g, "");
  if (e.target.value.length === 6) document.getElementById("tfa-disable-confirm").click();
});

document.getElementById("tfa-disable-confirm").addEventListener("click", async () => {
  const password = document.getElementById("tfa-disable-password").value;
  const code     = document.getElementById("tfa-disable-code").value.trim();
  const errEl    = document.getElementById("tfa-disable-error");
  const btn      = document.getElementById("tfa-disable-confirm");

  errEl.style.display = "none";

  if (!password) {
    errEl.textContent = "Please enter your password.";
    errEl.style.display = "";
    return;
  }
  if (code.length !== 6) {
    errEl.textContent = "Please enter the 6-digit authenticator code.";
    errEl.style.display = "";
    return;
  }

  btn.disabled = true; btn.textContent = "Verifying…";

  // Verify password
  const { error: signInErr } = await _sb.auth.signInWithPassword({
    email:    _currentUser.email,
    password: password,
  });
  if (signInErr) {
    errEl.textContent   = "Incorrect password.";
    errEl.style.display = "";
    btn.disabled = false; btn.textContent = "Disable 2FA";
    return;
  }

  // Verify TOTP
  const { data: tfaRow } = await _sb.from("user_2fa")
    .select("secret").eq("user_id", _currentUser.id).single();
  const valid = await verifyTOTP(tfaRow.secret, code);
  if (!valid) {
    errEl.textContent   = "Incorrect authenticator code. Please try again.";
    errEl.style.display = "";
    document.getElementById("tfa-disable-code").value = "";
    document.getElementById("tfa-disable-code").focus();
    btn.disabled = false; btn.textContent = "Disable 2FA";
    return;
  }

  // Disable
  await _sb.from("user_2fa").update({ enabled: false }).eq("user_id", _currentUser.id);
  await _sb.from("user_2fa_backup_codes").delete().eq("user_id", _currentUser.id);

  btn.disabled = false; btn.textContent = "Disable 2FA";
  closeModal("tfa-disable-modal");
  render2FAStatus(false);
  toast("Two-factor authentication disabled.");
});

[
  ["tfa-disable-close", "tfa-disable-modal"],
  ["tfa-disable-cancel", "tfa-disable-modal"],
].forEach(([btnId, modalId]) =>
  document.getElementById(btnId).addEventListener("click", () => closeModal(modalId))
);


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
  _tfaSecret = generateTOTPSecret();

  // Tampilkan secret (format WATEFORMXXXXXXXX) untuk dimasukkan manual di authenticator app
  document.getElementById("tfa-secret-display").textContent = _tfaSecret;
  document.getElementById("tfa-setup-error").style.display  = "none";
  document.getElementById("tfa-verify-input").value         = "";

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

  document.getElementById("tfa-backup-title").textContent =
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
// ══════════════════════════════════════════════════════════════
//  CHANGE PASSWORD
// ══════════════════════════════════════════════════════════════
document.getElementById("cp-save-btn").addEventListener("click", async () => {
  const oldPass  = document.getElementById("cp-old").value;
  const newPass  = document.getElementById("cp-new").value;
  const confirm  = document.getElementById("cp-confirm").value;
  const errEl    = document.getElementById("cp-error");
  const btn      = document.getElementById("cp-save-btn");

  errEl.style.display = "none";

  if (!oldPass || !newPass || !confirm) {
    errEl.textContent = "Please fill in all fields.";
    errEl.style.display = "block";
    return;
  }
  if (newPass.length < 8) {
    errEl.textContent = "New password must be at least 8 characters.";
    errEl.style.display = "block";
    return;
  }
  if (newPass === oldPass) {
    errEl.textContent = "New password cannot be the same as your current password.";
    errEl.style.display = "block";
    return;
  }
  if (newPass !== confirm) {
    errEl.textContent = "New passwords do not match.";
    errEl.style.display = "block";
    return;
  }

  btn.disabled = true;
  btn.textContent = "Updating…";

  // Verifikasi password lama tanpa mengganggu session aktif
  const { data: { session: currentSession } } = await _sb.auth.getSession();
  const verifyRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
    body: JSON.stringify({ email: _currentUser.email, password: oldPass }),
  });
  if (!verifyRes.ok) {
    errEl.textContent = "Current password is incorrect.";
    errEl.style.display = "block";
    btn.disabled = false;
    btn.textContent = "Update password";
    return;
  }

  // Restore session asli agar tidak ter-logout
  if (currentSession) {
    await _sb.auth.setSession({ access_token: currentSession.access_token, refresh_token: currentSession.refresh_token });
  }

  // Update to new password
  const { error: updateErr } = await _sb.auth.updateUser({ password: newPass });
  if (updateErr) {
    errEl.textContent = "Failed to update password. Please try again.";
    errEl.style.display = "block";
    btn.disabled = false;
    btn.textContent = "Update password";
    return;
  }

  // Clear fields
  document.getElementById("cp-old").value     = "";
  document.getElementById("cp-new").value     = "";
  document.getElementById("cp-confirm").value = "";
  btn.disabled = false;
  btn.textContent = "Update password";
  toast("Password updated successfully!");
});