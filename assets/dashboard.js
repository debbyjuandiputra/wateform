// ── CONFIG ───────────────────────────────────────────────────
const SUPABASE_URL      = "https://zaaqlfxtymuafalkeftd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphYXFsZnh0eW11YWZhbGtlZnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4Nzg2NjMsImV4cCI6MjEwMTQ1NDY2M30.NKBBX7Qcb4T22tvAjjAzh4Scmbt-bJN1kb1ADBr6Bro";
const BASE_URL = window.location.origin;

const _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession:     true,
    storageKey:         "wf-session",
    autoRefreshToken:   true,
    detectSessionInUrl: false,
  },
});

// ── State ─────────────────────────────────────────────────────
let currentUser    = null;
let currentProfile = null;
let currentPlan    = "free"; // plan milik user saat ini
let workspaces     = [];
let activeWsId     = null;
let pendingAction  = null; // for confirm modal

// ── Plan limits ───────────────────────────────────────────────
// "admin" is an internal-only tier (not sold, set manually in Supabase) with unlimited everything.
const PLAN_LIMITS = {
  free:     { maxWorkspaces: 1,        maxForms: 5,        maxMembers: 0,       viewResponses: false },
  plus:     { maxWorkspaces: 5,        maxForms: 20,       maxMembers: 1,       viewResponses: false },
  pro:      { maxWorkspaces: 15,       maxForms: 50,       maxMembers: 5,       viewResponses: true  },
  ultimate: { maxWorkspaces: Infinity, maxForms: Infinity, maxMembers: 100,     viewResponses: true  },
  admin:    { maxWorkspaces: Infinity, maxForms: Infinity, maxMembers: Infinity, viewResponses: true  },
};
function planLimits() { return PLAN_LIMITS[currentPlan] || PLAN_LIMITS.free; }

// ── Theme ─────────────────────────────────────────────────────
(function initTheme() {
  const root = document.documentElement;
  const btns = document.querySelectorAll("[data-theme-toggle]");

  function updateHamThemeLabel(isDark) {
    const label = document.getElementById("ham-theme-label");
    if (label) label.textContent = isDark ? "Light mode" : "Dark mode";
  }

  function set(t) {
    const isDark = t === "dark";
    isDark ? root.setAttribute("data-theme","dark") : root.removeAttribute("data-theme");
    btns.forEach(b => b.setAttribute("aria-pressed", String(isDark)));
    updateHamThemeLabel(isDark);
    try { localStorage.setItem("wf-theme", t); } catch(_){}
  }

  let saved; try { saved = localStorage.getItem("wf-theme"); } catch(_){}
  set(saved === "dark" ? "dark" : "light");

  btns.forEach(b => b.addEventListener("click", () =>
    set(root.getAttribute("data-theme")==="dark" ? "light" : "dark")
  ));

  // Hamburger theme toggle
  const hamTheme = document.getElementById("ham-theme");
  if (hamTheme) {
    hamTheme.addEventListener("click", () => {
      set(root.getAttribute("data-theme")==="dark" ? "light" : "dark");
    });
  }
})();

// ── Hamburger menu ────────────────────────────────────────────
(function initHamburger() {
  const btn  = document.getElementById("ham-btn");
  const menu = document.getElementById("ham-menu");
  if (!btn || !menu) return;

  function open()  { menu.classList.add("open");  btn.classList.add("open");  btn.setAttribute("aria-expanded","true"); }
  function close() { menu.classList.remove("open"); btn.classList.remove("open"); btn.setAttribute("aria-expanded","false"); }
  function toggle(){ menu.classList.contains("open") ? close() : open(); }

  btn.addEventListener("click", (e) => { e.stopPropagation(); toggle(); });
  document.addEventListener("click", (e) => {
    if (!btn.contains(e.target) && !menu.contains(e.target)) close();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

  // Subscription & Leaderboard placeholders
  document.getElementById("ham-subscription")?.addEventListener("click", () => {
    close();
    window.location.href = "subscription.html";
    // TODO: open subscription panel
  });
  document.getElementById("ham-leaderboard")?.addEventListener("click", () => {
    close();
    // TODO: open leaderboard panel
  });
  document.getElementById("ham-notification")?.addEventListener("click", () => {
    close();
    // TODO: open notification panel
  });
  document.getElementById("ham-storage")?.addEventListener("click", () => {
    close();
    // TODO: open storage panel
  });
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
document.querySelectorAll("[data-close]").forEach(btn =>
  btn.addEventListener("click", () => closeModal(btn.dataset.close))
);
document.querySelectorAll(".modal-backdrop").forEach(bd =>
  bd.addEventListener("click", e => { if (e.target === bd) bd.classList.remove("open"); })
);
function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg; el.style.display = msg ? "block" : "none";
}

// ── Auth state listener — handle sesi expired & refresh ───────
_sb.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
    window.location.replace("../login.html");
  }
  if (event === "TOKEN_REFRESHED" && session) {
    currentUser = session.user; // update user jika token di-refresh
  }
});

