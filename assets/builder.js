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

// ── Question type definitions ─────────────────────────────────
const Q_TYPES = [
  { type:"short",     label:"Short text",     icon:'<path d="M4 6h16M4 12h10"/>',                                                              desc:"Single line answer" },
  { type:"long",      label:"Long text",      icon:'<path d="M4 6h16M4 10h16M4 14h16M4 18h10"/>',                                             desc:"Multi-line answer" },
  { type:"choice",    label:"Multiple choice",icon:'<circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>',                              desc:"Pick one or more" },
  { type:"checkbox",  label:"Checkbox",       icon:'<rect x="4" y="4" width="16" height="16" rx="3"/><polyline points="8 12 11 15 16 9" stroke="var(--bg)" stroke-width="2.2" fill="none"/>', desc:"Yes/no toggle" },
  { type:"dropdown",  label:"Dropdown",       icon:'<path d="M6 9l6 6 6-6"/><rect x="3" y="3" width="18" height="18" rx="2"/>',               desc:"Select from list" },
  { type:"number",    label:"Number",         icon:'<text x="2" y="17" font-size="11" font-weight="700" font-family="monospace" fill="currentColor" stroke="none">123</text>', desc:"Numeric input" },
  { type:"date",      label:"Date",           icon:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',     desc:"Date picker" },
  { type:"rating",    label:"Rating",         icon:'<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>', desc:"Star rating" },
  { type:"email",     label:"Email",          icon:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/>',            desc:"Email address" },
  { type:"phone",     label:"Phone",          icon:'<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.55 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>', desc:"Phone number" },
  { type:"title",     label:"Title / Heading",icon:'<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',                                                 desc:"Section heading" },
  { type:"image",     label:"Image",          icon:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>', desc:"Display an image" },
  { type:"video",     label:"Video",          icon:'<rect x="2" y="4" width="20" height="16" rx="2"/><polygon points="10 9 15 12 10 15 10 9"/>',desc:"Embed a video" },
];

// Phone country codes
const COUNTRY_CODES = [
  {code:"+62",label:"🇮🇩 Indonesia (+62)"},{code:"+1",label:"🇺🇸 USA (+1)"},{code:"+44",label:"🇬🇧 UK (+44)"},
  {code:"+91",label:"🇮🇳 India (+91)"},{code:"+86",label:"🇨🇳 China (+86)"},{code:"+81",label:"🇯🇵 Japan (+81)"},
  {code:"+82",label:"🇰🇷 South Korea (+82)"},{code:"+49",label:"🇩🇪 Germany (+49)"},{code:"+33",label:"🇫🇷 France (+33)"},
  {code:"+39",label:"🇮🇹 Italy (+39)"},{code:"+34",label:"🇪🇸 Spain (+34)"},{code:"+351",label:"🇵🇹 Portugal (+351)"},
  {code:"+31",label:"🇳🇱 Netherlands (+31)"},{code:"+46",label:"🇸🇪 Sweden (+46)"},{code:"+47",label:"🇳🇴 Norway (+47)"},
  {code:"+45",label:"🇩🇰 Denmark (+45)"},{code:"+7",label:"🇷🇺 Russia (+7)"},{code:"+55",label:"🇧🇷 Brazil (+55)"},
  {code:"+52",label:"🇲🇽 Mexico (+52)"},{code:"+54",label:"🇦🇷 Argentina (+54)"},{code:"+57",label:"🇨🇴 Colombia (+57)"},
  {code:"+56",label:"🇨🇱 Chile (+56)"},{code:"+20",label:"🇪🇬 Egypt (+20)"},{code:"+27",label:"🇿🇦 South Africa (+27)"},
  {code:"+234",label:"🇳🇬 Nigeria (+234)"},{code:"+254",label:"🇰🇪 Kenya (+254)"},{code:"+971",label:"🇦🇪 UAE (+971)"},
  {code:"+966",label:"🇸🇦 Saudi Arabia (+966)"},{code:"+90",label:"🇹🇷 Turkey (+90)"},{code:"+92",label:"🇵🇰 Pakistan (+92)"},
  {code:"+880",label:"🇧🇩 Bangladesh (+880)"},{code:"+84",label:"🇻🇳 Vietnam (+84)"},{code:"+66",label:"🇹🇭 Thailand (+66)"},
  {code:"+60",label:"🇲🇾 Malaysia (+60)"},{code:"+65",label:"🇸🇬 Singapore (+65)"},{code:"+63",label:"🇵🇭 Philippines (+63)"},
  {code:"+61",label:"🇦🇺 Australia (+61)"},{code:"+64",label:"🇳🇿 New Zealand (+64)"},{code:"+41",label:"🇨🇭 Switzerland (+41)"},
  {code:"+43",label:"🇦🇹 Austria (+43)"},{code:"+32",label:"🇧🇪 Belgium (+32)"},{code:"+48",label:"🇵🇱 Poland (+48)"},
  {code:"+380",label:"🇺🇦 Ukraine (+380)"},{code:"+30",label:"🇬🇷 Greece (+30)"},{code:"+420",label:"🇨🇿 Czech (+420)"},
  {code:"+36",label:"🇭🇺 Hungary (+36)"},{code:"+40",label:"🇷🇴 Romania (+40)"},{code:"+372",label:"🇪🇪 Estonia (+372)"},
];

const LANGUAGES = [
  {code:"en",label:"English"},{code:"id",label:"Bahasa Indonesia"},{code:"ms",label:"Bahasa Melayu"},
  {code:"ar",label:"العربية"},{code:"zh",label:"中文"},{code:"zh-TW",label:"繁體中文"},
  {code:"ja",label:"日本語"},{code:"ko",label:"한국어"},{code:"hi",label:"हिन्दी"},
  {code:"bn",label:"বাংলা"},{code:"pt",label:"Português"},{code:"es",label:"Español"},
  {code:"fr",label:"Français"},{code:"de",label:"Deutsch"},{code:"it",label:"Italiano"},
  {code:"nl",label:"Nederlands"},{code:"sv",label:"Svenska"},{code:"no",label:"Norsk"},
  {code:"da",label:"Dansk"},{code:"fi",label:"Suomi"},{code:"pl",label:"Polski"},
  {code:"ru",label:"Русский"},{code:"tr",label:"Türkçe"},{code:"uk",label:"Українська"},
  {code:"vi",label:"Tiếng Việt"},{code:"th",label:"ภาษาไทย"},{code:"fa",label:"فارسی"},
  {code:"sw",label:"Kiswahili"},{code:"tl",label:"Filipino"},{code:"ur",label:"اردو"},
];

// ── State ─────────────────────────────────────────────────────
let formId    = null;
let formData  = null;
let questions = [];
let settings  = {};
let saveTimer = null;
let editingIdx = null; // index of question being edited in modal

// ── Member permissions (for invited users) ────────────────────
let memberPerms = {
  can_edit_questions: true,
  can_edit_settings:  true,
  is_owner: true,
};

// ── Theme ─────────────────────────────────────────────────────
(function() {
  const root = document.documentElement;
  const btns = document.querySelectorAll("[data-theme-toggle]");
  function set(t) {
    t === "dark" ? root.setAttribute("data-theme","dark") : root.removeAttribute("data-theme");
    try { localStorage.setItem("wf-theme",t); } catch(_){}
  }
  let saved; try { saved = localStorage.getItem("wf-theme"); } catch(_){}
  set(saved === "dark" ? "dark" : "light");
  btns.forEach(b => b.addEventListener("click", () => set(root.getAttribute("data-theme")==="dark"?"light":"dark")));
})();

// ── Toast ─────────────────────────────────────────────────────
function toast(msg, type="success") {
  const c = document.getElementById("toast-container");
  const el = document.createElement("div");
  el.className = `toast ${type}`; el.textContent = msg;
  c.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 300); }, 3000);
}

