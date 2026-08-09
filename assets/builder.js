// ── CONFIG ───────────────────────────────────────────────────
const SUPABASE_URL      = "https://zaaqlfxtymuafalkeftd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphYXFsZnh0eW11YWZhbGtlZnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4Nzg2NjMsImV4cCI6MjEwMTQ1NDY2M30.NKBBX7Qcb4T22tvAjjAzh4Scmbt-bJN1kb1ADBr6Bro";

const _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, storageKey: "wf-session", autoRefreshToken: true, detectSessionInUrl: false },
});

// ── State ─────────────────────────────────────────────────────
let currentUser = null;
let _form       = null;
let _fields     = [];      // working copy of form.questions
let _editingIdx = -1;      // index being edited (-1 = new)
let _pendingType = null;   // type chosen in qtype modal for new question
let _saveTimer  = null;
let _dirty      = false;

// ── Helpers ───────────────────────────────────────────────────
function esc(str) {
  return String(str ?? "").replace(/[&<>"']/g, c =>
    ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" })[c]);
}
function uid() {
  return "q_" + Math.random().toString(36).slice(2, 9);
}

// ── Theme ─────────────────────────────────────────────────────
(function initTheme() {
  const root = document.documentElement;
  function set(t) {
    t === "dark"
      ? root.setAttribute("data-theme","dark")
      : root.removeAttribute("data-theme");
    try { localStorage.setItem("wf-theme", t); } catch(_) {}
  }
  let saved; try { saved = localStorage.getItem("wf-theme"); } catch(_) {}
  set(saved === "dark" ? "dark" : "light");
})();

// ── Toast ─────────────────────────────────────────────────────
function toast(msg, type = "success") {
  const c = document.getElementById("toast-container");
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = msg;
  c.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 300); }, 3000);
}

// ── Modal helpers ─────────────────────────────────────────────
function openModal(id)  { document.getElementById(id)?.classList.add("open"); }
function closeModal(id) { document.getElementById(id)?.classList.remove("open"); }

document.querySelectorAll("[data-close]").forEach(btn =>
  btn.addEventListener("click", () => closeModal(btn.dataset.close))
);
document.querySelectorAll(".modal-backdrop").forEach(bd =>
  bd.addEventListener("click", e => { if (e.target === bd) bd.classList.remove("open"); })
);
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal-backdrop.open").forEach(m => m.classList.remove("open"));
  }
});

// ── Auth guard & boot ─────────────────────────────────────────
_sb.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
    window.location.replace("login.html");
  }
  if (event === "TOKEN_REFRESHED" && session) currentUser = session.user;
});

async function init() {
  let { data: { session } } = await _sb.auth.getSession();
  if (!session) {
    const { data: r } = await _sb.auth.refreshSession();
    session = r?.session ?? null;
  }
  if (!session) { window.location.replace("login.html"); return; }
  currentUser = session.user;

  const params = new URLSearchParams(location.search);
  const formId = params.get("form");
  if (!formId) { window.location.replace("dashboard/"); return; }

  const { data: form, error } = await _sb
    .from("forms")
    .select("*")
    .eq("id", formId)
    .single();

  if (error || !form) {
    toast("Form not found", "error");
    setTimeout(() => window.location.replace("dashboard/"), 1500);
    return;
  }

  _form   = form;
  _fields = Array.isArray(form.questions) ? JSON.parse(JSON.stringify(form.questions)) : [];

  // Render topbar title
  const titleEl = document.getElementById("topbar-form-title");
  if (titleEl) {
    titleEl.textContent = form.title || "Untitled Form";
    titleEl.contentEditable = "true";
    titleEl.spellcheck = false;
    titleEl.style.cursor = "text";
    titleEl.style.borderRadius = "6px";
    titleEl.style.padding = "2px 6px";
    titleEl.style.outline = "none";
    titleEl.addEventListener("focus", () => { titleEl.style.background = "var(--bg-mid)"; });
    titleEl.addEventListener("blur",  () => {
      titleEl.style.background = "";
      const newTitle = titleEl.textContent.trim() || "Untitled Form";
      titleEl.textContent = newTitle;
      if (_form.title !== newTitle) { _form.title = newTitle; markDirty(); }
    });
    titleEl.addEventListener("keydown", e => {
      if (e.key === "Enter") { e.preventDefault(); titleEl.blur(); }
    });
  }

  // Publish btn
  const pubBtn = document.getElementById("publish-btn");
  if (pubBtn) {
    updatePublishBtn();
    pubBtn.addEventListener("click", togglePublish);
  }

  // Preview btn
  document.getElementById("preview-btn")?.addEventListener("click", openPreview);

  // Settings panel
  document.getElementById("settings-toggle-btn")?.addEventListener("click", () => {
    const panel = document.getElementById("settings-panel");
    if (!panel) return;
    panel.classList.toggle("open");
    if (panel.classList.contains("open")) renderSettingsPanel();
  });
  document.getElementById("settings-close-btn")?.addEventListener("click", () => {
    document.getElementById("settings-panel")?.classList.remove("open");
  });

  // Add question button (empty state)
  document.getElementById("center-add-btn")?.addEventListener("click", openQtypeModal);

  // Edit modal save/cancel
  document.getElementById("edit-save-btn")?.addEventListener("click", saveEditModal);
  document.getElementById("edit-cancel-btn")?.addEventListener("click", () => closeModal("edit-modal"));

  renderBuilder();
}

// ── Save to Supabase ──────────────────────────────────────────
function markDirty() {
  _dirty = true;
  const ind = document.getElementById("save-indicator");
  if (ind) ind.textContent = "Unsaved changes";
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(saveForm, 1500);
}

async function saveForm() {
  if (!_form || !_dirty) return;
  _dirty = false;
  const ind = document.getElementById("save-indicator");
  if (ind) ind.textContent = "Saving…";

  const { error } = await _sb
    .from("forms")
    .update({ title: _form.title, questions: _fields, settings: _form.settings, updated_at: new Date().toISOString() })
    .eq("id", _form.id);

  if (error) {
    if (ind) ind.textContent = "Save failed";
    toast("Failed to save: " + error.message, "error");
  } else {
    if (ind) {
      ind.textContent = "Saved";
      setTimeout(() => { if (ind.textContent === "Saved") ind.textContent = ""; }, 2000);
    }
  }
}