// ── Init ──────────────────────────────────────────────────────
async function init() {
  // Coba ambil sesi; jika token expired, Supabase akan auto-refresh
  let { data: { session } } = await _sb.auth.getSession();

  // Jika tidak ada sesi sama sekali, coba refresh sekali lagi
  if (!session) {
    const { data: refreshed } = await _sb.auth.refreshSession();
    session = refreshed?.session ?? null;
  }

  if (!session) {
    window.location.replace("../login.html");
    return;
  }
  currentUser = session.user;

  const { data: profile } = await _sb.from("profiles").select("*").eq("id", currentUser.id).single();
  currentProfile = profile;

  // Ambil plan user
  const { data: subRow } = await _sb.from("subscriptions")
    .select("plan").eq("user_id", currentUser.id).maybeSingle();
  currentPlan = subRow?.plan || "free";

  // Render user info
  const initials = (profile?.full_name || "?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  document.getElementById("user-avatar").textContent = initials;
  document.getElementById("user-name").textContent   = profile?.full_name || "User";
  document.getElementById("user-handle").textContent = "@" + (profile?.username || "");

  await loadWorkspaces();
  loadStorageBar();

  // Auto-open workspace if redirected from builder (?ws=<id>)
  const urlParams = new URLSearchParams(location.search);
  const wsParam = urlParams.get("ws");
  if (wsParam && workspaces.find(w => w.id === wsParam)) {
    openWorkspace(wsParam);
  } else {
    renderHome();
  }
}

// ── Storage label ────────────────────────────────────────────
async function loadStorageBar() {
  const label = document.getElementById("ham-storage-label");
  if (!label) return;

  const { data } = await _sb
    .from("storage_usage")
    .select("used_bytes, quota_bytes")
    .eq("user_id", currentUser.id)
    .maybeSingle();

  // Jika tidak ada data (user lama sebelum migration 011/018), tampilkan default free tier.
  const usedBytes  = data?.used_bytes  ?? 0;
  const quotaBytes = data?.quota_bytes ?? 20971520; // 20 MB (free)

  const usedMb  = (usedBytes / 1048576).toFixed(1);
  const quotaMb = Math.round(quotaBytes / 1048576);
  const quotaLabel = quotaMb >= 1024
    ? (quotaMb >= 10240 ? `${quotaMb / 1024} GB` : `${(quotaMb / 1024).toFixed(1)} GB`)
    : `${quotaMb} MB`;
  label.textContent = `${usedMb} / ${quotaLabel}`;
}

// ── Load workspaces ───────────────────────────────────────────
async function loadWorkspaces() {
  const { data, error } = await _sb
    .from("workspaces")
    .select(`
      *,
      workspace_members!inner (user_id, role),
      forms (count)
    `)
    .order("created_at", { ascending: false });

  if (error) { console.error(error); return; }
  workspaces = data || [];
}


// ── Home view (all workspaces) ────────────────────────────────
function renderHome() {
  activeWsId = null;
  document.getElementById("topbar-ws-name").textContent = "Dashboard";
  const main = document.getElementById("main-content");
  main.innerHTML = `
    <div class="dash-header">
      <div>
        <h2>Your workspaces</h2>
      </div>
      <button class="btn btn-solid btn-sm" id="create-ws-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        New workspace
        ${(()=>{
          const lim = planLimits();
          const owned = workspaces.filter(w => w.workspace_members?.some(m => m.user_id === currentUser.id && m.role === "owner")).length;
          if (lim.maxWorkspaces === Infinity) return "";
          const atLimit = owned >= lim.maxWorkspaces;
          return `<span style="font-size:10px;opacity:.7;margin-left:2px">(${owned}/${lim.maxWorkspaces})</span>`;
        })()}
      </button>
    </div>
    <div class="dash-body">
      ${workspaces.length === 0 ? `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          <h4>No workspaces yet</h4>
        </div>
      ` : `<div class="ws-grid" id="ws-grid"></div>`}
    </div>
  `;
  document.getElementById("create-ws-btn")?.addEventListener("click", openNewWsModal);
  document.getElementById("create-ws-btn2")?.addEventListener("click", openNewWsModal);
  if (workspaces.length > 0) renderWsGrid();
}

function renderWsGrid() {
  const grid = document.getElementById("ws-grid");
  grid.innerHTML = "";
  workspaces.forEach(ws => {
    const myRole = ws.workspace_members?.find(m => m.user_id === currentUser.id)?.role || "member";
    const isOwner = myRole === "owner";
    const formCount = ws.forms?.[0]?.count || 0;
    const memberCount = ws.workspace_members?.length || 1;
    const createdDate = new Date(ws.created_at).toLocaleDateString(undefined, { year:"numeric", month:"short", day:"numeric"});
    const card = document.createElement("div");
    card.className = "ws-card";
    card.innerHTML = `
      <div class="ws-card-top">
        <div class="ws-card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        </div>
        <div style="flex:1;min-width:0">
          <h4>${esc(ws.name)}</h4>
          <div class="meta">Created ${createdDate}</div>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <span class="role-badge ${myRole === 'owner' ? 'role-owner' : 'role-member'}">${myRole}</span>
          <div class="dropdown ws-card-menu">
            <button class="btn-icon ws-menu-btn" data-ws-menu="${ws.id}" title="More options" style="width:28px;height:28px;border-radius:var(--radius)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
            <div class="dropdown-menu ws-dropdown-menu" style="right:0;left:auto;min-width:180px">
              <button class="dropdown-item" data-ws-action="open" data-ws-id="${ws.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                Open workspace
              </button>
              <button class="dropdown-item" data-ws-action="invite" data-ws-id="${ws.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>
                Manage members
              </button>
              ${isOwner ? `
              <button class="dropdown-item" data-ws-action="edit" data-ws-id="${ws.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                Edit workspace
              </button>
              <div class="dropdown-sep"></div>
              <button class="dropdown-item danger" data-ws-action="delete" data-ws-id="${ws.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                Delete workspace
              </button>` : ""}
            </div>
          </div>
        </div>
      </div>
      ${ws.description ? `<div class="desc">${esc(ws.description)}</div>` : ""}
      <div class="ws-card-footer">
        <div class="ws-card-stats">
          <span>${formCount} form${formCount !== 1 ? "s" : ""}</span>
          <span>${memberCount} member${memberCount !== 1 ? "s" : ""}</span>
        </div>
        <span class="ws-card-id font-mono">${ws.short_id}</span>
      </div>
    `;
    // click card body → open workspace (but not menu)
    card.addEventListener("click", e => {
      if (e.target.closest(".ws-card-menu")) return;
      openWorkspace(ws.id);
    });
    // menu button toggle
    card.querySelector("[data-ws-menu]").addEventListener("click", e => {
      e.stopPropagation();
      const menu = card.querySelector(".ws-dropdown-menu");
      document.querySelectorAll(".ws-dropdown-menu.open").forEach(m => { if (m !== menu) m.classList.remove("open"); });
      menu.classList.toggle("open");
    });
    // menu item actions
    card.querySelector(".ws-dropdown-menu").addEventListener("click", e => {
      e.stopPropagation();
      const btn = e.target.closest("[data-ws-action]");
      if (!btn) return;
      const action = btn.dataset.wsAction;
      const wsId = btn.dataset.wsId;
      const wsObj = workspaces.find(w => w.id === wsId);
      card.querySelector(".ws-dropdown-menu").classList.remove("open");
      if (action === "open")   { openWorkspace(wsId); return; }
      if (action === "invite") { openWorkspace(wsId).then(() => { document.getElementById("invite-btn")?.click(); }); return; }
      if (action === "edit")   { openEditWsModal(wsObj); return; }
      if (action === "delete") { openDeleteWsModal(wsObj); return; }
    });
    grid.appendChild(card);
  });

  // Close ws dropdowns on outside click
  document.addEventListener("click", () => {
    document.querySelectorAll(".ws-dropdown-menu.open").forEach(m => m.classList.remove("open"));
  }, { capture: true, once: false });
}

// ── Workspace view ────────────────────────────────────────────
async function openWorkspace(wsId) {
  activeWsId = wsId;
  const ws = workspaces.find(w => w.id === wsId);
  if (!ws) return;
  document.getElementById("topbar-ws-name").textContent = ws.name;

  const [{ data: forms }, { data: rawMembers, error: memberErr }] = await Promise.all([
    _sb.from("forms").select("*").eq("workspace_id", wsId).order("created_at", { ascending: false }),
    _sb.from("workspace_members").select("*").eq("workspace_id", wsId)
  ]);

  if (memberErr) console.error("workspace_members query error:", memberErr);
  console.log("Raw members from DB:", rawMembers);

  // Fetch profiles separately to avoid FK/RLS join issues
  let members = rawMembers || [];
  if (members.length > 0) {
    const userIds = members.map(m => m.user_id);
    const { data: profiles, error: profErr } = await _sb
      .from("profiles").select("id, full_name, username, photo_url, avatar_frame").in("id", userIds);
    if (profErr) console.error("profiles query error:", profErr);
    const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
    members = members.map(m => ({ ...m, profiles: profileMap[m.user_id] || null }));
  }
  console.log("Members with profiles:", members);

  const myMember = members?.find(m => m.user_id === currentUser.id);
  const myRole = myMember?.role || "member";
  const isOwner = myRole === "owner";

  // Permissions: all members have full access
  const perms = {
    can_edit_questions: true, can_edit_settings: true,
    can_add_members: true, can_see_members: true
  };
  const main = document.getElementById("main-content");
  main.innerHTML = `
    <div class="dash-header">
      <div style="display:flex;align-items:center;gap:10px">
        <button class="btn-icon" id="back-btn" title="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div>
          <h2 style="display:flex;align-items:center;gap:8px">
            ${esc(ws.name)}
            <span class="ws-card-id font-mono" style="font-size:12px">${ws.short_id}</span>
          </h2>
          ${ws.description ? `<p>${esc(ws.description)}</p>` : ""}
        </div>
      </div>
      <div style="display:flex;gap:8px">
        ${isOwner ? `
        <button class="btn btn-ghost btn-sm" id="ws-delete-btn" style="color:var(--red)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          <span class="btn-label">Delete</span>
        </button>
        <button class="btn btn-ghost btn-sm" id="ws-settings-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
          <span class="btn-label">Edit</span>
        </button>` : ""}
        <button class="btn btn-solid btn-sm" data-i18n="form" id="new-form-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M12 5v14M5 12h14"/></svg>
          New form
        </button>
      </div>
    </div>

    <div class="dash-body">
      <!-- Forms -->
      <div style="margin-bottom:28px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <h3 style="font-size:15px;font-weight:700;margin:0" translate="no">Forms</h3>
          <span style="font-size:12px;color:var(--text-muted)">${forms?.length || 0} total</span>
        </div>
        <div class="form-list" id="form-list"></div>
      </div>

      <!-- Members (hidden entirely if can_see_members=false and not owner) -->
      ${perms.can_see_members ? `<div id="members-section">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <h3 style="font-size:15px;font-weight:700;margin:0">Members</h3>
          ${(isOwner || perms.can_add_members) ? `<button class="btn btn-ghost btn-sm" id="invite-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M12 5v14M5 12h14"/></svg>
            Add member
          </button>` : ""}
        </div>
        <div id="member-list" style="background:var(--bg-raised);border:1px solid var(--border);border-radius:var(--radius-lg);padding:0 16px"></div>
      </div>` : ""}
    </div>
  `;

  document.getElementById("back-btn").addEventListener("click", () => { loadWorkspaces().then(renderHome); });
  document.getElementById("new-form-btn").addEventListener("click", () => openNewFormModal(wsId));
  document.getElementById("ws-settings-btn")?.addEventListener("click", () => openEditWsModal(ws));
  document.getElementById("ws-delete-btn")?.addEventListener("click", () => openDeleteWsModal(ws));
  document.getElementById("invite-btn")?.addEventListener("click", () => openInviteModal(wsId));

  renderFormList(forms || [], wsId, isOwner);
  if (perms.can_see_members) renderMemberList(members || [], wsId, isOwner, currentUser.id);
}

function renderFormList(forms, wsId, isOwner) {
  const list = document.getElementById("form-list");
  if (!forms.length) {
    list.innerHTML = `<div class="empty-state" style="padding:32px">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>
      <h4>No forms yet</h4>
    </div>`;
    return;
  }
  list.innerHTML = "";
  forms.forEach(form => {
    const wsShortId = workspaces.find(w=>w.id===wsId)?.short_id || "";
    const url = form.slug
      ? `${BASE_URL}/${form.slug}`
      : `${BASE_URL}/${wsShortId}/${form.short_id}`;
    const target = form.settings?.target;

    const row = document.createElement("div");
    row.className = "form-row";
    row.innerHTML = `
      <div class="form-row-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>
      </div>
      <div class="form-row-info">
        <div class="form-row-name">
          ${esc(form.title)}
          <button class="copy-link-btn copy-link-mobile" data-action="copy-link" data-url="${url}" title="Copy link" aria-label="Copy link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
        </div>
        <div class="form-row-meta">
          <span class="form-row-url">${url}</span>
          <button class="copy-link-btn copy-link-desktop" data-action="copy-link" data-url="${url}" title="Copy link" aria-label="Copy link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        ${form.is_published ? `<span class="pill" style="background:rgba(43,189,164,.12);color:var(--teal-deep)">Published</span>` : `<span class="pill" style="background:var(--bg-mid);color:var(--text-muted)">Draft</span>`}
        ${(()=>{ const s=form.settings||{}; const now=new Date(); const fmtShort=dt=>new Date(dt).toLocaleString(undefined,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}); if(s.openAt&&new Date(s.openAt)>now) return `<span class="pill" style="background:rgba(234,179,8,.12);color:#b45309;font-size:11px">Opens ${fmtShort(s.openAt)}</span>`; if(s.closeAt&&new Date(s.closeAt)>now) return `<span class="pill" style="background:rgba(234,179,8,.12);color:#b45309;font-size:11px">Closes ${fmtShort(s.closeAt)}</span>`; if(s.closeAt&&new Date(s.closeAt)<=now&&form.is_published) return `<span class="pill" style="background:rgba(239,68,68,.1);color:var(--red);font-size:11px">Closed</span>`; return ""; })()}
      </div>
      <div class="form-row-actions">
        <div class="dropdown">
          <button class="btn-icon" data-action="menu-toggle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
          </button>
          <div class="dropdown-menu" style="min-width:190px">
            <button class="dropdown-item" data-action="open-builder" data-id="${form.id}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>
              Open editor
            </button>
            <button class="dropdown-item" data-action="preview" data-id="${form.id}" data-url="${url}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              Preview form
            </button>
            <button class="dropdown-item" data-action="settings" data-id="${form.id}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              Settings
            </button>
            <div class="dropdown-sep"></div>
            <button class="dropdown-item" data-action="responses" data-id="${form.id}" style="${(()=>{const _wsR=workspaces.find(w=>w.id===wsId);const _oId=_wsR?.workspace_members?.find(m=>m.role==='owner')?.user_id||currentUser.id;let _oPlan=currentPlan;/* note: owner plan check is async so we use cached currentPlan for owner, show lock for non-owner */ const _oLim=PLAN_LIMITS[_oId===currentUser.id?currentPlan:'free']||PLAN_LIMITS.free;return !_oLim.viewResponses?'opacity:.5':'';})()}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              View responses
              ${!planLimits().viewResponses && (workspaces.find(w=>w.id===wsId)?.workspace_members?.find(m=>m.role==='owner')?.user_id||currentUser.id)===currentUser.id ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11" style="margin-left:auto;color:var(--text-muted)"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' : ''}
            </button>
            <button class="dropdown-item" data-action="share" data-id="${form.id}" data-url="${url}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
              Share / embed
            </button>
            <button class="dropdown-item" data-action="duplicate" data-id="${form.id}" data-ws="${wsId}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Duplicate
            </button>
            <button class="dropdown-item" data-action="rename" data-id="${form.id}" data-title="${esc(form.title)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
              Rename
            </button>
            <div class="dropdown-sep"></div>
            <button class="dropdown-item danger" data-action="delete" data-id="${form.id}" data-title="${esc(form.title)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
              Delete
            </button>
          </div>
        </div>
      </div>
    `;
    // Click row body → open builder
    row.style.cursor = "pointer";
    row.addEventListener("click", e => {
      if (e.target.closest("[data-action]") || e.target.closest(".dropdown")) return;
      window.location.href = `../builder.html?form=${form.id}`;
    });
    list.appendChild(row);
  });

  // Event delegation
  list.addEventListener("click", e => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    const id     = btn.dataset.id;

    if (action === "copy-link") {
      navigator.clipboard.writeText(btn.dataset.url);
      toast("Link copied");
      e.stopPropagation();
      return;
    }

    // Toggle dropdown menu
    if (action === "menu-toggle") {
      const menu = btn.closest(".dropdown").querySelector(".dropdown-menu");
      document.querySelectorAll(".dropdown-menu.open").forEach(m => { if (m !== menu) m.classList.remove("open"); });
      menu.classList.toggle("open");
      e.stopPropagation();
      return;
    }

    if (action === "open-builder") { window.location.href = `../builder.html?form=${id}`; return; }
    if (action === "preview")    { window.open(btn.dataset.url, "_blank"); return; }
    if (action === "settings")   { window.location.href = `../builder.html?form=${id}&panel=settings`; return; }
    if (action === "responses")  {
      // Cek apakah plan owner workspace mengizinkan view responses
      const _ws = workspaces.find(w => w.id === activeWsId);
      const _wsOwnerId = _ws?.workspace_members?.find(m => m.role === "owner")?.user_id || currentUser.id;
      // Ambil plan owner workspace (cached dari currentPlan jika kita adalah owner)
      const _checkViewResp = async () => {
        let _ownerPlan = currentPlan;
        if (_wsOwnerId !== currentUser.id) {
          const { data: _ownerSub } = await _sb.from("subscriptions")
            .select("plan").eq("user_id", _wsOwnerId).maybeSingle();
          _ownerPlan = _ownerSub?.plan || "free";
        }
        const _ownerLim = PLAN_LIMITS[_ownerPlan] || PLAN_LIMITS.free;
        if (!_ownerLim.viewResponses) {
          toast(
            `The ${_ownerPlan} plan cannot view responses. ` +
            (_wsOwnerId === currentUser.id ? "Upgrade to Pro or higher." : "Workspace owner needs to upgrade."),
            "error"
          );
          return;
        }
        openResponses(id);
      };
      _checkViewResp();
      return;
    }
    if (action === "share")      { openShareModal(btn.dataset.url); return; }
    if (action === "duplicate")  { duplicateForm(id, btn.dataset.ws); return; }
    if (action === "rename")     { openRenameModal(id, btn.dataset.title); return; }
    if (action === "delete")     { openDeleteForm(id, btn.dataset.title); return; }
  });
}