// ── Modal helpers ─────────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }
document.querySelectorAll("[data-close]").forEach(btn =>
  btn.addEventListener("click", () => closeModal(btn.dataset.close))
);
document.querySelectorAll(".modal-backdrop").forEach(bd =>
  bd.addEventListener("click", e => { if(e.target===bd) bd.classList.remove("open"); })
);

// ── Helpers ───────────────────────────────────────────────────
function esc(str) {
  return String(str||"").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
}
function uid() { return Math.random().toString(36).slice(2,9); }

// ── Auth state listener ───────────────────────────────────────
_sb.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
    window.location.replace("login.html");
  }
});

// ── Init ──────────────────────────────────────────────────────
async function init() {
  let { data: { session } } = await _sb.auth.getSession();
  if (!session) {
    const { data: refreshed } = await _sb.auth.refreshSession();
    session = refreshed?.session ?? null;
  }
  if (!session) { window.location.replace("login.html"); return; }

  const params = new URLSearchParams(location.search);
  formId = params.get("form");
  if (!formId) { window.location.href = "dashboard/"; return; }

  const { data, error } = await _sb.from("forms").select("*").eq("id", formId).single();
  if (error || !data) { window.location.href = "dashboard/"; return; }

  formData  = data;
  questions = Array.isArray(data.questions) ? data.questions : [];
  settings  = data.settings || {};

  // ── Load member permissions ────────────────────────────────
  // Check if current user is owner of this workspace, or a member with specific perms
  const wsId = data.workspace_id;
  if (wsId && session.user) {
    const { data: ws } = await _sb.from("workspaces").select("owner_id").eq("id", wsId).single();
    const isOwner = ws?.owner_id === session.user.id;
    if (!isOwner) {
      const { data: myMember } = await _sb.from("workspace_members")
        .select("permissions")
        .eq("workspace_id", wsId)
        .eq("user_id", session.user.id)
        .maybeSingle();
      const p = myMember?.permissions || {};
      memberPerms = {
        can_edit_questions: p.can_edit_questions !== false,
        can_edit_settings:  p.can_edit_settings  !== false,
        is_owner: false,
      };
    } else {
      memberPerms = { can_edit_questions: true, can_edit_settings: true, is_owner: true };
    }
  }

  document.getElementById("topbar-form-title").textContent = data.title;
  document.title = `${data.title} — WateForm`;

  renderQTypePicker();
  renderSettingsPanel();
  renderQuestionCards();
  updatePublishBtn();
  applyPermissionUI(); // lock UI jika tidak punya akses

  // Auto-open settings panel if ?panel=settings
  if (params.get("panel") === "settings") {
    document.getElementById("settings-panel")?.classList.add("open");
  }
}

// ── Apply permission restrictions to builder UI ───────────────
function applyPermissionUI() {
  // can_edit_questions: false → sembunyikan add-question button dan disable semua q-card actions
  if (!memberPerms.can_edit_questions) {
    // Hide add question button and empty state CTA
    document.querySelectorAll(".center-add-q-btn, #center-empty .btn").forEach(el => {
      el.style.display = "none";
    });
    // Disable the "Add question" type-picker trigger
    const addQBtn = document.getElementById("add-q-btn");
    if (addQBtn) { addQBtn.disabled = true; addQBtn.title = "You don't have permission to edit questions"; }
    // Show readonly banner
    showReadonlyBanner("questions");
  }

  // can_edit_settings: false → disable settings panel inputs and publish button
  if (!memberPerms.can_edit_settings) {
    const settingsPanel = document.getElementById("settings-panel");
    if (settingsPanel) {
      settingsPanel.querySelectorAll("input, select, textarea, button:not(.panel-close)").forEach(el => {
        el.disabled = true;
      });
    }
    const publishBtn = document.getElementById("publish-btn");
    if (publishBtn) {
      publishBtn.disabled = true;
      publishBtn.title = "You don't have permission to edit form settings";
    }
    showReadonlyBanner("settings");
  }
}

function showReadonlyBanner(type) {
  const center = document.getElementById("builder-center");
  if (!center || center.querySelector(".perms-banner")) return;
  const banner = document.createElement("div");
  banner.className = "perms-banner";
  banner.style.cssText = "background:rgba(234,179,8,.1);border:1px solid rgba(234,179,8,.3);border-radius:8px;padding:10px 14px;font-size:13px;color:#92400e;margin-bottom:12px;display:flex;align-items:center;gap:8px";
  const msgs = {
    questions: "You have view-only access to questions in this workspace.",
    settings:  "You have view-only access to form settings in this workspace.",
  };
  banner.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg> ${msgs[type] || "Read-only access."}`;
  center.insertAdjacentElement("afterbegin", banner);
}

// ── Auto-save ─────────────────────────────────────────────────
function scheduleSave() {
  document.getElementById("save-indicator").textContent = "Saving…";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 1200);
}

async function saveNow() {
  // If the form is published, auto-revert to draft on any change
  const wasPublished = formData?.is_published;
  // Only include fields the user has permission to save
  const payload = {};
  if (memberPerms.can_edit_questions) payload.questions = questions;
  if (memberPerms.can_edit_settings)  payload.settings = settings;
  if (!Object.keys(payload).length) {
    document.getElementById("save-indicator").textContent = "Read-only";
    setTimeout(() => { document.getElementById("save-indicator").textContent = ""; }, 2000);
    return;
  }
  if (wasPublished && memberPerms.can_edit_settings) payload.is_published = false;
  await _sb.from("forms").update(payload).eq("id", formId);
  if (wasPublished) {
    formData.is_published = false;
    updatePublishBtn();
  }
  document.getElementById("save-indicator").textContent = "Saved";
  setTimeout(() => { document.getElementById("save-indicator").textContent = ""; }, 2000);
}

// ── Question type picker (modal) ──────────────────────────────
function renderQTypePicker() {
  const grid = document.getElementById("qtype-grid");
  grid.innerHTML = "";
  Q_TYPES.forEach(def => {
    const btn = document.createElement("button");
    btn.className = "qtype-btn";
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${def.icon}</svg>
      <span>${def.label}</span>
    `;
    btn.addEventListener("click", () => { addQuestion(def.type); closeModal("qtype-modal"); });
    grid.appendChild(btn);
  });
}