// ── Publish ───────────────────────────────────────────────────
function updatePublishBtn() {
  const btn = document.getElementById("publish-btn");
  if (!btn || !_form) return;
  const pub = _form.is_published;
  btn.innerHTML = pub
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Unpublish`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg> Publish`;
  btn.style.background = pub ? "var(--bg-mid)" : "";
  btn.style.color = pub ? "var(--text)" : "";
  btn.style.borderColor = pub ? "var(--border)" : "";
}

async function togglePublish() {
  if (!_form) return;
  await saveForm(); // flush pending changes first
  const newPub = !_form.is_published;
  const { error } = await _sb
    .from("forms").update({ is_published: newPub }).eq("id", _form.id);
  if (error) { toast("Could not update publish status", "error"); return; }
  _form.is_published = newPub;
  updatePublishBtn();
  toast(newPub ? "Form published ✓" : "Form unpublished");
}

// ── Field type definitions ────────────────────────────────────
const FIELD_TYPES = {
  // Basic
  short_text:  { label: "Short Answer",    cat: "Basic",    icon: `<path d="M4 7h16M4 12h10"/>` },
  long_text:   { label: "Long Answer",     cat: "Basic",    icon: `<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>` },
  email:       { label: "Email",           cat: "Basic",    icon: `<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>` },
  phone:       { label: "Phone",           cat: "Basic",    icon: `<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 10a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.06 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z"/>` },
  number:      { label: "Number",          cat: "Basic",    icon: `<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>` },
  url:         { label: "Website / URL",   cat: "Basic",    icon: `<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>` },
  date:        { label: "Date",            cat: "Basic",    icon: `<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>` },
  // Choice
  choice:      { label: "Multiple Choice", cat: "Choice",   icon: `<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4" fill="currentColor"/>` },
  checkbox:    { label: "Checkboxes",      cat: "Choice",   icon: `<path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>` },
  dropdown:    { label: "Dropdown",        cat: "Choice",   icon: `<path d="M6 9l6 6 6-6"/><rect x="3" y="3" width="18" height="18" rx="2"/>` },
  multiselect: { label: "Multi-Select",    cat: "Choice",   icon: `<rect x="2" y="3" width="7" height="7" rx="1"/><rect x="2" y="14" width="7" height="7" rx="1"/><path d="M13 6h9M13 17h5"/>` },
  toggle:      { label: "Yes / No Toggle", cat: "Choice",   icon: `<rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="16" cy="12" r="4" fill="currentColor"/>` },
  // Rating
  rating:      { label: "Star Rating",     cat: "Rating",   icon: `<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>` },
  emoji_rating:{ label: "Emoji Rating",    cat: "Rating",   icon: `<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>` },
  nps_score:   { label: "NPS Score",       cat: "Rating",   icon: `<path d="M3 3v18h18"/><path d="m7 16 4-8 4 8"/>` },
  slider:      { label: "Slider",          cat: "Rating",   icon: `<line x1="2" y1="12" x2="22" y2="12"/><circle cx="10" cy="12" r="3" fill="currentColor"/>` },
  likert:      { label: "Likert Scale",    cat: "Rating",   icon: `<rect x="3" y="3" width="4" height="18"/><rect x="10" y="7" width="4" height="14"/><rect x="17" y="5" width="4" height="16"/>` },
  // Advanced
  matrix:      { label: "Matrix / Grid",   cat: "Advanced", icon: `<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>` },
  ranking:     { label: "Ranking",         cat: "Advanced", icon: `<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>` },
  multi_input: { label: "Multi-Input",     cat: "Advanced", icon: `<rect x="3" y="3" width="18" height="5" rx="1"/><rect x="3" y="10" width="18" height="5" rx="1"/><rect x="3" y="17" width="18" height="4" rx="1"/>` },
  file_upload: { label: "File Upload",     cat: "Advanced", icon: `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>` },
  map:         { label: "Location / Map",  cat: "Advanced", icon: `<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>` },
  color:       { label: "Color Picker",    cat: "Advanced", icon: `<circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12.5" r="2.5"/><path d="M12 22C6.5 22 2 17.5 2 12s4.5-10 10-10c.926 0 1.648.477 2.025 1.191A1.97 1.97 0 0 1 14 14a1.97 1.97 0 0 0-1.975.809C11.648 15.523 11 16.245 11 17c0 2.757 2.243 5 5 5a4.998 4.998 0 0 0 4.98-4.502C21.614 19.38 17.336 22 12 22z"/>` },
  // Layout
  title:       { label: "Section Title",   cat: "Layout",   icon: `<path d="M4 6h16M4 12h8M4 18h6"/>` },
  image:       { label: "Image",           cat: "Layout",   icon: `<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>` },
  video:       { label: "Video",           cat: "Layout",   icon: `<path d="m22 8-6 4 6 4V8z"/><rect x="2" y="6" width="14" height="12" rx="2"/>` },
  divider:     { label: "Divider",         cat: "Layout",   icon: `<line x1="3" y1="12" x2="21" y2="12"/>` },
  spacer:      { label: "Spacer",          cat: "Layout",   icon: `<path d="M12 3v18M5 6l7-3 7 3M5 18l7 3 7-3"/>` },
  button_link: { label: "Button / Link",   cat: "Layout",   icon: `<rect x="2" y="7" width="20" height="10" rx="5"/><path d="m9 12 2 2 4-4"/>` },
  page_break:  { label: "Page Break",      cat: "Layout",   icon: `<line x1="3" y1="12" x2="8" y2="12"/><line x1="16" y1="12" x2="21" y2="12"/><rect x="9" y="9" width="6" height="6" rx="1"/>` },
};

const CAT_ORDER = ["Basic","Choice","Rating","Advanced","Layout"];

