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
  { type:"file_upload", label:"File Upload",    icon:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',   desc:"User uploads a file" },
  { type:"url_input",   label:"URL",            icon:'<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',  desc:"Clickable link set by owner" },
  { type:"color",       label:"Color Picker",   icon:'<circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12.5" r="2.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',   desc:"Hex, RGB, HSL picker" },
  { type:"password",    label:"Password Gate",  icon:'<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',  desc:"Owner sets a password" },
  { type:"toggle",      label:"Toggle Switch",   icon:'<rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="16" cy="12" r="4" fill="currentColor" stroke="none"/>', desc:"On / Off toggle" },
  { type:"multiselect", label:"Multi-select Dropdown", icon:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>', desc:"Select multiple from dropdown" },
  { type:"likert",      label:"Likert Scale",    icon:'<circle cx="4" cy="12" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="22" cy="12" r="2"/><line x1="4" y1="12" x2="22" y2="12"/>', desc:"Agreement scale" },
  { type:"matrix",      label:"Matrix / Grid",   icon:'<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>', desc:"Table-style grid" },
  { type:"multi_input", label:"Multiple Inputs",  icon:'<path d="M8 6h13M8 12h13"/><path d="M3 6h.01M3 12h.01"/><path d="M3 18h.01M8 18h13"/>', desc:"Multiple labeled fields" },
  { type:"datetime",    label:"Date & Time",      icon:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4"/>',  desc:"Date, time, week, month, year" },
  { type:"ranking",     label:"Ranking",          icon:'<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',   desc:"Drag to rank options" },
  { type:"emoji_rating",label:"Emoji Rating",     icon:'<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',  desc:"Rate with emoji faces" },
  { type:"slider",      label:"Slider",           icon:'<line x1="3" y1="12" x2="21" y2="12"/><circle cx="9" cy="12" r="3" fill="currentColor" stroke="none"/>',  desc:"Drag slider (0–100)" },
  { type:"nps_score",   label:"NPS Score",        icon:'<rect x="2" y="7" width="4" height="14" rx="1"/><rect x="9" y="4" width="4" height="17" rx="1"/><rect x="16" y="2" width="4" height="19" rx="1"/>',  desc:"Net Promoter Score (0–10)" },
  { type:"map",         label:"Map / Location",   icon:'<path d="M21 10c0 6-9 13-9 13S3 16 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',                                                              desc:"Map picker + GPS + address" },
  { type:"divider",     label:"Divider",          icon:'<line x1="3" y1="12" x2="21" y2="12" stroke-width="2.5"/><line x1="3" y1="7" x2="21" y2="7" opacity=".3"/><line x1="3" y1="17" x2="21" y2="17" opacity=".3"/>',  desc:"Horizontal rule / separator" },
  { type:"spacer",      label:"Spacer",           icon:'<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M8 21H5a2 2 0 0 0-2-2v-3M21 16v3a2 2 0 0 1-2 2h-3"/>',                                              desc:"Blank vertical space" },
  { type:"button_link", label:"Button (link)",    icon:'<rect x="3" y="8" width="18" height="8" rx="3"/><path d="M9 12h6M13 10l2 2-2 2"/>',                                                                          desc:"Button that opens a URL" },
  { type:"page_break",  label:"Page Break",       icon:'<path d="M5 12h14"/><path d="M15 8l4 4-4 4"/><path d="M9 8l-4 4 4 4"/>',                                                                                     desc:"Split form into pages (Next/Prev)" },
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
let wsShortId = "";
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

// ── Media upload (Supabase Storage) ─────────────────────────────
async function uploadFormMedia(file) {
  const ext  = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${formId || "misc"}/${Date.now()}-${uid()}${ext ? "." + ext : ""}`;
  const { error } = await _sb.storage.from("form-media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) {
    // Give the user a clear message when the storage bucket hasn't been created yet
    const msg = error.message || String(error);
    if (msg.includes("Bucket not found") || msg.includes("not found") || error.statusCode === 404) {
      throw new Error("Storage bucket not set up. Please run migration 20260806_009_form_media_bucket.sql in Supabase SQL Editor first.");
    }
    throw error;
  }
  const { data } = _sb.storage.from("form-media").getPublicUrl(path);
  return data?.publicUrl || "";
}

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
    const { data: ws } = await _sb.from("workspaces").select("owner_id, short_id").eq("id", wsId).single();
    wsShortId = ws?.short_id || "";
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
    if (def.type === "page_break") return; // Added via dedicated button, not the picker
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
    // file_upload
    allowedFileTypes: "",
    maxFileSizeMb: 10,
    // url_input
    urlHref: "", urlLabel: "",
    // color
    colorDefault: "#2BBDA4",
    // password
    passwordValue: "",
    // toggle
    toggleDefault: false,
    toggleOnLabel: "Yes",
    toggleOffLabel: "No",
    // multiselect
    multiselectOptions: ["Option 1","Option 2","Option 3"],
    multiselectPlaceholder: "Select options…",
    multiselectMax: 0,
    // likert
    likertStatement: "",
    likertScale: 5,
    likertStartLabel: "Strongly Disagree",
    likertEndLabel: "Strongly Agree",
    likertRows: [""],
    // matrix
    matrixRows: ["Row 1","Row 2"],
    matrixCols: ["Column 1","Column 2","Column 3"],
    matrixType: "radio",
    // multi_input
    multiInputFields: [{label:"Field 1", placeholder:"", type:"text"}, {label:"Field 2", placeholder:"", type:"text"}],
    // datetime
    datetimeMode: "date",
    // ranking
    rankingOptions: ["Option 1","Option 2","Option 3"],
    // emoji_rating
    emojiSet: "5",
    // slider
    sliderMin: 0, sliderMax: 100, sliderStep: 1, sliderDefault: 50,
    sliderMinLabel: "", sliderMaxLabel: "",
    // nps_score
    npsMinLabel: "Not likely", npsMaxLabel: "Very likely",
    // map
    mapLat: null, mapLng: null, mapAddress: "", mapZoom: 13,
    mapAllowGps: true, mapShowAddress: true,
    // divider
    dividerStyle: "solid", dividerColor: "",
    // spacer
    spacerHeight: 32,
    // button_link
    buttonLabel: "Open link", buttonUrl: "", buttonStyle: "primary", buttonAlign: "left",
  };
  questions.push(q);
  renderQuestionCards();
  scheduleSave();
  // open edit modal for the new question (skip for page_break — no settings)
  if (type !== "page_break") openEditModal(questions.length - 1);
}

// ── Compact question card list ─────────────────────────────────
function renderQuestionCards() {
  const center = document.getElementById("builder-center");
  const empty  = document.getElementById("center-empty");

  // Remove existing cards and add-btn (but keep center-empty)
  center.querySelectorAll(".qcard, .center-add-q-btn, .page-break-card, .center-bottom-btns").forEach(el => el.remove());

  if (questions.length === 0) {
    if (empty) empty.style.display = "flex";
    return;
  }
  if (empty) empty.style.display = "none";

  // Count page numbers for labeling
  let pageNum = 1;
  questions.forEach((q, idx) => {
    if (q.type === "page_break") {
      // ── Page break divider ───────────────────────────────────
      const pb = document.createElement("div");
      pb.className = "page-break-card";
      pb.dataset.idx = idx;
      pb.innerHTML = `
        <div class="page-break-line"></div>
        <div class="page-break-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M5 12h14"/><path d="M15 8l4 4-4 4"/><path d="M9 8l-4 4 4 4"/></svg>
          Page ${pageNum} ends here — Page ${pageNum + 1} starts below
        </div>
        <div class="page-break-line"></div>
        <button class="page-break-del" title="Remove page break" data-idx="${idx}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>`;
      pb.querySelector(".page-break-del").addEventListener("click", (e) => {
        e.stopPropagation(); deleteQuestion(idx);
      });
      center.appendChild(pb);
      pageNum++;
      return;
    }

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

  // Add question + Add page break buttons at the bottom
  const btnsRow = document.createElement("div");
  btnsRow.className = "center-bottom-btns";

  const addBtn = document.createElement("button");
  addBtn.className = "add-q-btn center-add-q-btn";
  addBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M12 5v14M5 12h14"/></svg> Add question`;
  addBtn.addEventListener("click", () => openModal("qtype-modal"));

  const addPbBtn = document.createElement("button");
  addPbBtn.className = "add-q-btn center-add-pb-btn";
  addPbBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M5 12h14"/><path d="M15 8l4 4-4 4"/><path d="M9 8l-4 4 4 4"/></svg> Add page break`;
  addPbBtn.addEventListener("click", () => {
    if (!memberPerms.can_edit_questions) { toast("You don't have permission to edit questions", "error"); return; }
    addQuestion("page_break");
  });

  btnsRow.appendChild(addBtn);
  btnsRow.appendChild(addPbBtn);
  center.appendChild(btnsRow);
}

// ── Edit modal ─────────────────────────────────────────────────
function openEditModal(idx) {
  const q = questions[idx];
  if (q.type === "page_break") return; // No edit modal for page breaks
  editingIdx = idx;
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
    { type:"text", id:"em-title", value: q.title, placeholder: isTitle ? "Section heading…" : "Question title…", maxlength:"200", style: isTitle ? "font-size:20px;font-weight:700;letter-spacing:-.3px" : "font-size:15px;font-weight:600" }
  ));

  if (!isTitle) {
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
  }

  // ── Type-specific fields
  if (["short","long","number","date"].includes(q.type)) {
    body.appendChild(makeField("Placeholder", "input",
      { type:"text", id:"em-placeholder", value: q.placeholder, maxlength:"120" }
    ));
  }

  if (q.type === "email") {
    body.appendChild(makeField("Placeholder", "input",
      { type:"text", id:"em-placeholder", value: q.placeholder, maxlength:"120" }
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
      { type:"text", id:"em-placeholder", value: q.placeholder, maxlength:"60" }
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
    // Max selections for checkbox (like multiselect)
    if (q.type === "checkbox") {
      body.appendChild(makeField("Max selections (0 = unlimited)", "input",
        { type:"number", id:"em-cb-max", value: q.checkboxMax||0, min:"0", max:"99", step:"1" }
      ));
    }
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
    fileInp.addEventListener("change", async () => {
      const file = fileInp.files?.[0];
      if (!file) { uploadHint.textContent = "No file chosen"; return; }
      const maxMb = 25;
      if (file.size > maxMb * 1024 * 1024) {
        uploadHint.textContent = `File too large (max ${maxMb}MB).`;
        uploadHint.style.color = "var(--red)";
        fileInp.value = "";
        return;
      }
      uploadHint.style.color = "";
      uploadHint.textContent = "Uploading…";
      uploadBtn.disabled = true;
      try {
        const publicUrl = await uploadFormMedia(file);
        q.imageUploadUrl = publicUrl;
        urlInp.value = publicUrl;      // saveEditToMemory reads mediaUrl from this field
        setMediaTab("url");
        modeInp.value = "url";
        q.imageInputMode = "url";
        uploadHint.textContent = "Uploaded: " + file.name;
        toast("File uploaded");
      } catch (err) {
        console.error("Upload failed:", err);
        const msg = err?.message || "Upload failed. Please try again.";
        uploadHint.textContent = msg;
        uploadHint.style.color = "var(--red)";
        toast(msg.length > 80 ? "Upload failed — check console for details" : msg, "error");
      } finally {
        uploadBtn.disabled = false;
      }
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

  // ── File Upload fields
  if (q.type === "file_upload") {
    body.appendChild(makeField("Label / Title", "input",
      { type:"text", id:"em-file-label", value: q.placeholder || "Upload your file", maxlength:"120" }
    ));
    const ftWrap = document.createElement("div");
    ftWrap.className = "field";
    const ftLbl = document.createElement("label"); ftLbl.textContent = "Allowed file types";
    ftWrap.appendChild(ftLbl);
    const ftSel = document.createElement("select"); ftSel.id = "em-file-types"; ftSel.multiple = true;
    ftSel.style.cssText = "height:130px;width:100%;padding:8px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-mid);color:var(--text);font-size:13px";
    const ftOptions = [
      {v:"image/*",l:"Images (jpg, png, gif, webp…)"},
      {v:"application/pdf",l:"PDF"},
      {v:".doc,.docx",l:"Word Documents"},
      {v:".xls,.xlsx",l:"Spreadsheets"},
      {v:".ppt,.pptx",l:"Presentations"},
      {v:"video/*",l:"Videos"},
      {v:"audio/*",l:"Audio"},
      {v:".zip,.rar,.7z",l:"Archives (zip, rar)"},
      {v:"text/*",l:"Text files"},
    ];
    const curFt = (q.allowedFileTypes || "").split(",").map(s=>s.trim()).filter(Boolean);
    ftOptions.forEach(o => {
      const opt = document.createElement("option"); opt.value = o.v; opt.textContent = o.l;
      if (curFt.includes(o.v)) opt.selected = true;
      ftSel.appendChild(opt);
    });
    ftWrap.appendChild(ftSel);
    const ftHint = document.createElement("div");
    ftHint.style.cssText = "font-size:11px;color:var(--text-muted);margin-top:4px";
    ftHint.textContent = "Hold Ctrl/Cmd to select multiple. Leave blank to allow any.";
    ftWrap.appendChild(ftHint);
    body.appendChild(ftWrap);
    body.appendChild(makeField("Max file size (MB)", "input",
      { type:"number", id:"em-file-maxmb", value: q.maxFileSizeMb || 10, min:"1", max:"100", step:"1" }
    ));
  }

  // ── URL Input fields
  if (q.type === "url_input") {
    body.appendChild(makeField("URL", "input",
      { type:"url", id:"em-url-href", value: q.urlHref || "", placeholder:"https://…", maxlength:"500" }
    ));
    body.appendChild(makeField("Teks link (opsional)", "input",
      { type:"text", id:"em-url-label", value: q.urlLabel || "", placeholder:"Kosongkan untuk tampilkan URL-nya", maxlength:"200" }
    ));
  }

  // ── Color Picker fields
  if (q.type === "color") {
    const colorWrap = document.createElement("div");
    colorWrap.className = "field";
    const colorLbl = document.createElement("label"); colorLbl.textContent = "Default color";
    colorWrap.appendChild(colorLbl);
    const colorInp = document.createElement("input");
    colorInp.type = "color"; colorInp.id = "em-color-default";
    colorInp.value = q.colorDefault || "#2BBDA4";
    colorInp.style.cssText = "width:64px;height:40px;border:1px solid var(--border);border-radius:var(--radius);padding:2px;cursor:pointer;background:var(--bg-mid)";
    colorWrap.appendChild(colorInp);
    body.appendChild(colorWrap);
  }

  // ── Password Gate fields
  if (q.type === "password") {
    const pwWrap = document.createElement("div");
    pwWrap.className = "field";
    const pwLbl = document.createElement("label"); pwLbl.textContent = "Password (set by you, users must enter this)";
    pwWrap.appendChild(pwLbl);
    const pwInp = document.createElement("input");
    pwInp.type = "text"; pwInp.id = "em-password-value";
    pwInp.value = q.passwordValue || "";
    pwInp.placeholder = "Enter the password users must type…";
    pwInp.style.cssText = "width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-mid);color:var(--text);font-size:14px;font-family:inherit";
    pwWrap.appendChild(pwInp);
    const pwHint = document.createElement("div");
    pwHint.style.cssText = "font-size:11px;color:var(--text-muted);margin-top:4px";
    pwHint.textContent = "Users will not be able to submit unless they enter this exact password.";
    pwWrap.appendChild(pwHint);
    body.appendChild(pwWrap);
    // Clear error state on input
    pwInp.addEventListener("input", () => {
      pwInp.style.borderColor = "";
      pwWrap.querySelector(".pw-required-hint")?.remove();
    });
  }

  // ── Toggle Switch fields
  if (q.type === "toggle") {
    const twrap = document.createElement("div"); twrap.className = "field";
    twrap.innerHTML = `<label>Labels</label><div style="display:flex;gap:8px;align-items:center">
      <input type="text" id="em-toggle-off" value="${esc(q.toggleOffLabel||"No")}" placeholder="Off label" style="flex:1;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-mid);color:var(--text);font-size:13px;font-family:inherit">
      <span style="color:var(--text-muted);font-size:12px">Off / On</span>
      <input type="text" id="em-toggle-on" value="${esc(q.toggleOnLabel||"Yes")}" placeholder="On label" style="flex:1;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-mid);color:var(--text);font-size:13px;font-family:inherit">
    </div>`;
    body.appendChild(twrap);
    body.appendChild(makeToggleField("Default state (On)", "em-toggle-default", q.toggleDefault));
  }

  // ── Multi-select Dropdown fields
  if (q.type === "multiselect") {
    body.appendChild(makeField("Placeholder", "input",
      { type:"text", id:"em-ms-placeholder", value: q.multiselectPlaceholder||"Select options…", maxlength:"100" }
    ));
    const msWrap = document.createElement("div"); msWrap.className = "field";
    const msLbl = document.createElement("label"); msLbl.textContent = "Options";
    msWrap.appendChild(msLbl);
    const msOpts = document.createElement("div"); msOpts.className = "choice-options"; msOpts.id = "em-ms-options";
    msWrap.appendChild(msOpts);
    const msAddBtn = document.createElement("button"); msAddBtn.className = "add-option-btn"; msAddBtn.type = "button"; msAddBtn.textContent = "+ Add option";
    msAddBtn.addEventListener("click", () => {
      const opts = collectMsOptions(); opts.push("Option "+(opts.length+1)); renderMsOptions(opts, msOpts);
    });
    msWrap.appendChild(msAddBtn);
    body.appendChild(msWrap);
    renderMsOptions(q.multiselectOptions||[], msOpts);
    body.appendChild(makeField("Max selections (0 = unlimited)", "input",
      { type:"number", id:"em-ms-max", value: q.multiselectMax||0, min:"0", max:"99", step:"1" }
    ));
  }

  // ── Likert Scale fields
  if (q.type === "likert") {
    const scaleWrap = document.createElement("div"); scaleWrap.className = "field";
    const scLbl = document.createElement("label"); scLbl.textContent = "Scale size";
    scaleWrap.appendChild(scLbl);
    const scSel = document.createElement("select"); scSel.id = "em-likert-scale";
    [3,4,5,6,7,10].forEach(n => {
      const opt = document.createElement("option"); opt.value = n; opt.textContent = `${n} points`;
      if ((q.likertScale||5) === n) opt.selected = true;
      scSel.appendChild(opt);
    });
    scaleWrap.appendChild(scSel);
    body.appendChild(scaleWrap);
    body.appendChild(makeField("Start label (left)", "input",
      { type:"text", id:"em-likert-start", value: q.likertStartLabel||"Strongly Disagree", maxlength:"60" }
    ));
    body.appendChild(makeField("End label (right)", "input",
      { type:"text", id:"em-likert-end", value: q.likertEndLabel||"Strongly Agree", maxlength:"60" }
    ));
    // Rows (statements)
    const lrWrap = document.createElement("div"); lrWrap.className = "field";
    const lrLbl = document.createElement("label"); lrLbl.textContent = "Statements / Rows (one per line)";
    lrWrap.appendChild(lrLbl);
    const lrTA = document.createElement("textarea"); lrTA.id = "em-likert-rows";
    lrTA.rows = 4; lrTA.style.cssText = "width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-mid);color:var(--text);font-size:13px;font-family:inherit;resize:vertical";
    lrTA.placeholder = "Statement 1\nStatement 2\nStatement 3";
    lrTA.value = (q.likertRows||[""]).filter(Boolean).join("\n");
    lrWrap.appendChild(lrTA);
    body.appendChild(lrWrap);
  }

  // ── Matrix / Grid fields
  if (q.type === "matrix") {
    const mtWrap = document.createElement("div"); mtWrap.className = "field";
    const mtLbl = document.createElement("label"); mtLbl.textContent = "Rows (one per line)";
    mtWrap.appendChild(mtLbl);
    const mtRowTA = document.createElement("textarea"); mtRowTA.id = "em-matrix-rows";
    mtRowTA.rows = 4; mtRowTA.style.cssText = "width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-mid);color:var(--text);font-size:13px;font-family:inherit;resize:vertical";
    mtRowTA.value = (q.matrixRows||["Row 1","Row 2"]).join("\n");
    mtWrap.appendChild(mtRowTA);
    body.appendChild(mtWrap);
    const mtColWrap = document.createElement("div"); mtColWrap.className = "field";
    const mtColLbl = document.createElement("label"); mtColLbl.textContent = "Columns (one per line)";
    mtColWrap.appendChild(mtColLbl);
    const mtColTA = document.createElement("textarea"); mtColTA.id = "em-matrix-cols";
    mtColTA.rows = 4; mtColTA.style.cssText = "width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-mid);color:var(--text);font-size:13px;font-family:inherit;resize:vertical";
    mtColTA.value = (q.matrixCols||["Column 1","Column 2","Column 3"]).join("\n");
    mtColWrap.appendChild(mtColTA);
    body.appendChild(mtColWrap);
    const mtTypeWrap = document.createElement("div"); mtTypeWrap.className = "field";
    const mtTypeLbl = document.createElement("label"); mtTypeLbl.textContent = "Selection type per row";
    mtTypeWrap.appendChild(mtTypeLbl);
    const mtTypeSel = document.createElement("select"); mtTypeSel.id = "em-matrix-type";
    [{v:"radio",l:"Single choice (radio)"},{v:"checkbox",l:"Multiple choice (checkbox)"}].forEach(({v,l})=>{
      const o = document.createElement("option"); o.value=v; o.textContent=l;
      if ((q.matrixType||"radio")===v) o.selected=true;
      mtTypeSel.appendChild(o);
    });
    mtTypeWrap.appendChild(mtTypeSel);
    body.appendChild(mtTypeWrap);
  }

  // ── Multiple Inputs fields
  if (q.type === "multi_input") {
    const miWrap = document.createElement("div"); miWrap.className = "field";
    const miLbl = document.createElement("label"); miLbl.textContent = "Sub-fields";
    miWrap.appendChild(miLbl);
    const miList = document.createElement("div"); miList.id = "em-mi-list";
    miList.style.cssText = "display:flex;flex-direction:column;gap:8px";
    miWrap.appendChild(miList);
    const miAddBtn = document.createElement("button"); miAddBtn.className = "add-option-btn"; miAddBtn.type = "button"; miAddBtn.textContent = "+ Add field";
    miAddBtn.addEventListener("click", () => {
      const fields = collectMiFields(); fields.push({label:"Field "+(fields.length+1),placeholder:"",type:"text"}); renderMiFields(fields, miList);
    });
    miWrap.appendChild(miAddBtn);
    body.appendChild(miWrap);
    renderMiFields(q.multiInputFields||[{label:"Field 1",placeholder:"",type:"text"}], miList);
  }

  // ── Date & Time fields
  if (q.type === "datetime") {
    const dtWrap = document.createElement("div"); dtWrap.className = "field";
    const dtLbl = document.createElement("label"); dtLbl.textContent = "Date/Time mode";
    dtWrap.appendChild(dtLbl);
    const dtSel = document.createElement("select"); dtSel.id = "em-dt-mode";
    [{v:"date",l:"Date"},{v:"time",l:"Time"},{v:"datetime-local",l:"Date & Time"},{v:"week",l:"Week"},{v:"month",l:"Month"},{v:"year",l:"Year (number input)"}].forEach(({v,l}) => {
      const o = document.createElement("option"); o.value = v; o.textContent = l;
      if ((q.datetimeMode||"date") === v) o.selected = true;
      dtSel.appendChild(o);
    });
    dtWrap.appendChild(dtSel);
    body.appendChild(dtWrap);
  }

  // ── Ranking fields
  if (q.type === "ranking") {
    const rkWrap = document.createElement("div"); rkWrap.className = "field";
    const rkLbl = document.createElement("label"); rkLbl.textContent = "Options to rank (one per line)";
    rkWrap.appendChild(rkLbl);
    const rkTA = document.createElement("textarea"); rkTA.id = "em-ranking-opts";
    rkTA.rows = 5; rkTA.style.cssText = "width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-mid);color:var(--text);font-size:13px;font-family:inherit;resize:vertical";
    rkTA.placeholder = "Option 1\nOption 2\nOption 3";
    rkTA.value = (q.rankingOptions||["Option 1","Option 2","Option 3"]).join("\n");
    rkWrap.appendChild(rkTA);
    body.appendChild(rkWrap);
  }

  // ── Emoji Rating fields
  if (q.type === "emoji_rating") {
    const erWrap = document.createElement("div"); erWrap.className = "field";
    const erLbl = document.createElement("label"); erLbl.textContent = "Emoji set";
    erWrap.appendChild(erLbl);
    const erSel = document.createElement("select"); erSel.id = "em-emoji-set";
    [{v:"2",l:"2 emoji (\u{1F44E} / \u{1F44D})"},{v:"3",l:"3 emoji (\u{1F61E} / \u{1F610} / \u{1F60A})"},{v:"5",l:"5 emoji (\u{1F622} \u{1F641} \u{1F610} \u{1F60A} \u{1F601})"}].forEach(({v,l}) => {
      const o = document.createElement("option"); o.value = v; o.textContent = l;
      if ((q.emojiSet||"5") === v) o.selected = true;
      erSel.appendChild(o);
    });
    erWrap.appendChild(erSel);
    body.appendChild(erWrap);
  }

  // ── Slider fields
  if (q.type === "slider") {
    body.appendChild(makeField("Min value", "input", { type:"number", id:"em-slider-min", value: q.sliderMin!=null?q.sliderMin:0, step:"1" }));
    body.appendChild(makeField("Max value", "input", { type:"number", id:"em-slider-max", value: q.sliderMax!=null?q.sliderMax:100, step:"1" }));
    body.appendChild(makeField("Step", "input", { type:"number", id:"em-slider-step", value: q.sliderStep||1, min:"1" }));
    body.appendChild(makeField("Default value", "input", { type:"number", id:"em-slider-default", value: q.sliderDefault!=null?q.sliderDefault:50, step:"1" }));
    body.appendChild(makeField("Min label (left)", "input", { type:"text", id:"em-slider-min-label", value: q.sliderMinLabel||"", maxlength:"40" }));
    body.appendChild(makeField("Max label (right)", "input", { type:"text", id:"em-slider-max-label", value: q.sliderMaxLabel||"", maxlength:"40" }));
  }

  // ── NPS Score fields
  if (q.type === "nps_score") {
    body.appendChild(makeField("Label for 0 (left)", "input", { type:"text", id:"em-nps-min-label", value: q.npsMinLabel||"Not likely", maxlength:"40" }));
    body.appendChild(makeField("Label for 10 (right)", "input", { type:"text", id:"em-nps-max-label", value: q.npsMaxLabel||"Very likely", maxlength:"40" }));
  }

  // ── Map / Location fields
  if (q.type === "map") {
    body.appendChild(makeToggleField("Allow GPS / current location", "em-map-allow-gps", q.mapAllowGps !== false));
    body.appendChild(makeToggleField("Show address text field", "em-map-show-address", q.mapShowAddress !== false));
    const zWrap = document.createElement("div"); zWrap.className = "field";
    const zLbl = document.createElement("label"); zLbl.textContent = "Default zoom level (1–20)";
    zWrap.appendChild(zLbl);
    const zInp = document.createElement("input"); zInp.type = "number"; zInp.id = "em-map-zoom";
    zInp.value = q.mapZoom || 13; zInp.min = 1; zInp.max = 20; zInp.step = 1;
    zInp.style.cssText = "width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-mid);color:var(--text);font-size:14px;font-family:inherit";
    zWrap.appendChild(zInp);
    body.appendChild(zWrap);
    const hint = document.createElement("div");
    hint.style.cssText = "font-size:12px;color:var(--text-muted);padding:8px 12px;background:var(--bg-mid);border-radius:var(--radius);border:1px solid var(--border)";
    hint.innerHTML = "📍 Respondents can drag a pin on the map, use GPS to auto-fill their location, and type an address. Coordinates + address are saved.";
    body.appendChild(hint);
  }

  // ── Divider fields
  if (q.type === "divider") {
    const dWrap = document.createElement("div"); dWrap.className = "field";
    const dLbl = document.createElement("label"); dLbl.textContent = "Line style";
    dWrap.appendChild(dLbl);
    const dSel = document.createElement("select"); dSel.id = "em-divider-style";
    [{v:"solid",l:"Solid"},{v:"dashed",l:"Dashed"},{v:"dotted",l:"Dotted"},{v:"double",l:"Double"}].forEach(({v,l}) => {
      const o = document.createElement("option"); o.value = v; o.textContent = l;
      if ((q.dividerStyle||"solid") === v) o.selected = true;
      dSel.appendChild(o);
    });
    dWrap.appendChild(dSel); body.appendChild(dWrap);
    const hint2 = document.createElement("div");
    hint2.style.cssText = "font-size:12px;color:var(--text-muted);margin-top:4px";
    hint2.textContent = "Divider is a display-only separator — respondents don't fill it in.";
    body.appendChild(hint2);
  }

  // ── Spacer fields
  if (q.type === "spacer") {
    body.appendChild(makeField("Height (px)", "input", { type:"number", id:"em-spacer-height", value: q.spacerHeight || 32, min:"8", max:"300", step:"4" }));
    const hint3 = document.createElement("div");
    hint3.style.cssText = "font-size:12px;color:var(--text-muted);margin-top:4px";
    hint3.textContent = "Spacer adds blank vertical space — respondents don't fill it in.";
    body.appendChild(hint3);
  }

  // ── Button (link) fields
  if (q.type === "button_link") {
    body.appendChild(makeField("Button label", "input", { type:"text", id:"em-btn-label", value: q.buttonLabel || "Open link", maxlength:"80" }));
    body.appendChild(makeField("URL / Link", "input", { type:"url", id:"em-btn-url", value: q.buttonUrl || "", placeholder:"https://…" }));
    const bStyleWrap = document.createElement("div"); bStyleWrap.className = "field";
    const bStyleLbl = document.createElement("label"); bStyleLbl.textContent = "Style";
    bStyleWrap.appendChild(bStyleLbl);
    const bStyleSel = document.createElement("select"); bStyleSel.id = "em-btn-style";
    [{v:"primary",l:"Primary (filled)"},{v:"outline",l:"Outline"},{v:"ghost",l:"Ghost / text"}].forEach(({v,l}) => {
      const o = document.createElement("option"); o.value = v; o.textContent = l;
      if ((q.buttonStyle||"primary") === v) o.selected = true;
      bStyleSel.appendChild(o);
    });
    bStyleWrap.appendChild(bStyleSel); body.appendChild(bStyleWrap);
    const bAlignWrap = document.createElement("div"); bAlignWrap.className = "field";
    const bAlignLbl = document.createElement("label"); bAlignLbl.textContent = "Alignment";
    bAlignWrap.appendChild(bAlignLbl);
    const bAlignSel = document.createElement("select"); bAlignSel.id = "em-btn-align";
    [{v:"left",l:"Left"},{v:"center",l:"Center"},{v:"right",l:"Right"}].forEach(({v,l}) => {
      const o = document.createElement("option"); o.value = v; o.textContent = l;
      if ((q.buttonAlign||"left") === v) o.selected = true;
      bAlignSel.appendChild(o);
    });
    bAlignWrap.appendChild(bAlignSel); body.appendChild(bAlignWrap);
    const hint4 = document.createElement("div");
    hint4.style.cssText = "font-size:12px;color:var(--text-muted);margin-top:4px";
    hint4.textContent = "Button opens the URL in a new tab. Respondents don't type anything.";
    body.appendChild(hint4);
  }

  // ── Required toggle (not for title/image/video/toggle types)
  if (!isTitle && !["image","video","password","url_input","toggle","divider","spacer","button_link","ranking"].includes(q.type)) {
    body.appendChild(document.createElement("hr"));
    body.appendChild(makeToggleField("Required", "em-required", q.required));
  }

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

// ── Multi-select option helpers ──────────────────────────────
function renderMsOptions(opts, container) {
  container.innerHTML = "";
  opts.forEach((opt, oi) => {
    const row = document.createElement("div"); row.className = "choice-opt-row";
    const inp = document.createElement("input"); inp.type = "text"; inp.value = opt; inp.placeholder = `Option ${oi+1}`; inp.dataset.oi = oi;
    const rmBtn = document.createElement("button"); rmBtn.className = "choice-remove"; rmBtn.type = "button";
    rmBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>`;
    rmBtn.addEventListener("click", () => { const cur = collectMsOptions(); cur.splice(oi,1); renderMsOptions(cur, container); });
    row.appendChild(inp); row.appendChild(rmBtn); container.appendChild(row);
  });
}
function collectMsOptions() {
  const div = document.getElementById("em-ms-options");
  if (!div) return [];
  return Array.from(div.querySelectorAll("input[data-oi]")).map(i => i.value);
}

// ── Multi-input field helpers ─────────────────────────────────
function renderMiFields(fields, container) {
  container.innerHTML = "";
  fields.forEach((f, fi) => {
    const row = document.createElement("div");
    row.style.cssText = "display:flex;gap:6px;align-items:center";
    const lblInp = document.createElement("input"); lblInp.type = "text"; lblInp.value = f.label||""; lblInp.placeholder = "Label"; lblInp.dataset.fi = fi; lblInp.dataset.key = "label";
    lblInp.style.cssText = "flex:1;padding:7px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-mid);color:var(--text);font-size:13px;font-family:inherit";
    const phInp = document.createElement("input"); phInp.type = "text"; phInp.value = f.placeholder||""; phInp.placeholder = "Placeholder"; phInp.dataset.fi = fi; phInp.dataset.key = "placeholder";
    phInp.style.cssText = "flex:1;padding:7px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-mid);color:var(--text);font-size:13px;font-family:inherit";
    const typSel = document.createElement("select"); typSel.dataset.fi = fi; typSel.dataset.key = "type";
    typSel.style.cssText = "padding:7px 8px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-mid);color:var(--text);font-size:12px;font-family:inherit";
    [{v:"text",l:"Text"},{v:"number",l:"Number"},{v:"email",l:"Email"},{v:"date",l:"Date"},{v:"tel",l:"Phone"},{v:"url",l:"URL"}].forEach(({v,l})=>{
      const o = document.createElement("option"); o.value=v; o.textContent=l; if(f.type===v) o.selected=true; typSel.appendChild(o);
    });
    const rmBtn = document.createElement("button"); rmBtn.type = "button"; rmBtn.className = "choice-remove";
    rmBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>`;
    rmBtn.addEventListener("click", () => { const cur = collectMiFields(); cur.splice(fi,1); renderMiFields(cur, container); });
    row.appendChild(lblInp); row.appendChild(phInp); row.appendChild(typSel); row.appendChild(rmBtn);
    container.appendChild(row);
  });
}
function collectMiFields() {
  const div = document.getElementById("em-mi-list");
  if (!div) return [];
  const rows = div.querySelectorAll("div");
  return Array.from(rows).map(row => {
    const inps = row.querySelectorAll("input,select");
    const f = {label:"",placeholder:"",type:"text"};
    inps.forEach(i => { if(i.dataset.key) f[i.dataset.key] = i.value; });
    return f;
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
  if (!["image","video","password","url_input","toggle","divider","spacer","button_link"].includes(q.type)) {
    q.required  = get("em-required")?.checked || false;
  }
  q.gmailOnly   = get("em-gmail-only")?.checked || false;
  if (q.type === "checkbox") {
    q.checkboxOptions = collectOptions();
    q.checkboxAllowOther = get("em-allow-other")?.checked || false;
    q.checkboxMax = Number(get("em-cb-max")?.value) || 0;
  } else {
    q.allowOther  = get("em-allow-other")?.checked || false;
  }
  q.phonePrefix = get("em-phone-prefix")?.value || q.phonePrefix;
  q.maxRating   = Number(get("em-max-rating")?.value) || q.maxRating;
  q.mediaType   = get("em-media-type")?.value || q.mediaType;
  q.imageInputMode = get("em-media-type")?.value || q.imageInputMode;
  q.mediaUrl    = get("em-media-url")?.value || "";
  // toggle
  if (q.type === "toggle") {
    q.toggleOnLabel  = get("em-toggle-on")?.value  || "Yes";
    q.toggleOffLabel = get("em-toggle-off")?.value || "No";
    q.toggleDefault  = get("em-toggle-default")?.checked || false;
  }
  // multiselect
  if (q.type === "multiselect") {
    q.multiselectOptions     = collectMsOptions();
    q.multiselectPlaceholder = get("em-ms-placeholder")?.value || "Select options…";
    q.multiselectMax         = Number(get("em-ms-max")?.value) || 0;
  }
  // likert
  if (q.type === "likert") {
    q.likertScale      = Number(get("em-likert-scale")?.value) || 5;
    q.likertStartLabel = get("em-likert-start")?.value || "Strongly Disagree";
    q.likertEndLabel   = get("em-likert-end")?.value   || "Strongly Agree";
    q.likertRows = (get("em-likert-rows")?.value || "").split("\n").map(s=>s.trim()).filter(Boolean);
    if (!q.likertRows.length) q.likertRows = [""];
  }
  // matrix
  if (q.type === "matrix") {
    q.matrixRows = (get("em-matrix-rows")?.value || "").split("\n").map(s=>s.trim()).filter(Boolean);
    q.matrixCols = (get("em-matrix-cols")?.value || "").split("\n").map(s=>s.trim()).filter(Boolean);
    q.matrixType = get("em-matrix-type")?.value || "radio";
  }
  // multi_input
  if (q.type === "multi_input") {
    q.multiInputFields = collectMiFields();
  }
  // datetime
  if (q.type === "datetime") {
    q.datetimeMode = get("em-dt-mode")?.value || "date";
  }
  // ranking
  if (q.type === "ranking") {
    q.rankingOptions = (get("em-ranking-opts")?.value || "").split("\n").map(s=>s.trim()).filter(Boolean);
    if (!q.rankingOptions.length) q.rankingOptions = ["Option 1","Option 2","Option 3"];
    q.required = false; // ranking never required
  }
  // emoji_rating
  if (q.type === "emoji_rating") {
    q.emojiSet = get("em-emoji-set")?.value || "5";
  }
  // slider
  if (q.type === "slider") {
    q.sliderMin     = Number(get("em-slider-min")?.value)     || 0;
    q.sliderMax     = Number(get("em-slider-max")?.value)     || 100;
    q.sliderStep    = Number(get("em-slider-step")?.value)    || 1;
    q.sliderDefault = Number(get("em-slider-default")?.value) || 50;
    q.sliderMinLabel = get("em-slider-min-label")?.value || "";
    q.sliderMaxLabel = get("em-slider-max-label")?.value || "";
  }
  // nps_score
  if (q.type === "nps_score") {
    q.npsMinLabel = get("em-nps-min-label")?.value || "Not likely";
    q.npsMaxLabel = get("em-nps-max-label")?.value || "Very likely";
  }
  // map
  if (q.type === "map") {
    q.mapAllowGps   = get("em-map-allow-gps")?.checked !== false;
    q.mapShowAddress = get("em-map-show-address")?.checked !== false;
    q.mapZoom       = Number(get("em-map-zoom")?.value) || 13;
  }
  // divider
  if (q.type === "divider") {
    q.dividerStyle = get("em-divider-style")?.value || "solid";
  }
  // spacer
  if (q.type === "spacer") {
    q.spacerHeight = Number(get("em-spacer-height")?.value) || 32;
  }
  // button_link
  if (q.type === "button_link") {
    q.buttonLabel = get("em-btn-label")?.value || "Open link";
    q.buttonUrl   = get("em-btn-url")?.value   || "";
    q.buttonStyle = get("em-btn-style")?.value || "primary";
    q.buttonAlign = get("em-btn-align")?.value || "left";
  }
  // file_upload
  if (q.type === "file_upload") {
    q.placeholder = get("em-file-label")?.value || "Upload your file";
    const ftSel = document.getElementById("em-file-types");
    if (ftSel) {
      q.allowedFileTypes = Array.from(ftSel.selectedOptions).map(o=>o.value).join(",");
    }
    q.maxFileSizeMb = Number(get("em-file-maxmb")?.value) || 10;
  }
  // url_input
  if (q.type === "url_input") {
    q.urlHref  = get("em-url-href")?.value.trim()  || "";
    q.urlLabel = get("em-url-label")?.value.trim() || "";
  }
  // color
  if (q.type === "color") {
    q.colorDefault = get("em-color-default")?.value || "#2BBDA4";
  }
  // password
  if (q.type === "password") {
    const pwVal = get("em-password-value")?.value || "";
    if (!pwVal.trim()) {
      // Show error on the password input
      const pwInpEl = get("em-password-value");
      if (pwInpEl) {
        pwInpEl.style.borderColor = "var(--red)";
        pwInpEl.focus();
        // Show hint
        const pwHintEl = pwInpEl.parentElement?.querySelector(".pw-required-hint");
        if (!pwHintEl) {
          const h = document.createElement("div");
          h.className = "pw-required-hint";
          h.style.cssText = "font-size:12px;color:var(--red);margin-top:4px";
          h.textContent = "Password is required before saving.";
          pwInpEl.parentElement?.appendChild(h);
        }
      }
      return; // abort save
    }
    q.passwordValue = pwVal;
    const pwInpEl = get("em-password-value");
    if (pwInpEl) { pwInpEl.style.borderColor = ""; }
    document.querySelector(".pw-required-hint")?.remove();
  }
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
  // formData.slug is the custom slug column; settings.slug is legacy — prefer the column
  const formSlug = formData?.slug || "";

  body.innerHTML = `
    <div class="field">
      <label class="toggle-row" style="cursor:pointer">
        <span class="toggle-label" style="font-weight:600;color:var(--text)">Active</span>
        <label class="toggle">
          <input type="checkbox" id="s-active" ${s.isActive === false ? "" : "checked"}>
          <span class="toggle-track"></span>
        </label>
      </label>
    </div>
    <div class="field">
      <label class="toggle-row" style="cursor:pointer">
        <span class="toggle-label" style="font-weight:600;color:var(--text)">Remove watermark</span>
        <label class="toggle">
          <input type="checkbox" id="s-watermark" ${s.removeWatermark === true ? "checked" : ""}>
          <span class="toggle-track"></span>
        </label>
      </label>
    </div>
    <div class="settings-sep"></div>
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
      <div id="s-slug-preview" style="display:flex;align-items:center;gap:4px;background:var(--bg-mid);border:1px solid var(--border);border-radius:var(--radius);padding:9px 12px;font-size:13px;">
        <span style="color:var(--text-muted);white-space:nowrap" id="s-slug-prefix">${window.location.host}/</span>
        <input type="text" id="s-slug" value="${esc(formSlug)}" maxlength="40" minlength="4"
          placeholder="${esc((wsShortId || "xxxx") + "/" + (formData?.short_id || "xxxx"))}"
          pattern="[A-Za-z0-9._~-]+" autocapitalize="off" autocorrect="off" spellcheck="false"
          style="border:none;background:transparent;padding:0;outline:none;font-size:13px;width:100%;color:var(--text)">
      </div>
      <div id="s-slug-hint" style="font-size:12px;margin-top:5px;min-height:18px;display:flex;align-items:center;gap:5px"></div>
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
        <div class="phone-wrap" style="max-width:340px">
          <select id="s-wa-prefix" class="phone-prefix">
            ${COUNTRY_CODES.map(c=>`<option value="${c.code}" ${(s.waPrefix||"+62")===c.code?"selected":""}>${c.code} ${c.label.split(" ")[0]}</option>`).join("")}
          </select>
          <input type="tel" id="s-wa-number" inputmode="numeric" pattern="[0-9]*" value="${esc(s.waNumber||"")}" style="min-width:0;flex:1">
        </div>
      </div>
    </div>
    <div id="s-tg-wrap">
      <div class="field">
        <label>Telegram username</label>
        <div style="display:flex;align-items:center;gap:4px;background:var(--bg-mid);border:1px solid var(--border);border-radius:var(--radius);padding:9px 12px">
          <span style="color:var(--text-muted)">@</span>
          <input type="text" id="s-tg-user" value="${esc(s.tgUsername||"")}" placeholder="username"
            pattern="[A-Za-z0-9_]+" maxlength="32" autocapitalize="off" autocorrect="off" spellcheck="false"
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
    </div>
    <div class="field" id="s-closed-msg-wrap" style="display:${s.closeAt ? '' : 'none'}">
      <label style="display:flex;align-items:center;gap:6px">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        Closed message <span style="font-size:11px;font-weight:400;color:var(--text-muted)">(optional)</span>
      </label>
      <textarea id="s-closed-msg" rows="3" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-mid);color:var(--text);font-size:13px;font-family:inherit;resize:vertical;line-height:1.5">${esc(s.closedMessage||"")}</textarea>
    </div>
  `;

  updateTargetVisibility();
  document.getElementById("s-target").addEventListener("change", () => {
    settings.target = document.getElementById("s-target").value;
    updateTargetVisibility();
    saveSetting();
  });
  document.getElementById("s-active")?.addEventListener("change", () => saveSetting());
  document.getElementById("s-watermark")?.addEventListener("change", () => saveSetting());
  ["s-title","s-desc","s-slug","s-wa-number","s-tg-user"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", () => saveSetting());
  });
  // Public URL: strip anything that isn't a letter, digit, or a URL-safe symbol (no spaces)
  let _slugCheckTimer = null;
  document.getElementById("s-slug")?.addEventListener("input", (e) => {
    const cleaned = e.target.value.replace(/[^A-Za-z0-9._~-]/g, "");
    if (cleaned !== e.target.value) e.target.value = cleaned;

    const hint = document.getElementById("s-slug-hint");
    const val = e.target.value.trim();

    // Reset hint
    if (hint) { hint.textContent = ""; hint.style.color = ""; }
    clearTimeout(_slugCheckTimer);

    if (!val || val.length < 4) return; // let saveSetting() handle the error msg
    if (val === (formData?.slug || "")) return; // same as current, no need to check

    // Show checking state
    if (hint) {
      hint.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:spin 1s linear infinite;flex-shrink:0"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Checking availability…';
      hint.style.color = "var(--text-muted)";
    }

    _slugCheckTimer = setTimeout(async () => {
      try {
        const { data, error } = await _sb
          .from("forms")
          .select("id")
          .eq("slug", val)
          .neq("id", formId)
          .maybeSingle();
        if (error) throw error;
        if (hint) {
          if (data) {
            // Already taken
            hint.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg> URL sudah dipakai, coba yang lain';
            hint.style.color = "var(--red)";
            document.getElementById("s-slug")?.classList.add("input-error");
          } else {
            // Available
            hint.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> URL tersedia';
            hint.style.color = "var(--teal)";
            document.getElementById("s-slug")?.classList.remove("input-error");
          }
        }
      } catch(err) {
        if (hint) { hint.textContent = ""; }
      }
    }, 500);
  });
  // WhatsApp number: digits only, numeric keyboard on mobile
  document.getElementById("s-wa-number")?.addEventListener("input", (e) => {
    const cleaned = e.target.value.replace(/[^0-9]/g, "");
    if (cleaned !== e.target.value) e.target.value = cleaned;
  });
  // Telegram username: letters, digits, underscore only — no spaces or unsupported symbols
  document.getElementById("s-tg-user")?.addEventListener("input", (e) => {
    const cleaned = e.target.value.replace(/[^A-Za-z0-9_]/g, "");
    if (cleaned !== e.target.value) e.target.value = cleaned;
  });
  ["s-wa-prefix","s-lang"].forEach(id => {
    document.getElementById(id)?.addEventListener("change", () => saveSetting());
  });
  ["s-open-at","s-close-at"].forEach(id => {
    document.getElementById(id)?.addEventListener("change", () => {
      saveSetting();
      // Show closed-message field only when closeAt is set
      const closeAtVal = document.getElementById("s-close-at")?.value;
      const wrap = document.getElementById("s-closed-msg-wrap");
      if (wrap) wrap.style.display = closeAtVal ? "" : "none";
    });
  });
  document.getElementById("s-closed-msg")?.addEventListener("input", () => saveSetting());
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
  const slugInput = document.getElementById("s-slug");
  const slugHint  = document.getElementById("s-slug-hint");
  // Public URL is optional; if provided, may only contain letters, digits, and URL-safe symbols (no spaces)
  let newSlug = (slugInput?.value || "").replace(/[^A-Za-z0-9._~-]/g, "").trim() || null;
  if (slugInput && slugInput.value !== (newSlug || "")) slugInput.value = newSlug || "";
  if (newSlug && newSlug.length < 4) {
    if (slugHint) {
      slugHint.textContent = "Custom link must be at least 4 characters.";
      slugHint.style.color = "var(--red)";
    }
    slugInput?.classList.add("input-error");
    newSlug = formData?.slug || null; // don't persist an invalid value
  } else {
    // Check if slug is taken by another form before saving
    if (newSlug !== settings.slug) {
      if (!newSlug) {
        // Slug dikosongkan — langsung simpan null
        if (slugHint) { slugHint.textContent = ""; slugHint.style.color = ""; }
        slugInput?.classList.remove("input-error");
        await _sb.from("forms").update({ slug: null }).eq("id", formId);
        if (formData) formData.slug = null;
      } else {
        const { data: existingSlug } = await _sb
          .from("forms")
          .select("id")
          .eq("slug", newSlug)
          .neq("id", formId)
          .maybeSingle();
        if (existingSlug) {
          if (slugHint) {
            slugHint.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;vertical-align:middle"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg> URL sudah dipakai, coba yang lain';
            slugHint.style.color = "var(--red)";
          }
          slugInput?.classList.add("input-error");
          newSlug = formData?.slug || null; // revert
        } else {
          if (slugHint) { slugHint.textContent = ""; slugHint.style.color = ""; }
          slugInput?.classList.remove("input-error");
          // Save into the dedicated `slug` column; short_id stays as the auto-generated ID
          await _sb.from("forms").update({ slug: newSlug }).eq("id", formId);
          if (formData) formData.slug = newSlug;
        }
      }
    } else {
      if (slugHint) { slugHint.textContent = ""; slugHint.style.color = ""; }
      slugInput?.classList.remove("input-error");
    }
  }
  settings.slug        = newSlug;
  settings.isActive    = document.getElementById("s-active")?.checked !== false;
  settings.removeWatermark = document.getElementById("s-watermark")?.checked === true;
  settings.target      = document.getElementById("s-target")?.value || "wa";
  settings.waPrefix    = document.getElementById("s-wa-prefix")?.value || "+62";
  settings.waNumber    = (document.getElementById("s-wa-number")?.value || "").replace(/[^0-9]/g, "");
  settings.tgUsername  = (document.getElementById("s-tg-user")?.value || "").replace(/[^A-Za-z0-9_]/g, "");
  settings.language    = document.getElementById("s-lang")?.value || "en";
  settings.openAt        = document.getElementById("s-open-at")?.value  || null;
  settings.closeAt       = document.getElementById("s-close-at")?.value || null;
  settings.closedMessage = document.getElementById("s-closed-msg")?.value.trim() || null;
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
  if (q.type === "dropdown") {
    const ddOpts = q.options || [];
    control = ddOpts.length > 10
      ? `<div style="position:relative"><input type="text" placeholder="— Select (searchable) —" readonly style="width:100%;padding:8px 36px 8px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--bg-raised);color:var(--text);cursor:pointer"><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' width='16' height='16' style='position:absolute;right:10px;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--text-muted)'><path d='m6 9 6 6 6-6'/></svg><div style='font-size:11px;color:var(--text-muted);margin-top:4px'>🔍 Searchable dropdown (${ddOpts.length} options)</div></div>`
      : `<select style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--bg-raised);color:var(--text);appearance:none"><option value="">Select…</option>${ddOpts.map(o=>`<option>${esc(o)}</option>`).join("")}</select>`;
  }
  if (q.type === "choice")   control = `<div style="display:flex;flex-direction:column;gap:6px">${(q.options||[]).map(o=>`<label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:14px"><input type="radio" name="q${i}"> ${esc(o)}</label>`).join("")}${q.allowOther ? `<label style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:14px"><input type="radio" name="q${i}"> Other: <input type="text" placeholder="Specify…" style="flex:1;border:none;outline:none;background:transparent;font-size:14px;color:var(--text)"></label>` : ""}</div>`;
  if (q.type === "image")    control = q.mediaUrl ? `<img src="${esc(q.mediaUrl)}" style="width:100%;max-height:360px;object-fit:cover;border-radius:10px;display:block">` : `<div style="background:var(--bg-mid);border:1px solid var(--border);border-radius:10px;padding:48px;text-align:center;color:var(--text-muted);font-size:13px"><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' width='32' height='32' style='opacity:.4;display:block;margin:0 auto 8px'><rect x='3' y='3' width='18' height='18' rx='2'/><circle cx='8.5' cy='8.5' r='1.5'/><path d='m21 15-5-5L5 21'/></svg>Image will appear here</div>`;
  if (q.type === "video")    control = q.mediaUrl ? `<video src="${esc(q.mediaUrl)}" controls style="width:100%;border-radius:10px;display:block"></video>` : `<div style="background:var(--bg-mid);border:1px solid var(--border);border-radius:10px;padding:48px;text-align:center;color:var(--text-muted);font-size:13px"><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' width='32' height='32' style='opacity:.4;display:block;margin:0 auto 8px'><rect x='2' y='4' width='20' height='16' rx='2'/><polygon points='10 9 15 12 10 15 10 9'/></svg>Video will appear here</div>`;
  if (q.type === "file_upload") control = `<div style="border:2px dashed var(--border);border-radius:10px;padding:24px;text-align:center;color:var(--text-muted);font-size:13px"><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' width='28' height='28' style='opacity:.5;margin:0 auto 8px;display:block'><path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='17 8 12 3 7 8'/><line x1='12' y1='3' x2='12' y2='15'/></svg>${esc(q.placeholder || "Upload your file")}<br><span style='font-size:11px'>${q.allowedFileTypes ? q.allowedFileTypes.replace(/,/g,", ") : "Any file"} · Max ${q.maxFileSizeMb||10}MB</span></div>`;
  if (q.type === "url_input") { const _href=esc(q.urlHref||""); const _lbl=esc(q.urlLabel||q.urlHref||""); control = _href ? `<a href="${_href}" target="_blank" rel="noopener noreferrer" style="color:#6366f1;text-decoration:underline;font-size:14px;word-break:break-all">${_lbl||_href}</a>` : `<span style="font-size:13px;color:var(--text-muted);font-style:italic">Belum ada URL yang diset</span>`; }
  if (q.type === "color")       control = `<div style="display:flex;align-items:center;gap:12px"><input type="color" value="${esc(q.colorDefault||"#2BBDA4")}" style="width:48px;height:40px;border:1px solid var(--border);border-radius:8px;padding:2px;cursor:pointer"><span style="font-size:13px;color:var(--text-muted)">HEX · RGB · HSL will be shown</span></div>`;
  if (q.type === "password")    control = `<div style="position:relative"><input type="password" placeholder="Enter password…" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--bg-raised);color:var(--text);letter-spacing:.1em"><div style="font-size:11px;color:var(--text-muted);margin-top:4px">🔒 Users must enter the correct password to submit</div></div>`;
  if (q.type === "toggle") control = `<div style="display:flex;align-items:center;gap:12px"><div style="width:50px;height:26px;border-radius:13px;background:var(--border);position:relative;cursor:pointer"><div style="width:22px;height:22px;border-radius:50%;background:#fff;position:absolute;top:2px;left:${q.toggleDefault?"24px":"2px"};box-shadow:0 1px 3px rgba(0,0,0,.2)"></div></div><span style="font-size:14px">${esc(q.toggleDefault?q.toggleOnLabel||"Yes":q.toggleOffLabel||"No")}</span></div>`;
  if (q.type === "multiselect") { const mso = (q.multiselectOptions||[]).slice(0,5); control = `<div style="border:1px solid var(--border);border-radius:8px;padding:9px 12px 8px;background:var(--bg-raised)"><div style="font-size:13px;color:var(--text-muted);margin-bottom:6px">${esc(q.multiselectPlaceholder||"Select options…")}</div><div style="display:flex;flex-wrap:wrap;gap:6px">${mso.map(o=>`<span style="padding:3px 10px;border:1px solid var(--border);border-radius:20px;font-size:12px;cursor:pointer">${esc(o)}</span>`).join("")}${(q.multiselectOptions||[]).length>5?`<span style="font-size:12px;color:var(--text-muted);padding:3px 6px">+${(q.multiselectOptions||[]).length-5} more</span>`:""}</div></div>`; }
  if (q.type === "likert") { const scale = q.likertScale||5; const rows = (q.likertRows||[""]).filter(Boolean); control = `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr><th style="padding:6px 8px;text-align:left;font-weight:500;color:var(--text-muted)">${esc(q.likertStartLabel||"Strongly Disagree")}</th>${Array.from({length:scale},(_,i)=>`<th style="padding:6px 4px;text-align:center;font-size:11px;color:var(--text-muted)">${i+1}</th>`).join("")}<th style="padding:6px 8px;text-align:right;font-weight:500;color:var(--text-muted)">${esc(q.likertEndLabel||"Strongly Agree")}</th></tr></thead><tbody>${(rows.length?rows:["Statement 1","Statement 2"]).map(r=>`<tr style="border-top:1px solid var(--border)"><td style="padding:8px;font-size:13px">${esc(r)}</td>${Array.from({length:scale},(_,i)=>`<td style="padding:8px 4px;text-align:center"><input type="radio" name="l${i}" style="accent-color:var(--teal)"></td>`).join("")}<td></td></tr>`).join("")}</tbody></table></div>`; }
  if (q.type === "matrix") { const rows = q.matrixRows||["Row 1","Row 2"]; const cols = q.matrixCols||["Col 1","Col 2"]; control = `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr><th style="padding:8px;text-align:left;border-bottom:1px solid var(--border)"></th>${cols.map(c=>`<th style="padding:8px 12px;text-align:center;border-bottom:1px solid var(--border);font-weight:600">${esc(c)}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr style="border-top:1px solid var(--border-soft)"><td style="padding:9px 8px;font-size:13px">${esc(r)}</td>${cols.map((_,ci)=>`<td style="padding:9px 12px;text-align:center"><input type="${q.matrixType||"radio"}" name="mx-${r}-${ci}" style="accent-color:var(--teal)"></td>`).join("")}</tr>`).join("")}</tbody></table></div>`; }
  if (q.type === "multi_input") { const mif = q.multiInputFields||[]; control = `<div style="display:flex;flex-direction:column;gap:10px">${mif.map(f=>`<div><div style="font-size:12px;font-weight:600;margin-bottom:4px;color:var(--text)">${esc(f.label||"")}</div><input type="${f.type||"text"}" placeholder="${esc(f.placeholder||"")}" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--bg-raised);color:var(--text)"></div>`).join("")}</div>`; }
  if (q.type === "datetime") { const mode = q.datetimeMode||"date"; const inpType = mode === "year" ? "number" : mode; control = `<input type="${inpType}" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--bg-raised);color:var(--text)" placeholder="${mode==='year'?'YYYY':''}">`; }
  if (q.type === "ranking") { const rkopts = q.rankingOptions||["Option 1","Option 2","Option 3"]; control = `<div style="display:flex;flex-direction:column;gap:6px">${rkopts.map((o,i)=>`<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--bg-raised);cursor:grab"><span style="color:var(--text-muted);font-size:12px;min-width:18px;text-align:center">${i+1}</span><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' width='14' height='14' style='flex-shrink:0;opacity:.4'><line x1='3' y1='8' x2='21' y2='8'/><line x1='3' y1='16' x2='21' y2='16'/></svg><span>${esc(o)}</span></div>`).join("")}</div>`; }
  if (q.type === "emoji_rating") { const eset = q.emojiSet||"5"; const emojis = eset==="2"?["👎","👍"]:eset==="3"?["😞","😐","😊"]:["😢","😠","😐","😊","😁"]; control = `<div style="display:flex;gap:10px;flex-wrap:wrap">${emojis.map(e=>`<button type="button" style="font-size:28px;background:none;border:2px solid var(--border);border-radius:50%;width:52px;height:52px;cursor:pointer;transition:border-color .15s">${e}</button>`).join("")}</div>`; }
  if (q.type === "slider") { const mn=q.sliderMin||0,mx=q.sliderMax||100,df=q.sliderDefault!=null?q.sliderDefault:50,mnL=q.sliderMinLabel||"",mxL=q.sliderMaxLabel||""; control = `<div style="padding:4px 0"><input type="range" value="${df}" min="${mn}" max="${mx}" step="${q.sliderStep||1}" style="width:100%;accent-color:var(--teal)"><div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);margin-top:2px"><span>${esc(mnL)||mn}</span><span style="font-weight:600;color:var(--text)">${df}</span><span>${esc(mxL)||mx}</span></div></div>`; }
  if (q.type === "nps_score") { const mnL=q.npsMinLabel||"Not likely",mxL=q.npsMaxLabel||"Very likely"; control = `<div><div style="display:flex;gap:4px;margin-bottom:6px">${Array.from({length:11},(_,i)=>`<button type="button" style="flex:1;padding:6px 2px;font-size:13px;font-weight:600;border:1.5px solid var(--border);border-radius:6px;cursor:pointer;background:var(--bg-raised);color:var(--text);min-width:28px">${i}</button>`).join("")}</div><div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted)"><span>${esc(mnL)}</span><span>${esc(mxL)}</span></div></div>`; }
  if (q.type === "divider") {
    const ds = q.dividerStyle || "solid";
    return `<div style="margin:16px 0"><hr style="border:none;border-top:2px ${ds} var(--border)"></div>`;
  }
  if (q.type === "spacer") {
    const sh = q.spacerHeight || 32;
    return `<div style="height:${sh}px"></div>`;
  }
  if (q.type === "map") {
    control = `<div style="border:1px solid var(--border);border-radius:10px;overflow:hidden">
      <div style="background:var(--bg-mid);height:200px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--text-muted)">
        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' width='36' height='36' style='opacity:.5'><path d='M21 10c0 6-9 13-9 13S3 16 3 10a9 9 0 0 1 18 0z'/><circle cx='12' cy='10' r='3'/></svg>
        <span style='font-size:13px'>Interactive map will appear here</span>
      </div>
      ${q.mapAllowGps !== false ? `<div style='padding:8px 12px;border-top:1px solid var(--border);font-size:12px;color:var(--text-muted)'>📍 GPS button available</div>` : ''}
      ${q.mapShowAddress !== false ? `<input type='text' placeholder='Address will be auto-filled…' style='display:block;width:100%;padding:9px 12px;border:none;border-top:1px solid var(--border);font-size:13px;background:var(--bg-raised);color:var(--text);box-sizing:border-box'>` : ''}
    </div>`;
  }
  if (q.type === "button_link") {
    const bStyle = q.buttonStyle || "primary";
    const bLabel = esc(q.buttonLabel || "Open link");
    const bAlign = q.buttonAlign || "left";
    const alignMap = {left:"flex-start",center:"center",right:"flex-end"};
    let btnCss = "padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;text-decoration:none;";
    if (bStyle === "primary")  btnCss += "background:var(--teal);color:#fff;border:2px solid var(--teal)";
    if (bStyle === "outline")  btnCss += "background:transparent;color:var(--teal);border:2px solid var(--teal)";
    if (bStyle === "ghost")    btnCss += "background:transparent;color:var(--teal);border:2px solid transparent";
    control = `<div style='display:flex;justify-content:${alignMap[bAlign]||"flex-start"}'><a href="${esc(q.buttonUrl||"#")}" target="_blank" style="${btnCss}">${bLabel} <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.5' width='13' height='13'><path d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'/><polyline points='15 3 21 3 21 9'/><line x1='10' y1='14' x2='21' y2='3'/></svg></a></div>`;
  }

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