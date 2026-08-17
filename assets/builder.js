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
  { type:"data_table",  label:"Table",            icon:'<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="3" y1="15" x2="21" y2="15"/>', desc:"Data table; owner prefills, users fill empty cells" },
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
  { type:"calculation", label:"Calculation",      icon:'<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8.01" y2="10"/><line x1="12" y1="10" x2="12.01" y2="10"/><line x1="16" y1="10" x2="16.01" y2="10"/><line x1="8" y1="14" x2="8.01" y2="14"/><line x1="12" y1="14" x2="12.01" y2="14"/><line x1="16" y1="14" x2="16.01" y2="14"/>', desc:"Formula from other fields" },
  { type:"payment",     label:"Payment (QRIS)",   icon:'<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="6" y1="15" x2="10" y2="15"/>', desc:"QRIS payment gate — fixed price or from Calculation" },
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

// ── Field tiers — field types that require a certain plan ──────
// plus = requires Plus or higher; pro = requires Pro or higher
const FIELD_TIERS = {
  // Plus-only fields
  file_upload:   "plus",
  video:         "plus",
  color:         "plus",
  password:      "plus",
  toggle:        "plus",
  multiselect:   "plus",
  likert:        "plus",
  matrix:        "pro",
  data_table:    "pro",
  multi_input:   "plus",
  datetime:      "plus",
  ranking:       "plus",
  slider:        "plus",
  nps_score:     "pro",
  // Pro-only fields
  map:           "pro",
  button_link:   "pro",
  calculation:   "pro",
  payment:       "pro",
  page_break:    "plus",
};

// ── Plan benefits per paket (sesuai tabel di dashboard/subscription.html) ──
// "admin" is an internal-only tier (not sold, set manually in Supabase) with unlimited everything.
// ── Plan benefits per paket (sesuai tabel di dashboard/subscription.html) ──
// "admin" is an internal-only tier (not sold, set manually in Supabase) with unlimited everything.
const PLAN_FEATURES = {
  free:     { removeWatermark: false, closedMessage: false, customUrl: false, customSubmitButton: false, fieldPlus: false, fieldPro: false, viewResponses: false, maxWorkspaces: 1,        maxForms: 5,        maxMembers: 0,   maxUploadMb: 0,   storageMb: 20    },
  plus:     { removeWatermark: true,  closedMessage: true,  customUrl: true,  customSubmitButton: true,  fieldPlus: true,  fieldPro: false, viewResponses: true,  maxWorkspaces: 5,        maxForms: 20,       maxMembers: 1,   maxUploadMb: 1,   storageMb: 50    },
  pro:      { removeWatermark: true,  closedMessage: true,  customUrl: true,  customSubmitButton: true,  fieldPlus: true,  fieldPro: true,  viewResponses: true,  maxWorkspaces: 15,       maxForms: 50,       maxMembers: 5,   maxUploadMb: 10,  storageMb: 100   },
  ultimate: { removeWatermark: true,  closedMessage: true,  customUrl: true,  customSubmitButton: true,  fieldPlus: true,  fieldPro: true,  viewResponses: true,  maxWorkspaces: Infinity, maxForms: Infinity, maxMembers: 100, maxUploadMb: 50,  storageMb: 500   },
  admin:    { removeWatermark: true,  closedMessage: true,  customUrl: true,  customSubmitButton: true,  fieldPlus: true,  fieldPro: true,  viewResponses: true,  maxWorkspaces: Infinity, maxForms: Infinity, maxMembers: Infinity, maxUploadMb: Infinity, storageMb: Infinity },
};
function planFeatures() { return PLAN_FEATURES[currentPlan] || PLAN_FEATURES.free; }

// ── State ─────────────────────────────────────────────────────
let formId    = null;
let formData  = null;
let wsShortId = "";
let wsOwnerId = "";
let questions = [];
let settings  = {};
let saveTimer = null;
let editingIdx = null; // index of question being edited in modal
let currentUser = null;   // session user (fix: sebelumnya undefined, dipakai di uploadFormMedia)
let currentPlan = "free"; // plan milik PEMILIK workspace (bukan viewer/member)
let storageOwnerFull = false; // true jika storage pemilik workspace penuh

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

// ── Calculation: normalize option to {label, value} ──────────
function normOpt(opt) {
  if (typeof opt === "string") return { label: opt, value: "" };
  return { label: String(opt.label ?? opt), value: opt.value ?? "" };
}
function normOpts(opts) {
  return (opts || []).map(normOpt);
}

// (buildCalcVarsFromQuestions and evalCalcFormula removed — replaced by evalCalcOps)

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

  // Hitung storage usage ke currentUser (= workspace creator saat buka builder)
  // Tidak await agar upload tidak terblok jika RPC gagal
  _sb.rpc("increment_storage_usage", {
    p_owner_id: currentUser?.id,
    p_bytes:    file.size,
  }).catch(e => console.warn("increment_storage_usage failed:", e));

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
  currentUser = session.user;

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
    wsOwnerId = ws?.owner_id || "";
    const isOwner = ws?.owner_id === session.user.id;

    // ── Ambil plan pemilik workspace (benefit ditentukan oleh plan owner, bukan viewer) ──
    if (wsOwnerId) {
      // Pastikan plan owner yang sudah expired ter-downgrade dulu sebelum dibaca
      try { await _sb.rpc("check_and_expire_plan", { p_user_id: wsOwnerId }); } catch(_) {}
      const { data: subData } = await _sb.from("subscriptions")
        .select("plan")
        .eq("user_id", wsOwnerId)
        .maybeSingle();
      currentPlan = subData?.plan || "free";

      // ── Cek storage pemilik workspace ──
      const { data: storData } = await _sb.from("storage_usage")
        .select("used_bytes, quota_bytes")
        .eq("user_id", wsOwnerId)
        .maybeSingle();
      const usedBytes  = storData?.used_bytes  ?? 0;
      const quotaBytes = storData?.quota_bytes ?? 1;
      storageOwnerFull = quotaBytes > 0 && usedBytes >= quotaBytes;
    }
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
const TIER_SECTIONS = [
  { tier: undefined, label: "Free" },
  { tier: "plus",     label: "Plus" },
  { tier: "pro",      label: "Pro" },
];