// ── Render builder center ─────────────────────────────────────
function renderBuilder() {
  const center = document.getElementById("builder-center");
  if (!center) return;
  center.innerHTML = "";

  // Empty state
  if (_fields.length === 0) {
    const es = document.createElement("div");
    es.className = "empty-state";
    es.style.marginTop = "60px";
    es.innerHTML = `
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/>
      </svg>
      <h4>No questions yet</h4>
      <p>Click "Add question" to start building your form.</p>
      <button class="btn btn-solid btn-sm" id="center-add-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Add question
      </button>`;
    center.appendChild(es);
    document.getElementById("center-add-btn")?.addEventListener("click", openQtypeModal);
    return;
  }

  // Render question cards
  let qNum = 0;
  _fields.forEach((field, idx) => {
    const isLayout = ["title","image","video","divider","spacer","button_link","page_break"].includes(field.type);
    if (!isLayout) qNum++;
    const card = buildFieldCard(field, idx, isLayout ? null : qNum);
    center.appendChild(card);
  });

  // Bottom action buttons
  const bottom = document.createElement("div");
  bottom.className = "center-bottom-btns";
  bottom.innerHTML = `
    <button class="btn add-q-btn" id="bottom-add-btn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
        <path d="M12 5v14M5 12h14"/>
      </svg>
      Add question
    </button>
    <button class="btn add-q-btn center-add-pb-btn" id="bottom-pb-btn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
        <line x1="3" y1="12" x2="8" y2="12"/><line x1="16" y1="12" x2="21" y2="12"/>
        <rect x="9" y="9" width="6" height="6" rx="1"/>
      </svg>
      Add page break
    </button>`;
  center.appendChild(bottom);
  document.getElementById("bottom-add-btn")?.addEventListener("click", openQtypeModal);
  document.getElementById("bottom-pb-btn")?.addEventListener("click", addPageBreak);
}

function buildFieldCard(field, idx, qNum) {
  const def = FIELD_TYPES[field.type] || { label: field.type, icon: `<circle cx="12" cy="12" r="10"/>` };
  const isPb   = field.type === "page_break";
  const isLayout = ["title","image","video","divider","spacer","button_link","page_break"].includes(field.type);

  if (isPb) {
    const wrap = document.createElement("div");
    wrap.className = "page-break-card";
    wrap.dataset.idx = idx;
    wrap.innerHTML = `
      <div class="page-break-line"></div>
      <div class="page-break-label">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
          <line x1="3" y1="12" x2="8" y2="12"/><line x1="16" y1="12" x2="21" y2="12"/>
          <rect x="9" y="9" width="6" height="6" rx="1"/>
        </svg>
        Page Break
      </div>
      <div class="page-break-line"></div>
      <button class="page-break-del qcard-btn qcard-btn-danger" data-idx="${idx}" title="Remove page break">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
      </button>`;
    wrap.querySelector(".page-break-del").addEventListener("click", () => deleteField(idx));
    return wrap;
  }

  const card = document.createElement("div");
  card.className = "qcard";
  card.dataset.idx = idx;
  card.innerHTML = `
    <div class="qcard-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${def.icon}</svg>
    </div>
    <div class="qcard-info">
      <div class="qcard-type">${qNum ? `Q${qNum} · ` : ""}${def.label}</div>
      <div class="qcard-title">${esc(field.title || "(untitled)")}</div>
    </div>
    <div class="qcard-actions">
      <button class="qcard-btn" data-action="up" data-idx="${idx}" title="Move up" ${idx === 0 ? "disabled" : ""}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg>
      </button>
      <button class="qcard-btn" data-action="down" data-idx="${idx}" title="Move down" ${idx === _fields.length-1 ? "disabled" : ""}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      <button class="qcard-btn" data-action="edit" data-idx="${idx}" title="Edit">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="qcard-btn qcard-btn-danger" data-action="delete" data-idx="${idx}" title="Delete">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
      </button>
    </div>`;

  card.addEventListener("click", (e) => {
    const action = e.target.closest("[data-action]")?.dataset.action;
    const i = parseInt(e.target.closest("[data-action]")?.dataset.idx ?? idx);
    if (action === "edit")   openEditModal(i);
    else if (action === "up")    moveField(i, -1);
    else if (action === "down")  moveField(i,  1);
    else if (action === "delete") deleteField(i);
    else if (!action) openEditModal(idx); // click card body = open edit
  });

  return card;
}

// ── Field operations ──────────────────────────────────────────
function moveField(idx, dir) {
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= _fields.length) return;
  [_fields[idx], _fields[newIdx]] = [_fields[newIdx], _fields[idx]];
  markDirty();
  renderBuilder();
}

function deleteField(idx) {
  _fields.splice(idx, 1);
  markDirty();
  renderBuilder();
}

function addPageBreak() {
  _fields.push({ id: uid(), type: "page_break", title: "Page Break" });
  markDirty();
  renderBuilder();
}