function renderMemberList(members, wsId, isOwner, meId) {
  const list = document.getElementById("member-list");
  list.innerHTML = "";

  if (!members || !members.length) {
    list.innerHTML = `<div style="padding:20px 0;text-align:center;color:var(--text-muted);font-size:13px">No members yet</div>`;
    return;
  }

  members.forEach(m => {
    const isMe = m.user_id === meId;
    const row = document.createElement("div");
    row.className = "member-row";
    const initials  = (m.profiles?.full_name || "?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
    const photoUrl   = m.profiles?.photo_url   || "";
    const frameClass = m.profiles?.avatar_frame || "";
    const frameRingHtml = frameClass ? `<div class="avatar-frame-ring ${esc(frameClass)}"></div>` : "";
    const avatarHtml = `
      <div class="avatar-wrap">
        ${photoUrl
          ? `<div class="avatar" style="padding:0;overflow:hidden"><img src="${photoUrl}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block"></div>`
          : `<div class="avatar">${initials}</div>`}
        ${frameRingHtml}
      </div>`;

    // Default permissions for display
    const p = m.permissions || {};
    const canEditQ  = p.can_edit_questions !== false;
    const canEditS  = p.can_edit_settings  !== false;
    const canAddM   = p.can_add_members    === true;
    const canSeeM   = p.can_see_members    === true;

    const kebabHtml = isOwner && m.role !== "owner" ? `
        <button class="btn-icon member-kebab-btn" data-uid="${m.user_id}" title="More options" style="color:var(--text-muted)">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
        </button>
        <div class="member-kebab-menu" style="display:none;position:absolute;right:0;top:100%;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-md);box-shadow:0 4px 16px rgba(0,0,0,.12);z-index:100;min-width:160px;overflow:hidden">
          <button class="member-kebab-item" data-transfer="${m.user_id}" data-name="${esc(m.profiles?.full_name || 'this member')}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M16 3h5v5M21 3l-7 7M8 21H3v-5M3 21l7-7"/></svg>
            Transfer ownership
          </button>
          <button class="member-kebab-item danger" data-remove="${m.user_id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M18 6 6 18M6 6l12 12"/></svg>
            Remove member
          </button>
        </div>` : "";

    row.innerHTML = `
      ${avatarHtml}
      <div class="member-info">
        <div class="member-name">
          ${esc(m.profiles?.full_name || "Unknown")}
          ${isMe ? `<span style="font-size:10px;font-weight:600;background:var(--teal-mid,rgba(43,189,164,.15));color:var(--teal-deep,#0d9488);padding:1px 6px;border-radius:99px;margin-left:6px;vertical-align:middle">You</span>` : ""}
        </div>
        <div class="member-username">@${esc(m.profiles?.username || "")}</div>
      </div>
      <span class="role-badge ${m.role === "owner" ? "role-owner" : "role-member"}">${m.role}</span>
      <div class="member-kebab-wrap" style="position:relative;width:28px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
        ${kebabHtml}
      </div>
    `;
    list.appendChild(row);
  });

  // Kebab menu toggle
  list.addEventListener("click", async e => {
    const kebabBtn = e.target.closest(".member-kebab-btn");
    if (kebabBtn) {
      // Close any other open menus
      list.querySelectorAll(".member-kebab-menu").forEach(m => {
        if (m !== kebabBtn.nextElementSibling) m.style.display = "none";
      });
      const menu = kebabBtn.nextElementSibling;
      menu.style.display = menu.style.display === "none" ? "block" : "none";
      return;
    }

    // Remove
    const removeBtn = e.target.closest("[data-remove]");
    if (removeBtn) {
      const uid = removeBtn.dataset.remove;
      openConfirm("Remove member?", "This member will lose access to the workspace.", async () => {
        await _sb.from("workspace_members").delete().eq("workspace_id", wsId).eq("user_id", uid);
        openWorkspace(wsId);
        toast("Member removed");
      }, "Remove");
      return;
    }
    // Transfer ownership
    const transferBtn = e.target.closest("[data-transfer]");
    if (transferBtn) {
      const uid = transferBtn.dataset.transfer;
      const name = transferBtn.dataset.name || "this member";
      // Close menu
      transferBtn.closest(".member-kebab-menu").style.display = "none";
      openConfirm(
        `Transfer ownership to ${name}?`,
        "You will become a regular member and they will become the owner. This cannot be undone.",
        async () => {
          const { data: rpcData, error } = await _sb.rpc("transfer_workspace_ownership", {
            p_workspace_id: wsId,
            p_new_owner_id: uid
          });
          console.error("Transfer error:", JSON.stringify(error)); if (error) { toast("Transfer failed: " + (error.message || error.details || error.hint || JSON.stringify(error)), "error"); return; }
          toast("Ownership transferred");
          await loadWorkspaces();
          openWorkspace(wsId);
        },
        "Yes"
      );
      return;
    }

    // Close menus when clicking elsewhere inside list
    if (!e.target.closest(".member-kebab-wrap")) {
      list.querySelectorAll(".member-kebab-menu").forEach(m => m.style.display = "none");
    }
  });

  // Close kebab menus on outside click
  document.addEventListener("click", function closeKebab(e) {
    if (!e.target.closest(".member-kebab-wrap")) {
      list.querySelectorAll(".member-kebab-menu").forEach(m => m.style.display = "none");
    }
  }, { once: false, capture: false });
}



// ── Workspace CRUD ────────────────────────────────────────────
function openNewWsModal() {
  document.getElementById("ws-modal-title").textContent = "New workspace";
  document.getElementById("ws-name").value = "";
  document.getElementById("ws-desc").value = "";
  document.getElementById("ws-save-btn").textContent = "Create workspace";
  showError("ws-modal-error", "");
  document.getElementById("ws-save-btn").onclick = createWorkspace;
  openModal("ws-modal");
  setTimeout(() => document.getElementById("ws-name").focus(), 100);
}

function openEditWsModal(ws) {
  document.getElementById("ws-modal-title").textContent = "Edit workspace";
  document.getElementById("ws-name").value = ws.name;
  document.getElementById("ws-desc").value = ws.description || "";
  document.getElementById("ws-save-btn").textContent = "Save changes";
  showError("ws-modal-error", "");
  document.getElementById("ws-save-btn").onclick = () => updateWorkspace(ws.id);
  openModal("ws-modal");
  setTimeout(() => document.getElementById("ws-name").focus(), 100);
}

async function createWorkspace() {
  const name = document.getElementById("ws-name").value.trim();
  if (!name) { showError("ws-modal-error", "Workspace name is required."); return; }

  // ── Cek batas workspace per plan ──
  const lim = planLimits();
  // Hitung workspace yang dimiliki (owned) oleh user ini
  const ownedCount = workspaces.filter(w =>
    w.workspace_members?.some(m => m.user_id === currentUser.id && m.role === "owner")
  ).length;
  if (ownedCount >= lim.maxWorkspaces) {
    const limLabel = lim.maxWorkspaces === Infinity ? "unlimited" : lim.maxWorkspaces;
    showError("ws-modal-error",
      `The ${currentPlan} plan can only create ${limLabel} workspace(s). ` +
      `Upgrade to add more.`
    );
    return;
  }

  const btn = document.getElementById("ws-save-btn");
  btn.disabled = true; btn.textContent = "Creating…";
  const { error } = await _sb.from("workspaces").insert({ name, description: document.getElementById("ws-desc").value.trim() || null, owner_id: currentUser.id, short_id: "" });
  btn.disabled = false; btn.textContent = "Create workspace";
  if (error) { showError("ws-modal-error", error.message); return; }
  closeModal("ws-modal");
  toast("Workspace created");
  await loadWorkspaces();
  renderHome();
}

async function updateWorkspace(wsId) {
  const name = document.getElementById("ws-name").value.trim();
  if (!name) { showError("ws-modal-error", "Workspace name is required."); return; }
  const btn = document.getElementById("ws-save-btn");
  btn.disabled = true; btn.textContent = "Saving…";
  const { error } = await _sb.from("workspaces").update({ name, description: document.getElementById("ws-desc").value.trim() || null }).eq("id", wsId);
  btn.disabled = false; btn.textContent = "Save changes";
  if (error) { showError("ws-modal-error", error.message); return; }
  closeModal("ws-modal");
  toast("Workspace updated");
  await loadWorkspaces();
  openWorkspace(wsId);
}

// ── Delete workspace ──────────────────────────────────────────
function openDeleteWsModal(ws) {
  openConfirm(
    `Delete "${ws.name}"?`,
    "All forms and responses in this workspace will be permanently deleted. This cannot be undone.",
    async () => {
      const { error } = await _sb.rpc("delete_workspace_with_cleanup", {
        p_workspace_id: ws.id,
      });
      if (error) { toast("Failed to delete workspace", "error"); return; }
      toast("Workspace deleted");
      await loadWorkspaces();
      renderHome();
    }
  );
}

// ── Invite member ─────────────────────────────────────────────
function openInviteModal(wsId) {
  document.getElementById("invite-email").value = "";
  showError("invite-error", "");
  document.getElementById("invite-save-btn").onclick = () => inviteMember(wsId);
  openModal("invite-modal");
  setTimeout(() => document.getElementById("invite-email").focus(), 100);
}

async function inviteMember(wsId) {
  const email = document.getElementById("invite-email").value.trim().toLowerCase();
  if (!email) { showError("invite-error", "Enter an email address."); return; }
  if (!/^[a-zA-Z0-9._%+\-]+@gmail\.com$/.test(email)) { showError("invite-error", "Only @gmail.com addresses are allowed."); return; }

  // ── Cek batas member per plan (berdasarkan plan owner workspace) ──
  const ws = workspaces.find(w => w.id === wsId);
  const wsOwnerId = ws?.workspace_members?.find(m => m.role === "owner")?.user_id || currentUser.id;
  const { data: ownerSub } = await _sb.from("subscriptions")
    .select("plan").eq("user_id", wsOwnerId).maybeSingle();
  const ownerPlan = ownerSub?.plan || "free";
  const ownerLim  = PLAN_LIMITS[ownerPlan] || PLAN_LIMITS.free;

  if (ownerLim.maxMembers <= 0) {
    showError("invite-error",
      `The ${ownerPlan} plan does not allow adding members. ` +
      (wsOwnerId === currentUser.id ? "Upgrade to Plus or higher." : "Workspace owner needs to upgrade.")
    );
    return;
  }
  // Hitung member yang sudah ada (tidak termasuk owner)
  const currentMemberCount = (ws?.workspace_members?.length || 1) - 1; // exclude owner
  if (currentMemberCount >= ownerLim.maxMembers) {
    const limLabel = ownerLim.maxMembers;
    showError("invite-error",
      `The ${ownerPlan} plan can only add ${limLabel} member(s) per workspace. ` +
      (wsOwnerId === currentUser.id ? "Upgrade to add more." : "Workspace owner needs to upgrade.")
    );
    return;
  }

  const btn = document.getElementById("invite-save-btn");
  btn.disabled = true; btn.textContent = "Adding…";

  // Look up user by email via auth.users through profiles (email stored in auth)
  const { data: authUser, error: ae } = await _sb.rpc("get_user_id_by_email", { email_input: email });
  let userId = authUser || null;
  let fullName = email;

  if (!userId) {
    // Fallback: try profiles table if email column exists
    const { data: profile, error: pe } = await _sb.from("profiles").select("id,full_name,email").eq("email", email).maybeSingle();
    if (profile) { userId = profile.id; fullName = profile.full_name || email; }
  } else {
    const { data: profile } = await _sb.from("profiles").select("full_name").eq("id", userId).maybeSingle();
    if (profile?.full_name) fullName = profile.full_name;
  }

  if (!userId) { showError("invite-error", "No account found with that email address."); btn.disabled = false; btn.textContent = "Add member"; return; }
  if (userId === currentUser.id) { showError("invite-error", "You cannot add yourself."); btn.disabled = false; btn.textContent = "Add member"; return; }

  const { error } = await _sb.from("workspace_members").insert({ workspace_id: wsId, user_id: userId, role: "member" });
  btn.disabled = false; btn.textContent = "Add member";
  if (error?.code === "23505") { showError("invite-error", "This user is already a member."); return; }
  if (error) { showError("invite-error", error.message); return; }
  closeModal("invite-modal");
  toast(`${fullName} added as member`);
  openWorkspace(wsId);
}

// ── Form CRUD ─────────────────────────────────────────────────
function openNewFormModal(wsId) {
  document.getElementById("form-title").value = "";
  showError("form-modal-error", "");
  document.getElementById("form-save-btn").onclick = () => createForm(wsId);
  openModal("form-modal");
  setTimeout(() => document.getElementById("form-title").focus(), 100);
}

async function createForm(wsId) {
  const title = document.getElementById("form-title").value.trim();
  if (!title) { showError("form-modal-error", "Form title is required."); return; }

  // ── Cek batas form per plan (total form di semua workspace milik owner workspace ini) ──
  // Cari owner workspace aktif
  const ws = workspaces.find(w => w.id === wsId);
  const wsOwnerId = ws?.workspace_members?.find(m => m.role === "owner")?.user_id || currentUser.id;
  // Ambil semua form milik owner workspace ini
  const { data: ownerForms } = await _sb
    .from("forms")
    .select("id", { count: "exact", head: true })
    .in("workspace_id",
      workspaces
        .filter(w => w.workspace_members?.some(m => m.user_id === wsOwnerId && m.role === "owner"))
        .map(w => w.id)
    );
  // Ambil plan owner workspace
  const { data: ownerSub } = await _sb.from("subscriptions")
    .select("plan").eq("user_id", wsOwnerId).maybeSingle();
  const ownerPlan = ownerSub?.plan || "free";
  const ownerLim  = PLAN_LIMITS[ownerPlan] || PLAN_LIMITS.free;

  // Count total forms owned
  const { count: formCount } = await _sb
    .from("forms")
    .select("id", { count: "exact", head: true })
    .in("workspace_id",
      workspaces
        .filter(w => w.workspace_members?.some(m => m.user_id === wsOwnerId && m.role === "owner"))
        .map(w => w.id)
    );
  if (formCount !== null && formCount >= ownerLim.maxForms) {
    const limLabel = ownerLim.maxForms === Infinity ? "unlimited" : ownerLim.maxForms;
    showError("form-modal-error",
      `The ${ownerPlan} plan can only create ${limLabel} form(s). ` +
      (wsOwnerId === currentUser.id ? "Upgrade to add more." : "Workspace owner needs to upgrade.")
    );
    return;
  }

  const btn = document.getElementById("form-save-btn");
  btn.disabled = true; btn.textContent = "Creating…";
  const { data, error } = await _sb.from("forms").insert({
    workspace_id: wsId, created_by: currentUser.id,
    title, short_id: "", questions: [], settings: {}
  }).select().single();
  btn.disabled = false; btn.textContent = "Create form";
  if (error) { showError("form-modal-error", error.message); return; }
  closeModal("form-modal");
  window.location.href = `../builder.html?form=${data.id}`;
}

async function duplicateForm(formId, wsId) {
  const { data: orig } = await _sb.from("forms").select("*").eq("id", formId).single();
  if (!orig) return;
  const { error } = await _sb.from("forms").insert({
    workspace_id: wsId, created_by: currentUser.id,
    title: orig.title + " (copy)", short_id: "",
    questions: orig.questions, settings: orig.settings
  });
  if (error) { toast("Failed to duplicate", "error"); return; }
  toast("Form duplicated");
  openWorkspace(wsId);
}

function openRenameModal(formId, currentTitle) {
  document.getElementById("rename-input").value = currentTitle;
  document.getElementById("rename-save-btn").onclick = () => renameForm(formId);
  openModal("rename-modal");
  setTimeout(() => { const i = document.getElementById("rename-input"); i.focus(); i.select(); }, 100);
}

async function renameForm(formId) {
  const title = document.getElementById("rename-input").value.trim();
  if (!title) return;
  await _sb.from("forms").update({ title }).eq("id", formId);
  closeModal("rename-modal");
  toast("Form renamed");
  openWorkspace(activeWsId);
}

function openDeleteForm(formId, title) {
  openConfirm(`Delete "${title}"?`, "All responses will be permanently deleted. This cannot be undone.", async () => {
    const { error } = await _sb.rpc("delete_form_with_cleanup", {
      p_form_id: formId,
    });
    if (error) { toast("Failed to delete form", "error"); return; }
    toast("Form deleted");
    openWorkspace(activeWsId);
  });
}

// ── Share modal ───────────────────────────────────────────────
function openShareModal(url) {
  document.getElementById("share-link").value = url;
  document.getElementById("share-embed").value = `<iframe src="${url}?embed=1" width="100%" height="600" frameborder="0"></iframe>`;
  document.getElementById("share-copy-btn").onclick = () => { navigator.clipboard.writeText(url); toast("Link copied"); };
  document.getElementById("embed-copy-btn").onclick = () => { navigator.clipboard.writeText(document.getElementById("share-embed").value); toast("Embed code copied"); };
  openModal("share-modal");
}

// ── Responses view ────────────────────────────────────────────
let _responsesChannel = null;
async function openResponses(formId) {
  if (_responsesChannel) { _sb.removeChannel(_responsesChannel); _responsesChannel = null; }
  const [{ data: form }, { data: responses }] = await Promise.all([
    _sb.from("forms").select("title, questions").eq("id", formId).single(),
    _sb.from("responses").select("*").eq("form_id", formId).order("submitted_at", { ascending: false })
  ]);
  const questions = form?.questions || [];
  const main = document.getElementById("main-content");
  main.innerHTML = `
    <div class="dash-header" style="justify-content:flex-start">
      <div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1">
        <button class="btn-icon" id="back-from-resp" style="flex-shrink:0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div style="min-width:0"><h2 style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Responses · ${esc(form?.title || "Form")}</h2><p>${responses?.length || 0} submissions</p></div>
      </div>
      ${responses?.length ? `<div id="resp-actions" style="display:none;gap:6px;flex-shrink:0;align-items:center">
        <button class="btn-icon resp-delete-btn" id="delete-resp-btn" title="Delete selected responses" style="color:var(--red);width:32px;height:32px;border:1px solid var(--red);border-radius:var(--radius);flex-shrink:0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
        <button class="btn-icon" id="export-csv-btn" title="Download CSV" style="width:32px;height:32px;border:1px solid var(--border);border-radius:var(--radius);flex-shrink:0;color:var(--text-soft)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
      </div>` : ""}
    </div>
    <div class="dash-body">
      ${!responses?.length ? `<div class="empty-state"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><h4>No responses yet</h4><p>Responses will appear here after someone submits the form.</p></div>` :
      `<div class="resp-table-wrap"><table class="resp-table">
        <thead><tr>
          <th style="width:36px"><input type="checkbox" id="resp-select-all" /></th>
          <th>#</th>
          ${questions.map(q => `<th>${esc(q.title || q.type)}</th>`).join("")}
          <th>Sent to</th><th>Time</th>
        </tr></thead>
        <tbody>
          ${responses.map((r, i) => `<tr>
            <td><input type="checkbox" class="resp-select-row" data-idx="${i}" /></td>
            <td style="color:var(--text-muted)">${i+1}</td>
            ${questions.map(q => `<td>${renderAnswerCell(q, r.answers?.[q.id])}</td>`).join("")}
            <td>${r.sent_to === "wa" ? '<span class="pill pill-wa">WA</span>' : r.sent_to === "tg" ? '<span class="pill pill-tg">TG</span>' : r.sent_to === "both" ? '<span class="pill pill-wa">WA</span><span class="pill pill-tg">TG</span>' : "-"}</td>
            <td style="color:var(--text-muted);white-space:nowrap">${new Date(r.submitted_at).toLocaleString()}</td>
          </tr>`).join("")}
        </tbody>
      </table></div>`}
    </div>
  `;
  document.getElementById("back-from-resp").addEventListener("click", () => {
    if (_responsesChannel) { _sb.removeChannel(_responsesChannel); _responsesChannel = null; }
    openWorkspace(activeWsId);
  });

  if (responses?.length) {
    const selectAll = document.getElementById("resp-select-all");
    const actions   = document.getElementById("resp-actions");
    const exportBtn = document.getElementById("export-csv-btn");
    const deleteBtn = document.getElementById("delete-resp-btn");
    const rowChecks = () => Array.from(document.querySelectorAll(".resp-select-row"));

    function refreshActionState() {
      const checked = rowChecks().filter(c => c.checked);
      actions.style.display = checked.length ? "flex" : "none";
    }

    selectAll.addEventListener("change", () => {
      rowChecks().forEach(c => c.checked = selectAll.checked);
      refreshActionState();
    });

    rowChecks().forEach(c => c.addEventListener("change", () => {
      const all = rowChecks();
      selectAll.checked = all.length > 0 && all.every(x => x.checked);
      selectAll.indeterminate = all.some(x => x.checked) && !selectAll.checked;
      refreshActionState();
    }));

    exportBtn.addEventListener("click", () => {
      const selectedIdx = rowChecks().filter(c => c.checked).map(c => Number(c.dataset.idx));
      const rows = selectedIdx.map(i => responses[i]);
      exportResponsesToCsv(rows, questions, form?.title || "responses");
    });

    deleteBtn.addEventListener("click", () => {
      const selectedIdx = rowChecks().filter(c => c.checked).map(c => Number(c.dataset.idx));
      const count = selectedIdx.length;
      if (!count) return;
      openConfirm(
        "Delete responses",
        `Delete ${count} selected response${count > 1 ? "s" : ""}? This cannot be undone.`,
        async () => {
          const ids = selectedIdx.map(i => responses[i].id);
          let deleteError = null;
          for (const id of ids) {
            const { error } = await _sb.rpc("delete_response_with_cleanup", { p_response_id: id });
            if (error) { deleteError = error; break; }
          }
          if (deleteError) { toast("Failed to delete", "error"); return; }
          toast(`${count} response${count > 1 ? "s" : ""} deleted`);
          openResponses(formId);
        },
        "Delete"
      );
    });
  }

  // ── Realtime: auto-refresh tabel saat ada submission baru atau update jawaban (file link) ──
  _responsesChannel = _sb
    .channel('responses-' + formId)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'responses', filter: 'form_id=eq.' + formId }, () => openResponses(formId))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'responses', filter: 'form_id=eq.' + formId }, () => openResponses(formId))
    .subscribe();
}