function addQuestion(type) {
  if (!memberPerms.can_edit_questions) { toast("You don't have permission to edit questions", "error"); return; }
  const q = {
    id: uid(), type,
    title: "", subtitle: "",
    placeholder: "", image: "",
    required: false,
    options: ["Option 1", "Option 2"],
    checkboxOptions: ["Option 1", "Option 2"],
    checkboxAllowOther: false,
    allowOther: false,
    gmailOnly: false,
    phonePrefix: "+62",
    maxRating: 5,
    mediaType: "link", mediaUrl: "",
    imageUploadUrl: "",
    imageInputMode: "url",
    checked: false,
  };
  questions.push(q);
  renderQuestionCards();
  scheduleSave();
  // open edit modal for the new question
  openEditModal(questions.length - 1);
}

// ── Compact question card list ─────────────────────────────────
function renderQuestionCards() {
  const center = document.getElementById("builder-center");
  const empty  = document.getElementById("center-empty");

  // Remove existing cards and add-btn (but keep center-empty)
  center.querySelectorAll(".qcard, .center-add-q-btn").forEach(el => el.remove());

  if (questions.length === 0) {
    if (empty) empty.style.display = "flex";
    return;
  }
  if (empty) empty.style.display = "none";

  questions.forEach((q, idx) => {
    const def = Q_TYPES.find(t => t.type === q.type) || Q_TYPES[0];
    const card = document.createElement("div");
    card.className = "qcard";
    card.dataset.idx = idx;

    const icon = document.createElement("div");
    icon.className = "qcard-icon";
    icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${def.icon}</svg>`;

    const info = document.createElement("div");
    info.className = "qcard-info";

    const typeLbl = document.createElement("div");
    typeLbl.className = "qcard-type";
    typeLbl.textContent = def.label;

    const titleLbl = document.createElement("div");
    titleLbl.className = "qcard-title";
    titleLbl.textContent = q.title || "Untitled";

    info.appendChild(typeLbl);
    info.appendChild(titleLbl);

    const actions = document.createElement("div");
    actions.className = "qcard-actions";

    // Delete button
    const delBtn = document.createElement("button");
    delBtn.className = "qcard-btn qcard-btn-danger";
    delBtn.title = "Delete";
    delBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;
    delBtn.addEventListener("click", (e) => { e.stopPropagation(); deleteQuestion(idx); });

    actions.appendChild(delBtn);

    card.appendChild(icon);
    card.appendChild(info);
    card.appendChild(actions);

    // Click card body to edit
    card.addEventListener("click", () => openEditModal(idx));

    center.appendChild(card);
  });

  // Add question button at the bottom
  const addBtn = document.createElement("button");
  addBtn.className = "add-q-btn center-add-q-btn";
  addBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M12 5v14M5 12h14"/></svg> Add question`;
  addBtn.addEventListener("click", () => openModal("qtype-modal"));
  center.appendChild(addBtn);
}

// ── Edit modal ─────────────────────────────────────────────────
function openEditModal(idx) {
  editingIdx = idx;
  const q = questions[idx];
  const def = Q_TYPES.find(t => t.type === q.type) || Q_TYPES[0];

  // Set modal header
  document.getElementById("edit-modal-type").textContent = def.label;
  document.getElementById("edit-modal-qnum").textContent = `Q${idx + 1}`;

  // Build form body
  const body = document.getElementById("edit-modal-body");
  body.innerHTML = "";

  // ── Common: Title
  const isTitle = q.type === "title";
  body.appendChild(makeField(
    isTitle ? "Heading text" : "Title",
    "input",
    { type:"text", id:"em-title", value: q.title, placeholder: isTitle ? "Section heading…" : "Question title…", maxlength:"200" }
  ));

  // ── Common: Subtitle (rich)
  const subtitleWrap = document.createElement("div");
  subtitleWrap.className = "field";
  const subtitleLbl = document.createElement("label");
  subtitleLbl.innerHTML = (isTitle ? "Subtext" : "Subtitle") + " <span style='font-size:11px;font-weight:400;color:var(--text-muted)'>(optional)</span>";
  subtitleWrap.appendChild(subtitleLbl);

  const toolbar = document.createElement("div");
  toolbar.className = "rich-toolbar";
  [["bold","B"],["italic","I"],["underline","U"],["strikeThrough","S"]].forEach(([cmd,lbl]) => {
    const b = document.createElement("button");
    b.className = "rich-btn"; b.dataset.cmd = cmd; b.type = "button";
    b.innerHTML = `<${lbl === "S" ? "s" : lbl === "I" ? "i" : lbl === "U" ? "u" : "b"}>${lbl}</${lbl === "S" ? "s" : lbl === "I" ? "i" : lbl === "U" ? "u" : "b"}>`;
    b.addEventListener("click", () => { document.execCommand(cmd, false, null); editor.focus(); });
    toolbar.appendChild(b);
  });
  const listBtn = document.createElement("button");
  listBtn.className = "rich-btn"; listBtn.type = "button"; listBtn.textContent = "•";
  listBtn.addEventListener("click", () => { document.execCommand("insertUnorderedList", false, null); editor.focus(); });
  toolbar.appendChild(listBtn);

  const editor = document.createElement("div");
  editor.className = "rich-editor"; editor.id = "em-subtitle"; editor.contentEditable = "true";
  editor.innerHTML = q.subtitle || "";

  subtitleWrap.appendChild(toolbar);
  subtitleWrap.appendChild(editor);
  body.appendChild(subtitleWrap);

  // ── Type-specific fields
  if (["short","long","number","date"].includes(q.type)) {
    body.appendChild(makeField("Placeholder", "input",
      { type:"text", id:"em-placeholder", value: q.placeholder, maxlength:"120" }
    ));
  }

  if (q.type === "email") {
    body.appendChild(makeField("Placeholder", "input",
      { type:"text", id:"em-placeholder", value: q.placeholder, placeholder:"e.g. you@example.com", maxlength:"120" }
    ));
    body.appendChild(makeToggleField("Require @gmail.com only", "em-gmail-only", q.gmailOnly));
  }

  if (q.type === "phone") {
    const wrap = document.createElement("div");
    wrap.className = "field";
    const lbl = document.createElement("label");
    lbl.textContent = "Default country code";
    wrap.appendChild(lbl);
    const sel = document.createElement("select");
    sel.id = "em-phone-prefix";
    COUNTRY_CODES.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.code; opt.textContent = c.label;
      if (q.phonePrefix === c.code) opt.selected = true;
      sel.appendChild(opt);
    });
    wrap.appendChild(sel);
    body.appendChild(wrap);
    body.appendChild(makeField("Placeholder", "input",
      { type:"text", id:"em-placeholder", value: q.placeholder, placeholder:"e.g. 812-3456-7890", maxlength:"60" }
    ));
  }

  if (q.type === "rating") {
    const wrap = document.createElement("div");
    wrap.className = "field";
    const lbl = document.createElement("label"); lbl.textContent = "Max rating";
    wrap.appendChild(lbl);
    const sel = document.createElement("select"); sel.id = "em-max-rating";
    [3,4,5,7,10].forEach(n => {
      const opt = document.createElement("option");
      opt.value = n; opt.textContent = `${n} stars`;
      if (q.maxRating === n) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener("change", () => renderStarsPreview(Number(sel.value)));
    wrap.appendChild(sel);
    body.appendChild(wrap);

    const starsDiv = document.createElement("div");
    starsDiv.className = "rating-preview"; starsDiv.id = "em-stars";
    body.appendChild(starsDiv);
    renderStarsPreview(q.maxRating || 5);
  }

  if (q.type === "choice" || q.type === "dropdown" || q.type === "checkbox") {
    const wrap = document.createElement("div");
    wrap.className = "field";
    const lbl = document.createElement("label");
    lbl.textContent = q.type === "checkbox" ? "Checkbox options (multi-select)" : "Options";
    wrap.appendChild(lbl);
    const optsDiv = document.createElement("div");
    optsDiv.className = "choice-options"; optsDiv.id = "em-options";
    wrap.appendChild(optsDiv);
    const addOptBtn = document.createElement("button");
    addOptBtn.className = "add-option-btn"; addOptBtn.type = "button"; addOptBtn.textContent = "+ Add option";
    addOptBtn.addEventListener("click", () => {
      const opts = collectOptions();
      opts.push("Option " + (opts.length + 1));
      renderOptions(opts, optsDiv);
    });
    wrap.appendChild(addOptBtn);
    if (q.type === "choice" || q.type === "checkbox") {
      wrap.appendChild(makeToggleField('Allow "Other" option', "em-allow-other", q.type === "checkbox" ? q.checkboxAllowOther : q.allowOther));
    }
    body.appendChild(wrap);
    renderOptions(q.type === "checkbox" ? (q.checkboxOptions || q.options || []) : (q.options || []), optsDiv);
  }

  if (q.type === "image" || q.type === "video") {
    // Tab toggle: URL vs Upload
    const mediaWrap = document.createElement("div");
    mediaWrap.className = "field";
    const mediaLbl = document.createElement("label");
    mediaLbl.textContent = q.type === "image" ? "Image source" : "Video source";
    mediaWrap.appendChild(mediaLbl);

    const tabRow = document.createElement("div");
    tabRow.style.cssText = "display:flex;gap:0;margin-bottom:10px;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden";
    const tabUrl = document.createElement("button");
    tabUrl.type = "button"; tabUrl.id = "em-tab-url";
    tabUrl.textContent = "URL / Link";
    tabUrl.style.cssText = "flex:1;padding:7px 12px;font-size:13px;border:none;cursor:pointer;transition:background .15s";
    const tabUpload = document.createElement("button");
    tabUpload.type = "button"; tabUpload.id = "em-tab-upload";
    tabUpload.textContent = "Upload file";
    tabUpload.style.cssText = "flex:1;padding:7px 12px;font-size:13px;border:none;cursor:pointer;transition:background .15s";
    tabRow.appendChild(tabUrl);
    tabRow.appendChild(tabUpload);
    mediaWrap.appendChild(tabRow);

    // URL pane
    const urlPane = document.createElement("div");
    urlPane.id = "em-url-pane";
    const urlInp = document.createElement("input");
    urlInp.type = "url"; urlInp.id = "em-media-url";
    urlInp.value = q.mediaUrl || "";
    urlInp.placeholder = "https://…";
    urlInp.style.cssText = "width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-mid);color:var(--text);font-size:14px;font-family:inherit";
    urlPane.appendChild(urlInp);

    // Upload pane
    const uploadPane = document.createElement("div");
    uploadPane.id = "em-upload-pane";
    const fileInp = document.createElement("input");
    fileInp.type = "file"; fileInp.id = "em-media-file";
    fileInp.accept = q.type === "image" ? "image/*" : "video/*";
    fileInp.style.cssText = "display:none";
    const uploadBtn = document.createElement("button");
    uploadBtn.type = "button"; uploadBtn.className = "btn btn-ghost btn-sm";
    uploadBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Choose file';
    uploadBtn.addEventListener("click", () => fileInp.click());
    const uploadHint = document.createElement("div");
    uploadHint.id = "em-upload-hint";
    uploadHint.style.cssText = "font-size:12px;color:var(--text-muted);margin-top:6px";
    uploadHint.textContent = q.imageUploadUrl ? "File uploaded" : "No file chosen";
    if (q.imageUploadUrl) {
      const link = document.createElement("a");
      link.href = q.imageUploadUrl; link.target = "_blank";
      link.style.cssText = "font-size:12px;color:var(--teal);display:block;margin-top:4px;word-break:break-all";
      link.textContent = q.imageUploadUrl;
      uploadPane.appendChild(link);
    }
    fileInp.addEventListener("change", () => {
      const file = fileInp.files?.[0];
      uploadHint.textContent = file ? file.name : "No file chosen";
    });
    uploadPane.appendChild(fileInp);
    uploadPane.appendChild(uploadBtn);
    uploadPane.appendChild(uploadHint);

    mediaWrap.appendChild(urlPane);
    mediaWrap.appendChild(uploadPane);
    body.appendChild(mediaWrap);

    // Init active tab
    const initMode = q.imageInputMode || "url";
    function setMediaTab(mode) {
      const isUrl = mode === "url";
      tabUrl.style.background = isUrl ? "var(--teal-dim)" : "var(--bg-mid)";
      tabUrl.style.color = isUrl ? "var(--teal-deep)" : "var(--text-muted)";
      tabUrl.style.fontWeight = isUrl ? "600" : "400";
      tabUpload.style.background = !isUrl ? "var(--teal-dim)" : "var(--bg-mid)";
      tabUpload.style.color = !isUrl ? "var(--teal-deep)" : "var(--text-muted)";
      tabUpload.style.fontWeight = !isUrl ? "600" : "400";
      urlPane.style.display = isUrl ? "" : "none";
      uploadPane.style.display = !isUrl ? "" : "none";
      document.getElementById("em-media-type") && (document.getElementById("em-media-type").value = mode);
    }
    // hidden input to track mode
    const modeInp = document.createElement("input");
    modeInp.type = "hidden"; modeInp.id = "em-media-type"; modeInp.value = initMode;
    body.appendChild(modeInp);
    tabUrl.addEventListener("click", () => { setMediaTab("url"); modeInp.value = "url"; });
    tabUpload.addEventListener("click", () => { setMediaTab("upload"); modeInp.value = "upload"; });
    setMediaTab(initMode);
  }

  if (!["image","video","title"].includes(q.type)) {
    // Question image: URL input and Upload button inline
    const imgWrap = document.createElement("div");
    imgWrap.className = "field";
    const imgLbl = document.createElement("label");
    imgLbl.innerHTML = "Image <span style='font-size:11px;font-weight:400;color:var(--text-muted)'>(optional)</span>";
    imgWrap.appendChild(imgLbl);

    // URL input + Upload button side by side in one row
    const imgUrlRow = document.createElement("div");
    imgUrlRow.style.cssText = "display:flex;align-items:center;gap:8px";

    const imgUrlInp = document.createElement("input");
    imgUrlInp.type = "url"; imgUrlInp.id = "em-image";
    imgUrlInp.value = q.image || "";
    imgUrlInp.placeholder = "Paste image URL…";
    imgUrlInp.style.cssText = "flex:1;min-width:0";
    imgUrlRow.appendChild(imgUrlInp);

    const imgFileInp = document.createElement("input");
    imgFileInp.type = "file"; imgFileInp.id = "em-image-file";
    imgFileInp.accept = "image/*"; imgFileInp.style.display = "none";

    const imgUploadBtn = document.createElement("button");
    imgUploadBtn.type = "button"; imgUploadBtn.className = "btn btn-ghost btn-sm";
    imgUploadBtn.style.cssText = "white-space:nowrap;flex-shrink:0";
    imgUploadBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Upload';
    imgUploadBtn.addEventListener("click", () => imgFileInp.click());
    imgUrlRow.appendChild(imgFileInp);
    imgUrlRow.appendChild(imgUploadBtn);

    imgFileInp.addEventListener("change", () => {
      const file = imgFileInp.files?.[0];
      if (file) {
        const objUrl = URL.createObjectURL(file);
        imgUrlInp.value = objUrl;
        imgUploadBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> ' + file.name.slice(0,12) + (file.name.length>12?'…':'');
      }
    });

    imgWrap.appendChild(imgUrlRow);
    body.appendChild(imgWrap);
  }

  // ── Required toggle
  body.appendChild(document.createElement("hr"));
  body.appendChild(makeToggleField("Required", "em-required", q.required));

  // ── Move up/down
  const moveRow = document.createElement("div");
  moveRow.style.cssText = "display:flex;gap:8px;margin-top:8px;";
  const upBtn = document.createElement("button");
  upBtn.className = "btn btn-ghost btn-sm"; upBtn.type = "button"; upBtn.textContent = "↑ Move up";
  upBtn.disabled = idx === 0;
  upBtn.addEventListener("click", () => {
    saveEditToMemory();
    moveQuestion(idx, -1);
    // close and re-open at new index
    closeModal("edit-modal");
    openEditModal(idx - 1);
  });
  const downBtn = document.createElement("button");
  downBtn.className = "btn btn-ghost btn-sm"; downBtn.type = "button"; downBtn.textContent = "↓ Move down";
  downBtn.disabled = idx === questions.length - 1;
  downBtn.addEventListener("click", () => {
    saveEditToMemory();
    moveQuestion(idx, 1);
    closeModal("edit-modal");
    openEditModal(idx + 1);
  });
  moveRow.appendChild(upBtn);
  moveRow.appendChild(downBtn);
  body.appendChild(moveRow);

  openModal("edit-modal");
}

function renderStarsPreview(max) {
  const div = document.getElementById("em-stars");
  if (!div) return;
  div.innerHTML = "";
  for (let i = 1; i <= max; i++) {
    const s = document.createElement("button");
    s.type = "button"; s.className = "star-btn lit"; s.textContent = "★";
    div.appendChild(s);
  }
}

function renderOptions(opts, container) {
  container.innerHTML = "";
  opts.forEach((opt, oi) => {
    const row = document.createElement("div");
    row.className = "choice-opt-row";
    const inp = document.createElement("input");
    inp.type = "text"; inp.value = opt; inp.placeholder = `Option ${oi+1}`; inp.dataset.oi = oi;
    const rmBtn = document.createElement("button");
    rmBtn.className = "choice-remove"; rmBtn.type = "button";
    rmBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>`;
    rmBtn.addEventListener("click", () => {
      const cur = collectOptions();
      cur.splice(oi, 1);
      renderOptions(cur, container);
    });
    row.appendChild(inp);
    row.appendChild(rmBtn);
    container.appendChild(row);
  });
}

function collectOptions() {
  const div = document.getElementById("em-options");
  if (!div) return [];
  return Array.from(div.querySelectorAll("input[data-oi]")).map(i => i.value);
}

function makeField(labelHtml, tag, attrs) {
  const wrap = document.createElement("div");
  wrap.className = "field";
  const lbl = document.createElement("label");
  lbl.innerHTML = labelHtml;
  wrap.appendChild(lbl);
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "value") el.value = v || "";
    else el.setAttribute(k, v);
  });
  wrap.appendChild(el);
  return wrap;
}

function makeToggleField(labelText, id, checked) {
  const row = document.createElement("label");
  row.className = "toggle-row";
  const span = document.createElement("span");
  span.className = "toggle-label"; span.textContent = labelText;
  const lbl = document.createElement("label");
  lbl.className = "toggle";
  const inp = document.createElement("input");
  inp.type = "checkbox"; inp.id = id; inp.checked = !!checked;
  const track = document.createElement("span");
  track.className = "toggle-track";
  lbl.appendChild(inp);
  lbl.appendChild(track);
  row.appendChild(span);
  row.appendChild(lbl);
  return row;
}

// ── Save from edit modal back to questions[] ──────────────────
function saveEditToMemory() {
  if (editingIdx === null) return;
  const q = questions[editingIdx];
  const get = id => document.getElementById(id);

  q.title       = get("em-title")?.value || "";
  q.subtitle    = get("em-subtitle")?.innerHTML || "";
  q.placeholder = get("em-placeholder")?.value || "";
  q.image       = get("em-image")?.value || "";
  q.required    = get("em-required")?.checked || false;
  q.gmailOnly   = get("em-gmail-only")?.checked || false;
  if (q.type === "checkbox") {
    q.checkboxOptions = collectOptions();
    q.checkboxAllowOther = get("em-allow-other")?.checked || false;
  } else {
    q.allowOther  = get("em-allow-other")?.checked || false;
  }
  q.phonePrefix = get("em-phone-prefix")?.value || q.phonePrefix;
  q.maxRating   = Number(get("em-max-rating")?.value) || q.maxRating;
  q.mediaType   = get("em-media-type")?.value || q.mediaType;
  q.imageInputMode = get("em-media-type")?.value || q.imageInputMode;
  q.mediaUrl    = get("em-media-url")?.value || "";
  if (document.getElementById("em-options")) {
    if (q.type === "checkbox") {
      q.checkboxOptions = collectOptions();
    } else {
      q.options = collectOptions();
    }
  }
}

// Save button in edit modal
document.getElementById("edit-save-btn").addEventListener("click", () => {
  saveEditToMemory();
  renderQuestionCards();
  scheduleSave();
  closeModal("edit-modal");
  toast("Question saved");
});

// Close edit modal — discard changes
document.getElementById("edit-cancel-btn")?.addEventListener("click", () => {
  closeModal("edit-modal");
});

// ── Move / Delete question ────────────────────────────────────
function moveQuestion(idx, dir) {
  if (!memberPerms.can_edit_questions) return;
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= questions.length) return;
  [questions[idx], questions[newIdx]] = [questions[newIdx], questions[idx]];
  renderQuestionCards();
  scheduleSave();
}

function deleteQuestion(idx) {
  if (!memberPerms.can_edit_questions) { toast("You don't have permission to edit questions", "error"); return; }
  if (!confirm("Delete this question?")) return;
  questions.splice(idx, 1);
  renderQuestionCards();
  scheduleSave();
}

// ── Add question buttons ──────────────────────────────────────
document.getElementById("add-q-btn")?.addEventListener("click", () => openModal("qtype-modal"));
document.getElementById("center-add-btn")?.addEventListener("click", () => openModal("qtype-modal"));

// ── Submit placeholder dinamis ────────────────────────────────
function getSubmitPlaceholder(target) {
  if (target === "tg")   return "Send WateForm to Telegram";
  if (target === "both") return "Send WateForm to WhatsApp & Telegram";
  return "Send WateForm to WhatsApp";
}

// ── Settings panel ────────────────────────────────────────────
function renderSettingsPanel() {
  const s = settings;
  const body = document.getElementById("settings-body");
  const formSlug = s.slug || formData?.short_id || "";

  body.innerHTML = `
    <div class="field">
      <label>Form title</label>
      <input type="text" id="s-title" value="${esc(formData?.title || "")}" maxlength="120">
    </div>
    <div class="field">
      <label>Description <span style="font-size:11px;font-weight:400;color:var(--text-muted)">(optional)</span></label>
      <textarea id="s-desc" rows="2" maxlength="300">${esc(formData?.description || "")}</textarea>
    </div>
    <div class="settings-sep"></div>
    <div class="field">
      <label>Public URL</label>
      <div style="display:flex;align-items:center;gap:4px;background:var(--bg-mid);border:1px solid var(--border);border-radius:var(--radius);padding:9px 12px;font-size:13px;">
        <span style="color:var(--text-muted);white-space:nowrap">${window.location.host}/</span>
        <input type="text" id="s-slug" value="${esc(formSlug)}" maxlength="20"
          style="border:none;background:transparent;padding:0;outline:none;font-size:13px;width:100%;color:var(--text)"
          placeholder="auto">
      </div>
      <!-- <div class="hint">Leave blank to use auto-generated ID.</div> -->
    </div>
    <div class="settings-sep"></div>
    <div class="field">
      <label>Target</label>
      <select id="s-target">
        <option value="wa"   ${(s.target||"wa")==="wa"?"selected":""}>WhatsApp only</option>
        <option value="tg"   ${s.target==="tg"?"selected":""}>Telegram only</option>
        <option value="both" ${s.target==="both"?"selected":""}>WhatsApp & Telegram</option>
      </select>
    </div>
    <div id="s-wa-wrap">
      <div class="field">
        <label>WhatsApp number</label>
        <div class="phone-wrap">
          <select id="s-wa-prefix" class="phone-prefix">
            ${COUNTRY_CODES.map(c=>`<option value="${c.code}" ${(s.waPrefix||"+62")===c.code?"selected":""}>${c.code} ${c.label.split(" ")[0]}</option>`).join("")}
          </select>
          <input type="text" id="s-wa-number" value="${esc(s.waNumber||"")}" >
        </div>
      </div>
    </div>
    <div id="s-tg-wrap">
      <div class="field">
        <label>Telegram username</label>
        <div style="display:flex;align-items:center;gap:4px;background:var(--bg-mid);border:1px solid var(--border);border-radius:var(--radius);padding:9px 12px">
          <span style="color:var(--text-muted)">@</span>
          <input type="text" id="s-tg-user" value="${esc(s.tgUsername||"")}" placeholder="username"
            style="border:none;background:transparent;padding:0;outline:none;font-size:14px;width:100%;color:var(--text)">
        </div>
      </div>
    </div>
    <div class="settings-sep"></div>
    <div class="field">
      <label>Language</label>
      <select id="s-lang">
        ${LANGUAGES.map(l=>`<option value="${l.code}" ${(s.language||"en")===l.code?"selected":""}>${l.label}</option>`).join("")}
      </select>
    </div>
    <div id="s-submit-wrap"></div>
    <div class="settings-sep"></div>
    <div class="field">
      <label>Description <span style="font-size:11px;font-weight:400;color:var(--text-muted)">(optional)</span></label>
      <label style="display:flex;align-items:center;gap:6px">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        Schedule <span style="font-size:11px;font-weight:400;color:var(--text-muted)">(optional)</span>
      </label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:4px">
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;font-weight:500">Opens at</div>
          <input type="datetime-local" id="s-open-at" value="${esc(s.openAt||"")}"
            style="width:100%;padding:7px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-mid);color:var(--text);font-size:12px;font-family:inherit">
          <!-- <div class="hint" style="margin-top:3px">Leave blank to open immediately.</div> -->
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:4px">
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;font-weight:500">Closes at</div>
          <input type="datetime-local" id="s-close-at" value="${esc(s.closeAt||"")}"
            style="width:100%;padding:7px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-mid);color:var(--text);font-size:12px;font-family:inherit">
          <!-- <div class="hint" style="margin-top:3px">Leave blank to never close.</div> -->
        </div>
      </div>
      <div id="s-schedule-preview" style="margin-top:8px;font-size:12px;color:var(--text-muted)"></div>
    </div>
  `;

  updateTargetVisibility();
  document.getElementById("s-target").addEventListener("change", () => {
    settings.target = document.getElementById("s-target").value;
    updateTargetVisibility();
    saveSetting();
  });
  ["s-title","s-desc","s-slug","s-wa-number","s-tg-user"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", () => saveSetting());
  });
  ["s-wa-prefix","s-lang"].forEach(id => {
    document.getElementById(id)?.addEventListener("change", () => saveSetting());
  });
  ["s-open-at","s-close-at"].forEach(id => {
    document.getElementById(id)?.addEventListener("change", () => { saveSetting(); updateSchedulePreview(); });
  });
  updateSchedulePreview();
}

function updateSchedulePreview() {
  const el = document.getElementById("s-schedule-preview");
  if (!el) return;
  const openAt  = document.getElementById("s-open-at")?.value;
  const closeAt = document.getElementById("s-close-at")?.value;
  if (!openAt && !closeAt) { el.textContent = ""; return; }
  const fmt = dt => new Date(dt).toLocaleString(undefined, { dateStyle:"medium", timeStyle:"short" });
  const parts = [];
  if (openAt)  parts.push("Opens " + fmt(openAt));
  if (closeAt) parts.push("Closes " + fmt(closeAt));
  el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11" style="vertical-align:-1px"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> ` + parts.join(" · ");
}

function updateTargetVisibility() {
  const t = document.getElementById("s-target")?.value || "wa";
  const waWrap = document.getElementById("s-wa-wrap");
  const tgWrap = document.getElementById("s-tg-wrap");
  if (waWrap) waWrap.style.display = t === "tg" ? "none" : "block";
  if (tgWrap) tgWrap.style.display = t === "wa" ? "none" : "block";
  renderSubmitFields(t);
}

function renderSubmitFields(target) {
  const wrap = document.getElementById("s-submit-wrap");
  if (!wrap) return;
  const s = settings;
  if (target === "both") {
    wrap.innerHTML = `
      <div class="field">
        <label>Submit button for WhatsApp</label>
        <input type="text" id="s-submit-label-wa" value="${esc(s.submitLabelWa||"")}" placeholder="Send WateForm to WhatsApp">
      </div>
      <div class="field">
        <label>Submit button for Telegram</label>
        <input type="text" id="s-submit-label-tg" value="${esc(s.submitLabelTg||"")}" placeholder="Send WateForm to Telegram">
      </div>
    `;
    document.getElementById("s-submit-label-wa")?.addEventListener("input", () => saveSetting());
    document.getElementById("s-submit-label-tg")?.addEventListener("input", () => saveSetting());
  } else {
    wrap.innerHTML = `
      <div class="field">
        <label>Submit button text</label>
        <input type="text" id="s-submit-label" value="${esc(s.submitLabel||"")}" placeholder="${getSubmitPlaceholder(target)}">
      </div>
    `;
    document.getElementById("s-submit-label")?.addEventListener("input", () => saveSetting());
  }
}

async function saveSetting() {
  if (!memberPerms.can_edit_settings) return;
  const title = document.getElementById("s-title")?.value.trim();
  if (title) {
    formData.title = title;
    document.getElementById("topbar-form-title").textContent = title;
    const settingPayload = { title, description: document.getElementById("s-desc")?.value.trim() || null };
    if (formData?.is_published) { settingPayload.is_published = false; formData.is_published = false; updatePublishBtn(); }
    await _sb.from("forms").update(settingPayload).eq("id", formId);
  }
  settings.slug        = document.getElementById("s-slug")?.value.trim() || null;
  settings.target      = document.getElementById("s-target")?.value || "wa";
  settings.waPrefix    = document.getElementById("s-wa-prefix")?.value || "+62";
  settings.waNumber    = document.getElementById("s-wa-number")?.value.trim() || "";
  settings.tgUsername  = document.getElementById("s-tg-user")?.value.trim() || "";
  settings.language    = document.getElementById("s-lang")?.value || "en";
  settings.openAt      = document.getElementById("s-open-at")?.value  || null;
  settings.closeAt     = document.getElementById("s-close-at")?.value || null;
  const tgt = document.getElementById("s-target")?.value || "wa";
  if (tgt === "both") {
    settings.submitLabelWa = document.getElementById("s-submit-label-wa")?.value.trim() || "";
    settings.submitLabelTg = document.getElementById("s-submit-label-tg")?.value.trim() || "";
    settings.submitLabel   = "";
  } else {
    settings.submitLabel   = document.getElementById("s-submit-label")?.value.trim() || "";
    settings.submitLabelWa = "";
    settings.submitLabelTg = "";
  }
  scheduleSave();
}

// ── Publish ───────────────────────────────────────────────────
function updatePublishBtn() {
  const btn = document.getElementById("publish-btn");
  const published = formData?.is_published;
  const openAt  = settings.openAt;
  const closeAt = settings.closeAt;
  const now     = new Date();
  let scheduleNote = "";
  if (published && openAt && new Date(openAt) > now) {
    scheduleNote = ` · Opens ${new Date(openAt).toLocaleString(undefined,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}`;
  } else if (published && closeAt && new Date(closeAt) > now) {
    scheduleNote = ` · Closes ${new Date(closeAt).toLocaleString(undefined,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}`;
  }
  btn.innerHTML = published
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M20 6 9 17l-5-5"/></svg> Published${scheduleNote}`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M5 12h14M12 5l7 7-7 7"/></svg> Publish`;
  btn.style.background = published ? "var(--teal-deep)" : "";
}

document.getElementById("publish-btn").addEventListener("click", async () => {
  const newState = !formData?.is_published;

  // Validasi hanya saat akan publish (bukan unpublish)
  if (newState) {
    // Cek judul form
    const titleVal = (document.getElementById("s-title")?.value || formData?.title || "").trim();
    if (!titleVal) {
      toast("Form title cannot be empty.", "error");
      document.getElementById("settings-panel").classList.add("open");
      setTimeout(() => document.getElementById("s-title")?.focus(), 150);
      return;
    }

    // Cek nomor WA / username TG sesuai target
    const target = settings.target || "wa";
    const waNum  = (settings.waNumber || "").trim();
    const tgUser = (settings.tgUsername || "").trim();

    if (target === "wa" && !waNum) {
      toast("Enter your WhatsApp number", "error");
      document.getElementById("settings-panel").classList.add("open");
      setTimeout(() => document.getElementById("s-wa-number")?.focus(), 150);
      return;
    }
    if (target === "tg" && !tgUser) {
      toast("Enter your Telegram username", "error");
      document.getElementById("settings-panel").classList.add("open");
      setTimeout(() => document.getElementById("s-tg-user")?.focus(), 150);
      return;
    }
    if (target === "both" && !waNum && !tgUser) {
      toast("Enter your WhatsApp number and/or Telegram username", "error");
      document.getElementById("settings-panel").classList.add("open");
      return;
    }
    if (target === "both" && !waNum) {
      toast("Enter your WhatsApp number", "error");
      document.getElementById("settings-panel").classList.add("open");
      setTimeout(() => document.getElementById("s-wa-number")?.focus(), 150);
      return;
    }
    if (target === "both" && !tgUser) {
      toast("Enter your Telegram username", "error");
      document.getElementById("settings-panel").classList.add("open");
      setTimeout(() => document.getElementById("s-tg-user")?.focus(), 150);
      return;
    }
  }

  await saveNow();
  const { error } = await _sb.from("forms").update({ is_published: newState }).eq("id", formId);
  if (error) { toast("Failed to " + (newState ? "publish" : "unpublish"), "error"); return; }
  formData.is_published = newState;
  updatePublishBtn();

  if (newState) {
    // Redirect ke workspace setelah publish
    const wsId = formData?.workspace_id;
    toast("Form published! Redirecting…");
    setTimeout(() => {
      window.location.href = wsId
        ? `dashboard/?ws=${wsId}`
        : "dashboard/";
    }, 1200);
  } else {
    toast("Form unpublished");
  }
});

// ── Settings panel toggle ─────────────────────────────────────
document.getElementById("settings-toggle-btn").addEventListener("click", () => {
  document.getElementById("settings-panel").classList.toggle("open");
});
document.getElementById("settings-close-btn").addEventListener("click", () => {
  document.getElementById("settings-panel").classList.remove("open");
});

// ── Preview ───────────────────────────────────────────────────
document.getElementById("preview-btn").addEventListener("click", () => {
  const body = document.getElementById("preview-body");
  const s = settings;
  const target = s.target || "wa";
  let html = `<h2 style="font-size:18px;font-weight:800;margin:0 0 6px">${esc(formData?.title || "Form")}</h2>`;
  if (formData?.description) html += `<p style="font-size:13.5px;color:var(--text-soft);margin:0 0 20px">${esc(formData.description)}</p>`;
  questions.forEach((q, i) => { html += buildPreviewField(q, i); });
  html += `
    <div style="margin-top:24px;display:flex;flex-direction:column;gap:10px">
      ${target !== "tg" ? `<button class="btn btn-solid" style="background:#25D366;color:#fff;border-color:#25D366;flex:1;min-width:160px">
        <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.997 0C5.373 0 0 5.373 0 12c0 2.122.559 4.112 1.532 5.835L.054 23.94l6.285-1.448A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.624 0 11.997 0zm.003 21.818a9.82 9.82 0 0 1-5.022-1.376l-.36-.214-3.733.979 1.001-3.656-.234-.376A9.82 9.82 0 0 1 2.182 12c0-5.421 4.41-9.818 9.818-9.818 5.42 0 9.818 4.397 9.818 9.818 0 5.42-4.397 9.818-9.818 9.818z"/></svg>
        ${s.submitLabelWa || s.submitLabel || "Send WateForm to WhatsApp"}
      </button>` : ""}
      ${target !== "wa" ? `<button class="btn btn-solid" style="background:#229ED9;color:#fff;border-color:#229ED9;flex:1;min-width:160px">
        <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 14.147l-2.95-.924c-.64-.203-.655-.64.136-.953l11.57-4.461c.537-.194 1.006.131.968.412z"/></svg>
        ${s.submitLabelTg || s.submitLabel || "Send WateForm to Telegram"}
      </button>` : ""}
    </div>
  `;
  body.innerHTML = html;
  openModal("preview-modal");
});

function buildPreviewField(q, i) {
  if (q.type === "title") {
    return `<div style="margin-bottom:20px">
      <h3 style="font-size:16px;font-weight:700;margin:0 0 4px">${esc(q.title)}</h3>
      ${q.subtitle ? `<div style="font-size:13px;color:var(--text-soft)">${q.subtitle}</div>` : ""}
    </div>`;
  }
  let control = "";
  const ph = esc(q.placeholder || "");
  if (q.type === "short")    control = `<input type="text" placeholder="${ph}" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--bg-raised);color:var(--text)">`;
  if (q.type === "long")     control = `<textarea placeholder="${ph}" rows="3" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--bg-raised);color:var(--text);resize:vertical"></textarea>`;
  if (q.type === "number")   control = `<input type="number" placeholder="${ph}" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--bg-raised);color:var(--text)">`;
  if (q.type === "date")     control = `<input type="date" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--bg-raised);color:var(--text)">`;
  if (q.type === "email")    control = `<input type="email" placeholder="${q.gmailOnly ? "you@gmail.com" : ph}" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--bg-raised);color:var(--text)">`;
  if (q.type === "checkbox") { const cbOpts = q.checkboxOptions || q.options || []; control = `<div style="display:flex;flex-direction:column;gap:6px">${cbOpts.map(o=>`<label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:14px"><input type="checkbox"> ${esc(o)}</label>`).join("")}${q.checkboxAllowOther ? `<label style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:14px"><input type="checkbox"> Other: <input type="text" placeholder="Specify…" style="flex:1;border:none;outline:none;background:transparent;font-size:14px;color:var(--text)"></label>` : ""}</div>`; }
  if (q.type === "phone")    control = `<div style="display:flex;gap:8px"><select style="width:120px;padding:8px;border:1px solid var(--border);border-radius:8px;font-size:13px;background:var(--bg-raised);color:var(--text)"><option>${esc(q.phonePrefix||"+62")}</option></select><input type="tel" placeholder="${ph}" style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--bg-raised);color:var(--text)"></div>`;
  if (q.type === "rating")   control = `<div style="display:flex;gap:6px">${Array(q.maxRating||5).fill("★").map(s=>`<span style="font-size:24px;cursor:pointer;color:var(--teal)">★</span>`).join("")}</div>`;
  if (q.type === "dropdown") control = `<select style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--bg-raised);color:var(--text);appearance:none"><option value="">Select…</option>${(q.options||[]).map(o=>`<option>${esc(o)}</option>`).join("")}</select>`;
  if (q.type === "choice")   control = `<div style="display:flex;flex-direction:column;gap:6px">${(q.options||[]).map(o=>`<label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:14px"><input type="radio" name="q${i}"> ${esc(o)}</label>`).join("")}${q.allowOther ? `<label style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:14px"><input type="radio" name="q${i}"> Other: <input type="text" placeholder="Specify…" style="flex:1;border:none;outline:none;background:transparent;font-size:14px;color:var(--text)"></label>` : ""}</div>`;
  if (q.type === "image")    control = q.mediaUrl ? `<img src="${esc(q.mediaUrl)}" style="max-width:100%;border-radius:8px">` : `<div style="background:var(--bg-mid);border:1px solid var(--border);border-radius:8px;padding:32px;text-align:center;color:var(--text-muted);font-size:13px">Image will appear here</div>`;
  if (q.type === "video")    control = q.mediaUrl ? `<video src="${esc(q.mediaUrl)}" controls style="width:100%;border-radius:8px"></video>` : `<div style="background:var(--bg-mid);border:1px solid var(--border);border-radius:8px;padding:32px;text-align:center;color:var(--text-muted);font-size:13px">Video will appear here</div>`;

  return `
    <div style="margin-bottom:20px">
      ${q.image ? `<img src="${esc(q.image)}" style="max-width:100%;border-radius:8px;margin-bottom:8px">` : ""}
      ${q.type !== "checkbox" ? `<div style="font-size:14px;font-weight:600;margin-bottom:4px">${esc(q.title)}${q.required ? `<span style="color:var(--red);margin-left:2px">*</span>` : ""}</div>` : ""}
      ${q.subtitle ? `<div style="font-size:12.5px;color:var(--text-soft);margin-bottom:6px">${q.subtitle}</div>` : ""}
      ${control}
    </div>
  `;
}

// ── Enter / Escape key support ────────────────────────────────
document.addEventListener("keydown", e => {
  // Escape: close topmost open modal
  if (e.key === "Escape") {
    const openBd = [...document.querySelectorAll(".modal-backdrop.open")].pop();
    if (openBd) { openBd.classList.remove("open"); return; }
  }

  // Enter in edit modal body: save (unless inside textarea or contenteditable)
  if (e.key === "Enter" && !e.shiftKey) {
    const editModal = document.getElementById("edit-modal");
    if (editModal?.classList.contains("open")) {
      const tag = document.activeElement?.tagName?.toLowerCase();
      const ce  = document.activeElement?.contentEditable;
      if (tag !== "textarea" && ce !== "true") {
        e.preventDefault();
        document.getElementById("edit-save-btn")?.click();
        return;
      }
    }
  }
});

// ── Boot ──────────────────────────────────────────────────────
init();