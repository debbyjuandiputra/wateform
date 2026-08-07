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

// ── Auth state listener ─────────────────────────────────────────
_sb.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
    window.location.replace("/login.html");
  }
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  await _sb.auth.signOut();
  window.location.href = "/login.html";
});

// ── Init ──────────────────────────────────────────────────────
async function init() {
  let { data: { session } } = await _sb.auth.getSession();
  if (!session) {
    const { data: refreshed } = await _sb.auth.refreshSession();
    session = refreshed?.session ?? null;
  }
  if (!session) {
    window.location.replace("/login.html");
    return;
  }
  const currentUser = session.user;

  const { data: profile } = await _sb.from("profiles").select("*").eq("id", currentUser.id).single();

  const initials = (profile?.full_name || "?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  document.getElementById("profile-avatar").textContent = initials;
  document.getElementById("profile-name").textContent   = profile?.full_name || "User";
  document.getElementById("profile-handle").textContent = "@" + (profile?.username || "");
  document.getElementById("profile-email").value = currentUser.email || "";
  document.getElementById("profile-username-input").value = profile?.username || "";
}
init();

// ── Delete Account ─────────────────────────────────────────────
(function initDeleteAccount() {
  const modal      = document.getElementById("delete-account-modal");
  const input      = document.getElementById("delete-confirm-input");
  const confirmBtn = document.getElementById("delete-confirm-btn");
  const errorEl    = document.getElementById("delete-modal-error");

  function openModal() {
    input.value = "";
    confirmBtn.disabled = true;
    if (errorEl) { errorEl.textContent = ""; errorEl.style.display = "none"; }
    modal.classList.remove("hidden");
    setTimeout(() => input.focus(), 50);
  }

  function closeModal() {
    modal.classList.add("hidden");
    input.value = "";
    confirmBtn.disabled = true;
  }

  document.getElementById("delete-account-btn").addEventListener("click", openModal);
  document.getElementById("delete-modal-close").addEventListener("click", closeModal);
  document.getElementById("delete-modal-cancel").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  input.addEventListener("input", () => {
    confirmBtn.disabled = input.value.trim() !== "DELETE";
    if (errorEl) { errorEl.textContent = ""; errorEl.style.display = "none"; }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !confirmBtn.disabled) confirmBtn.click();
    if (e.key === "Escape") closeModal();
  });

  confirmBtn.addEventListener("click", async () => {
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Deleting…";
    if (errorEl) { errorEl.textContent = ""; errorEl.style.display = "none"; }

    try {
      const { data: { user } } = await _sb.auth.getUser();
      if (user) {
        await _sb.from("profiles").delete().eq("id", user.id);
      }

      const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-user`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${(await _sb.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete account");

      await _sb.auth.signOut();
      window.location.href = "/login.html?deleted=1";
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