// ── Question type picker modal ────────────────────────────────
function openQtypeModal() {
  const grid = document.getElementById("qtype-grid");
  if (!grid) return;
  grid.innerHTML = "";

  const bycat = {};
  Object.entries(FIELD_TYPES).forEach(([type, def]) => {
    if (!bycat[def.cat]) bycat[def.cat] = [];
    bycat[def.cat].push({ type, ...def });
  });

  CAT_ORDER.forEach(cat => {
    if (!bycat[cat]) return;
    const section = document.createElement("div");
    section.innerHTML = `<div class="qtype-section-title">${cat}</div><div class="qtype-grid" id="cat-${cat}"></div>`;
    grid.appendChild(section);

    const catGrid = section.querySelector(`#cat-${cat}`);
    bycat[cat].forEach(({ type, label, icon }) => {
      const btn = document.createElement("button");
      btn.className = "qtype-btn";
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${icon}</svg>
        <span>${label}</span>`;
      btn.addEventListener("click", () => {
        closeModal("qtype-modal");
        _pendingType = type;
        _editingIdx  = -1;
        openEditModal(-1, type);
      });
      catGrid.appendChild(btn);
    });
  });

  openModal("qtype-modal");
}

// ── Edit modal ────────────────────────────────────────────────
function openEditModal(idx, forceType) {
  _editingIdx = idx;
  const isNew = idx === -1;
  const type  = forceType || (isNew ? _pendingType : _fields[idx]?.type);
  const field = isNew
    ? { id: uid(), type, title: "", description: "", required: false }
    : JSON.parse(JSON.stringify(_fields[idx]));

  const def = FIELD_TYPES[type] || { label: type, icon: `<circle cx="12" cy="12" r="10"/>` };

  // Header
  const iconEl = document.getElementById("edit-modal-icon");
  if (iconEl) iconEl.innerHTML = def.icon;
  const typeEl = document.getElementById("edit-modal-type");
  if (typeEl) typeEl.textContent = def.label;
  const qnumEl = document.getElementById("edit-modal-qnum");
  if (qnumEl) qnumEl.textContent = isNew ? "New" : `#${idx + 1}`;

  // Body
  const body = document.getElementById("edit-modal-body");
  if (!body) return;
  body.innerHTML = buildEditorBody(type, field);

  // Wire up dynamic parts after injecting HTML
  wireEditorDynamics(type, field, body);

  openModal("edit-modal");

  // Focus title
  const titleInput = body.querySelector("[data-field='title']");
  if (titleInput) setTimeout(() => titleInput.focus(), 50);

  // Store reference so save can read
  body.dataset.fieldId   = field.id;
  body.dataset.fieldType = type;
}

function fieldRow(label, inputHtml, hint) {
  return `<div style="display:flex;flex-direction:column;gap:4px">
    <label style="font-size:12px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em">${label}</label>
    ${inputHtml}
    ${hint ? `<span style="font-size:11.5px;color:var(--text-muted)">${hint}</span>` : ""}
  </div>`;
}

function styledInput(attrs, val) {
  return `<input ${attrs} value="${esc(val ?? "")}" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-raised);color:var(--text);font-size:13.5px;outline:none;font-family:inherit">`;
}

function styledTextarea(attrs, val) {
  return `<textarea ${attrs} rows="3" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-raised);color:var(--text);font-size:13.5px;outline:none;font-family:inherit;resize:vertical">${esc(val ?? "")}</textarea>`;
}

function toggleRow(label, name, checked) {
  const id = "tog-" + Math.random().toString(36).slice(2,7);
  return `<div class="toggle-row">
    <span class="toggle-label">${label}</span>
    <label class="toggle">
      <input type="checkbox" id="${id}" data-field="${name}" ${checked ? "checked" : ""}>
      <span class="toggle-track"></span>
    </label>
  </div>`;
}

function commonFields(field, withRequired = true, withPlaceholder = false) {
  return `
    ${fieldRow("Question", styledInput(`data-field="title" placeholder="Question text…"`, field.title))}
    ${fieldRow("Description", styledTextarea(`data-field="description" placeholder="Optional help text…"`, field.description))}
    ${withPlaceholder ? fieldRow("Placeholder", styledInput(`data-field="placeholder" placeholder="Placeholder text…"`, field.placeholder)) : ""}
    ${withRequired ? toggleRow("Required", "required", field.required) : ""}`;
}

function optionsList(options = []) {
  if (!options.length) options = ["Option 1", "Option 2"];
  return `<div data-choices-container style="display:flex;flex-direction:column;gap:6px">
    ${options.map((opt, i) => optionRow(opt, i)).join("")}
  </div>
  <button class="add-option-btn" data-add-option>+ Add option</button>`;
}
function optionRow(val, i) {
  return `<div class="choice-opt-row" data-opt-row="${i}">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="color:var(--text-muted);flex-shrink:0"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
    <input type="text" class="choice-opt-input" value="${esc(val)}"
      style="flex:1;padding:7px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-raised);color:var(--text);font-size:13px;outline:none;font-family:inherit">
    <button class="choice-remove" data-remove-opt title="Remove">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
    </button>
  </div>`;
}

function matrixRowsCols(rows = [], cols = []) {
  if (!rows.length) rows = ["Row 1","Row 2","Row 3"];
  if (!cols.length) cols = ["Column 1","Column 2","Column 3"];
  return `
    <div>
      <label style="font-size:12px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;display:block;margin-bottom:6px">Rows</label>
      <div data-matrix-rows style="display:flex;flex-direction:column;gap:4px">
        ${rows.map((r,i) => `<div style="display:flex;gap:6px;align-items:center"><input type="text" class="matrix-row-inp" value="${esc(r)}" style="flex:1;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-raised);color:var(--text);font-size:13px;outline:none;font-family:inherit"><button class="choice-remove" data-rm-row title="Remove"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>`).join("")}
      </div>
      <button class="add-option-btn" data-add-mrow style="margin-top:4px">+ Add row</button>
    </div>
    <div>
      <label style="font-size:12px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;display:block;margin-bottom:6px">Columns</label>
      <div data-matrix-cols style="display:flex;flex-direction:column;gap:4px">
        ${cols.map((c,i) => `<div style="display:flex;gap:6px;align-items:center"><input type="text" class="matrix-col-inp" value="${esc(c)}" style="flex:1;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-raised);color:var(--text);font-size:13px;outline:none;font-family:inherit"><button class="choice-remove" data-rm-col title="Remove"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>`).join("")}
      </div>
      <button class="add-option-btn" data-add-mcol style="margin-top:4px">+ Add column</button>
    </div>`;
}

function buildEditorBody(type, field) {
  const styledSelect = (name, val, options, style = "") =>
    `<select data-field="${name}" style="padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-raised);color:var(--text);font-size:13.5px;outline:none;font-family:inherit;${style}">
      ${options.map(([v,l]) => `<option value="${v}" ${val==v?"selected":""}>${l}</option>`).join("")}
    </select>`;

  switch (type) {

    // ── Basic text-input types ────────────────────────────────
    case "short_text":
    case "email":
    case "phone":
    case "number":
    case "url":
    case "password":
      return commonFields(field, true, true);

    case "long_text":
      return commonFields(field, true, true) +
        fieldRow("Min rows", styledInput(`data-field="minRows" type="number" min="2" max="20"`, field.minRows ?? 3));

    case "date":
      return commonFields(field) +
        fieldRow("Date format",
          styledSelect("dateFormat", field.dateFormat ?? "YYYY-MM-DD",
            [["YYYY-MM-DD","YYYY-MM-DD"],["DD/MM/YYYY","DD/MM/YYYY"],["MM/DD/YYYY","MM/DD/YYYY"]]));

    // ── Choice types ──────────────────────────────────────────
    case "choice":
    case "checkbox":
    case "dropdown":
    case "multiselect":
      return commonFields(field) +
        fieldRow("Options", optionsList(field.options));

    case "toggle":
      return commonFields(field, true, false) +
        fieldRow("On label",  styledInput(`data-field="onLabel"`,  field.onLabel  ?? "Yes")) +
        fieldRow("Off label", styledInput(`data-field="offLabel"`, field.offLabel ?? "No"));

    // ── Rating / Scale ────────────────────────────────────────
    case "rating":
      return commonFields(field) +
        fieldRow("Max stars",
          styledSelect("max", field.max ?? 5, [[3,"3"],[5,"5"],[7,"7"],[10,"10"]]));

    case "emoji_rating":
      return commonFields(field) +
        fieldRow("Emoji set",
          styledSelect("emojiSet", field.emojiSet ?? "faces",
            [["faces","😞 😕 😐 😊 😄"],["hearts","💔 🧡 💛 💚 💙"],["hands","👎 🤏 👍 🙌 🤩"],["custom","Custom"]]));

    case "nps_score":
      return commonFields(field) +
        fieldRow("Low label",  styledInput(`data-field="npsLow"`,  field.npsLow  ?? "Not at all likely")) +
        fieldRow("High label", styledInput(`data-field="npsHigh"`, field.npsHigh ?? "Extremely likely"));

    case "slider":
      return commonFields(field) +
        fieldRow("Min value",  styledInput(`data-field="min"  type="number"`, field.min  ?? 0)) +
        fieldRow("Max value",  styledInput(`data-field="max"  type="number"`, field.max  ?? 100)) +
        fieldRow("Step",       styledInput(`data-field="step" type="number" min="1"`, field.step ?? 1)) +
        toggleRow("Show current value", "showValue", field.showValue);

    case "likert":
      return commonFields(field) +
        fieldRow("Rows (statements)", optionsList(field.rows?.length ? field.rows : ["Statement 1","Statement 2","Statement 3"])) +
        `<hr>` +
        fieldRow("Column labels (scale)", optionsList(field.cols?.length ? field.cols : ["Strongly Disagree","Disagree","Neutral","Agree","Strongly Agree"]));

    // ── Advanced ──────────────────────────────────────────────
    case "matrix":
      return commonFields(field) +
        matrixRowsCols(field.rows, field.cols) +
        toggleRow("Allow multiple selections per row", "matrixAllowMultiple", field.matrixAllowMultiple);

    case "ranking":
      return commonFields(field) +
        fieldRow("Items to rank", optionsList(field.options?.length ? field.options : ["Item 1","Item 2","Item 3"]));

    case "multi_input": {
      const subFields = field.miFields?.length
        ? field.miFields
        : [{ label: "First name", type: "text", placeholder: "" }, { label: "Last name", type: "text", placeholder: "" }];
      return commonFields(field, true, false) +
        `<div>
          <label style="font-size:12px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;display:block;margin-bottom:8px">Sub-fields</label>
          <div data-mi-container style="display:flex;flex-direction:column;gap:6px">
            ${subFields.map((sf,i) => miSubFieldRow(sf, i)).join("")}
          </div>
          <button class="add-option-btn" data-add-mi style="margin-top:6px">+ Add sub-field</button>
        </div>`;
    }

    case "file_upload":
      return commonFields(field) +
        fieldRow("Accepted file types",
          styledInput(`data-field="accept" placeholder=".pdf,.png,.jpg (leave blank for any)"`, field.accept)) +
        fieldRow("Max file size",
          styledSelect("maxSizeMb", field.maxSizeMb ?? 5,
            [[1,"1 MB"],[2,"2 MB"],[5,"5 MB"],[10,"10 MB"],[20,"20 MB"],[50,"50 MB"]]));

    case "map":
      return commonFields(field) +
        fieldRow("Default latitude",  styledInput(`data-field="defaultLat"  type="number" step="any"`, field.defaultLat  ?? "")) +
        fieldRow("Default longitude", styledInput(`data-field="defaultLng"  type="number" step="any"`, field.defaultLng  ?? "")) +
        toggleRow("Show current location button", "showGps", field.showGps !== false);

    case "color":
      return commonFields(field) +
        fieldRow("Default color", styledInput(`data-field="defaultColor" type="color"`, field.defaultColor ?? "#2BBDA4"));

    // ── Layout ────────────────────────────────────────────────
    case "title":
      return fieldRow("Heading text", styledInput(`data-field="title" placeholder="Section heading…"`, field.title)) +
        fieldRow("Subtitle / description", styledTextarea(`data-field="description" placeholder="Optional subtitle…"`, field.description));

    case "image":
      return fieldRow("Image URL", styledInput(`data-field="url" placeholder="https://…"`, field.url)) +
        fieldRow("Caption", styledInput(`data-field="caption" placeholder="Optional caption"`, field.caption)) +
        fieldRow("Width", styledSelect("imgWidth", field.imgWidth ?? "full",
          [["full","Full width"],["large","Large (75%)"],["medium","Medium (50%)"],["small","Small (30%)"]]));

    case "video":
      return fieldRow("Video URL",
        styledInput(`data-field="url" placeholder="YouTube or Vimeo URL"`, field.url)) +
        `<span style="font-size:11.5px;color:var(--text-muted)">Paste a YouTube or Vimeo URL. The video will be embedded.</span>`;

    case "divider":
      return fieldRow("Style",
        styledSelect("divStyle", field.divStyle ?? "solid",
          [["solid","Solid line"],["dashed","Dashed line"],["dotted","Dotted line"]]));

    case "spacer":
      return fieldRow("Height (px)",
        styledInput(`data-field="height" type="number" min="8" max="200" step="4"`, field.height ?? 32));

    case "button_link":
      return fieldRow("Button label", styledInput(`data-field="title" placeholder="Click here"`, field.title)) +
        fieldRow("Link URL", styledInput(`data-field="url" placeholder="https://…"`, field.url)) +
        fieldRow("Style", styledSelect("btnStyle", field.btnStyle ?? "solid",
          [["solid","Solid"],["ghost","Outline"],["link","Link"]])) +
        toggleRow("Open in new tab", "newTab", field.newTab !== false);

    case "page_break":
      return fieldRow("Label (optional)", styledInput(`data-field="title" placeholder="Page 2"`, field.title));

    default:
      return commonFields(field, true, true);
  }
}

function miSubFieldRow(sf, i) {
  return `<div data-mi-row style="display:grid;grid-template-columns:1fr 100px auto;gap:6px;align-items:center">
    <input type="text" class="mi-label" placeholder="Label" value="${esc(sf.label||"")}"
      style="padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-raised);color:var(--text);font-size:13px;outline:none;font-family:inherit">
    <select class="mi-type" style="padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-raised);color:var(--text);font-size:13px;outline:none;font-family:inherit">
      <option value="text" ${sf.type==="text"?"selected":""}>Text</option>
      <option value="number" ${sf.type==="number"?"selected":""}>Number</option>
      <option value="email" ${sf.type==="email"?"selected":""}>Email</option>
      <option value="date" ${sf.type==="date"?"selected":""}>Date</option>
    </select>
    <button class="choice-remove" data-rm-mi title="Remove">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
    </button>
  </div>`;
}

// ── Wire dynamic modal interactions ──────────────────────────
function wireEditorDynamics(type, field, body) {
  // Generic: add/remove choice options
  body.querySelector("[data-add-option]")?.addEventListener("click", () => {
    const container = body.querySelector("[data-choices-container]");
    if (!container) return;
    const i = container.querySelectorAll("[data-opt-row]").length;
    container.insertAdjacentHTML("beforeend", optionRow(`Option ${i+1}`, i));
    wireRemoveOpts(container);
  });
  wireRemoveOpts(body.querySelector("[data-choices-container]"));

  // Matrix rows/cols
  body.querySelector("[data-add-mrow]")?.addEventListener("click", () => {
    const cont = body.querySelector("[data-matrix-rows]");
    const n = cont.querySelectorAll(".matrix-row-inp").length + 1;
    cont.insertAdjacentHTML("beforeend",
      `<div style="display:flex;gap:6px;align-items:center"><input type="text" class="matrix-row-inp" value="Row ${n}" style="flex:1;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-raised);color:var(--text);font-size:13px;outline:none;font-family:inherit"><button class="choice-remove" data-rm-row title="Remove"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>`);
    wireMatrixRemove(body);
  });
  body.querySelector("[data-add-mcol]")?.addEventListener("click", () => {
    const cont = body.querySelector("[data-matrix-cols]");
    const n = cont.querySelectorAll(".matrix-col-inp").length + 1;
    cont.insertAdjacentHTML("beforeend",
      `<div style="display:flex;gap:6px;align-items:center"><input type="text" class="matrix-col-inp" value="Column ${n}" style="flex:1;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-raised);color:var(--text);font-size:13px;outline:none;font-family:inherit"><button class="choice-remove" data-rm-col title="Remove"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>`);
    wireMatrixRemove(body);
  });
  wireMatrixRemove(body);

  // Multi-input sub-fields
  body.querySelector("[data-add-mi]")?.addEventListener("click", () => {
    const cont = body.querySelector("[data-mi-container]");
    const i = cont.querySelectorAll("[data-mi-row]").length;
    cont.insertAdjacentHTML("beforeend", miSubFieldRow({ label: "", type: "text" }, i));
    wireRemoveMi(body);
  });
  wireRemoveMi(body);
}

function wireRemoveOpts(container) {
  if (!container) return;
  container.querySelectorAll("[data-remove-opt]").forEach(btn => {
    btn.onclick = () => {
      if (container.querySelectorAll("[data-opt-row]").length > 1) btn.closest("[data-opt-row]").remove();
    };
  });
}

function wireMatrixRemove(body) {
  body.querySelectorAll("[data-rm-row]").forEach(btn => {
    btn.onclick = () => {
      const rows = body.querySelectorAll("[data-matrix-rows] [data-rm-row]");
      if (rows.length > 1) btn.closest("div").remove();
    };
  });
  body.querySelectorAll("[data-rm-col]").forEach(btn => {
    btn.onclick = () => {
      const cols = body.querySelectorAll("[data-matrix-cols] [data-rm-col]");
      if (cols.length > 1) btn.closest("div").remove();
    };
  });
}

function wireRemoveMi(body) {
  body.querySelectorAll("[data-rm-mi]").forEach(btn => {
    btn.onclick = () => {
      const rows = body.querySelectorAll("[data-mi-row]");
      if (rows.length > 1) btn.closest("[data-mi-row]").remove();
    };
  });
}

// ── Read editor modal values ──────────────────────────────────
function readEditModal() {
  const body = document.getElementById("edit-modal-body");
  if (!body) return null;
  const type  = body.dataset.fieldType;
  const id    = body.dataset.fieldId;

  // Collect all data-field attributes
  const data = { id, type };
  body.querySelectorAll("[data-field]").forEach(el => {
    const key = el.dataset.field;
    if (el.type === "checkbox") data[key] = el.checked;
    else data[key] = el.value;
  });

  // Numeric coercions
  ["max","min","step","minRows","height","defaultLat","defaultLng","maxSizeMb"].forEach(k => {
    if (data[k] !== undefined && data[k] !== "") data[k] = Number(data[k]);
  });

  // Choice options
  const optsCont = body.querySelector("[data-choices-container]");
  if (optsCont) {
    const isLikert = type === "likert";
    if (isLikert) {
      // likert reuses optionsList for rows & cols — tricky: we have TWO option lists separated by <hr>
      // We handle likert with matrix-style rows instead; see likert case below
    } else {
      data.options = [...optsCont.querySelectorAll(".choice-opt-input")].map(i => i.value).filter(Boolean);
    }
  }

  // Likert: two lists
  if (type === "likert") {
    const allContainers = [...body.querySelectorAll("[data-choices-container]")];
    if (allContainers.length >= 2) {
      data.rows = [...allContainers[0].querySelectorAll(".choice-opt-input")].map(i => i.value).filter(Boolean);
      data.cols = [...allContainers[1].querySelectorAll(".choice-opt-input")].map(i => i.value).filter(Boolean);
    }
  }

  // Matrix rows/cols
  if (type === "matrix") {
    data.rows = [...body.querySelectorAll(".matrix-row-inp")].map(i => i.value).filter(Boolean);
    data.cols = [...body.querySelectorAll(".matrix-col-inp")].map(i => i.value).filter(Boolean);
  }

  // Ranking & multi_input share optionsList for their items
  if (type === "ranking") {
    data.options = [...body.querySelectorAll(".choice-opt-input")].map(i => i.value).filter(Boolean);
  }

  // Multi-input sub-fields
  if (type === "multi_input") {
    data.miFields = [...body.querySelectorAll("[data-mi-row]")].map(row => ({
      label: row.querySelector(".mi-label")?.value || "",
      type:  row.querySelector(".mi-type")?.value  || "text",
    }));
  }

  return data;
}

function saveEditModal() {
  const data = readEditModal();
  if (!data) return;

  // Basic validation
  const needsTitle = !["divider","spacer"].includes(data.type);
  if (needsTitle && !data.title?.trim()) {
    toast("Please enter a question/label.", "error");
    const titleInput = document.getElementById("edit-modal-body")?.querySelector("[data-field='title']");
    titleInput?.focus();
    return;
  }

  if (_editingIdx === -1) {
    // New field
    _fields.push(data);
  } else {
    _fields[_editingIdx] = data;
  }

  closeModal("edit-modal");
  markDirty();
  renderBuilder();
}

// ── Settings panel ────────────────────────────────────────────
function renderSettingsPanel() {
  const body = document.getElementById("settings-body");
  if (!body || !_form) return;

  const s = _form.settings || {};

  body.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:14px">

      ${sRow("Submit label", `<input data-s="submit_label" value="${esc(s.submit_label || "Submit")}"
        style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-raised);color:var(--text);font-size:13.5px;outline:none;font-family:inherit">`)}

      <div class="settings-sep"></div>

      ${sRow("Delivery", `<select data-s="target" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-raised);color:var(--text);font-size:13.5px;outline:none;font-family:inherit">
        <option value="" ${!s.target?"selected":""}>None (save only)</option>
        <option value="wa"   ${s.target==="wa"  ?"selected":""}>WhatsApp</option>
        <option value="tg"   ${s.target==="tg"  ?"selected":""}>Telegram</option>
        <option value="both" ${s.target==="both"?"selected":""}>WhatsApp + Telegram</option>
      </select>`)}

      <div id="s-wa-wrap" style="display:${s.target==="wa"||s.target==="both"?"":"none"};flex-direction:column;gap:8px">
        ${sRow("WhatsApp number", `<input data-s="wa_number" placeholder="+62…" value="${esc(s.wa_number||"")}"
          style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-raised);color:var(--text);font-size:13.5px;outline:none;font-family:inherit">`)}
      </div>
      <div id="s-tg-wrap" style="display:${s.target==="tg"||s.target==="both"?"":"none"};flex-direction:column;gap:8px">
        ${sRow("Telegram username", `<input data-s="tg_username" placeholder="@yourbot" value="${esc(s.tg_username||"")}"
          style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-raised);color:var(--text);font-size:13.5px;outline:none;font-family:inherit">`)}
      </div>

      <div class="settings-sep"></div>

      ${sRow("Open at (optional)", `<input data-s="openAt" type="datetime-local" value="${esc(s.openAt ? toLocalDatetime(s.openAt) : "")}"
        style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-raised);color:var(--text);font-size:13.5px;outline:none;font-family:inherit">`)}

      ${sRow("Close at (optional)", `<input data-s="closeAt" type="datetime-local" value="${esc(s.closeAt ? toLocalDatetime(s.closeAt) : "")}"
        style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-raised);color:var(--text);font-size:13.5px;outline:none;font-family:inherit">`)}

      ${sRow("Max responses", `<input data-s="maxResponses" type="number" min="0" placeholder="Unlimited" value="${esc(s.maxResponses||"")}"
        style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-raised);color:var(--text);font-size:13.5px;outline:none;font-family:inherit">`)}

      <div class="settings-sep"></div>

      ${sRow("Custom slug", `<input data-s="slug" placeholder="my-form" value="${esc(_form.slug||"")}"
        style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-raised);color:var(--text);font-size:13.5px;outline:none;font-family:inherit">
        <span style="font-size:11px;color:var(--text-muted)">Used as the form's custom URL</span>`)}

      <button class="btn btn-solid" id="settings-save-btn" style="margin-top:4px">Save settings</button>
    </div>`;

  // Show/hide WA/TG fields based on target
  body.querySelector("[data-s='target']")?.addEventListener("change", (e) => {
    const v = e.target.value;
    body.querySelector("#s-wa-wrap").style.display = (v==="wa"||v==="both") ? "flex" : "none";
    body.querySelector("#s-tg-wrap").style.display = (v==="tg"||v==="both") ? "flex" : "none";
  });

  body.querySelector("#settings-save-btn")?.addEventListener("click", () => {
    const newSettings = { ..._form.settings };
    body.querySelectorAll("[data-s]").forEach(el => {
      const key = el.dataset.s;
      let val = el.value.trim();
      if (key === "maxResponses") val = val ? Number(val) : null;
      if (key === "openAt" || key === "closeAt") val = val ? new Date(val).toISOString() : null;
      newSettings[key] = val || null;
    });
    // slug lives on the form row, not settings
    const slugVal = body.querySelector("[data-s='slug']")?.value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "") || null;
    _form.settings = newSettings;
    _form.slug = slugVal;
    markDirty();
    toast("Settings saved");
  });
}

function sRow(label, inputHtml) {
  return `<div style="display:flex;flex-direction:column;gap:4px">
    <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em">${label}</label>
    ${inputHtml}
  </div>`;
}

function toLocalDatetime(iso) {
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Preview modal ─────────────────────────────────────────────
function openPreview() {
  const body = document.getElementById("preview-body");
  if (!body) return;

  if (!_fields.length) {
    body.innerHTML = `<div class="empty-state"><h4>No questions yet</h4></div>`;
  } else {
    body.innerHTML = _fields.map((field, i) => previewField(field, i)).join("");
  }

  openModal("preview-modal");
}

function previewField(field, i) {
  const def = FIELD_TYPES[field.type] || { label: field.type };
  const req  = field.required ? `<span style="color:var(--red);margin-left:2px">*</span>` : "";

  if (field.type === "page_break") {
    return `<div style="display:flex;align-items:center;gap:8px;margin:16px 0">
      <div style="flex:1;height:1px;background:var(--border)"></div>
      <span style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">${esc(field.title||"Page Break")}</span>
      <div style="flex:1;height:1px;background:var(--border)"></div>
    </div>`;
  }
  if (field.type === "title") {
    return `<div style="margin-bottom:16px">
      <h3 style="margin:0 0 4px;font-size:18px;font-weight:700">${esc(field.title)}</h3>
      ${field.description ? `<p style="margin:0;color:var(--text-soft);font-size:13px">${esc(field.description)}</p>` : ""}
    </div>`;
  }
  if (field.type === "divider") {
    return `<hr style="border:none;border-top:1px ${field.divStyle||"solid"} var(--border);margin:16px 0">`;
  }
  if (field.type === "spacer") {
    return `<div style="height:${field.height||32}px"></div>`;
  }
  if (field.type === "image" && field.url) {
    return `<div style="margin-bottom:16px;text-align:center">
      <img src="${esc(field.url)}" alt="${esc(field.caption||"")}" style="max-width:100%;border-radius:var(--radius)">
      ${field.caption ? `<p style="font-size:12px;color:var(--text-muted);margin:6px 0 0">${esc(field.caption)}</p>` : ""}
    </div>`;
  }

  const inputStyle = "width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-raised);color:var(--text);font-size:14px;outline:none;font-family:inherit";

  let inputHtml = "";
  switch (field.type) {
    case "short_text": case "email": case "phone": case "number": case "url": case "password": case "color": case "date":
      inputHtml = `<input type="${field.type==="short_text"?"text":field.type}" placeholder="${esc(field.placeholder||"")}" style="${inputStyle}" disabled>`;
      break;
    case "long_text":
      inputHtml = `<textarea rows="${field.minRows||3}" placeholder="${esc(field.placeholder||"")}" style="${inputStyle}" disabled></textarea>`;
      break;
    case "choice":
      inputHtml = (field.options||["Option 1","Option 2"]).map(o =>
        `<label style="display:flex;align-items:center;gap:8px;font-size:14px;cursor:pointer;margin-bottom:6px">
          <input type="radio" disabled> ${esc(o)}
        </label>`).join("");
      break;
    case "checkbox": case "multiselect":
      inputHtml = (field.options||["Option 1","Option 2"]).map(o =>
        `<label style="display:flex;align-items:center;gap:8px;font-size:14px;cursor:pointer;margin-bottom:6px">
          <input type="checkbox" disabled> ${esc(o)}
        </label>`).join("");
      break;
    case "dropdown":
      inputHtml = `<select style="${inputStyle}" disabled><option>— Select —</option>${(field.options||[]).map(o=>`<option>${esc(o)}</option>`).join("")}</select>`;
      break;
    case "rating":
      inputHtml = Array.from({ length: field.max || 5 }, () =>
        `<span style="font-size:24px;cursor:pointer">⭐</span>`).join("");
      break;
    case "nps_score":
      inputHtml = `<div style="display:flex;gap:4px;flex-wrap:wrap">${Array.from({length:11},(_,i)=>`<button disabled style="width:36px;height:36px;border:1px solid var(--border);border-radius:6px;background:var(--bg-mid);font-size:13px;font-weight:600">${i}</button>`).join("")}</div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-top:4px">
          <span>${esc(field.npsLow||"Not at all likely")}</span><span>${esc(field.npsHigh||"Extremely likely")}</span>
        </div>`;
      break;
    case "slider":
      inputHtml = `<input type="range" min="${field.min||0}" max="${field.max||100}" step="${field.step||1}" style="width:100%;accent-color:var(--teal)" disabled>`;
      break;
    case "toggle":
      inputHtml = `<div style="display:flex;gap:12px;align-items:center">
        <span style="font-size:14px">${esc(field.offLabel||"No")}</span>
        <div style="width:40px;height:22px;background:var(--teal);border-radius:999px;position:relative;cursor:pointer">
          <div style="position:absolute;width:16px;height:16px;background:#fff;border-radius:50%;top:3px;right:3px;transition:right .2s"></div>
        </div>
        <span style="font-size:14px">${esc(field.onLabel||"Yes")}</span>
      </div>`;
      break;
    case "file_upload":
      inputHtml = `<div style="border:2px dashed var(--border);border-radius:var(--radius);padding:20px;text-align:center;color:var(--text-muted)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28" style="margin:0 auto 8px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <div style="font-size:13px">Click to upload${field.accept ? ` (${field.accept})` : ""}</div>
      </div>`;
      break;
    case "map":
      inputHtml = `<div style="height:140px;background:var(--bg-mid);border-radius:var(--radius);display:flex;align-items:center;justify-content:center;color:var(--text-muted)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="24" height="24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        &nbsp;Location picker
      </div>`;
      break;
    case "button_link":
      inputHtml = `<button style="padding:10px 24px;background:var(--teal);color:#04231C;border:none;border-radius:var(--radius);font-weight:600;font-size:14px;cursor:pointer" disabled>${esc(field.title||"Click here")}</button>`;
      break;
    default:
      inputHtml = `<input type="text" style="${inputStyle}" disabled>`;
  }

  return `<div style="margin-bottom:20px">
    <div style="font-size:14px;font-weight:600;margin-bottom:6px">${esc(field.title||"(untitled)")}${req}</div>
    ${field.description ? `<div style="font-size:12.5px;color:var(--text-soft);margin-bottom:8px">${esc(field.description)}</div>` : ""}
    ${inputHtml}
  </div>`;
}

// ── Boot ──────────────────────────────────────────────────────
init();