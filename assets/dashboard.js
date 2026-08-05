// ── CONFIG ───────────────────────────────────────────────────
const SUPABASE_URL      = "https://zaaqlfxtymuafalkeftd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphYXFsZnh0eW11YWZhbGtlZnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4Nzg2NjMsImV4cCI6MjEwMTQ1NDY2M30.NKBBX7Qcb4T22tvAjjAzh4Scmbt-bJN1kb1ADBr6Bro";
const BASE_URL = window.location.origin;

const _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── State ─────────────────────────────────────────────────────
let currentUser    = null;
let currentProfile = null;
let workspaces     = [];
let activeWsId     = null;
let pendingAction  = null; // for confirm modal

// ── Theme ─────────────────────────────────────────────────────
(function initTheme() {
  const root = document.documentElement;
  const btns = document.querySelectorAll("[data-theme-toggle]");
  function set(t) {
    t === "dark" ? root.setAttribute("data-theme","dark") : root.removeAttribute("data-theme");
    btns.forEach(b => b.setAttribute("aria-pressed", String(t==="dark")));
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

// ── Init ──────────────────────────────────────────────────────
async function init() {
  const { data: { session } } = await _sb.auth.getSession();
  if (!session) { window.location.href = "login.html"; return; }
  currentUser = session.user;

  const { data: profile } = await _sb.from("profiles").select("*").eq("id", currentUser.id).single();
  currentProfile = profile;

  // Render user info
  const initials = (profile?.full_name || "?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  document.getElementById("user-avatar").textContent = initials;
  document.getElementById("user-name").textContent   = profile?.full_name || "User";
  document.getElementById("user-handle").textContent = "@" + (profile?.username || "");

  await loadWorkspaces();
  renderHome();
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
  renderSidebar();
}

// ── Sidebar ───────────────────────────────────────────────────
function renderSidebar() {
  const list = document.getElementById("ws-list");
  list.innerHTML = "";
  workspaces.forEach(ws => {
    const btn = document.createElement("button");
    btn.className = "sidebar-item" + (ws.id === activeWsId ? " active" : "");
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
      <span class="sidebar-ws-name">${esc(ws.name)}</span>
    `;
    btn.addEventListener("click", () => openWorkspace(ws.id));
    list.appendChild(btn);
  });
}

// ── Home view (all workspaces) ────────────────────────────────
function renderHome() {
  activeWsId = null;
  renderSidebar();
  document.getElementById("topbar-ws-name").textContent = "Dashboard";
  const main = document.getElementById("main-content");
  main.innerHTML = `
    <div class="dash-header">
      <div>
        <h2>Your workspaces</h2>
        <p>Each workspace groups forms and members together.</p>
      </div>
      <button class="btn btn-solid btn-sm" id="create-ws-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        New workspace
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
        <span class="role-badge ${myRole === 'owner' ? 'role-owner' : 'role-member'}">${myRole}</span>
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
    card.addEventListener("click", () => openWorkspace(ws.id));
    grid.appendChild(card);
  });
}

// ── Workspace view ────────────────────────────────────────────
async function openWorkspace(wsId) {
  activeWsId = wsId;
  renderSidebar();
  const ws = workspaces.find(w => w.id === wsId);
  if (!ws) return;
  document.getElementById("topbar-ws-name").textContent = ws.name;

  const [{ data: forms }, { data: members }] = await Promise.all([
    _sb.from("forms").select("*").eq("workspace_id", wsId).order("created_at", { ascending: false }),
    _sb.from("workspace_members").select("*, profiles(full_name, username)").eq("workspace_id", wsId)
  ]);

  const myRole = members?.find(m => m.user_id === currentUser.id)?.role || "member";
  const isOwner = myRole === "owner";
  const createdDate = new Date(ws.created_at).toLocaleDateString(undefined, { year:"numeric", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit"});

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
          <p>Created ${createdDate}${ws.description ? " · " + esc(ws.description) : ""}</p>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        ${isOwner ? `<button class="btn btn-ghost btn-sm" id="ws-settings-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          Settings
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

      <!-- Members -->
      <div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <h3 style="font-size:15px;font-weight:700;margin:0">Members</h3>
          ${isOwner ? `<button class="btn btn-ghost btn-sm" id="invite-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>
            Invite
          </button>` : ""}
        </div>
        <div id="member-list" style="background:var(--bg-raised);border:1px solid var(--border);border-radius:var(--radius-lg);padding:0 16px"></div>
      </div>
    </div>
  `;

  document.getElementById("back-btn").addEventListener("click", () => { loadWorkspaces().then(renderHome); });
  document.getElementById("new-form-btn").addEventListener("click", () => openNewFormModal(wsId));
  document.getElementById("ws-settings-btn")?.addEventListener("click", () => openEditWsModal(ws));
  document.getElementById("invite-btn")?.addEventListener("click", () => openInviteModal(wsId));

  renderFormList(forms || [], wsId, isOwner);
  renderMemberList(members || [], wsId, isOwner);
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
    const url = `${BASE_URL}/${workspaces.find(w=>w.id===wsId)?.short_id}/${form.short_id}`;
    const target = form.settings?.target;
    const pillHtml = target === "wa" ? `<span class="pill pill-wa">WhatsApp</span>` :
                     target === "tg" ? `<span class="pill pill-tg">Telegram</span>` :
                     target === "both" ? `<span class="pill pill-wa">WA</span><span class="pill pill-tg">TG</span>` : "";
    const row = document.createElement("div");
    row.className = "form-row";
    row.innerHTML = `
      <div class="form-row-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>
      </div>
      <div class="form-row-info">
        <div class="form-row-name">${esc(form.title)}</div>
        <div class="form-row-meta">${url}</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        ${pillHtml}
        ${form.is_published ? `<span class="pill" style="background:rgba(43,189,164,.12);color:var(--teal-deep)">Published</span>` : `<span class="pill" style="background:var(--bg-mid);color:var(--text-muted)">Draft</span>`}
      </div>
      <div class="form-row-actions">
        <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${form.id}" data-ws="${wsId}">Edit</button>
        <div class="dropdown">
          <button class="btn-icon" data-action="menu-toggle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
          </button>
          <div class="dropdown-menu">
            <button class="dropdown-item" data-action="responses" data-id="${form.id}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              View responses
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
    list.appendChild(row);
  });

  // Event delegation
  list.addEventListener("click", e => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    const id     = btn.dataset.id;

    // Toggle dropdown menu
    if (action === "menu-toggle") {
      const menu = btn.closest(".dropdown").querySelector(".dropdown-menu");
      document.querySelectorAll(".dropdown-menu.open").forEach(m => { if (m !== menu) m.classList.remove("open"); });
      menu.classList.toggle("open");
      e.stopPropagation();
      return;
    }

    if (action === "edit")       { window.location.href = `builder.html?form=${id}`; return; }
    if (action === "responses")  { openResponses(id); return; }
    if (action === "share")      { openShareModal(btn.dataset.url); return; }
    if (action === "duplicate")  { duplicateForm(id, btn.dataset.ws); return; }
    if (action === "rename")     { openRenameModal(id, btn.dataset.title); return; }
    if (action === "delete")     { openDeleteForm(id, btn.dataset.title); return; }
  });
}

function renderMemberList(members, wsId, isOwner) {
  const list = document.getElementById("member-list");
  list.innerHTML = "";
  members.forEach(m => {
    const row = document.createElement("div");
    row.className = "member-row";
    const initials = (m.profiles?.full_name || "?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
    row.innerHTML = `
      <div class="avatar">${initials}</div>
      <div class="member-info">
        <div class="member-name">${esc(m.profiles?.full_name || "Unknown")}</div>
        <div class="member-username">@${esc(m.profiles?.username || "")}</div>
      </div>
      <span class="role-badge ${m.role === 'owner' ? 'role-owner' : 'role-member'}">${m.role}</span>
      ${isOwner && m.role !== 'owner' ? `<button class="btn-icon danger-hover" data-remove="${m.user_id}" title="Remove member" style="color:var(--text-muted)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>` : ""}
    `;
    list.appendChild(row);
  });

  list.addEventListener("click", async e => {
    const btn = e.target.closest("[data-remove]");
    if (!btn) return;
    const uid = btn.dataset.remove;
    openConfirm("Remove member?", "This member will lose access to the workspace.", async () => {
      await _sb.from("workspace_members").delete().eq("workspace_id", wsId).eq("user_id", uid);
      openWorkspace(wsId);
      toast("Member removed");
    });
  });
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

// ── Invite member ─────────────────────────────────────────────
function openInviteModal(wsId) {
  document.getElementById("invite-username").value = "";
  showError("invite-error", "");
  document.getElementById("invite-save-btn").onclick = () => inviteMember(wsId);
  openModal("invite-modal");
  setTimeout(() => document.getElementById("invite-username").focus(), 100);
}

async function inviteMember(wsId) {
  const username = document.getElementById("invite-username").value.trim();
  if (!username) { showError("invite-error", "Enter a username."); return; }
  const btn = document.getElementById("invite-save-btn");
  btn.disabled = true; btn.textContent = "Inviting…";

  const { data: profile, error: pe } = await _sb.from("profiles").select("id,full_name").eq("username", username).single();
  if (pe || !profile) { showError("invite-error", "User not found."); btn.disabled = false; btn.textContent = "Invite"; return; }
  if (profile.id === currentUser.id) { showError("invite-error", "You are already the owner."); btn.disabled = false; btn.textContent = "Invite"; return; }

  const { error } = await _sb.from("workspace_members").insert({ workspace_id: wsId, user_id: profile.id, role: "member" });
  btn.disabled = false; btn.textContent = "Invite";
  if (error?.code === "23505") { showError("invite-error", "This user is already a member."); return; }
  if (error) { showError("invite-error", error.message); return; }
  closeModal("invite-modal");
  toast(`${profile.full_name} added as member`);
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
  const btn = document.getElementById("form-save-btn");
  btn.disabled = true; btn.textContent = "Creating…";
  const { data, error } = await _sb.from("forms").insert({
    workspace_id: wsId, created_by: currentUser.id,
    title, short_id: "", questions: [], settings: {}
  }).select().single();
  btn.disabled = false; btn.textContent = "Create form";
  if (error) { showError("form-modal-error", error.message); return; }
  closeModal("form-modal");
  window.location.href = `builder.html?form=${data.id}`;
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
    await _sb.from("forms").delete().eq("id", formId);
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
async function openResponses(formId) {
  const [{ data: form }, { data: responses }] = await Promise.all([
    _sb.from("forms").select("title, questions").eq("id", formId).single(),
    _sb.from("responses").select("*").eq("form_id", formId).order("submitted_at", { ascending: false })
  ]);
  const questions = form?.questions || [];
  const main = document.getElementById("main-content");
  main.innerHTML = `
    <div class="dash-header">
      <div style="display:flex;align-items:center;gap:10px">
        <button class="btn-icon" id="back-from-resp">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div><h2>Responses · ${esc(form?.title || "Form")}</h2><p>${responses?.length || 0} submissions</p></div>
      </div>
    </div>
    <div class="dash-body" style="overflow-x:auto">
      ${!responses?.length ? `<div class="empty-state"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><h4>No responses yet</h4><p>Responses will appear here after someone submits the form.</p></div>` :
      `<table class="resp-table">
        <thead><tr>
          <th>#</th>
          ${questions.map(q => `<th>${esc(q.title || q.type)}</th>`).join("")}
          <th>Sent to</th><th>Time</th>
        </tr></thead>
        <tbody>
          ${responses.map((r, i) => `<tr>
            <td style="color:var(--text-muted)">${i+1}</td>
            ${questions.map(q => `<td>${esc(String(r.answers?.[q.id] ?? ""))}</td>`).join("")}
            <td>${r.sent_to === "wa" ? '<span class="pill pill-wa">WA</span>' : r.sent_to === "tg" ? '<span class="pill pill-tg">TG</span>' : r.sent_to === "both" ? '<span class="pill pill-wa">WA</span><span class="pill pill-tg">TG</span>' : "-"}</td>
            <td style="color:var(--text-muted);white-space:nowrap">${new Date(r.submitted_at).toLocaleString()}</td>
          </tr>`).join("")}
        </tbody>
      </table>`}
    </div>
  `;
  document.getElementById("back-from-resp").addEventListener("click", () => openWorkspace(activeWsId));
}

// ── Confirm modal ─────────────────────────────────────────────
function openConfirm(title, body, onOk) {
  document.getElementById("confirm-title").textContent = title;
  document.getElementById("confirm-body").textContent = body;
  document.getElementById("confirm-ok-btn").onclick = () => { closeModal("confirm-modal"); onOk(); };
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
  window.location.href = "login.html";
});
document.getElementById("new-ws-btn").addEventListener("click", openNewWsModal);
document.getElementById("sidebar-home-btn").addEventListener("click", () => { loadWorkspaces().then(renderHome); });

// ── Helpers ───────────────────────────────────────────────────
function esc(str) {
  return String(str).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
}

// ── Boot ──────────────────────────────────────────────────────
init();