// ── CSV export ────────────────────────────────────────────────
function csvEscape(val) {
  const s = String(val ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildCsv(rows, questions) {
  const headers = ["#", ...questions.map(q => q.title || q.type), "Sent to", "Time"];
  const lines = [headers.map(csvEscape).join(",")];
  rows.forEach((r, i) => {
    const sentTo = r.sent_to === "wa" ? "WA" : r.sent_to === "tg" ? "TG" : r.sent_to === "both" ? "WA, TG" : "-";
    const cols = [
      i + 1,
      ...questions.map(q => r.answers?.[q.id] ?? ""),
      sentTo,
      new Date(r.submitted_at).toLocaleString(),
    ];
    lines.push(cols.map(csvEscape).join(","));
  });
  return lines.join("\r\n");
}

function exportResponsesToCsv(rows, questions, formTitle) {
  const csv = "\uFEFF" + buildCsv(rows, questions);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${formTitle.replace(/[^a-z0-9]+/gi, "_").toLowerCase() || "responses"}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ── Confirm modal ─────────────────────────────────────────────
function openConfirm(title, body, onOk, okLabel) {
  document.getElementById("confirm-title").textContent = title;
  document.getElementById("confirm-body").textContent = body;
  const okBtn = document.getElementById("confirm-ok-btn");
  okBtn.textContent = okLabel || "Delete";
  okBtn.className = "btn btn-danger btn-sm";
  okBtn.onclick = () => { closeModal("confirm-modal"); onOk(); };
  openModal("confirm-modal");
}

// ── User menu ──────────────────────────────────────────────────
document.getElementById("user-btn").addEventListener("click", e => {
  e.stopPropagation();
  document.getElementById("user-menu").classList.toggle("open");
});
document.addEventListener("click", () => {
  document.querySelectorAll(".dropdown-menu.open").forEach(m => m.classList.remove("open"));
});
document.getElementById("logout-btn").addEventListener("click", async () => {
  await _sb.auth.signOut();
  window.location.href = "../login.html";
});

// ── Helpers ───────────────────────────────────────────────────
function esc(str) {
  return String(str).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
}

// Render a response cell: file_upload answers become anchor links with the original filename
function renderAnswerCell(q, val) {
  const s = String(val ?? "");
  if (q.type === "file_upload" && s.includes("||https://wateform.my.id/storage/")) {
    const sep      = s.indexOf("||");
    const fileName = s.slice(0, sep);
    const fileUrl  = s.slice(sep + 2);
    const safeName = esc(fileName);
    const safeUrl  = esc(fileUrl);
    return '<a href="' + safeUrl + '" target="_blank" rel="noopener" '
         + 'style="color:var(--teal);text-decoration:underline;white-space:nowrap;display:inline-flex;align-items:center;gap:4px" '
         + 'title="' + safeName + '">'
         + '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">'
         + '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>'
         + '<polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>'
         + '</svg>' + safeName + '</a>';
  }
  // Fallback: plain old storage URL (legacy) or non-file answer
  if (q.type === "file_upload" && s.startsWith("https://wateform.my.id/storage/")) {
    const safeUrl = esc(s);
    return '<a href="' + safeUrl + '" target="_blank" rel="noopener" '
         + 'style="color:var(--teal);text-decoration:underline">'
         + 'Download file</a>';
  }
  return esc(s);
}



// ── Enter key support for modals ──────────────────────────────
(function initEnterKey() {
  // ws-modal: Enter → click ws-save-btn
  document.getElementById("ws-name")?.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); document.getElementById("ws-save-btn")?.click(); }
  });
  document.getElementById("ws-desc")?.addEventListener("keydown", e => {
    if (e.key === "Enter" && e.ctrlKey) { e.preventDefault(); document.getElementById("ws-save-btn")?.click(); }
  });

  // invite-modal: Enter → click invite-save-btn
  document.getElementById("invite-email")?.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); document.getElementById("invite-save-btn")?.click(); }
  });

  // form-modal: Enter → click form-save-btn
  document.getElementById("form-title")?.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); document.getElementById("form-save-btn")?.click(); }
  });

  // rename-modal: Enter → click rename-save-btn
  document.getElementById("rename-input")?.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); document.getElementById("rename-save-btn")?.click(); }
  });

  // confirm-modal: Enter → click confirm-ok-btn
  document.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      const confirmModal = document.getElementById("confirm-modal");
      if (confirmModal?.classList.contains("open")) {
        e.preventDefault();
        document.getElementById("confirm-ok-btn")?.click();
      }
    }
    if (e.key === "Escape") {
      const openModal = document.querySelector(".modal-backdrop.open");
      if (openModal) { openModal.classList.remove("open"); }
    }
  });
})();

// ── Boot ──────────────────────────────────────────────────────
init();