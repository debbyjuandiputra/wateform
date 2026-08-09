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

  // ── Ambil & tampilkan plan saat ini ──────────────────────────
  (async () => {
    const { data: { session } } = await _sb.auth.getSession();
    if (!session) return;

    const { data: subRow } = await _sb.from("subscriptions")
      .select("plan, status, expires_at")
      .eq("user_id", session.user.id)
      .maybeSingle();

    const currentPlan = subRow?.plan || "free";

    // Urutan rank plan (semakin tinggi index = semakin tinggi tier)
    const PLAN_RANK = { free: 0, plus: 1, pro: 2, ultimate: 3 };
    const currentRank = PLAN_RANK[currentPlan] ?? 0;

    // Update semua tombol [data-plan]
    document.querySelectorAll("[data-plan]").forEach(btn => {
      const p    = btn.dataset.plan;
      const rank = PLAN_RANK[p] ?? 0;

      if (p === currentPlan) {
        // Tombol plan aktif → "Current plan"
        btn.textContent = "✓ Current plan";
        btn.disabled = true;
        btn.className = "btn btn-ghost btn-sm";
        if (btn.style) btn.style.cssText = "width:100%;opacity:.7;cursor:default";
        // Highlight kolom / card
        const head = btn.closest(".plan-head");
        if (head && !head.classList.contains("featured")) {
          head.style.background = "rgba(43,189,164,.08)";
        }
      } else if (rank < currentRank) {
        // Plan lebih rendah → disabled, tidak bisa diklik
        btn.disabled = true;
        btn.className = "btn btn-ghost btn-sm";
        if (btn.style) btn.style.cssText = "width:100%;opacity:.35;cursor:not-allowed";
        btn.title = "You are already on a higher plan";
      }
      // Plan lebih tinggi → tetap aktif bisa diklik (tidak diubah)
    });

    // Tampilkan info plan aktif di bawah judul
    const intro = document.querySelector(".sub-intro");
    if (intro && currentPlan !== "free") {
      const infoEl = document.createElement("div");
      infoEl.style.cssText = "display:inline-flex;align-items:center;gap:8px;background:rgba(43,189,164,.1);border:1px solid rgba(43,189,164,.25);border-radius:999px;padding:4px 14px;font-size:12.5px;font-weight:600;color:var(--teal-deep);width:fit-content";
      const expiresText = subRow?.expires_at
        ? ` · Expires ${new Date(subRow.expires_at).toLocaleDateString()}`
        : (subRow?.interval === "lifetime" ? " · Lifetime" : "");
      infoEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg> Active plan: <strong style="text-transform:capitalize">${currentPlan}</strong>${expiresText}`;
      intro.insertBefore(infoEl, intro.children[1] || null);
    }
  })();

  // ── Pilih paket ──────────────────────────────────────────────
  document.querySelectorAll("[data-plan]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const plan = btn.dataset.plan;
      if (btn.disabled) return;
      // TODO: arahkan ke checkout / payment gateway
      // Untuk sementara tampilkan info contact admin
      alert(`Untuk upgrade ke ${plan}, hubungi admin atau pembuat aplikasi. Fitur pembayaran otomatis sedang dalam pengembangan.`);
    });
  });

  // ── Skip → dashboard, tandai first-visit sudah lihat halaman ini ─
  document.getElementById("skip-link")?.addEventListener("click", () => {
    try { localStorage.setItem("wf-seen-subscription", "1"); } catch (_) {}
  });
})();