function renderQTypePicker() {
  const grid = document.getElementById("qtype-grid");
  grid.innerHTML = "";
  const pf = planFeatures();

  TIER_SECTIONS.forEach(section => {
    const defs = Q_TYPES.filter(def => def.type !== "page_break" && FIELD_TIERS[def.type] === section.tier);
    if (!defs.length) return;

    const sectionEl = document.createElement("div");
    sectionEl.className = "qtype-section";

    const heading = document.createElement("div");
    heading.className = "qtype-section-title";
    heading.textContent = section.label;
    sectionEl.appendChild(heading);

    const sectionGrid = document.createElement("div");
    sectionGrid.className = "qtype-grid";

    defs.forEach(def => {
      const tier = FIELD_TIERS[def.type]; // "plus", "pro", or undefined (free)
      const locked =
        (tier === "plus" && !pf.fieldPlus) ||
        (tier === "pro"  && !pf.fieldPro);

      const btn = document.createElement("button");
      btn.className = "qtype-btn" + (locked ? " qtype-locked" : "");
      const badgeHtml = locked
        ? `<span class="qtype-tier-badge">${tier === "pro" ? "Pro" : "Plus"}</span>`
        : "";
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${def.icon}</svg>
        <span>${def.label}</span>
        ${badgeHtml}
      `;
      if (locked) {
        const planLabel = tier === "pro" ? "Pro" : "Plus";
        btn.title = `Requires the ${planLabel} plan or higher`;
        btn.addEventListener("click", () => {
          toast(`This field requires the ${planLabel} plan or higher. Upgrade on the Subscription page.`, "error");
        });
      } else {
        btn.addEventListener("click", () => {
          if (storageOwnerFull) {
            toast("Storage is full.", "error");
            return;
          }
          addQuestion(def.type); closeModal("qtype-modal");
        });
      }
      sectionGrid.appendChild(btn);
    });

    sectionEl.appendChild(sectionGrid);
    grid.appendChild(sectionEl);
  });
}

function addQuestion(type) {
  if (!memberPerms.can_edit_questions) { toast("You don't have permission to edit questions", "error"); return; }
  // Tidak perlu memblokir penambahan payment di sini — validasi dilakukan saat save/publish
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
    // data_table
    tableColumns:        ["","",""],
    tableRows:           ["",""],
    tableCells:          [["","",""],["","",""]],
    tableAllowMultiple:  false,
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
    // calculation
    calcLabel: "Order Summary",
    calcOps: [],
    calcPrefix: "$",
    calcSuffix: "",
    calcDecimals: 0,
    calcShowBreakdown: true,
    calcSendOnlyTotal: true,
    // payment
    paymentLabel: "Payment",
    paymentDescription: "",
    paymentPaid: false,
    // "fixed" = form owner sets a fixed price, "calculation" = use total from Calculation field
    paymentSource: "fixed",
    // Daftar item harga tetap: [{label, value}]
    paymentItems: [{ label: "Item 1", value: "" }],
    // option value (for choice/checkbox/dropdown/toggle/multiselect)
    optionWithValue: false,
    toggleOnValue: "",
    toggleOffValue: "",
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
  addBtn.addEventListener("click", () => openQTypeModal());

  const addPbBtn = document.createElement("button");
  const pbLocked = !planFeatures().fieldPlus;
  addPbBtn.className = "add-q-btn center-add-pb-btn" + (pbLocked ? " qtype-locked" : "");
  addPbBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M5 12h14"/><path d="M15 8l4 4-4 4"/><path d="M9 8l-4 4 4 4"/></svg> Add page break${pbLocked ? ` <span class="qtype-tier-badge">Plus</span>` : ""}`;
  if (pbLocked) {
    addPbBtn.title = "Requires the Plus plan or higher";
    addPbBtn.addEventListener("click", () => {
      toast("Page breaks require the Plus plan or higher. Upgrade on the Subscription page.", "error");
    });
  } else {
    addPbBtn.addEventListener("click", () => {
      if (!memberPerms.can_edit_questions) { toast("You don't have permission to edit questions", "error"); return; }
      addQuestion("page_break");
    });
  }

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
  const isCalc  = q.type === "calculation";
  body.appendChild(makeField(
    isTitle ? "Heading text" : "Title",
    "input",
    { type:"text", id:"em-title", value: q.title, placeholder: isTitle ? "Section heading…" : isCalc ? "Total" : "Question title…", maxlength:"200", style: isTitle ? "font-size:20px;font-weight:700;letter-spacing:-.3px" : "font-size:15px;font-weight:600" }
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
    const hasCalc = questions.some(qq => qq.type === "calculation");
    const wrap = document.createElement("div");
    wrap.className = "field";
    const lbl = document.createElement("label");
    lbl.textContent = q.type === "checkbox" ? "Checkbox options (multi-select)" : "Options";
    wrap.appendChild(lbl);

    // "Nilai Opsi" toggle — only shown when there's a calculation field
    if (hasCalc) {
      const valHint = document.createElement("div");
      valHint.style.cssText = "font-size:11px;color:var(--text-muted);margin-bottom:6px";
      valHint.textContent = "This form has a Calculation field. You can assign a numeric price to each option.";
      wrap.appendChild(valHint);
      const valToggle = makeToggleField("Enable option pricing (for Calculation)", "em-option-with-value", q.optionWithValue || false);
      wrap.appendChild(valToggle);
    }

    // Column header when nilai opsi active
    if (q.optionWithValue && hasCalc) {
      const hdr = document.createElement("div");
      hdr.style.cssText = "display:flex;gap:8px;align-items:center;font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:2px;padding:0 2px";
      hdr.innerHTML = `<span style="flex:1">Option label</span><span style="width:88px;text-align:right">Price / value</span><span style="width:24px"></span>`;
      wrap.appendChild(hdr);
    }

    const optsDiv = document.createElement("div");
    optsDiv.className = "choice-options"; optsDiv.id = "em-options";
    wrap.appendChild(optsDiv);
    const addOptBtn = document.createElement("button");
    addOptBtn.className = "add-option-btn"; addOptBtn.type = "button"; addOptBtn.textContent = "+ Add option";
    addOptBtn.addEventListener("click", () => {
      const withVal = document.getElementById("em-option-with-value")?.checked || false;
      const opts = collectOptions(withVal);
      opts.push(withVal ? { label: "Option " + (opts.length + 1), value: "" } : "Option " + (opts.length + 1));
      renderOptions(opts, optsDiv, withVal);
    });
    wrap.appendChild(addOptBtn);
    if (q.type === "choice" || q.type === "checkbox") {
      wrap.appendChild(makeToggleField('Allow "Other" option', "em-allow-other", q.type === "checkbox" ? q.checkboxAllowOther : q.allowOther));
    }
    body.appendChild(wrap);

    const rawOpts = q.type === "checkbox" ? (q.checkboxOptions || q.options || []) : (q.options || []);
    renderOptions(rawOpts, optsDiv, q.optionWithValue && hasCalc);

    // Wire the toggle: re-render when switched
    if (hasCalc) {
      setTimeout(() => {
        const tog = document.getElementById("em-option-with-value");
        if (tog) tog.addEventListener("change", function() {
          const cur = collectOptions(this.checked);
          // Update header visibility
          const existHdr = wrap.querySelector(".calc-opt-hdr");
          if (this.checked && !existHdr) {
            const hdr = document.createElement("div");
            hdr.className = "calc-opt-hdr";
            hdr.style.cssText = "display:flex;gap:8px;align-items:center;font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:2px;padding:0 2px";
            hdr.innerHTML = `<span style="flex:1">Option label</span><span style="width:88px;text-align:right">Price / value</span><span style="width:24px"></span>`;
            optsDiv.insertAdjacentElement("beforebegin", hdr);
          } else if (!this.checked && existHdr) {
            existHdr.remove();
          }
          renderOptions(cur, optsDiv, this.checked);
        });
      }, 0);
    }

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
      const _planMaxMb = planFeatures().maxUploadMb || 0;
      const maxMb = _planMaxMb > 0 ? Math.min(25, _planMaxMb) : 25; // form media upload; 0=free→still allow 25 for image/video in builder
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
    const _pMaxMb = planFeatures().maxUploadMb;
    const _maxMbInput = makeField("Max file size (MB)", "input",
      { type:"number", id:"em-file-maxmb",
        value: _pMaxMb > 0 ? Math.min(q.maxFileSizeMb || 10, _pMaxMb) : (q.maxFileSizeMb || 10),
        min:"1", max: _pMaxMb > 0 ? String(_pMaxMb) : "100", step:"1" }
    );
    if (_pMaxMb > 0) {
      const _hintEl = document.createElement("div");
      _hintEl.style.cssText = "font-size:11px;color:var(--text-muted);margin-top:4px";
      _hintEl.textContent = `Your plan: max ${_pMaxMb} MB per file.`;
      _maxMbInput.appendChild(_hintEl);
    }
    body.appendChild(_maxMbInput);
  }

  // ── URL Input fields
  if (q.type === "url_input") {
    body.appendChild(makeField("URL", "input",
      { type:"url", id:"em-url-href", value: q.urlHref || "", placeholder:"https://…", maxlength:"500" }
    ));
    body.appendChild(makeField("Teks link (optional)", "input",
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
    const hasCalc = questions.some(qq => qq.type === "calculation");
    const twrap = document.createElement("div"); twrap.className = "field";
    twrap.innerHTML = `<label>Labels</label><div style="display:flex;gap:8px;align-items:center">
      <input type="text" id="em-toggle-off" value="${esc(q.toggleOffLabel||"No")}" placeholder="Off label" style="flex:1;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-mid);color:var(--text);font-size:13px;font-family:inherit">
      <span style="color:var(--text-muted);font-size:12px">Off / On</span>
      <input type="text" id="em-toggle-on" value="${esc(q.toggleOnLabel||"Yes")}" placeholder="On label" style="flex:1;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-mid);color:var(--text);font-size:13px;font-family:inherit">
    </div>`;
    body.appendChild(twrap);
    body.appendChild(makeToggleField("Default state (On)", "em-toggle-default", q.toggleDefault));
    if (hasCalc) {
      const tvWrap = document.createElement("div"); tvWrap.className = "field";
      tvWrap.innerHTML = `<label>Pricing values (for Calculation) <span style="font-size:11px;font-weight:400;color:var(--text-muted)">(optional)</span></label>
        <div style="display:flex;gap:8px;align-items:center">
          <div style="flex:1"><div style="font-size:11px;color:var(--text-muted);margin-bottom:3px">Value when OFF</div>
            <input type="number" id="em-toggle-off-val" value="${q.toggleOffValue !== "" && q.toggleOffValue !== undefined ? q.toggleOffValue : ""}" placeholder="0" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-mid);color:var(--text);font-size:13px;font-family:'JetBrains Mono',monospace;text-align:right"></div>
          <div style="flex:1"><div style="font-size:11px;color:var(--text-muted);margin-bottom:3px">Value when ON</div>
            <input type="number" id="em-toggle-on-val" value="${q.toggleOnValue !== "" && q.toggleOnValue !== undefined ? q.toggleOnValue : ""}" placeholder="0" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-mid);color:var(--text);font-size:13px;font-family:'JetBrains Mono',monospace;text-align:right"></div>
        </div>`;
      body.appendChild(tvWrap);
    }
  }

  // ── Multi-select Dropdown fields
  if (q.type === "multiselect") {
    const hasCalcMs = questions.some(qq => qq.type === "calculation");
    body.appendChild(makeField("Placeholder", "input",
      { type:"text", id:"em-ms-placeholder", value: q.multiselectPlaceholder||"Select options…", maxlength:"100" }
    ));
    const msWrap = document.createElement("div"); msWrap.className = "field";
    const msLbl = document.createElement("label"); msLbl.textContent = "Options";
    msWrap.appendChild(msLbl);
    if (hasCalcMs) {
      const msHint = document.createElement("div");
      msHint.style.cssText = "font-size:11px;color:var(--text-muted);margin-bottom:6px";
      msHint.textContent = "This form has a Calculation field. You can assign a numeric price to each option.";
      msWrap.appendChild(msHint);
      msWrap.appendChild(makeToggleField("Enable option pricing (for Calculation)", "em-ms-with-value", q.optionWithValue || false));
    }
    const msOpts = document.createElement("div"); msOpts.className = "choice-options"; msOpts.id = "em-ms-options";
    msWrap.appendChild(msOpts);
    const msAddBtn = document.createElement("button"); msAddBtn.className = "add-option-btn"; msAddBtn.type = "button"; msAddBtn.textContent = "+ Add option";
    msAddBtn.addEventListener("click", () => {
      const withVal = document.getElementById("em-ms-with-value")?.checked || false;
      const opts = collectMsOptions(withVal);
      opts.push(withVal ? { label: "Option "+(opts.length+1), value: "" } : "Option "+(opts.length+1));
      renderMsOptions(opts, msOpts, withVal);
    });
    msWrap.appendChild(msAddBtn);
    body.appendChild(msWrap);
    renderMsOptions(q.multiselectOptions||[], msOpts, q.optionWithValue && hasCalcMs);
    if (hasCalcMs) {
      setTimeout(() => {
        const tog = document.getElementById("em-ms-with-value");
        if (tog) tog.addEventListener("change", function() {
          const cur = collectMsOptions(this.checked);
          renderMsOptions(cur, msOpts, this.checked);
        });
      }, 0);
    }
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
    body.appendChild(makeToggleField("Allow multiple answers", "em-matrix-allow-multiple", !!(q.matrixAllowMultiple)));
  }

  // ── Data Table fields
  if (q.type === "data_table") {
    const dtWrap = document.createElement("div");
    dtWrap.id = "em-datatable-wrap";
    dtWrap.style.cssText = "display:flex;flex-direction:column;gap:10px";

    let dtCols  = [...(q.tableColumns || ["Ulangan I","Ulangan II","Ulangan III"])];
    let dtRows  = [...(q.tableRows    || ["M0","M1"])];
    let dtCells = (q.tableCells || []).map(r => [...(r||[])]);
    while (dtCells.length < dtRows.length) dtCells.push(Array(dtCols.length).fill(""));
    dtCells = dtCells.slice(0, dtRows.length).map(r => {
      const row = [...(r||[])];
      while (row.length < dtCols.length) row.push("");
      return row.slice(0, dtCols.length);
    });

    function syncDtState() {
      dtCols  = [...dtWrap.querySelectorAll(".dt-col-header")].map(i => i.value);
      dtRows  = [...dtWrap.querySelectorAll(".dt-row-label")].map(i => i.value);
      dtWrap.querySelectorAll(".dt-cell-inp").forEach(c => {
        const ri = +c.dataset.ri, ci = +c.dataset.ci;
        if (dtCells[ri]) dtCells[ri][ci] = c.value;
      });
    }

    function renderDtEditor() {
      // Keep the allow-multiple checkbox state before wiping
      const prevAM = dtWrap.querySelector("#em-dt-allow-multiple")?.checked ?? q.tableAllowMultiple ?? false;
      dtWrap.innerHTML = "";

      // ─ Table scroll wrapper
      const scroll = document.createElement("div");
      scroll.style.cssText = "overflow-x:auto;border:1px solid var(--border);border-radius:var(--radius)";
      const tbl = document.createElement("table");
      tbl.style.cssText = "width:100%;border-collapse:collapse;font-size:12.5px";

      // Header row
      const thead = document.createElement("thead");
      const hRow  = document.createElement("tr");

      // top-left corner
      const corner = document.createElement("th");
      corner.style.cssText = "padding:8px 10px;background:var(--bg-mid);border-bottom:1px solid var(--border);border-right:1px solid var(--border);min-width:88px";
      hRow.appendChild(corner);

      dtCols.forEach((col, ci) => {
        const th = document.createElement("th");
        th.style.cssText = "padding:6px 8px;background:var(--bg-mid);border-bottom:1px solid var(--border);border-right:1px solid var(--border);text-align:center;min-width:110px";
        const colDiv = document.createElement("div");
        colDiv.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:4px";
        const inp = document.createElement("input");
        inp.type = "text"; inp.className = "dt-col-header"; inp.dataset.ci = ci;
        inp.value = col; inp.placeholder = "Column "+(ci+1);
        inp.style.cssText = "width:100%;padding:4px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;font-weight:600;background:var(--bg-raised);color:var(--text);text-align:center";
        const rmBtn = document.createElement("button");
        rmBtn.type = "button"; rmBtn.textContent = "×"; rmBtn.title = "Remove column";
        rmBtn.style.cssText = "border:none;background:none;color:var(--text-muted);cursor:pointer;font-size:15px;line-height:1;padding:0 2px;border-radius:4px";
        rmBtn.addEventListener("click", () => {
          if (dtCols.length <= 1) return;
          syncDtState(); dtCols.splice(ci,1); dtCells = dtCells.map(r=>{r.splice(ci,1);return r;});
          renderDtEditor();
        });
        colDiv.appendChild(inp); colDiv.appendChild(rmBtn);
        th.appendChild(colDiv); hRow.appendChild(th);
      });
      thead.appendChild(hRow); tbl.appendChild(thead);

      // Body
      const tbody = document.createElement("tbody");
      dtRows.forEach((row, ri) => {
        const tr = document.createElement("tr");
        // Row label cell
        const tdLbl = document.createElement("td");
        tdLbl.style.cssText = "padding:6px 8px;background:var(--bg-mid);border-top:1px solid var(--border-soft);border-right:1px solid var(--border)";
        const lblDiv = document.createElement("div"); lblDiv.style.cssText = "display:flex;align-items:center;gap:4px";
        const lblInp = document.createElement("input");
        lblInp.type = "text"; lblInp.className = "dt-row-label"; lblInp.dataset.ri = ri;
        lblInp.value = row; lblInp.placeholder = "Row "+(ri+1);
        lblInp.style.cssText = "flex:1;min-width:50px;padding:4px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;font-weight:600;background:var(--bg-raised);color:var(--text)";
        const rmRow = document.createElement("button");
        rmRow.type = "button"; rmRow.textContent = "×"; rmRow.title = "Remove row";
        rmRow.style.cssText = "border:none;background:none;color:var(--text-muted);cursor:pointer;font-size:15px;line-height:1;padding:0 2px;border-radius:4px;flex-shrink:0";
        rmRow.addEventListener("click", () => {
          if (dtRows.length <= 1) return;
          syncDtState(); dtRows.splice(ri,1); dtCells.splice(ri,1);
          renderDtEditor();
        });
        lblDiv.appendChild(lblInp); lblDiv.appendChild(rmRow);
        tdLbl.appendChild(lblDiv); tr.appendChild(tdLbl);

        // Data cells
        dtCols.forEach((_, ci) => {
          const td = document.createElement("td");
          td.style.cssText = "padding:5px 8px;border-top:1px solid var(--border-soft);border-right:1px solid var(--border);text-align:center";
          const cInp = document.createElement("input");
          cInp.type = "text"; cInp.className = "dt-cell-inp"; cInp.dataset.ri = ri; cInp.dataset.ci = ci;
          cInp.value = (dtCells[ri]||[])[ci] || ""; cInp.placeholder = "—";
          cInp.title = "Leave empty → respondent will fill this";
          cInp.style.cssText = "width:100%;padding:4px 8px;border:1px dashed var(--border);border-radius:6px;font-size:12.5px;background:var(--bg-raised);color:var(--text);text-align:center;min-width:80px";
          td.appendChild(cInp); tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      tbl.appendChild(tbody); scroll.appendChild(tbl);
      dtWrap.appendChild(scroll);

      // Hint
      const hint = document.createElement("p");
      hint.style.cssText = "font-size:11.5px;color:var(--text-muted);margin:0";
      hint.textContent = "Cells left empty will be filled by respondents. Column headers & row labels are set by you.";
      dtWrap.appendChild(hint);

      // Add col / row buttons
      const btnRow = document.createElement("div");
      btnRow.style.cssText = "display:flex;gap:8px";
      const addColBtn = document.createElement("button");
      addColBtn.type = "button"; addColBtn.className = "add-option-btn";
      addColBtn.style.textAlign = "center";
      addColBtn.textContent = "+ Column";
      addColBtn.addEventListener("click", () => {
        syncDtState();
        dtCols.push("Ulangan "+(dtCols.length+1));
        dtCells = dtCells.map(r => [...r, ""]);
        renderDtEditor();
      });
      const addRowBtn = document.createElement("button");
      addRowBtn.type = "button"; addRowBtn.className = "add-option-btn";
      addRowBtn.style.textAlign = "center";
      addRowBtn.textContent = "+ Rows";
      addRowBtn.addEventListener("click", () => {
        syncDtState();
        dtRows.push("M"+dtRows.length);
        dtCells.push(Array(dtCols.length).fill(""));
        renderDtEditor();
      });
      btnRow.appendChild(addColBtn); btnRow.appendChild(addRowBtn);
      dtWrap.appendChild(btnRow);

      // Allow multiple answers toggle — Pro+ only
      if (planFeatures().fieldPro) {
        const amRow = document.createElement("div");
        amRow.style.cssText = "display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg-mid);border:1px solid var(--border);border-radius:var(--radius)";
        const amChk = document.createElement("input");
        amChk.type = "checkbox"; amChk.id = "em-dt-allow-multiple"; amChk.checked = prevAM;
        amChk.style.cssText = "width:16px;height:16px;accent-color:var(--teal);cursor:pointer;flex-shrink:0";
        const amLbl = document.createElement("label");
        amLbl.htmlFor = "em-dt-allow-multiple";
        amLbl.style.cssText = "font-size:13px;cursor:pointer;line-height:1.4";
        amLbl.innerHTML = "<strong>Allow multiple answers</strong>";
        amRow.appendChild(amChk); amRow.appendChild(amLbl);
        dtWrap.appendChild(amRow);
      }
    }

    renderDtEditor();
    body.appendChild(dtWrap);
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

  // ── Calculation field editor
  if (q.type === "calculation") {
    // ── Info box
    const infoBox = document.createElement("div");
    infoBox.style.cssText = "background:var(--teal-dim);border:1px solid rgba(43,189,164,.2);border-radius:var(--radius);padding:10px 13px;font-size:12px;color:var(--text-soft);line-height:1.6;margin-bottom:4px";
    infoBox.innerHTML = `<strong style="color:var(--teal-deep)">How it works:</strong> The total is the <em>sum of values from options the respondent selects</em>. You can add flat fees, discounts, taxes, or multipliers below.`;
    body.appendChild(infoBox);

    // ── Pricing fields connected
    const sources = getCalcSourceFields();
    const srcBox = document.createElement("div"); srcBox.className = "field";
    const srcLbl = document.createElement("label"); srcLbl.textContent = "Pricing fields connected";
    srcBox.appendChild(srcLbl);
    const srcList = document.createElement("div"); srcList.style.cssText = "display:flex;flex-direction:column;gap:4px";
    if (sources.length) {
      sources.forEach(s => {
        const opts = normOpts(s.type === "checkbox" ? (s.checkboxOptions || s.options || []) : (s.options || s.multiselectOptions || []));
        const valued = opts.filter(o => o.value !== "");
        const pill = document.createElement("div");
        pill.style.cssText = "display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--bg-raised);border:1px solid var(--border);border-radius:var(--radius);font-size:12px";
        pill.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" style="color:var(--teal);flex-shrink:0"><polyline points="20 6 9 17 4 12"/></svg>
          <span style="flex:1;font-weight:500">${esc(s.title || s.type)}</span>
          <span style="color:var(--text-muted)">${valued.length} option${valued.length !== 1 ? "s" : ""} with prices</span>`;
        srcList.appendChild(pill);
      });
    } else {
      const empty = document.createElement("div");
      empty.style.cssText = "padding:8px 10px;background:var(--bg-raised);border:1px dashed var(--border);border-radius:var(--radius);font-size:12px;color:var(--text-muted)";
      empty.innerHTML = `No pricing fields yet. Open a <strong>Choice / Checkbox / Dropdown / Multi-select</strong> field, toggle <strong>Enable option pricing</strong>, and set a price per option.`;
      srcList.appendChild(empty);
    }
    srcBox.appendChild(srcList); body.appendChild(srcBox);

    // ── Display label
    body.appendChild(makeField("Display label", "input",
      { type:"text", id:"em-calc-label", value: q.calcLabel || "Order Summary", maxlength:"80" }
    ));

    // ── Number format
    const fmtRow = document.createElement("div"); fmtRow.className = "field";
    const fmtLbl = document.createElement("label"); fmtLbl.textContent = "Number format";
    fmtRow.appendChild(fmtLbl);
    const fmtGrid = document.createElement("div"); fmtGrid.style.cssText = "display:flex;gap:8px";
    const mkFmtField = (lbl, id, val, ph, type, w) => {
      const d = document.createElement("div"); d.style.flex = w || "1";
      const l = document.createElement("div"); l.style.cssText = "font-size:11px;color:var(--text-muted);margin-bottom:3px"; l.textContent = lbl;
      const i = document.createElement("input"); i.type = type || "text"; i.id = id; i.value = val; i.placeholder = ph;
      if (type === "number") { i.min = "0"; i.max = "4"; }
      i.style.cssText = "width:100%;padding:7px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-mid);color:var(--text);font-size:13px;font-family:inherit";
      i.addEventListener("input", updateCalcPreview);
      d.appendChild(l); d.appendChild(i); return d;
    };
    fmtGrid.appendChild(mkFmtField("Prefix", "em-calc-prefix", q.calcPrefix ?? "$", "$", "text", "0 0 80px"));
    fmtGrid.appendChild(mkFmtField("Suffix", "em-calc-suffix", q.calcSuffix ?? "", "", "text", "0 0 80px"));
    fmtGrid.appendChild(mkFmtField("Decimals", "em-calc-decimals", q.calcDecimals ?? 0, "0", "number", "0 0 70px"));
    fmtRow.appendChild(fmtGrid); body.appendChild(fmtRow);

    // ── Extra operations
    const opsWrap = document.createElement("div"); opsWrap.className = "field";
    const opsLbl = document.createElement("label"); opsLbl.textContent = "Extra operations";
    opsWrap.appendChild(opsLbl);
    const opsHint = document.createElement("div");
    opsHint.style.cssText = "font-size:11px;color:var(--text-muted);margin-bottom:8px";
    opsHint.textContent = "Optional: flat fees, discounts, taxes, or multipliers applied after selected options are summed.";
    opsWrap.appendChild(opsHint);

    const opsHdr = document.createElement("div");
    opsHdr.style.cssText = "display:none";
    opsHdr.innerHTML = `<span style="flex:0 0 120px">Operation</span><span style="width:70px;text-align:right">Value</span><span style="flex:1;padding-left:6px">Label</span><span style="width:28px"></span>`;
    opsWrap.appendChild(opsHdr);

    const opsList = document.createElement("div"); opsList.id = "em-calc-ops";
    opsList.style.cssText = "display:flex;flex-direction:column;gap:6px;margin-bottom:8px";
    opsWrap.appendChild(opsList);
    renderCalcOps(q.calcOps || [], opsList);

    const addOpBtn = document.createElement("button");
    addOpBtn.type = "button"; addOpBtn.className = "add-option-btn"; addOpBtn.textContent = "+ Add operation";
    addOpBtn.addEventListener("click", () => {
      const cur = collectCalcOps(); cur.push({ op:"add", value:0, label:"" });
      renderCalcOps(cur, opsList); updateCalcPreview();
    });
    opsWrap.appendChild(addOpBtn); body.appendChild(opsWrap);

    // ── Live preview
    const prevWrap = document.createElement("div"); prevWrap.id = "em-calc-preview";
    prevWrap.style.cssText = "background:var(--teal-dim);border:1px solid rgba(43,189,164,.25);border-radius:var(--radius);padding:12px 14px;font-size:13px;margin-bottom:4px";
    prevWrap.innerHTML = `<span style="color:var(--text-muted);font-style:italic">Preview will appear here…</span>`;
    body.appendChild(prevWrap);

    // ── Toggles
    body.appendChild(makeToggleField("Show itemized breakdown to respondent", "em-calc-breakdown", q.calcShowBreakdown !== false));
    body.appendChild(makeToggleField("Send only the Total in WhatsApp / Telegram message", "em-calc-send-total", q.calcSendOnlyTotal !== false));

    setTimeout(() => updateCalcPreview(), 50);
  }


  // ── Payment field editor — two modes: fixed price or from Calculation
  if (q.type === "payment") {
    const calcFields = questions.filter(qq => qq.type === "calculation");
    // Sumber harga aktif saat ini
    let currentSource = q.paymentSource || "fixed";

    // ── Info box
    const infoBox = document.createElement("div");
    infoBox.style.cssText = "background:var(--teal-dim);border:1px solid rgba(43,189,164,.2);border-radius:var(--radius);padding:10px 13px;font-size:12px;color:var(--text-soft);line-height:1.6;margin-bottom:4px";
    infoBox.innerHTML = `<strong style="color:var(--teal-deep)">How it works:</strong> This field generates a QRIS for the respondent. The submit button stays disabled until payment is confirmed.`;
    body.appendChild(infoBox);

    // ── Field label
    body.appendChild(makeField("Field label", "input",
      { type:"text", id:"em-payment-label", value: q.paymentLabel || "Payment", maxlength:"80" }
    ));

    // ── Description (optional)
    body.appendChild(makeField("Description (optional)", "textarea",
      { id:"em-payment-desc", value: q.paymentDescription || "", rows:"2", maxlength:"200",
        placeholder:"E.g. Scan the QRIS below to complete your payment" }
    ));

    body.appendChild(document.createElement("hr"));

    // ── Payment source selector (radio tab style)
    const srcField = document.createElement("div"); srcField.className = "field";
    const srcLblEl = document.createElement("label"); srcLblEl.textContent = "Payment amount source";
    srcField.appendChild(srcLblEl);

    const radioWrap = document.createElement("div");
    radioWrap.style.cssText = "display:flex;gap:8px;";

    // Helper untuk membuat tab pilihan sumber harga
    function makeSourceTab(value, labelText, descText) {
      const tab = document.createElement("label");
      tab.style.cssText = "flex:1;display:flex;flex-direction:column;gap:3px;padding:10px 12px;border:1.5px solid var(--border);border-radius:var(--radius);cursor:pointer;transition:border-color .15s,background .15s;font-size:13px";
      tab.setAttribute("for", "em-pay-src-" + value);
      const radio = document.createElement("input");
      radio.type = "radio"; radio.name = "em-payment-source"; radio.id = "em-pay-src-" + value;
      radio.value = value; radio.style.display = "none";
      if (currentSource === value) {
        tab.style.borderColor = "var(--teal)";
        tab.style.background  = "var(--teal-dim)";
      }
      const title = document.createElement("span");
      title.style.cssText = "font-weight:600;color:var(--text)";
      title.textContent = labelText;
      const desc = document.createElement("span");
      desc.style.cssText = "font-size:11px;color:var(--text-muted);line-height:1.4";
      desc.textContent = descText;
      tab.appendChild(radio); tab.appendChild(title); tab.appendChild(desc);
      return tab;
    }

    const tabFixed = makeSourceTab("fixed",       "Fixed price",      "Set the price directly in this field");
    const tabCalc  = makeSourceTab("calculation", "From Calculation", "Use the total from a Calculation field");
    radioWrap.appendChild(tabFixed);
    radioWrap.appendChild(tabCalc);
    srcField.appendChild(radioWrap);
    body.appendChild(srcField);

    // ── Panel: Fixed price items
    const fixedPanel = document.createElement("div");
    fixedPanel.id = "em-pay-fixed-panel";
    fixedPanel.style.display       = currentSource === "fixed" ? "flex" : "none";
    fixedPanel.style.flexDirection = "column";
    fixedPanel.style.gap           = "8px";

    const fixedLabelEl = document.createElement("label");
    fixedLabelEl.textContent = "Price items";
    fixedLabelEl.style.cssText = "font-size:13px;font-weight:500;color:var(--text)";
    fixedPanel.appendChild(fixedLabelEl);

    const fixedHint = document.createElement("div");
    fixedHint.style.cssText = "font-size:11px;color:var(--text-muted);margin-top:-4px";
    fixedHint.textContent = "Add one or more items. The total of all values will be the payment amount.";
    fixedPanel.appendChild(fixedHint);

    // Container untuk daftar baris item harga
    const itemsContainer = document.createElement("div");
    itemsContainer.id = "em-pay-items-container";
    itemsContainer.style.cssText = "display:flex;flex-direction:column;gap:6px";

    // Normalisasi paymentItems dari data tersimpan
    let payItems = Array.isArray(q.paymentItems) && q.paymentItems.length > 0
      ? q.paymentItems.map(it => ({ label: it.label || "", value: it.value ?? "" }))
      : [{ label: "Item 1", value: "" }];

    // Render satu baris item harga
    function renderPayItemRow(item, idx) {
      const row = document.createElement("div");
      row.className = "em-pay-item-row";
      row.style.cssText = "display:flex;gap:6px;align-items:center";

      const lblInp = document.createElement("input");
      lblInp.type = "text"; lblInp.placeholder = "Label";
      lblInp.value = item.label;
      lblInp.style.cssText = "flex:1;padding:7px 10px;border:1px solid var(--border);border-radius:var(--radius);font-size:13px;background:var(--bg-raised);color:var(--text);outline:none";
      lblInp.setAttribute("data-pay-label", idx);

      const valInp = document.createElement("input");
      valInp.type = "number"; valInp.placeholder = "Price";
      valInp.value = item.value;
      valInp.min = "0"; valInp.step = "any";
      valInp.style.cssText = "width:110px;padding:7px 10px;border:1px solid var(--border);border-radius:var(--radius);font-size:13px;background:var(--bg-raised);color:var(--text);outline:none";
      valInp.setAttribute("data-pay-value", idx);

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.style.cssText = "width:28px;height:28px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-mid);color:var(--text-muted);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:color .12s,border-color .12s";
      delBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M18 6 6 18M6 6l12 12"/></svg>`;
      delBtn.title = "Remove item";
      delBtn.addEventListener("mouseover", () => { delBtn.style.color = "var(--red)"; delBtn.style.borderColor = "var(--red)"; });
      delBtn.addEventListener("mouseout",  () => { delBtn.style.color = ""; delBtn.style.borderColor = ""; });
      delBtn.addEventListener("click", () => {
        syncPayItemInputs();
        payItems.splice(idx, 1);
        rebuildPayItems();
      });

      row.appendChild(lblInp); row.appendChild(valInp); row.appendChild(delBtn);
      return row;
    }

    // Rebuild semua baris dari array payItems
    function rebuildPayItems() {
      itemsContainer.innerHTML = "";
      payItems.forEach((it, i) => itemsContainer.appendChild(renderPayItemRow(it, i)));
    }

    // Sync nilai input ke payItems sebelum operasi struktural
    function syncPayItemInputs() {
      itemsContainer.querySelectorAll(".em-pay-item-row").forEach((row, i) => {
        const lbl = row.querySelector("[data-pay-label]");
        const val = row.querySelector("[data-pay-value]");
        if (lbl && payItems[i] !== undefined) payItems[i].label = lbl.value;
        if (val && payItems[i] !== undefined) payItems[i].value = val.value;
      });
    }

    rebuildPayItems();
    fixedPanel.appendChild(itemsContainer);

    // Tombol untuk menambah item harga baru
    const addItemBtn = document.createElement("button");
    addItemBtn.type = "button";
    addItemBtn.style.cssText = "align-self:flex-start;font-size:12px;font-weight:600;color:var(--teal-deep);background:var(--teal-dim);border:1.5px dashed var(--teal);border-radius:var(--radius);padding:5px 12px;cursor:pointer;display:flex;align-items:center;gap:5px";
    addItemBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M12 5v14M5 12h14"/></svg>Add item`;
    addItemBtn.addEventListener("click", () => {
      syncPayItemInputs();
      payItems.push({ label: "Item " + (payItems.length + 1), value: "" });
      rebuildPayItems();
    });
    fixedPanel.appendChild(addItemBtn);

    // ── Panel: From Calculation
    const calcPanel = document.createElement("div");
    calcPanel.id = "em-pay-calc-panel";
    calcPanel.style.display       = currentSource === "calculation" ? "flex" : "none";
    calcPanel.style.flexDirection = "column";
    calcPanel.style.gap           = "6px";

    if (calcFields.length === 0) {
      // Peringatan jika belum ada field Calculation
      const noCalcWarn = document.createElement("div");
      noCalcWarn.style.cssText = "background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.2);border-radius:var(--radius);padding:10px 13px;font-size:12px;color:var(--text-soft);line-height:1.6";
      noCalcWarn.innerHTML = `<strong style="color:var(--red,#ef4444)">No Calculation field found.</strong> Add a Calculation field to this form first. The form cannot be saved or published with this option active and no Calculation field present.`;
      calcPanel.appendChild(noCalcWarn);
    } else {
      const calcLblEl = document.createElement("label");
      calcLblEl.textContent = "Linked Calculation field";
      calcLblEl.style.cssText = "font-size:13px;font-weight:500;color:var(--text)";
      calcPanel.appendChild(calcLblEl);
      const srcList = document.createElement("div"); srcList.style.cssText = "display:flex;flex-direction:column;gap:4px";
      calcFields.forEach(cf => {
        const pill = document.createElement("div");
        pill.style.cssText = "display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--bg-raised);border:1px solid var(--border);border-radius:var(--radius);font-size:12px";
        pill.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" style="color:var(--teal);flex-shrink:0"><polyline points="20 6 9 17 4 12"/></svg>
          <span style="flex:1;font-weight:500">${esc(cf.calcLabel || cf.title || "Calculation")}</span>
          <span style="color:var(--text-muted)">Total will be used as the payment amount</span>`;
        srcList.appendChild(pill);
      });
      calcPanel.appendChild(srcList);
    }

    body.appendChild(fixedPanel);
    body.appendChild(calcPanel);

    // ── Terapkan perubahan tab sumber harga
    function applySourceTab(val) {
      [tabFixed, tabCalc].forEach(t => {
        const isActive = t.querySelector("input").value === val;
        t.style.borderColor = isActive ? "var(--teal)"     : "var(--border)";
        t.style.background  = isActive ? "var(--teal-dim)" : "";
        t.querySelector("input").checked = isActive;
      });
      fixedPanel.style.display = val === "fixed"       ? "flex" : "none";
      calcPanel.style.display  = val === "calculation" ? "flex" : "none";
      currentSource = val;
    }

    [tabFixed, tabCalc].forEach(tab => {
      tab.addEventListener("click", () => {
        syncPayItemInputs();
        applySourceTab(tab.querySelector("input").value);
      });
    });

    body.appendChild(document.createElement("hr"));
    const noteDiv = document.createElement("div");
    noteDiv.style.cssText = "font-size:12px;color:var(--text-muted);padding:8px 10px;background:var(--bg-raised);border:1px solid var(--border);border-radius:var(--radius);line-height:1.6";
    noteDiv.innerHTML = `<strong>Submit logic:</strong> The form submit button stays disabled until QRIS payment is detected. After payment, the form owner's wallet balance is credited with the payment amount.`;
    body.appendChild(noteDiv);
  }

  // ── Required toggle (not for title/image/video/toggle types)
  if (!isTitle && !["image","video","password","url_input","toggle","divider","spacer","button_link","calculation","ranking","payment"].includes(q.type)) {
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

function renderOptions(opts, container, withValue) {
  container.innerHTML = "";
  const normed = normOpts(opts);
  normed.forEach((opt, oi) => {
    const row = document.createElement("div");
    row.className = "choice-opt-row";
    const inp = document.createElement("input");
    inp.type = "text"; inp.value = opt.label; inp.placeholder = `Option ${oi+1}`;
    inp.dataset.oi = oi; inp.dataset.role = "label"; inp.style.flex = "1";
    row.appendChild(inp);
    if (withValue) {
      const val = document.createElement("input");
      val.type = "number"; val.placeholder = "Price";
      val.value = opt.value !== "" ? opt.value : "";
      val.dataset.oi = oi; val.dataset.role = "value";
      val.className = "calc-opt-value";
      val.title = "Numeric price for this option (used by the Calculation field)";
      row.appendChild(val);
    }
    const rmBtn = document.createElement("button");
    rmBtn.className = "choice-remove"; rmBtn.type = "button";
    rmBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>`;
    rmBtn.addEventListener("click", () => {
      const cur = collectOptions(withValue);
      cur.splice(oi, 1);
      renderOptions(cur, container, withValue);
    });
    row.appendChild(rmBtn);
    container.appendChild(row);
  });
}

// ── Multi-select option helpers ──────────────────────────────
function renderMsOptions(opts, container, withValue) {
  container.innerHTML = "";
  const normed = normOpts(opts);
  normed.forEach((opt, oi) => {
    const row = document.createElement("div"); row.className = "choice-opt-row";
    const inp = document.createElement("input"); inp.type = "text";
    inp.value = opt.label; inp.placeholder = `Option ${oi+1}`;
    inp.dataset.oi = oi; inp.dataset.role = "label"; inp.style.flex = "1";
    row.appendChild(inp);
    if (withValue) {
      const val = document.createElement("input");
      val.type = "number"; val.placeholder = "Price";
      val.value = opt.value !== "" ? opt.value : "";
      val.dataset.oi = oi; val.dataset.role = "ms-value";
      val.className = "calc-opt-value";
      row.appendChild(val);
    }
    const rmBtn = document.createElement("button"); rmBtn.className = "choice-remove"; rmBtn.type = "button";
    rmBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>`;
    rmBtn.addEventListener("click", () => { const cur = collectMsOptions(withValue); cur.splice(oi,1); renderMsOptions(cur, container, withValue); });
    row.appendChild(rmBtn); container.appendChild(row);
  });
}
function collectMsOptions(withValue) {
  const div = document.getElementById("em-ms-options");
  if (!div) return [];
  const labels = Array.from(div.querySelectorAll("[data-role='label']"));
  if (!labels.length) return Array.from(div.querySelectorAll("input[data-oi]")).map(i => i.value);
  return labels.map((inp, i) => {
    const valInp = div.querySelector(`[data-role='ms-value'][data-oi='${i}']`);
    if (withValue || valInp) return { label: inp.value, value: valInp && valInp.value !== "" ? Number(valInp.value) : "" };
    return inp.value;
  });
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

function collectOptions(withValue) {
  const div = document.getElementById("em-options");
  if (!div) return [];
  const labels = Array.from(div.querySelectorAll("[data-role='label']"));
  if (!labels.length) {
    // fallback: legacy inputs without data-role
    return Array.from(div.querySelectorAll("input[data-oi]")).map(i => i.value);
  }
  return labels.map((inp, i) => {
    const valInp = div.querySelector(`[data-role='value'][data-oi='${i}']`);
    if (withValue || valInp) {
      return { label: inp.value, value: valInp && valInp.value !== "" ? Number(valInp.value) : "" };
    }
    return inp.value;
  });
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

// ── Calculation: helper functions ────────────────────────────
// ── Calculation: visual operation blocks ─────────────────────
function renderCalcOps(ops, container) {
  container.innerHTML = "";
  ops.forEach((op, oi) => {
    const row = document.createElement("div");
    row.className = "calc-op-row";

    // Line 1: operation type (full width) + remove button
    const line1 = document.createElement("div");
    line1.style.cssText = "display:flex;gap:6px;align-items:center";

    const typSel = document.createElement("select");
    typSel.dataset.oi = oi; typSel.dataset.key = "op";
    typSel.className = "calc-op-type";
    [
      { v:"add",      l:"+ Add flat amount" },
      { v:"subtract", l:"− Subtract flat amount" },
      { v:"multiply", l:"× Multiply subtotal by" },
      { v:"percent",  l:"% Add percentage of subtotal" },
    ].forEach(({ v, l }) => {
      const o = document.createElement("option"); o.value = v; o.textContent = l;
      if ((op.op || "add") === v) o.selected = true;
      typSel.appendChild(o);
    });
    typSel.addEventListener("change", updateCalcPreview);
    line1.appendChild(typSel);

    const rmBtn = document.createElement("button"); rmBtn.type = "button"; rmBtn.className = "choice-remove";
    rmBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>`;
    rmBtn.addEventListener("click", () => {
      const cur = collectCalcOps(); cur.splice(oi, 1);
      renderCalcOps(cur, container); updateCalcPreview();
    });
    line1.appendChild(rmBtn);
    row.appendChild(line1);

    // Line 2: label (left) + value (right) in one row
    const line2 = document.createElement("div");
    line2.style.cssText = "display:flex;gap:6px;align-items:center;margin-top:4px;width:100%";

    const lblInp = document.createElement("input");
    lblInp.type = "text"; lblInp.value = op.label ?? ""; lblInp.placeholder = "Label (required)";
    lblInp.dataset.oi = oi; lblInp.dataset.key = "label";
    lblInp.required = true;
    lblInp.style.cssText = "flex:1;min-width:0;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-mid);color:var(--text);font-size:13px;font-family:inherit;box-sizing:border-box;outline:none";
    lblInp.addEventListener("focus",  () => lblInp.style.borderColor = "var(--teal)");
    lblInp.addEventListener("blur",   () => lblInp.style.borderColor = "var(--border)");
    lblInp.addEventListener("input", updateCalcPreview);

    const valInp = document.createElement("input");
    valInp.type = "number"; valInp.value = op.value ?? 0; valInp.placeholder = "0";
    valInp.dataset.oi = oi; valInp.dataset.key = "value";
    valInp.style.cssText = "width:90px;flex-shrink:0;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-mid);color:var(--text);font-size:13px;font-family:'JetBrains Mono',monospace;text-align:right;box-sizing:border-box;outline:none";
    valInp.addEventListener("focus",  () => valInp.style.borderColor = "var(--teal)");
    valInp.addEventListener("blur",   () => valInp.style.borderColor = "var(--border)");
    valInp.addEventListener("input", updateCalcPreview);

    line2.appendChild(lblInp);
    line2.appendChild(valInp);
    row.appendChild(line2);
    container.appendChild(row);
  });
}

function collectCalcOps() {
  const div = document.getElementById("em-calc-ops");
  if (!div) return [];
  return Array.from(div.children).map(row => {
    const v = { op: "add", value: 0, label: "" };
    row.querySelectorAll("input,select").forEach(i => {
      if (!i.dataset.key) return;
      v[i.dataset.key] = i.dataset.key === "value" ? Number(i.value) || 0 : i.value;
    });
    return v;
  });
}

// Evaluate ops against a subtotal (sum of selected option values)
function evalCalcOps(subtotal, ops) {
  let total = subtotal;
  ops.forEach(op => {
    const val = Number(op.value) || 0;
    if      (op.op === "add")      total += val;
    else if (op.op === "subtract") total -= val;
    else if (op.op === "multiply") total *= val;
    else if (op.op === "percent")  total += (subtotal * val / 100);
  });
  return total;
}

// Source fields that have option pricing set
function getCalcSourceFields() {
  return questions.filter(q =>
    q.optionWithValue && (
      q.type === "choice" || q.type === "checkbox" ||
      q.type === "dropdown" || q.type === "multiselect"
    ) && normOpts(
      q.type === "checkbox" ? (q.checkboxOptions || q.options || []) :
      (q.options || q.multiselectOptions || [])
    ).some(o => o.value !== "")
  );
}

function updateCalcPreview() {
  const prev = document.getElementById("em-calc-preview");
  if (!prev) return;

  const prefix = document.getElementById("em-calc-prefix")?.value ?? "$";
  const suffix = document.getElementById("em-calc-suffix")?.value ?? "";
  const dec    = Number(document.getElementById("em-calc-decimals")?.value) || 0;
  const fmtNum = n => `${prefix}${Number(n).toLocaleString("en-US",{minimumFractionDigits:dec,maximumFractionDigits:dec})}${suffix}`;

  const sources = getCalcSourceFields();
  const ops     = collectCalcOps();

  if (!sources.length && !ops.length) {
    prev.innerHTML = `<span style="color:var(--text-muted);font-style:italic">Set option values on a choice/checkbox/dropdown field above, then the total will appear here.</span>`;
    return;
  }

  // Sample: use first valued option per field
  let subtotal = 0;
  const sampleLines = [];
  sources.forEach(q => {
    const opts = normOpts(q.type === "checkbox" ? (q.checkboxOptions || q.options || []) : (q.options || q.multiselectOptions || []));
    const first = opts.find(o => o.value !== "");
    if (!first) return;
    const v = Number(first.value) || 0;
    subtotal += v;
    sampleLines.push(`<div style="display:flex;justify-content:space-between;font-size:12px;padding:2px 0;color:var(--text-soft)">
      <span>${esc(q.title || q.type)}<span style="color:var(--text-muted);font-size:11px"> — ${esc(first.label)}</span></span><span>${fmtNum(v)}</span>
    </div>`);
  });

  const opLines = ops.map(op => {
    const val = Number(op.value) || 0;
    let displayOp = "", amount = 0;
    if      (op.op === "add")      { displayOp = `+${fmtNum(val)}`;     amount =  val; }
    else if (op.op === "subtract") { displayOp = `−${fmtNum(val)}`;     amount = -val; }
    else if (op.op === "multiply") { displayOp = `×${val}`;             amount =  subtotal * (val - 1); }
    else if (op.op === "percent")  { displayOp = `${val}%`;             amount =  subtotal * val / 100; }
    const lbl = op.label || "";
    return `<div style="display:flex;justify-content:space-between;font-size:12px;padding:2px 0;color:var(--text-soft)">
      <span>${esc(lbl)}<span style="color:var(--text-muted);font-size:11px"> (${displayOp})</span></span>
      <span>${amount >= 0 ? "+" : ""}${fmtNum(amount)}</span>
    </div>`;
  });

  const total = evalCalcOps(subtotal, ops);
  prev.innerHTML = `
    <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted);margin-bottom:7px">Preview (sample values)</div>
    ${sampleLines.join("")}
    ${opLines.length ? `<div style="border-top:1px dashed var(--border);margin:6px 0"></div>${opLines.join("")}` : ""}
    <div style="display:flex;justify-content:space-between;font-weight:700;font-size:14px;border-top:1px solid rgba(43,189,164,.3);margin-top:7px;padding-top:7px">
      <span>Total</span><span style="color:var(--teal-deep)">${fmtNum(total)}</span>
    </div>`;
}

// ── Save from edit modal back to questions[] ──────────────────
function saveEditToMemory() {
  if (editingIdx === null) return false;
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
    q.matrixAllowMultiple = get("em-matrix-allow-multiple")?.checked || false;
  }
  // data_table
  if (q.type === "data_table") {
    const wrap = get("em-datatable-wrap");
    if (wrap) {
      q.tableColumns = [...wrap.querySelectorAll(".dt-col-header")].map((i, ci) => i.value.trim() || `Column ${ci + 1}`);
      q.tableRows    = [...wrap.querySelectorAll(".dt-row-label")].map((i, ri) => i.value.trim() || `Row ${ri + 1}`);
      const nR = q.tableRows.length, nC = q.tableColumns.length;
      q.tableCells = Array.from({length: nR}, (_, ri) =>
        Array.from({length: nC}, (_, ci) => {
          const c = wrap.querySelector(`.dt-cell-inp[data-ri="${ri}"][data-ci="${ci}"]`);
          return c ? c.value : "";
        })
      );
      q.tableAllowMultiple = get("em-dt-allow-multiple")?.checked || false;
    }
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
    // Clamp to plan's maxUploadMb if set (0 = no file upload allowed)
    const _planMax = planFeatures().maxUploadMb;
    const _rawMax  = Number(get("em-file-maxmb")?.value) || 10;
    q.maxFileSizeMb = _planMax > 0 ? Math.min(_rawMax, _planMax) : _rawMax;
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
      return false; // abort save
    }
    q.passwordValue = pwVal;
    const pwInpEl = get("em-password-value");
    if (pwInpEl) { pwInpEl.style.borderColor = ""; }
    document.querySelector(".pw-required-hint")?.remove();
  }
  if (document.getElementById("em-options")) {
    const withVal = get("em-option-with-value")?.checked || false;
    q.optionWithValue = withVal;
    if (q.type === "checkbox") {
      q.checkboxOptions = collectOptions(withVal);
    } else {
      q.options = collectOptions(withVal);
    }
  }
  // toggle nilai
  if (q.type === "toggle") {
    const onV  = get("em-toggle-on-val");
    const offV = get("em-toggle-off-val");
    q.toggleOnValue  = onV  && onV.value  !== "" ? Number(onV.value)  : "";
    q.toggleOffValue = offV && offV.value !== "" ? Number(offV.value) : "";
  }
  // multiselect nilai
  if (q.type === "multiselect") {
    const withValMs = get("em-ms-with-value")?.checked || false;
    q.optionWithValue = withValMs;
    q.multiselectOptions = collectMsOptions(withValMs);
  }
  // calculation
  if (q.type === "calculation") {
    // Validate: all extra operations must have a label
    const opDiv = document.getElementById("em-calc-ops");
    if (opDiv) {
      let missingLabel = false;
      opDiv.querySelectorAll("input[data-key='label']").forEach(inp => {
        if (!inp.value.trim()) {
          inp.style.borderColor = "var(--red, #ef4444)";
          missingLabel = true;
        } else {
          inp.style.borderColor = "";
        }
      });
      if (missingLabel) {
        // Show hint if not already present
        if (!opDiv.querySelector(".op-label-hint")) {
          const hint = document.createElement("div");
          hint.className = "op-label-hint";
          hint.style.cssText = "font-size:12px;color:var(--red,#ef4444);margin-top:6px";
          hint.textContent = "Please fill in a label for each operation.";
          opDiv.appendChild(hint);
        }
        return false; // abort save
      }
      opDiv.querySelector(".op-label-hint")?.remove();
    }
    q.calcLabel         = get("em-calc-label")?.value     || "Order Summary";
    q.calcOps           = collectCalcOps();
    q.calcPrefix        = get("em-calc-prefix")?.value    ?? "$";
    q.calcSuffix        = get("em-calc-suffix")?.value    ?? "";
    q.calcDecimals      = Number(get("em-calc-decimals")?.value) || 0;
    q.calcShowBreakdown = get("em-calc-breakdown")?.checked !== false;
    q.calcSendOnlyTotal = get("em-calc-send-total")?.checked !== false;
  }
  // payment - save label, description, price source, and fixed price items
  if (q.type === "payment") {
    q.paymentLabel       = get("em-payment-label")?.value || "Payment";
    q.paymentDescription = get("em-payment-desc")?.value || "";

    // Tentukan sumber harga aktif (fixed atau calculation)
    const srcRadio = document.querySelector("input[name='em-payment-source']:checked");
    q.paymentSource = srcRadio ? srcRadio.value : "fixed";

    // Kumpulkan item harga tetap dari baris DOM
    const itemRows = document.querySelectorAll(".em-pay-item-row");
    q.paymentItems = Array.from(itemRows).map(row => ({
      label: row.querySelector("[data-pay-label]")?.value || "",
      value: row.querySelector("[data-pay-value]")?.value || ""
    }));

    // Validasi: mode fixed wajib punya minimal 1 item dengan harga > 0
    if (q.paymentSource === "fixed") {
      const hasValidItem = q.paymentItems.some(it => it.value !== "" && Number(it.value) > 0);
      if (!hasValidItem) {
        toast("Fixed price payment must have at least one item with a price value greater than 0.", "error");
        return false;
      }
    }

    // Validasi: mode calculation wajib ada field Calculation lain di form
    if (q.paymentSource === "calculation") {
      const hasCalc = questions.some(qq => qq.type === "calculation");
      if (!hasCalc) {
        toast('You selected "From Calculation" but no Calculation field exists in this form. Add a Calculation field first.', "error");
        return false;
      }
    }
  }
  return true;
}

// Save button in edit modal
document.getElementById("edit-save-btn").addEventListener("click", () => {
  if (!saveEditToMemory()) return; // abort if validation failed
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
function openQTypeModal() {
  if (storageOwnerFull) {
    toast("Storage is full.", "error");
    return;
  }
  openModal("qtype-modal");
}
document.getElementById("add-q-btn")?.addEventListener("click", openQTypeModal);
document.getElementById("center-add-btn")?.addEventListener("click", openQTypeModal);

// ── Submit placeholder dinamis ────────────────────────────────
function getSubmitPlaceholder(target) {
  if (target === "tg")   return "Send WateForm to Telegram";
  if (target === "both") return "Send WateForm to WhatsApp & Telegram";
  if (target === "wa2")  return "Send WateForm to WhatsApp";
  if (target === "tg2")  return "Send WateForm to Telegram";
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
      <label class="toggle-row" style="cursor:${planFeatures().removeWatermark ? "pointer" : "not-allowed"}">
        <span class="toggle-label" style="font-weight:600;color:var(--text);display:flex;align-items:center;gap:6px">
          Remove watermark
          ${!planFeatures().removeWatermark ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" style="color:var(--text-muted)"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>` : ""}
        </span>
        <label class="toggle">
          <input type="checkbox" id="s-watermark" ${s.removeWatermark === true ? "checked" : ""} ${!planFeatures().removeWatermark ? "disabled" : ""}>
          <span class="toggle-track"></span>
        </label>
      </label>
      ${!planFeatures().removeWatermark ? `<div class="hint" style="margin-top:5px;font-size:12px;color:var(--text-muted)">Upgrade to <strong>Plus</strong> or higher to remove the watermark. <a href="dashboard/subscription.html" style="color:var(--teal)">View plans →</a></div>` : ""}
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
      <label style="display:flex;align-items:center;gap:6px">
        Public URL
        ${!planFeatures().customUrl ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" style="color:var(--text-muted)"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>` : ""}
      </label>
      <div id="s-slug-preview" style="display:flex;align-items:center;gap:4px;background:var(--bg-mid);border:1px solid var(--border);border-radius:var(--radius);padding:9px 12px;font-size:13px;${!planFeatures().customUrl ? "opacity:.55;cursor:not-allowed" : ""}">
        <span style="color:var(--text-muted);white-space:nowrap" id="s-slug-prefix">${window.location.host}/</span>
        <input type="text" id="s-slug" value="${planFeatures().customUrl ? esc(formSlug) : ""}" maxlength="40" minlength="4"
          placeholder="${planFeatures().customUrl ? esc((wsShortId || "xxxx") + "/" + (formData?.short_id || "xxxx")) : "Upgrade to Plus for a custom URL"}"
          pattern="[A-Za-z0-9._~-]+" autocapitalize="off" autocorrect="off" spellcheck="false"
          ${!planFeatures().customUrl ? "disabled" : ""}
          style="border:none;background:transparent;padding:0;outline:none;font-size:13px;width:100%;color:var(--text)${!planFeatures().customUrl ? ";cursor:not-allowed" : ""}">
      </div>
      <div id="s-slug-hint" style="font-size:12px;margin-top:5px;min-height:18px;display:flex;align-items:center;gap:5px"></div>
      ${!planFeatures().customUrl ? `<div class="hint" style="margin-top:5px;font-size:12px;color:var(--text-muted)">Upgrade to <strong>Plus</strong> or higher for a custom URL. <a href="dashboard/subscription.html" style="color:var(--teal)">View plans →</a></div>` : ""}
    </div>
    <div class="settings-sep"></div>
    <div class="field">
      <label>Target</label>
      <select id="s-target">
        <option value="wa"   ${(s.target||"wa")==="wa"?"selected":""}>WhatsApp only</option>
        <option value="tg"   ${s.target==="tg"?"selected":""}>Telegram only</option>
        <option value="both" ${s.target==="both"?"selected":""}>WhatsApp & Telegram</option>
        <option value="wa2"  ${s.target==="wa2"?"selected":""}>Double WhatsApp</option>
        <option value="tg2"  ${s.target==="tg2"?"selected":""}>Double Telegram</option>
      </select>
    </div>
    <div id="s-wa-wrap">
      <div class="field">
        <label id="s-wa-label">WhatsApp number</label>
        <div class="phone-wrap" style="max-width:340px">
          <select id="s-wa-prefix" class="phone-prefix">
            ${COUNTRY_CODES.map(c=>`<option value="${c.code}" ${(s.waPrefix||"+62")===c.code?"selected":""}>${c.code} ${c.label.split(" ")[0]}</option>`).join("")}
          </select>
          <input type="tel" id="s-wa-number" inputmode="numeric" pattern="[0-9]*" value="${esc(s.waNumber||"")}" style="min-width:0;flex:1">
        </div>
      </div>
    </div>
    <div id="s-wa2-wrap" style="display:none">
      <div class="field">
        <label>WhatsApp number 2</label>
        <div class="phone-wrap" style="max-width:340px">
          <select id="s-wa2-prefix" class="phone-prefix">
            ${COUNTRY_CODES.map(c=>`<option value="${c.code}" ${(s.waPrefix2||"+62")===c.code?"selected":""}>${c.code} ${c.label.split(" ")[0]}</option>`).join("")}
          </select>
          <input type="tel" id="s-wa2-number" inputmode="numeric" pattern="[0-9]*" value="${esc(s.waNumber2||"")}" style="min-width:0;flex:1">
        </div>
      </div>
    </div>
    <div id="s-tg-wrap">
      <div class="field">
        <label id="s-tg-label">Telegram username</label>
        <div style="display:flex;align-items:center;gap:4px;background:var(--bg-mid);border:1px solid var(--border);border-radius:var(--radius);padding:9px 12px">
          <span style="color:var(--text-muted)">@</span>
          <input type="text" id="s-tg-user" value="${esc(s.tgUsername||"")}" placeholder="username"
            pattern="[A-Za-z0-9_]+" maxlength="32" autocapitalize="off" autocorrect="off" spellcheck="false"
            style="border:none;background:transparent;padding:0;outline:none;font-size:14px;width:100%;color:var(--text)">
        </div>
      </div>
    </div>
    <div id="s-tg2-wrap" style="display:none">
      <div class="field">
        <label>Telegram username 2</label>
        <div style="display:flex;align-items:center;gap:4px;background:var(--bg-mid);border:1px solid var(--border);border-radius:var(--radius);padding:9px 12px">
          <span style="color:var(--text-muted)">@</span>
          <input type="text" id="s-tg2-user" value="${esc(s.tgUsername2||"")}" placeholder="username"
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
        ${!planFeatures().closedMessage ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" style="color:var(--text-muted)"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>` : ""}
      </label>
      <textarea id="s-closed-msg" rows="3" ${!planFeatures().closedMessage ? "disabled" : ""}
        style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-mid);color:var(--text);font-size:13px;font-family:inherit;resize:vertical;line-height:1.5${!planFeatures().closedMessage ? ";opacity:.55;cursor:not-allowed" : ""}"
        placeholder="${!planFeatures().closedMessage ? "Upgrade to Plus to set a closed message for the form…" : ""}">${planFeatures().closedMessage ? esc(s.closedMessage||"") : ""}</textarea>
      ${!planFeatures().closedMessage ? `<div class="hint" style="margin-top:5px;font-size:12px;color:var(--text-muted)">Upgrade to <strong>Plus</strong> or higher to set a closed message. <a href="dashboard/subscription.html" style="color:var(--teal)">View plans →</a></div>` : ""}
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
  ["s-title","s-desc","s-slug","s-wa-number","s-tg-user","s-wa2-number","s-tg2-user"].forEach(id => {
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
            hint.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg> URL already taken, try another';
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
  document.getElementById("s-wa2-number")?.addEventListener("input", (e) => {
    const cleaned = e.target.value.replace(/[^0-9]/g, "");
    if (cleaned !== e.target.value) e.target.value = cleaned;
  });
  // Telegram username: letters, digits, underscore only — no spaces or unsupported symbols
  document.getElementById("s-tg-user")?.addEventListener("input", (e) => {
    const cleaned = e.target.value.replace(/[^A-Za-z0-9_]/g, "");
    if (cleaned !== e.target.value) e.target.value = cleaned;
  });
  document.getElementById("s-tg2-user")?.addEventListener("input", (e) => {
    const cleaned = e.target.value.replace(/[^A-Za-z0-9_]/g, "");
    if (cleaned !== e.target.value) e.target.value = cleaned;
  });
  ["s-wa-prefix","s-wa2-prefix","s-lang"].forEach(id => {
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
  const waWrap  = document.getElementById("s-wa-wrap");
  const wa2Wrap = document.getElementById("s-wa2-wrap");
  const tgWrap  = document.getElementById("s-tg-wrap");
  const tg2Wrap = document.getElementById("s-tg2-wrap");
  const waLabel = document.getElementById("s-wa-label");
  const tgLabel = document.getElementById("s-tg-label");

  // WA primary: shown for wa, both, wa2
  if (waWrap)  waWrap.style.display  = (t === "tg" || t === "tg2") ? "none" : "block";
  // WA secondary: shown only for wa2
  if (wa2Wrap) wa2Wrap.style.display = t === "wa2" ? "block" : "none";
  // TG primary: shown for tg, both, tg2
  if (tgWrap)  tgWrap.style.display  = (t === "wa" || t === "wa2") ? "none" : "block";
  // TG secondary: shown only for tg2
  if (tg2Wrap) tg2Wrap.style.display = t === "tg2" ? "block" : "none";

  // Update labels to distinguish WA1/WA2 or TG1/TG2 when in double mode
  if (waLabel) waLabel.textContent = t === "wa2" ? "WhatsApp number 1" : "WhatsApp number";
  if (tgLabel) tgLabel.textContent = t === "tg2" ? "Telegram username 1" : "Telegram username";

  renderSubmitFields(t);
}

function renderSubmitFields(target) {
  const wrap = document.getElementById("s-submit-wrap");
  if (!wrap) return;
  const s = settings;
  const canCustom = planFeatures().customSubmitButton;
  const lockIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" style="color:var(--text-muted)"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
  const upgradeHint = `<div class="hint" style="margin-top:5px;font-size:12px;color:var(--text-muted)">Upgrade to <strong>Plus</strong> or higher to customize the submit button. <a href="dashboard/subscription.html" style="color:var(--teal)">View plans →</a></div>`;

  if (target === "both") {
    wrap.innerHTML = `
      <div class="field">
        <label style="display:flex;align-items:center;gap:5px">${!canCustom ? lockIcon : ""}Submit button for WhatsApp</label>
        <input type="text" id="s-submit-label-wa" value="${canCustom ? esc(s.submitLabelWa||"") : ""}"
          placeholder="${canCustom ? "Send WateForm to WhatsApp" : "Upgrade to Plus to customize…"}"
          ${!canCustom ? "disabled" : ""}
          style="${!canCustom ? "opacity:.55;cursor:not-allowed" : ""}">
        ${!canCustom ? upgradeHint : ""}
      </div>
      <div class="field">
        <label style="display:flex;align-items:center;gap:5px">${!canCustom ? lockIcon : ""}Submit button for Telegram</label>
        <input type="text" id="s-submit-label-tg" value="${canCustom ? esc(s.submitLabelTg||"") : ""}"
          placeholder="${canCustom ? "Send WateForm to Telegram" : "Upgrade to Plus to customize…"}"
          ${!canCustom ? "disabled" : ""}
          style="${!canCustom ? "opacity:.55;cursor:not-allowed" : ""}">
      </div>
    `;
    document.getElementById("s-submit-label-wa")?.addEventListener("input", () => saveSetting());
    document.getElementById("s-submit-label-tg")?.addEventListener("input", () => saveSetting());
  } else if (target === "wa2") {
    wrap.innerHTML = `
      <div class="field">
        <label style="display:flex;align-items:center;gap:5px">${!canCustom ? lockIcon : ""}Submit button for WhatsApp 1</label>
        <input type="text" id="s-submit-label-wa" value="${canCustom ? esc(s.submitLabelWa||"") : ""}"
          placeholder="${canCustom ? "Send WateForm to WhatsApp 1" : "Upgrade to Plus to customize…"}"
          ${!canCustom ? "disabled" : ""}
          style="${!canCustom ? "opacity:.55;cursor:not-allowed" : ""}">
        ${!canCustom ? upgradeHint : ""}
      </div>
      <div class="field">
        <label style="display:flex;align-items:center;gap:5px">${!canCustom ? lockIcon : ""}Submit button for WhatsApp 2</label>
        <input type="text" id="s-submit-label-wa2" value="${canCustom ? esc(s.submitLabelWa2||"") : ""}"
          placeholder="${canCustom ? "Send WateForm to WhatsApp 2" : "Upgrade to Plus to customize…"}"
          ${!canCustom ? "disabled" : ""}
          style="${!canCustom ? "opacity:.55;cursor:not-allowed" : ""}">
      </div>
    `;
    document.getElementById("s-submit-label-wa")?.addEventListener("input", () => saveSetting());
    document.getElementById("s-submit-label-wa2")?.addEventListener("input", () => saveSetting());
  } else if (target === "tg2") {
    wrap.innerHTML = `
      <div class="field">
        <label style="display:flex;align-items:center;gap:5px">${!canCustom ? lockIcon : ""}Submit button for Telegram 1</label>
        <input type="text" id="s-submit-label-tg" value="${canCustom ? esc(s.submitLabelTg||"") : ""}"
          placeholder="${canCustom ? "Send WateForm to Telegram 1" : "Upgrade to Plus to customize…"}"
          ${!canCustom ? "disabled" : ""}
          style="${!canCustom ? "opacity:.55;cursor:not-allowed" : ""}">
        ${!canCustom ? upgradeHint : ""}
      </div>
      <div class="field">
        <label style="display:flex;align-items:center;gap:5px">${!canCustom ? lockIcon : ""}Submit button for Telegram 2</label>
        <input type="text" id="s-submit-label-tg2" value="${canCustom ? esc(s.submitLabelTg2||"") : ""}"
          placeholder="${canCustom ? "Send WateForm to Telegram 2" : "Upgrade to Plus to customize…"}"
          ${!canCustom ? "disabled" : ""}
          style="${!canCustom ? "opacity:.55;cursor:not-allowed" : ""}">
      </div>
    `;
    document.getElementById("s-submit-label-tg")?.addEventListener("input", () => saveSetting());
    document.getElementById("s-submit-label-tg2")?.addEventListener("input", () => saveSetting());
  } else {
    wrap.innerHTML = `
      <div class="field">
        <label style="display:flex;align-items:center;gap:5px">${!canCustom ? lockIcon : ""}Submit button text</label>
        <input type="text" id="s-submit-label" value="${canCustom ? esc(s.submitLabel||"") : ""}"
          placeholder="${canCustom ? getSubmitPlaceholder(target) : "Upgrade to Plus to customize…"}"
          ${!canCustom ? "disabled" : ""}
          style="${!canCustom ? "opacity:.55;cursor:not-allowed" : ""}">
        ${!canCustom ? upgradeHint : ""}
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
            slugHint.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;vertical-align:middle"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg> URL already taken, try another';
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
  // Gate custom URL: jika plan tidak allow, paksa null
  settings.slug        = planFeatures().customUrl ? newSlug : null;
  settings.isActive    = document.getElementById("s-active")?.checked !== false;
  // ── Enforce plan: paksa false/null jika plan pemilik workspace tidak mengizinkan,
  //    walaupun DOM-nya di-manipulasi dari devtools ──
  settings.removeWatermark = planFeatures().removeWatermark
    ? (document.getElementById("s-watermark")?.checked === true)
    : false;
  settings.target      = document.getElementById("s-target")?.value || "wa";
  settings.waPrefix    = document.getElementById("s-wa-prefix")?.value || "+62";
  settings.waNumber    = (document.getElementById("s-wa-number")?.value || "").replace(/[^0-9]/g, "");
  settings.waPrefix2   = document.getElementById("s-wa2-prefix")?.value || "+62";
  settings.waNumber2   = (document.getElementById("s-wa2-number")?.value || "").replace(/[^0-9]/g, "");
  settings.tgUsername  = (document.getElementById("s-tg-user")?.value || "").replace(/[^A-Za-z0-9_]/g, "");
  settings.tgUsername2 = (document.getElementById("s-tg2-user")?.value || "").replace(/[^A-Za-z0-9_]/g, "");
  settings.language    = document.getElementById("s-lang")?.value || "en";
  settings.openAt        = document.getElementById("s-open-at")?.value  || null;
  settings.closeAt       = document.getElementById("s-close-at")?.value || null;
  settings.closedMessage = planFeatures().closedMessage
    ? (document.getElementById("s-closed-msg")?.value.trim() || null)
    : null;
  const tgt = document.getElementById("s-target")?.value || "wa";
  if (tgt === "both") {
    settings.submitLabelWa  = planFeatures().customSubmitButton ? (document.getElementById("s-submit-label-wa")?.value.trim() || "") : "";
    settings.submitLabelTg  = planFeatures().customSubmitButton ? (document.getElementById("s-submit-label-tg")?.value.trim() || "") : "";
    settings.submitLabel    = "";
    settings.submitLabelWa2 = "";
    settings.submitLabelTg2 = "";
  } else if (tgt === "wa2") {
    settings.submitLabelWa  = planFeatures().customSubmitButton ? (document.getElementById("s-submit-label-wa")?.value.trim() || "") : "";
    settings.submitLabelWa2 = planFeatures().customSubmitButton ? (document.getElementById("s-submit-label-wa2")?.value.trim() || "") : "";
    settings.submitLabel    = "";
    settings.submitLabelTg  = "";
    settings.submitLabelTg2 = "";
  } else if (tgt === "tg2") {
    settings.submitLabelTg  = planFeatures().customSubmitButton ? (document.getElementById("s-submit-label-tg")?.value.trim() || "") : "";
    settings.submitLabelTg2 = planFeatures().customSubmitButton ? (document.getElementById("s-submit-label-tg2")?.value.trim() || "") : "";
    settings.submitLabel    = "";
    settings.submitLabelWa  = "";
    settings.submitLabelWa2 = "";
  } else {
    settings.submitLabel    = planFeatures().customSubmitButton ? (document.getElementById("s-submit-label")?.value.trim() || "") : "";
    settings.submitLabelWa  = "";
    settings.submitLabelTg  = "";
    settings.submitLabelWa2 = "";
    settings.submitLabelTg2 = "";
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
    const target  = settings.target || "wa";
    const waNum   = (settings.waNumber  || "").trim();
    const waNum2  = (settings.waNumber2 || "").trim();
    const tgUser  = (settings.tgUsername  || "").trim();
    const tgUser2 = (settings.tgUsername2 || "").trim();

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
    if (target === "wa2" && !waNum) {
      toast("Enter WhatsApp number 1", "error");
      document.getElementById("settings-panel").classList.add("open");
      setTimeout(() => document.getElementById("s-wa-number")?.focus(), 150);
      return;
    }
    if (target === "wa2" && !waNum2) {
      toast("Enter WhatsApp number 2", "error");
      document.getElementById("settings-panel").classList.add("open");
      setTimeout(() => document.getElementById("s-wa2-number")?.focus(), 150);
      return;
    }
    if (target === "tg2" && !tgUser) {
      toast("Enter Telegram username 1", "error");
      document.getElementById("settings-panel").classList.add("open");
      setTimeout(() => document.getElementById("s-tg-user")?.focus(), 150);
      return;
    }
    if (target === "tg2" && !tgUser2) {
      toast("Enter Telegram username 2", "error");
      document.getElementById("settings-panel").classList.add("open");
      setTimeout(() => document.getElementById("s-tg2-user")?.focus(), 150);
      return;
    }
  }


    // Validasi payment field sebelum publish
    const paymentFields = questions.filter(q => q.type === "payment");
    for (const pq of paymentFields) {
      const src = pq.paymentSource || "fixed";
      if (src === "fixed") {
        // Mode fixed: wajib ada minimal 1 item dengan harga > 0
        const hasValidItem = Array.isArray(pq.paymentItems) &&
          pq.paymentItems.some(it => it.value !== "" && Number(it.value) > 0);
        if (!hasValidItem) {
          toast(`Payment field "${pq.paymentLabel || "Payment"}" has no valid price. Set at least one item with a price greater than 0 to publish.`, "error");
          return;
        }
      } else if (src === "calculation") {
        // Mode calculation: wajib ada field Calculation di form
        const hasCalc = questions.some(q => q.type === "calculation");
        if (!hasCalc) {
          toast(`Payment field "${pq.paymentLabel || "Payment"}" is set to use a Calculation field, but no Calculation field exists in this form. Add a Calculation field or switch to Fixed price to publish.`, "error");
          return;
        }
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
  const waIcon = `<svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.997 0C5.373 0 0 5.373 0 12c0 2.122.559 4.112 1.532 5.835L.054 23.94l6.285-1.448A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.624 0 11.997 0zm.003 21.818a9.82 9.82 0 0 1-5.022-1.376l-.36-.214-3.733.979 1.001-3.656-.234-.376A9.82 9.82 0 0 1 2.182 12c0-5.421 4.41-9.818 9.818-9.818 5.42 0 9.818 4.397 9.818 9.818 0 5.42-4.397 9.818-9.818 9.818z"/></svg>`;
  const tgIcon = `<svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 14.147l-2.95-.924c-.64-.203-.655-.64.136-.953l11.57-4.461c.537-.194 1.006.131.968.412z"/></svg>`;
  let previewBtns = "";
  if (target === "wa2") {
    previewBtns = `
      <button class="btn btn-solid" style="background:#25D366;color:#fff;border-color:#25D366;flex:1;min-width:160px">${waIcon} ${s.submitLabelWa || "Send WateForm to WhatsApp 1"}</button>
      <button class="btn btn-solid" style="background:#128C7E;color:#fff;border-color:#128C7E;flex:1;min-width:160px">${waIcon} ${s.submitLabelWa2 || "Send WateForm to WhatsApp 2"}</button>`;
  } else if (target === "tg2") {
    previewBtns = `
      <button class="btn btn-solid" style="background:#229ED9;color:#fff;border-color:#229ED9;flex:1;min-width:160px">${tgIcon} ${s.submitLabelTg || "Send WateForm to Telegram 1"}</button>
      <button class="btn btn-solid" style="background:#1A7FAF;color:#fff;border-color:#1A7FAF;flex:1;min-width:160px">${tgIcon} ${s.submitLabelTg2 || "Send WateForm to Telegram 2"}</button>`;
  } else {
    previewBtns = `
      ${target !== "tg" ? `<button class="btn btn-solid" style="background:#25D366;color:#fff;border-color:#25D366;flex:1;min-width:160px">${waIcon} ${s.submitLabelWa || s.submitLabel || "Send WateForm to WhatsApp"}</button>` : ""}
      ${target !== "wa" ? `<button class="btn btn-solid" style="background:#229ED9;color:#fff;border-color:#229ED9;flex:1;min-width:160px">${tgIcon} ${s.submitLabelTg || s.submitLabel || "Send WateForm to Telegram"}</button>` : ""}`;
  }
  html += `
    <div style="margin-top:24px;display:flex;flex-direction:column;gap:10px">
      ${previewBtns}
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
  if (q.type === "checkbox") { const cbOpts = normOpts(q.checkboxOptions || q.options || []); control = `<div style="display:flex;flex-direction:column;gap:6px">${cbOpts.map(o=>`<label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:14px"><input type="checkbox"> ${esc(o.label)}${q.optionWithValue && o.value !== "" ? `<span style="margin-left:auto;font-size:11px;color:var(--text-muted);font-family:'JetBrains Mono',monospace">${Number(o.value).toLocaleString("en-US")}</span>` : ""}</label>`).join("")}${q.checkboxAllowOther ? `<label style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:14px"><input type="checkbox"> Other: <input type="text" placeholder="Specify…" style="flex:1;border:none;outline:none;background:transparent;font-size:14px;color:var(--text)"></label>` : ""}</div>`; }
  if (q.type === "phone")    control = `<div style="display:flex;gap:8px"><select style="width:120px;padding:8px;border:1px solid var(--border);border-radius:8px;font-size:13px;background:var(--bg-raised);color:var(--text)"><option>${esc(q.phonePrefix||"+62")}</option></select><input type="tel" placeholder="${ph}" style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--bg-raised);color:var(--text)"></div>`;
  if (q.type === "rating")   control = `<div style="display:flex;gap:6px">${Array(q.maxRating||5).fill("★").map(s=>`<span style="font-size:24px;cursor:pointer;color:var(--teal)">★</span>`).join("")}</div>`;
  if (q.type === "dropdown") {
    const ddOpts = normOpts(q.options || []);
    control = ddOpts.length > 10
      ? `<div style="position:relative"><input type="text" placeholder="— Select (searchable) —" readonly style="width:100%;padding:8px 36px 8px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--bg-raised);color:var(--text);cursor:pointer"><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' width='16' height='16' style='position:absolute;right:10px;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--text-muted)'><path d='m6 9 6 6 6-6'/></svg><div style='font-size:11px;color:var(--text-muted);margin-top:4px'>🔍 Searchable dropdown (${ddOpts.length} options)</div></div>`
      : `<select style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--bg-raised);color:var(--text);appearance:none"><option value="">Select…</option>${ddOpts.map(o=>`<option value="${esc(o.label)}">${esc(o.label)}</option>`).join("")}</select>`;
  }
  if (q.type === "calculation") {
    // Builder preview: show static placeholder — total is 0 until respondent selects options
    const pfx = q.calcPrefix ?? "$"; const sfx = q.calcSuffix ?? ""; const dc = q.calcDecimals || 0;
    const fmtN = n => `${pfx}${Number(n).toLocaleString("en-US",{minimumFractionDigits:dc,maximumFractionDigits:dc})}${sfx}`;
    const pricingSources = questions.filter(pq => pq.optionWithValue && ["choice","checkbox","dropdown","multiselect"].includes(pq.type));
    control = `<div style="background:var(--bg-raised);border:1.5px solid var(--border);border-radius:10px;padding:14px 16px">
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted);margin-bottom:10px">${esc(q.calcLabel||"Order Summary")}</div>
      ${pricingSources.length
        ? `<div style="font-size:12px;color:var(--text-muted);font-style:italic;margin-bottom:10px">Items will appear here as the respondent makes selections.</div>`
        : `<div style="font-size:12px;color:var(--text-muted);font-style:italic;margin-bottom:10px">No pricing fields connected yet. Enable "option pricing" on a choice / checkbox / dropdown field.</div>`
      }
      <div style="display:flex;justify-content:space-between;font-weight:700;font-size:16px;border-top:1.5px solid var(--border);padding-top:8px">
        <span>${esc(q.title || "Total")}</span><span style="color:var(--teal-deep)">${fmtN(0)}</span>
      </div>
    </div>`;
  }
  if (q.type === "payment") {
    // Preview di builder: tampilkan sesuai mode sumber harga (fixed atau calculation)
    const src = q.paymentSource || "fixed";
    const calcField = questions.find(pq => pq.type === "calculation");
    const pfx = calcField ? (calcField.calcPrefix ?? "Rp") : "Rp";
    const sfx = calcField ? (calcField.calcSuffix ?? "") : "";
    const dc  = calcField ? (calcField.calcDecimals || 0) : 0;
    const fmtN = n => `${pfx}${Number(n).toLocaleString("en-US",{minimumFractionDigits:dc,maximumFractionDigits:dc})}${sfx}`;

    let amountRows = "";
    let totalPreview = 0;

    if (src === "fixed") {
      // Tampilkan baris item harga tetap
      const items = Array.isArray(q.paymentItems) && q.paymentItems.length > 0 ? q.paymentItems : [];
      items.forEach(it => {
        const v = Number(it.value) || 0;
        totalPreview += v;
        amountRows += `<div style="display:flex;justify-content:space-between;font-size:13px;padding:3px 0;color:var(--text-soft)">
          <span>${esc(it.label || "Item")}</span>
          <span style="font-family:'JetBrains Mono',monospace">${fmtN(v)}</span>
        </div>`;
      });
      if (items.length === 0) {
        amountRows = `<div style="font-size:12px;color:var(--red,#ef4444);padding:4px 0">No price items set</div>`;
      }
    } else {
      // Mode calculation: tampilkan linked calc field
      amountRows = calcField
        ? `<div style="display:flex;justify-content:space-between;font-size:13px;padding:3px 0;color:var(--text-soft)">
            <span>${esc(calcField.calcLabel || calcField.title || "Calculation")}</span>
            <span style="color:var(--text-muted);font-style:italic">dynamic</span>
           </div>`
        : `<div style="font-size:12px;color:var(--red,#ef4444);padding:4px 0">No Calculation field found</div>`;
    }

    control = `<div style="background:var(--bg-raised);border:1.5px solid var(--teal,#2bbda4);border-radius:10px;padding:14px 16px">
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted);margin-bottom:8px">${esc(q.paymentLabel||"Payment")}</div>
      ${q.paymentDescription ? `<div style="font-size:12px;color:var(--text-soft);margin-bottom:10px">${esc(q.paymentDescription)}</div>` : ""}
      <div style="border-top:1px solid var(--border);padding-top:8px;margin-bottom:6px">${amountRows}</div>
      <div style="display:flex;justify-content:space-between;font-weight:700;font-size:15px;padding:6px 0;border-top:1px solid var(--border)">
        <span>Total</span>
        <span style="color:var(--teal-deep)">${src === "fixed" ? fmtN(totalPreview) : (calcField ? fmtN(0) + " (calculated)" : "—")}</span>
      </div>
      <button type="button" style="width:100%;margin-top:10px;padding:10px;background:var(--teal);color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
        Pay with QRIS
      </button>
      <div style="font-size:11px;color:var(--text-muted);margin-top:6px;text-align:center">Submit button activates after payment is confirmed</div>
    </div>`;
  }
  if (q.type === "choice")   { const choiceOpts = normOpts(q.options||[]); control = `<div style="display:flex;flex-direction:column;gap:6px">${choiceOpts.map(o=>`<label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:14px"><input type="radio" name="q${i}"> ${esc(o.label)}${q.optionWithValue && o.value !== "" ? `<span style="margin-left:auto;font-size:11px;color:var(--text-muted);font-family:'JetBrains Mono',monospace">${Number(o.value).toLocaleString("en-US")}</span>` : ""}</label>`).join("")}${q.allowOther ? `<label style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:14px"><input type="radio" name="q${i}"> Other: <input type="text" placeholder="Specify…" style="flex:1;border:none;outline:none;background:transparent;font-size:14px;color:var(--text)"></label>` : ""}</div>`; }
  if (q.type === "image")    control = q.mediaUrl ? `<img src="${esc(q.mediaUrl)}" style="width:100%;max-height:360px;object-fit:cover;border-radius:10px;display:block">` : `<div style="background:var(--bg-mid);border:1px solid var(--border);border-radius:10px;padding:48px;text-align:center;color:var(--text-muted);font-size:13px"><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' width='32' height='32' style='opacity:.4;display:block;margin:0 auto 8px'><rect x='3' y='3' width='18' height='18' rx='2'/><circle cx='8.5' cy='8.5' r='1.5'/><path d='m21 15-5-5L5 21'/></svg>Image will appear here</div>`;
  if (q.type === "video")    control = q.mediaUrl ? `<video src="${esc(q.mediaUrl)}" controls style="width:100%;border-radius:10px;display:block"></video>` : `<div style="background:var(--bg-mid);border:1px solid var(--border);border-radius:10px;padding:48px;text-align:center;color:var(--text-muted);font-size:13px"><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' width='32' height='32' style='opacity:.4;display:block;margin:0 auto 8px'><rect x='2' y='4' width='20' height='16' rx='2'/><polygon points='10 9 15 12 10 15 10 9'/></svg>Video will appear here</div>`;
  if (q.type === "file_upload") control = `<div style="border:2px dashed var(--border);border-radius:10px;padding:24px;text-align:center;color:var(--text-muted);font-size:13px"><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' width='28' height='28' style='opacity:.5;margin:0 auto 8px;display:block'><path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='17 8 12 3 7 8'/><line x1='12' y1='3' x2='12' y2='15'/></svg>${esc(q.placeholder || "Upload your file")}<br><span style='font-size:11px'>${q.allowedFileTypes ? q.allowedFileTypes.replace(/,/g,", ") : "Any file"} · Max ${q.maxFileSizeMb||10}MB</span></div>`;
  if (q.type === "url_input") { const _href=esc(q.urlHref||""); const _lbl=esc(q.urlLabel||q.urlHref||""); control = _href ? `<a href="${_href}" target="_blank" rel="noopener noreferrer" style="color:#6366f1;text-decoration:underline;font-size:14px;word-break:break-all">${_lbl||_href}</a>` : `<span style="font-size:13px;color:var(--text-muted);font-style:italic">No URL set yet</span>`; }
  if (q.type === "color")       control = `<div style="display:flex;align-items:center;gap:12px"><input type="color" value="${esc(q.colorDefault||"#2BBDA4")}" style="width:48px;height:40px;border:1px solid var(--border);border-radius:8px;padding:2px;cursor:pointer"><span style="font-size:13px;color:var(--text-muted)">HEX · RGB · HSL will be shown</span></div>`;
  if (q.type === "password")    control = `<div style="position:relative"><input type="password" placeholder="Enter password…" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--bg-raised);color:var(--text);letter-spacing:.1em"><div style="font-size:11px;color:var(--text-muted);margin-top:4px">Users must enter the correct password to submit</div></div>`;
  if (q.type === "toggle") control = `<div style="display:flex;align-items:center;gap:12px"><div style="width:50px;height:26px;border-radius:13px;background:var(--border);position:relative;cursor:pointer"><div style="width:22px;height:22px;border-radius:50%;background:#fff;position:absolute;top:2px;left:${q.toggleDefault?"24px":"2px"};box-shadow:0 1px 3px rgba(0,0,0,.2)"></div></div><span style="font-size:14px">${esc(q.toggleDefault?q.toggleOnLabel||"Yes":q.toggleOffLabel||"No")}</span></div>`;
  if (q.type === "multiselect") { const mso = normOpts(q.multiselectOptions||[]).slice(0,5); const msAll = normOpts(q.multiselectOptions||[]); control = `<div style="border:1px solid var(--border);border-radius:8px;padding:9px 12px 8px;background:var(--bg-raised)"><div style="font-size:13px;color:var(--text-muted);margin-bottom:6px">${esc(q.multiselectPlaceholder||"Select options…")}</div><div style="display:flex;flex-wrap:wrap;gap:6px">${mso.map(o=>`<span style="padding:3px 10px;border:1px solid var(--border);border-radius:20px;font-size:12px;cursor:pointer">${esc(o.label)}</span>`).join("")}${msAll.length>5?`<span style="font-size:12px;color:var(--text-muted);padding:3px 6px">+${msAll.length-5} more</span>`:""}</div></div>`; }
  if (q.type === "likert") { const scale = q.likertScale||5; const rows = (q.likertRows||[""]).filter(Boolean); control = `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr><th style="padding:6px 8px;text-align:left;font-weight:500;color:var(--text-muted)">${esc(q.likertStartLabel||"Strongly Disagree")}</th>${Array.from({length:scale},(_,i)=>`<th style="padding:6px 4px;text-align:center;font-size:11px;color:var(--text-muted)">${i+1}</th>`).join("")}<th style="padding:6px 8px;text-align:right;font-weight:500;color:var(--text-muted)">${esc(q.likertEndLabel||"Strongly Agree")}</th></tr></thead><tbody>${(rows.length?rows:["Statement 1","Statement 2"]).map(r=>`<tr style="border-top:1px solid var(--border)"><td style="padding:8px;font-size:13px">${esc(r)}</td>${Array.from({length:scale},(_,i)=>`<td style="padding:8px 4px;text-align:center"><input type="radio" name="l${i}" style="accent-color:var(--teal)"></td>`).join("")}<td></td></tr>`).join("")}</tbody></table></div>`; }
  if (q.type === "matrix") { const rows = q.matrixRows||["Row 1","Row 2"]; const cols = q.matrixCols||["Col 1","Col 2"]; control = `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr><th style="padding:8px;text-align:left;border-bottom:1px solid var(--border)"></th>${cols.map(c=>`<th style="padding:8px 12px;text-align:center;border-bottom:1px solid var(--border);font-weight:600">${esc(c)}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr style="border-top:1px solid var(--border-soft)"><td style="padding:9px 8px;font-size:13px">${esc(r)}</td>${cols.map((_,ci)=>`<td style="padding:9px 12px;text-align:center"><input type="${q.matrixType||"radio"}" name="mx-${r}-${ci}" style="accent-color:var(--teal)"></td>`).join("")}</tr>`).join("")}</tbody></table></div>`; }
  if (q.type === "data_table") {
    const dtC = q.tableColumns||["Ulangan I","Ulangan II","Ulangan III"];
    const dtR = q.tableRows||["M0","M1"];
    const dtCells = q.tableCells||dtR.map(()=>dtC.map(()=>""));
    control = `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr>
        <th style="padding:8px 10px;text-align:left;border-bottom:2px solid var(--border);background:var(--bg-mid);min-width:80px"></th>
        ${dtC.map(c=>`<th style="padding:8px 12px;text-align:center;border-bottom:2px solid var(--border);font-weight:600;background:var(--bg-mid);white-space:nowrap">${esc(c)}</th>`).join("")}
      </tr></thead>
      <tbody>${dtR.map((r,ri)=>`<tr style="border-top:1px solid var(--border-soft)">
        <td style="padding:8px 10px;font-weight:600;font-size:12.5px;background:var(--bg-mid);white-space:nowrap">${esc(r)}</td>
        ${dtC.map((_,ci)=>{const v=(dtCells[ri]||[])[ci]||""; return v
          ? `<td style="padding:8px 12px;text-align:center;font-size:13px">${esc(v)}</td>`
          : `<td style="padding:5px 8px;text-align:center"><div style="height:28px;border:1.5px dashed var(--border);border-radius:6px;background:var(--bg-raised);opacity:.7"></div></td>`;}
        ).join("")}
      </tr>`).join("")}</tbody>
    </table></div>`;
  }
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
