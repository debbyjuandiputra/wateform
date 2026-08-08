(function () {
  const SUPABASE_URL      = "https://zaaqlfxtymuafalkeftd.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphYXFsZnh0eW11YWZhbGtlZnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4Nzg2NjMsImV4cCI6MjEwMTQ1NDY2M30.NKBBX7Qcb4T22tvAjjAzh4Scmbt-bJN1kb1ADBr6Bro";

  const _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, storageKey: "wf-session", autoRefreshToken: true, detectSessionInUrl: false },
  });

  // ── Theme (sama seperti halaman lain) ───────────────────────
  (function initTheme() {
    const root = document.documentElement;
    const btns = document.querySelectorAll("[data-theme-toggle]");
    function set(t) {
      const isDark = t === "dark";
      isDark ? root.setAttribute("data-theme", "dark") : root.removeAttribute("data-theme");
      btns.forEach((b) => b.setAttribute("aria-pressed", String(isDark)));
      try { localStorage.setItem("wf-theme", t); } catch (_) {}
    }
    let saved; try { saved = localStorage.getItem("wf-theme"); } catch (_) {}
    set(saved === "dark" ? "dark" : "light");
    btns.forEach((b) => b.addEventListener("click", () =>
      set(root.getAttribute("data-theme") === "dark" ? "light" : "dark")
    ));
  })();

  // ── Auth guard ───────────────────────────────────────────────
  _sb.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
      window.location.replace("../login.html");
    }
  });

  document.getElementById("logout-btn")?.addEventListener("click", async () => {
    await _sb.auth.signOut();
    window.location.replace("../login.html");
  });

  // ── Pilih paket — TODO: sambungkan ke alur pembayaran + benefit ──
  document.querySelectorAll("[data-plan]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const plan = btn.dataset.plan;
      console.log("[subscription] plan selected:", plan);
      // TODO: arahkan ke checkout / update paket user setelah alur benefit siap
    });
  });

  // ── Skip → dashboard, tandai first-visit sudah lihat halaman ini ─
  document.getElementById("skip-link")?.addEventListener("click", () => {
    try { localStorage.setItem("wf-seen-subscription", "1"); } catch (_) {}
  });
})();