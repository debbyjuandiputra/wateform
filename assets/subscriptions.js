(function () {
  "use strict";

  const SUPABASE_URL      = "https://zaaqlfxtymuafalkeftd.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphYXFsZnh0eW11YWZhbGtlZnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4Nzg2NjMsImV4cCI6MjEwMTQ1NDY2M30.NKBBX7Qcb4T22tvAjjAzh4Scmbt-bJN1kb1ADBr6Bro";
  const EDGE_BASE = SUPABASE_URL + "/functions/v1";

  const _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, storageKey: "wf-session", autoRefreshToken: true, detectSessionInUrl: false },
  });

  const PLANS = {
    plus:     { label: "Plus",     price: 2000  },
    pro:      { label: "Pro",      price: 6000 },
    ultimate: { label: "Ultimate", price: 25000 },
  };

  const PLAN_RANK = { free: 0, plus: 1, pro: 2, ultimate: 3, admin: 99 };

  // ── Theme ────────────────────────────────────────────────────────────────
  (function initTheme() {
    const root = document.documentElement;
    const btns = document.querySelectorAll("[data-theme-toggle]");
    function set(t) {
      const isDark = t === "dark";
      isDark ? root.setAttribute("data-theme", "dark") : root.removeAttribute("data-theme");
      btns.forEach(b => b.setAttribute("aria-pressed", String(isDark)));
      try { localStorage.setItem("wf-theme", t); } catch (_) {}
    }
    let saved;
    try { saved = localStorage.getItem("wf-theme"); } catch (_) {}
    set(saved === "dark" ? "dark" : "light");
    btns.forEach(b => b.addEventListener("click", () =>
      set(root.getAttribute("data-theme") === "dark" ? "light" : "dark")
    ));
  })();

  // ── Auth guard ───────────────────────────────────────────────────────────
  _sb.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
      window.location.replace("../login.html");
    }
  });

  document.getElementById("logout-btn")?.addEventListener("click", async () => {
    await _sb.auth.signOut();
    window.location.replace("../login.html");
  });

  // ── Toast ────────────────────────────────────────────────────────────────
  function showToast(msg, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = msg;
    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
      el.classList.remove("show");
      el.addEventListener("transitionend", () => el.remove(), { once: true });
    }, 4000);
  }

  function fmtIdr(n) {
    return "IDR " + n.toLocaleString("id-ID");
  }

  function openModal(id)  { document.getElementById(id)?.classList.add("open"); }
  function closeModal(id) { document.getElementById(id)?.classList.remove("open"); }

  // ── Current plan state ───────────────────────────────────────────────────
  let _currentPlan = "free";

  function applyPlanState(currentPlan) {
    _currentPlan = currentPlan;
    const currentRank = PLAN_RANK[currentPlan] ?? 0;
    document.querySelectorAll("[data-plan]").forEach(btn => {
      const p    = btn.dataset.plan;
      const rank = PLAN_RANK[p] ?? 0;
      btn.disabled      = false;
      btn.style.cssText = "width:100%";
      if (p === "free") return;
      if (p === currentPlan) {
        btn.textContent   = "Current plan";
        btn.disabled      = true;
        btn.className     = "btn btn-ghost btn-sm";
        btn.style.cssText = "width:100%;opacity:.7;cursor:default";
        const head = btn.closest(".plan-head");
        if (head && !head.classList.contains("featured")) head.style.background = "rgba(43,189,164,.08)";
      } else if (rank < currentRank) {
        btn.disabled      = true;
        btn.style.cssText = "width:100%;opacity:.35;cursor:not-allowed";
        btn.title         = "You are already on a higher plan";
      }
    });
  }

  // ── Init: load subscription ───────────────────────────────────────────────
  (async () => {
    const { data: { session } } = await _sb.auth.getSession();
    if (!session) return;

    const { data: subRow } = await _sb
      .from("subscriptions")
      .select("plan, status, expires_at")
      .eq("user_id", session.user.id)
      .maybeSingle();

    const currentPlan = subRow?.plan || "free";
    applyPlanState(currentPlan);

    const intro = document.querySelector(".sub-intro");
    if (intro && currentPlan !== "free") {
      const badge = document.createElement("div");
      badge.style.cssText = "display:inline-flex;align-items:center;gap:8px;background:rgba(43,189,164,.1);border:1px solid rgba(43,189,164,.25);border-radius:999px;padding:4px 14px;font-size:12.5px;font-weight:600;color:var(--teal-deep);width:fit-content";
      const expiresText = subRow?.expires_at
        ? ` · Expires ${new Date(subRow.expires_at).toLocaleDateString("en-GB")}`
        : "";
      badge.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg> Active plan: <strong style="text-transform:capitalize">${currentPlan}</strong>${expiresText}`;
      intro.insertBefore(badge, intro.children[1] || null);
    }
  })();

  // ── Inject modal ─────────────────────────────────────────────────────────
  // ── Modal styles injection ────────────────────────────────────────────────
  (function injectModalStyles() {
    const style = document.createElement("style");
    style.textContent = `
      /* ── Confirm step: order summary card ── */
      .qris-summary-card {
        background: var(--bg-mid);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        overflow: hidden;
      }
      .qris-summary-header {
        padding: 12px 16px;
        border-bottom: 1px solid var(--border);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: .06em;
        text-transform: uppercase;
        color: var(--text-muted);
      }
      .qris-summary-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 11px 16px;
        font-size: 13.5px;
      }
      .qris-summary-row + .qris-summary-row {
        border-top: 1px solid var(--border-soft);
      }
      .qris-summary-row span:first-child { color: var(--text-soft); }
      .qris-summary-row span:last-child  { font-weight: 600; color: var(--text); }
      .qris-plan-pill {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 2px 10px 2px 4px;
        border-radius: 999px;
        font-size: 12.5px;
        font-weight: 700;
        background: rgba(43,189,164,.12);
        color: var(--teal-deep);
        text-transform: capitalize;
      }
      [data-theme="dark"] .qris-plan-pill { color: var(--teal); }
      .qris-plan-dot {
        width: 8px; height: 8px; border-radius: 50%;
        background: var(--teal);
        flex-shrink: 0;
      }
      .qris-price-highlight {
        font-size: 15px;
        font-weight: 700;
        color: var(--text);
      }
      .qris-billing-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--text-soft);
        font-weight: 500;
      }
      .qris-info-note {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 10px 14px;
        background: rgba(43,189,164,.06);
        border: 1px solid rgba(43,189,164,.18);
        border-radius: var(--radius);
        font-size: 12.5px;
        color: var(--text-soft);
        line-height: 1.55;
      }
      .qris-info-note svg { flex-shrink: 0; margin-top: 1px; color: var(--teal-deep); }
      [data-theme="dark"] .qris-info-note svg { color: var(--teal); }

      /* ── Pay step ── */
      .qris-pay-card {
        width: 100%;
        background: var(--bg-mid);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        overflow: hidden;
      }
      .qris-pay-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        padding: 10px 14px;
        font-size: 13px;
      }
      .qris-pay-row + .qris-pay-row { border-top: 1px solid var(--border-soft); }
      .qris-pay-row span:first-child { color: var(--text-soft); }
      .qris-pay-amount-val {
        font-size: 16px;
        font-weight: 700;
        color: var(--text);
        font-family: 'JetBrains Mono', monospace;
      }
      .qris-pay-note {
        padding: 9px 14px;
        border-top: 1px solid var(--border);
        font-size: 12px;
        color: var(--text-muted);
        background: var(--bg-raised);
      }
      .qris-countdown-bar {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        font-size: 12.5px;
        color: var(--text-soft);
        padding: 4px 0;
      }
      .qris-countdown-bar strong { color: var(--text); font-variant-numeric: tabular-nums; }

      /* modal-header plan accent line */
      .qris-modal-accent {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--text-muted);
        font-weight: 500;
        margin-top: 2px;
      }
    `;
    document.head.appendChild(style);
  })();

  (function injectModal() {
    const backdrop = document.createElement("div");
    backdrop.id        = "qris-modal";
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="qris-modal-title" style="max-width:440px">
        <div class="modal-header" style="margin-bottom:16px">
          <h3 id="qris-modal-title" style="font-size:17px;font-weight:800;margin:0">Subscribe</h3>
          <button class="modal-close" id="qris-modal-close" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="modal-body" style="gap:14px">

          <!-- Step 1: confirm before generating -->
          <div id="qris-step-confirm" style="display:flex;flex-direction:column;gap:14px">

            <div class="qris-summary-card">
              <div class="qris-summary-header">Order Summary</div>
              <div class="qris-summary-row">
                <span>Plan</span>
                <span id="qris-plan-name" style="font-weight:600;text-transform:capitalize"></span>
              </div>
              <div class="qris-summary-row">
                <span>Price</span>
                <span class="qris-price-highlight" id="qris-plan-price"></span>
              </div>
              <div class="qris-summary-row">
                <span>Billing period</span>
                <span>
                  <div class="qris-billing-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    30 days
                  </div>
                </span>
              </div>
            </div>

            <!-- <div class="qris-info-note">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <strong>Pay Now</strong> to generate a QRIS code. Scan and pay the exact amount shown.
            </div> -->

          </div>

          <!-- Step 2: QRIS display -->
          <div id="qris-step-pay" style="display:none;flex-direction:column;align-items:center;gap:14px">

            <div id="qris-img-wrap" style="width:210px;height:210px;border:1px solid var(--border);border-radius:var(--radius);display:flex;align-items:center;justify-content:center;overflow:hidden;background:var(--bg-raised)">
              <img id="qris-img" src="" alt="QRIS payment code" style="width:100%;height:100%;object-fit:contain;display:none">
              <span id="qris-img-loader" style="font-size:12.5px;color:var(--text-muted)">Loading…</span>
            </div>

            <div class="qris-pay-card">
              <div class="qris-pay-row">
                <span>Plan</span>
                <strong id="qris-pay-plan" style="text-transform:capitalize;font-weight:700"></strong>
              </div>
              <div class="qris-pay-row">
                <span>Transfer exactly</span>
                <span class="qris-pay-amount-val" id="qris-pay-amount"></span>
              </div>
              <div class="qris-pay-row">
                <span>Unique code</span>
                <span id="qris-pay-unique" style="font-size:12px;color:var(--text-muted)"></span>
              </div>

            </div>

            <!-- Static QRIS warning — shown only when Casaku subscription is expired -->
            <div id="qris-static-warn" style="display:none;width:100%;background:rgba(234,179,8,.12);border:1px solid rgba(234,179,8,.35);border-radius:var(--radius);padding:10px 12px;font-size:12.5px;color:#92680a;line-height:1.5;text-align:center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="vertical-align:-2px;margin-right:4px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <strong>Transfer the exact amount shown above!<br>No less, no more.</strong>
            </div>

            <div class="qris-countdown-bar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Expires in <strong id="qris-countdown">5:00</strong>
            </div>

            <!-- Confirm button — enabled after 15 seconds -->
            <div style="width:100%;display:flex;flex-direction:column;align-items:center;gap:6px">
              <button id="qris-btn-confirm" class="btn btn-solid btn-sm" style="width:100%;opacity:.4;cursor:not-allowed" disabled>
                Confirm payment
              </button>
              <span id="qris-confirm-hint" style="font-size:11.5px;color:var(--text-muted)">Available in <strong id="qris-confirm-countdown">20</strong>s</span>
            </div>

            <div id="qris-status-msg" style="font-size:13px;color:var(--text-soft);text-align:center;min-height:18px"></div>
            <div id="qris-report-link-wrap" style="display:none;text-align:center;margin-top:2px">
              <a id="qris-report-link" href="#" style="font-size:12px;color:#ef4444;text-decoration:underline;cursor:pointer">Already paid but not detected?</a>
            </div>
          </div>

          <!-- Step 3: success -->
          <div id="qris-step-success" style="display:none;flex-direction:column;align-items:center;gap:14px;text-align:center;padding:12px 0">
            <div style="width:56px;height:56px;border-radius:50%;background:rgba(43,189,164,.12);display:flex;align-items:center;justify-content:center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="28" height="28" style="color:var(--teal)"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <div style="font-size:17px;font-weight:800;margin-bottom:6px">Payment confirmed!</div>
              <div id="qris-success-detail" style="font-size:13px;color:var(--text-soft);line-height:1.6"></div>
            </div>
          </div>

          <!-- Step 4: not found -->
          <div id="qris-step-notfound" style="display:none;flex-direction:column;align-items:center;gap:14px;text-align:center;padding:12px 0">
            <div style="width:56px;height:56px;border-radius:50%;background:rgba(229,83,75,.08);display:flex;align-items:center;justify-content:center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="28" height="28" style="color:var(--red)"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div>
              <div style="font-size:17px;font-weight:800;margin-bottom:6px">Payment not found</div>
              <div style="font-size:13px;color:var(--text-soft);line-height:1.6">
                Your transfer was not detected. If you already paid, wait a few minutes and try confirming again.
              </div>
            </div>
          </div>

        </div>

        <div class="modal-footer" id="qris-modal-footer" style="margin-top:20px">
          <button class="btn btn-ghost btn-sm" id="qris-btn-cancel">Cancel</button>
          <button class="btn btn-solid btn-sm" id="qris-btn-generate">Pay now</button>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);
  })();

  // ── Modal state ───────────────────────────────────────────────────────────
  let _activePlan       = null;
  let _refNo            = null;
  let _countdownTimer   = null;
  let _confirmTimer     = null;
  let _failCount        = 0;

  function resetModal() {
    clearInterval(_countdownTimer);
    clearInterval(_confirmTimer);
    _countdownTimer = null;
    _confirmTimer   = null;
    _refNo          = null;
    _failCount      = 0;

    show("qris-step-confirm");
    hide("qris-step-pay");
    hide("qris-step-success");
    hide("qris-step-notfound");
    document.getElementById("qris-modal-footer").style.display = "";
    document.getElementById("qris-img").style.display          = "none";
    document.getElementById("qris-img-loader").style.display   = "";
    document.getElementById("qris-status-msg").textContent     = "";
    const reportWrap = document.getElementById("qris-report-link-wrap");
    if (reportWrap) reportWrap.style.display = "none";

    const staticWarn = document.getElementById("qris-static-warn");
    if (staticWarn) staticWarn.style.display = "none";

    const genBtn = document.getElementById("qris-btn-generate");
    genBtn.disabled     = false;
    genBtn.textContent  = "Pay now";

    const confirmBtn = document.getElementById("qris-btn-confirm");
    confirmBtn.disabled      = true;
    confirmBtn.style.opacity = ".4";
    confirmBtn.style.cursor  = "not-allowed";
    document.getElementById("qris-confirm-hint").style.display = "";
  }

  function show(id) { const el = document.getElementById(id); if (el) el.style.display = "flex"; }
  function hide(id) { const el = document.getElementById(id); if (el) el.style.display = "none"; }

  document.getElementById("qris-modal-close")?.addEventListener("click", () => { closeModal("qris-modal"); resetModal(); });
  document.getElementById("qris-modal")?.addEventListener("click", e => { if (e.target.id === "qris-modal") { closeModal("qris-modal"); resetModal(); } });
  document.getElementById("qris-btn-cancel")?.addEventListener("click", () => { closeModal("qris-modal"); resetModal(); });

  // ── Open modal on plan button click ──────────────────────────────────────
  document.querySelectorAll("[data-plan]").forEach(btn => {
    btn.addEventListener("click", () => {
      const plan = btn.dataset.plan;
      if (btn.disabled || plan === "free" || !PLANS[plan]) return;
      if ((PLAN_RANK[plan] ?? 0) <= (PLAN_RANK[_currentPlan] ?? 0)) return;

      _activePlan = plan;
      const info  = PLANS[plan];

      document.getElementById("qris-modal-title").textContent = `Subscribe to ${info.label}`;
      document.getElementById("qris-plan-name").textContent   = info.label;
      document.getElementById("qris-plan-price").textContent  = fmtIdr(info.price) + " / mo";

      resetModal();
      openModal("qris-modal");
    });
  });

  // ── Generate QRIS ─────────────────────────────────────────────────────────
  document.getElementById("qris-btn-generate")?.addEventListener("click", async () => {
    if (!_activePlan) return;

    const genBtn = document.getElementById("qris-btn-generate");
    genBtn.disabled   = true;
    genBtn.textContent = "Membuat kode…";

    const { data: { session } } = await _sb.auth.getSession();
    if (!session) { showToast("Session expired. Please log in again.", "error"); genBtn.disabled = false; genBtn.textContent = "Pay now"; return; }

    try {
      const res  = await fetch(`${EDGE_BASE}/create-subscription-qris`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
        body:    JSON.stringify({ plan: _activePlan }),
      });
      const data = await res.json();

      if (!res.ok || !data.qris_data) {
        showToast(data?.message || data?.error || "Failed to generate payment.", "error");
        genBtn.disabled    = false;
        genBtn.textContent = "Pay now";
        return;
      }

      _refNo = data.ref_no;

      hide("qris-step-confirm");
      show("qris-step-pay");
      hide("qris-modal-footer");

      renderQrisImage(data.qris_data);
      document.getElementById("qris-pay-plan").textContent   = data.plan_label;
      document.getElementById("qris-pay-amount").textContent = fmtIdr(data.amount);
      document.getElementById("qris-pay-unique").textContent = `IDR ${data.unique_code}`;

      // Show static QRIS warning only when Casaku subscription is expired
      const staticWarn = document.getElementById("qris-static-warn");
      if (staticWarn) staticWarn.style.display = data.is_static ? "block" : "none";

      startCountdown(data.expires_in || 300);
      startConfirmCountdown();

    } catch (_) {
      showToast("Network error. Please check your connection.", "error");
      genBtn.disabled    = false;
      genBtn.textContent = "Pay now";
    }
  });

  // ── Render QRIS image ─────────────────────────────────────────────────────
  function renderQrisImage(qrisString) {
    const img    = document.getElementById("qris-img");
    const loader = document.getElementById("qris-img-loader");
    const url    = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&ecc=M&data=${encodeURIComponent(qrisString)}`;
    img.onload  = () => {
      loader.style.display = "none";
      img.style.display = "block";
    };
    img.onerror = () => {
      loader.textContent = "Could not render QR code. Use a QRIS scanner app instead.";
    };
    img.src = url;
  }

  // ── QRIS expiry countdown ─────────────────────────────────────────────────
  function startCountdown(seconds) {
    let remaining = seconds;
    const el = document.getElementById("qris-countdown");
    function tick() {
      const m = Math.floor(remaining / 60);
      const s = String(remaining % 60).padStart(2, "0");
      if (el) el.textContent = `${m}:${s}`;
      if (remaining <= 0) clearInterval(_countdownTimer);
      remaining--;
    }
    tick();
    _countdownTimer = setInterval(tick, 1000);
  }

  // ── Show "Already paid but not detected?" link ────────────────────────────
  function showReportLink() {
    const reportWrap = document.getElementById("qris-report-link-wrap");
    if (reportWrap) reportWrap.style.display = "block";
  }

  // ── 15-second confirm button countdown ───────────────────────────────────
  function startConfirmCountdown() {
    let elapsed     = 0;
    const hintEl    = document.getElementById("qris-confirm-hint");
    const countEl   = document.getElementById("qris-confirm-countdown");
    const confirmBtn = document.getElementById("qris-btn-confirm");

    function tick() {
      elapsed++;
      const leftConfirm = Math.max(0, 20 - elapsed);
      if (countEl) countEl.textContent = leftConfirm;
      if (elapsed >= 20 && confirmBtn && confirmBtn.disabled) {
        confirmBtn.disabled      = false;
        confirmBtn.style.opacity = "1";
        confirmBtn.style.cursor  = "pointer";
        if (hintEl) hintEl.style.display = "none";
      }
      // Show report link after 50 seconds regardless of fail count
      if (elapsed >= 50) {
        showReportLink();
        clearInterval(_confirmTimer);
      }
    }
    _confirmTimer = setInterval(tick, 1000);

    // Report link handler — build mailto on click
    const reportLink = document.getElementById("qris-report-link");
    if (reportLink) {
      reportLink.addEventListener("click", async function(e) {
        e.preventDefault();
        const { data: { session } } = await _sb.auth.getSession();
        const userEmail = session?.user?.email ?? "";
        const planInfo  = PLANS[_activePlan];
        const amount    = planInfo ? fmtIdr(planInfo.price) : "";
        const now       = new Date();
        const timeStr   = now.toLocaleString("en-GB", { year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", second:"2-digit" });
        const subject   = encodeURIComponent("Payment not detected");
        const body      = encodeURIComponent(
          "Email: " + userEmail + "\n" +
          "Total: " + amount + "\n" +
          "Time: " + timeStr + "\n" +
          "Message: "
        );
        window.location.href = "mailto:wateform@gmail.com?subject=" + subject + "&body=" + body;
      });
    }
  }

  // ── Confirm payment button ────────────────────────────────────────────────
  document.getElementById("qris-btn-confirm")?.addEventListener("click", async () => {
    if (!_refNo) return;

    const confirmBtn = document.getElementById("qris-btn-confirm");
    const statusEl   = document.getElementById("qris-status-msg");

    confirmBtn.disabled      = true;
    confirmBtn.style.opacity = ".4";
    confirmBtn.style.cursor  = "not-allowed";
    confirmBtn.textContent   = "Checking...";
    if (statusEl) statusEl.textContent = "Verifying your payment...";

    const { data: { session } } = await _sb.auth.getSession();
    if (!session) { showToast("Session expired.", "error"); return; }

    try {
      const res  = await fetch(`${EDGE_BASE}/check-subscription-qris`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
        body:    JSON.stringify({ ref_no: _refNo }),
      });
      const data = await res.json();

      if (data.status === "success") {
        onPaymentSuccess(data);
        return;
      }

      if (data.status === "expired") {
        if (statusEl) statusEl.textContent = "";
        hide("qris-step-pay");
        show("qris-step-notfound");
        return;
      }

      // Payment not found yet — increment fail counter, show report link after 3 failures
      _failCount++;
      if (_failCount >= 3) {
        showReportLink();
      }
      // Alert + jeda 4-7 detik sebelum re-enable
      alert("Payment not detected yet. Please wait a moment and try again.");
      const _jeda = 4000 + Math.random() * 3000;
      setTimeout(() => {
        if (statusEl) statusEl.textContent = "";
        confirmBtn.disabled      = false;
        confirmBtn.style.opacity = "1";
        confirmBtn.style.cursor  = "pointer";
        confirmBtn.textContent   = "Confirm payment";
      }, _jeda);

    } catch (_) {
      if (statusEl) statusEl.textContent = "Network error. Please try again.";
      confirmBtn.disabled      = false;
      confirmBtn.style.opacity = "1";
      confirmBtn.style.cursor  = "pointer";
      confirmBtn.textContent   = "Confirm payment";
    }
  });

  // ── Payment success ───────────────────────────────────────────────────────
  function onPaymentSuccess(data) {
    clearInterval(_countdownTimer);
    clearInterval(_confirmTimer);

    hide("qris-step-pay");
    show("qris-step-success");

    const expiresAt = data.expires_at ? new Date(data.expires_at) : null;
    const detailEl  = document.getElementById("qris-success-detail");
    if (detailEl) {
      const planLabel = PLANS[data.plan]?.label ?? data.plan;
      const expStr    = expiresAt
        ? `Active until ${expiresAt.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })} at 23:59`
        : "Plan is now active";
      detailEl.innerHTML = `<strong style="text-transform:capitalize">${planLabel}</strong> plan activated.<br>${expStr}.`;
    }

    showToast(`${PLANS[data.plan]?.label ?? data.plan} plan is now active.`, "success");
    setTimeout(() => window.location.reload(), 3500);
  }

  // ── Skip link ─────────────────────────────────────────────────────────────
  document.getElementById("skip-link")?.addEventListener("click", () => {
    try { localStorage.setItem("wf-seen-subscription", "1"); } catch (_) {}
  });
})();