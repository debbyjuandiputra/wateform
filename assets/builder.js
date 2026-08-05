// ── CONFIG ───────────────────────────────────────────────────
const SUPABASE_URL      = "https://zaaqlfxtymuafalkeftd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphYXFsZnh0eW11YWZhbGtlZnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4Nzg2NjMsImV4cCI6MjEwMTQ1NDY2M30.NKBBX7Qcb4T22tvAjjAzh4Scmbt-bJN1kb1ADBr6Bro";
const BASE_URL = window.location.origin;

const _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Question type definitions ─────────────────────────────────
const Q_TYPES = [
  { type:"short",     label:"Short text",    icon:'<path d="M4 6h16M4 12h10"/>',          desc:"Single line answer" },
  { type:"long",      label:"Long text",     icon:'<path d="M4 6h16M4 10h16M4 14h16M4 18h10"/>', desc:"Multi-line answer" },
  { type:"choice",    label:"Multiple choice",icon:'<circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>', desc:"Pick one or more" },
  { type:"checkbox",  label:"Checkbox",      icon:'<rect x="3" y="5" width="6" height="6" rx="1"/><path d="m9 8-2 2-1-1M15 7h6M15 11h6M15 15h4"/>',desc:"Yes/no toggle" },
  { type:"dropdown",  label:"Dropdown",      icon:'<path d="M6 9l6 6 6-6"/><rect x="3" y="3" width="18" height="18" rx="2"/>',desc:"Select from list" },
  { type:"number",    label:"Number",        icon:'<path d="M4 9l4-4 4 4M8 5v14M16 15l4 4 4-4M20 5v14" transform="scale(.75) translate(3,3)"/>', desc:"Numeric input" },
  { type:"date",      label:"Date",          icon:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',desc:"Date picker" },
  { type:"rating",    label:"Rating",        icon:'<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',desc:"Star rating" },
  { type:"email",     label:"Email",         icon:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/>',desc:"Email address" },
  { type:"phone",     label:"Phone",         icon:'<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.55 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',desc:"Phone number" },
  { type:"title",     label:"Title / Heading",icon:'<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',desc:"Section heading" },
  { type:"image",     label:"Image",         icon:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',desc:"Display an image" },
  { type:"video",     label:"Video",         icon:'<rect x="2" y="4" width="20" height="16" rx="2"/><polygon points="10 9 15 12 10 15 10 9"/>',desc:"Embed a video" },
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
let formId       = null;
let formData     = null;
let questions    = [];   // array of question objects
let settings     = {};
let activeQIdx   = null;
let saveTimer    = null;

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
function svgIcon(path) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">${path}</svg>`;
}

// ── Init ──────────────────────────────────────────────────────
async function init() {
  const { data: { session } } = await _sb.auth.getSession();
  if (!session) { window.location.href = "login.html"; return; }

  const params = new URLSearchParams(location.search);
  formId = params.get("form");
  if (!formId) { window.location.href = "dashboard.html"; return; }

  const { data, error } = await _sb.from("forms").select("*").eq("id", formId).single();
  if (error || !data) { window.location.href = "dashboard.html"; return; }

  formData  = data;
  questions = Array.isArray(data.questions) ? data.questions : [];
  settings  = data.settings || {};

  document.getElementById("topbar-form-title").textContent = data.title;
  document.title = `${data.title} — WateForm`;

  renderQList();
  renderQTypePicker();
  renderSettingsPanel();
  if (questions.length > 0) selectQuestion(0);

  // Publish btn state
  updatePublishBtn();
}

// ── Auto-save ─────────────────────────────────────────────────
function scheduleSave() {
  document.getElementById("save-indicator").textContent = "Saving…";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 1200);
}

async function saveNow() {
  await _sb.from("forms").update({ questions, settings }).eq("id", formId);
  document.getElementById("save-indicator").textContent = "Saved";
  setTimeout(() => { document.getElementById("save-indicator").textContent = ""; }, 2000);
}

// ── Question list (left panel) ────────────────────────────────
function renderQList() {
  const list  = document.getElementById("q-list");
  const count = document.getElementById("q-count");
  const empty = document.getElementById("center-empty");
  count.textContent = questions.length;
  list.innerHTML = "";

  const hasQ = questions.length > 0;
  if (empty) empty.style.display = hasQ ? "none" : "flex";

  questions.forEach((q, i) => {
    const def  = Q_TYPES.find(t => t.type === q.type) || Q_TYPES[0];
    const item = document.createElement("button");
    item.className = "q-item" + (i === activeQIdx ? " active" : "");
    item.innerHTML = `
      <div class="q-item-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${def.icon}</svg>
      </div>
      <div class="q-item-label">
        <div class="q-item-type">${def.label}</div>
        <div class="q-item-title">${esc(q.title || "Untitled")}</div>
      </div>
      <span class="q-item-drag" title="Drag">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5h2M9 12h2M9 19h2M13 5h2M13 12h2M13 19h2"/></svg>
      </span>
    `;
    item.addEventListener("click", () => selectQuestion(i));
    list.appendChild(item);
  });
}

function selectQuestion(idx) {
  activeQIdx = idx;
  renderQList();
  renderQEditor(idx);
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

document.getElementById("add-q-btn").addEventListener("click", () => openModal("qtype-modal"));
document.getElementById("center-add-btn")?.addEventListener("click", () => openModal("qtype-modal"));
document.addEventListener("click", e => {
  if (e.target.id === "center-add-btn") openModal("qtype-modal");
});

function addQuestion(type) {
  const q = {
    id: uid(), type,
    title: "", subtitle: "",
    placeholder: "", image: "",
    required: false,
    // type-specific
    options: ["Option 1", "Option 2"],  // choice/dropdown
    allowOther: false,                   // choice
    gmailOnly: false,                    // email
    phonePrefix: "+62",                  // phone
    maxRating: 5,                        // rating
    mediaType: "link", mediaUrl: "",     // image/video
    checked: false,                      // checkbox
  };
  questions.push(q);
  selectQuestion(questions.length - 1);
  scheduleSave();
}

// ── Question editor (center panel) ───────────────────────────
function renderQEditor(idx) {
  const center = document.getElementById("builder-center");
  const q = questions[idx];
  if (!q) return;
  const def = Q_TYPES.find(t => t.type === q.type);

  // Remove old editor card if exists
  const old = center.querySelector(".q-editor-card");
  if (old) old.remove();

  const card = document.createElement("div");
  card.className = "q-editor-card";
  card.style.maxWidth = "680px";
  card.style.width = "100%";

  card.innerHTML = `
    <div class="q-editor-head">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">${def?.icon || ""}</svg>
      <span class="q-editor-type">${def?.label || q.type}</span>
      <span style="margin-left:auto;font-size:12px;color:var(--text-muted)">Q${idx + 1}</span>
    </div>
    <div class="q-editor-body" id="qeditor-body"></div>
    <div class="q-editor-actions">
      <label class="toggle-row" style="gap:8px;margin-right:auto">
        <span class="toggle-label">Required</span>
        <label class="toggle">
          <input type="checkbox" id="q-required" ${q.required ? "checked" : ""}>
          <span class="toggle-track"></span>
        </label>
      </label>
      <button class="btn btn-ghost btn-sm" id="q-move-up-btn" ${idx === 0 ? "disabled" : ""}>↑ Move up</button>
      <button class="btn btn-ghost btn-sm" id="q-move-down-btn" ${idx === questions.length - 1 ? "disabled" : ""}>↓ Move down</button>
      <button class="btn btn-danger btn-sm" id="q-delete-btn">Delete</button>
    </div>
  `;

  center.appendChild(card);

  // Fill body with type-specific fields
  buildQEditorBody(q, idx);

  // Required toggle
  document.getElementById("q-required").addEventListener("change", e => {
    questions[idx].required = e.target.checked;
    scheduleSave();
  });

  // Move / delete
  document.getElementById("q-move-up-btn").addEventListener("click", () => moveQuestion(idx, -1));
  document.getElementById("q-move-down-btn").addEventListener("click", () => moveQuestion(idx, 1));
  document.getElementById("q-delete-btn").addEventListener("click", () => deleteQuestion(idx));
}

function buildQEditorBody(q, idx) {
  const body = document.getElementById("qeditor-body");
  body.innerHTML = "";

  // ── Common fields (except title/image types) ──────────────
  if (q.type !== "title") {
    // Title
    body.appendChild(makeField("Title", `
      <input type="text" id="q-title" value="${esc(q.title)}" placeholder="Question title…" maxlength="200">
    `));

    // Subtitle with rich toolbar
    body.appendChild(makeField("Subtitle <span style='font-size:11px;font-weight:400;color:var(--text-muted)'>(optional)</span>", `
      <div class="rich-toolbar" id="rich-toolbar">
        <button class="rich-btn" data-cmd="bold" title="Bold"><b>B</b></button>
        <button class="rich-btn" data-cmd="italic" title="Italic"><i>I</i></button>
        <button class="rich-btn" data-cmd="underline" title="Underline"><u>U</u></button>
        <button class="rich-btn" data-cmd="strikeThrough" title="Strikethrough"><s>S</s></button>
        <button class="rich-btn" data-cmd="insertUnorderedList" title="Bullet list">•</button>
      </div>
      <div class="rich-editor" id="q-subtitle" contenteditable="true">${q.subtitle || ""}</div>
    `));
  } else {
    // Title type has bigger title field
    body.appendChild(makeField("Heading text", `
      <input type="text" id="q-title" value="${esc(q.title)}" placeholder="Section heading…" maxlength="200">
    `));
    body.appendChild(makeField("Subtext <span style='font-size:11px;font-weight:400;color:var(--text-muted)'>(optional)</span>", `
      <div class="rich-toolbar" id="rich-toolbar">
        <button class="rich-btn" data-cmd="bold"><b>B</b></button>
        <button class="rich-btn" data-cmd="italic"><i>I</i></button>
        <button class="rich-btn" data-cmd="underline"><u>U</u></button>
      </div>
      <div class="rich-editor" id="q-subtitle" contenteditable="true">${q.subtitle || ""}</div>
    `));
  }

  // ── Type-specific ─────────────────────────────────────────
  if (["short","long","number","date"].includes(q.type)) {
    body.appendChild(makeField("Placeholder", `
      <input type="text" id="q-placeholder" value="${esc(q.placeholder)}" maxlength="120">
    `));
  }

  if (q.type === "email") {
    body.appendChild(makeField("Placeholder", `
      <input type="text" id="q-placeholder" value="${esc(q.placeholder)}" placeholder="e.g. you@example.com" maxlength="120">
    `));
    body.appendChild(makeField("", `
      <label class="toggle-row">
        <span class="toggle-label">Require @gmail.com only</span>
        <label class="toggle">
          <input type="checkbox" id="q-gmail-only" ${q.gmailOnly ? "checked" : ""}>
          <span class="toggle-track"></span>
        </label>
      </label>
    `));
  }

  if (q.type === "phone") {
    body.appendChild(makeField("Default country code", `
      <select id="q-phone-prefix">
        ${COUNTRY_CODES.map(c => `<option value="${c.code}" ${q.phonePrefix===c.code?"selected":""}>${c.label}</option>`).join("")}
      </select>
    `));
    body.appendChild(makeField("Placeholder", `
      <input type="text" id="q-placeholder" value="${esc(q.placeholder)}" placeholder="e.g. 812-3456-7890" maxlength="60">
    `));
  }

  if (q.type === "rating") {
    body.appendChild(makeField("Max rating", `
      <select id="q-max-rating">
        ${[3,4,5,7,10].map(n => `<option value="${n}" ${q.maxRating===n?"selected":""}>${n} stars</option>`).join("")}
      </select>
    `));
    // Preview stars
    const starsDiv = document.createElement("div");
    starsDiv.className = "rating-preview";
    starsDiv.id = "rating-preview";
    body.appendChild(starsDiv);
    renderStarPreview(q.maxRating);
  }

  if (q.type === "choice" || q.type === "dropdown") {
    const wrap = document.createElement("div");
    wrap.className = "field";
    const lbl = document.createElement("label");
    lbl.textContent = "Options";
    wrap.appendChild(lbl);
    const optsDiv = document.createElement("div");
    optsDiv.className = "choice-options";
    optsDiv.id = "choice-options";
    wrap.appendChild(optsDiv);
    const addOptBtn = document.createElement("button");
    addOptBtn.className = "add-option-btn";
    addOptBtn.textContent = "+ Add option";
    addOptBtn.addEventListener("click", () => {
      questions[idx].options.push("Option " + (questions[idx].options.length + 1));
      renderChoiceOptions(idx);
      scheduleSave();
    });
    wrap.appendChild(addOptBtn);
    if (q.type === "choice") {
      const otherRow = document.createElement("label");
      otherRow.className = "toggle-row";
      otherRow.style.marginTop = "8px";
      otherRow.innerHTML = `
        <span class="toggle-label">Allow "Other" option</span>
        <label class="toggle">
          <input type="checkbox" id="q-allow-other" ${q.allowOther ? "checked" : ""}>
          <span class="toggle-track"></span>
        </label>
      `;
      wrap.appendChild(otherRow);
    }
    body.appendChild(wrap);
    renderChoiceOptions(idx);
  }

  if (q.type === "image" || q.type === "video") {
    body.appendChild(makeField("Media source", `
      <select id="q-media-type">
        <option value="link" ${q.mediaType==="link"?"selected":""}>Link / URL</option>
        <option value="upload" ${q.mediaType==="upload"?"selected":""}>Upload file</option>
      </select>
    `));
    body.appendChild(makeField(q.type === "image" ? "Image URL" : "Video URL", `
      <input type="url" id="q-media-url" value="${esc(q.mediaUrl)}" placeholder="https://…">
    `));
  }

  // Image for any question type (decorative image above question)
  if (!["image","video","title"].includes(q.type)) {
    body.appendChild(makeField("Question image <span style='font-size:11px;font-weight:400;color:var(--text-muted)'>(optional)</span>", `
      <input type="url" id="q-image" value="${esc(q.image)}" placeholder="Paste image URL or upload link…">
    `));
  }

  // ── Wire up events ────────────────────────────────────────
  const titleEl = document.getElementById("q-title");
  if (titleEl) {
    titleEl.addEventListener("input", () => {
      questions[idx].title = titleEl.value;
      document.querySelectorAll(".q-item")[idx]?.querySelector(".q-item-title")?.let?.(el => el.textContent = titleEl.value || "Untitled");
      // Update sidebar
      renderQList(); activeQIdx = idx;
      scheduleSave();
    });
  }

  const subtitleEl = document.getElementById("q-subtitle");
  if (subtitleEl) {
    subtitleEl.addEventListener("input", () => { questions[idx].subtitle = subtitleEl.innerHTML; scheduleSave(); });
    document.getElementById("rich-toolbar")?.querySelectorAll(".rich-btn").forEach(btn => {
      btn.addEventListener("click", () => { document.execCommand(btn.dataset.cmd, false, null); subtitleEl.focus(); });
    });
  }

  const placeholderEl = document.getElementById("q-placeholder");
  if (placeholderEl) placeholderEl.addEventListener("input", () => { questions[idx].placeholder = placeholderEl.value; scheduleSave(); });

  document.getElementById("q-gmail-only")?.addEventListener("change", e => { questions[idx].gmailOnly = e.target.checked; scheduleSave(); });
  document.getElementById("q-allow-other")?.addEventListener("change", e => { questions[idx].allowOther = e.target.checked; scheduleSave(); });

  document.getElementById("q-phone-prefix")?.addEventListener("change", e => { questions[idx].phonePrefix = e.target.value; scheduleSave(); });

  const maxRatingEl = document.getElementById("q-max-rating");
  if (maxRatingEl) {
    maxRatingEl.addEventListener("change", e => {
      questions[idx].maxRating = Number(e.target.value);
      renderStarPreview(questions[idx].maxRating);
      scheduleSave();
    });
  }

  const mediaTypeEl = document.getElementById("q-media-type");
  if (mediaTypeEl) mediaTypeEl.addEventListener("change", e => { questions[idx].mediaType = e.target.value; scheduleSave(); });
  const mediaUrlEl = document.getElementById("q-media-url");
  if (mediaUrlEl) mediaUrlEl.addEventListener("input", () => { questions[idx].mediaUrl = mediaUrlEl.value; scheduleSave(); });

  const imageEl = document.getElementById("q-image");
  if (imageEl) imageEl.addEventListener("input", () => { questions[idx].image = imageEl.value; scheduleSave(); });
}

function makeField(labelHtml, inputHtml) {
  const div = document.createElement("div");
  div.className = "field";
  if (labelHtml) div.innerHTML = `<label>${labelHtml}</label>`;
  div.insertAdjacentHTML("beforeend", inputHtml);
  return div;
}

function renderStarPreview(max) {
  const div = document.getElementById("rating-preview");
  if (!div) return;
  div.innerHTML = "";
  for (let i = 1; i <= max; i++) {
    const btn = document.createElement("button");
    btn.className = "star-btn lit";
    btn.textContent = "★";
    btn.type = "button";
    div.appendChild(btn);
  }
}

function renderChoiceOptions(idx) {
  const q = questions[idx];
  const div = document.getElementById("choice-options");
  if (!div) return;
  div.innerHTML = "";
  (q.options || []).forEach((opt, oi) => {
    const row = document.createElement("div");
    row.className = "choice-opt-row";
    row.innerHTML = `
      <input type="text" value="${esc(opt)}" placeholder="Option ${oi+1}" data-oi="${oi}">
      <button class="choice-remove" data-oi="${oi}" title="Remove">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    `;
    div.appendChild(row);
  });
  div.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", () => {
      questions[idx].options[+input.dataset.oi] = input.value;
      scheduleSave();
    });
  });
  div.querySelectorAll(".choice-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      questions[idx].options.splice(+btn.dataset.oi, 1);
      renderChoiceOptions(idx);
      scheduleSave();
    });
  });
}

// ── Move / Delete question ────────────────────────────────────
function moveQuestion(idx, dir) {
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= questions.length) return;
  [questions[idx], questions[newIdx]] = [questions[newIdx], questions[idx]];
  selectQuestion(newIdx);
  scheduleSave();
}

function deleteQuestion(idx) {
  questions.splice(idx, 1);
  const newIdx = Math.min(idx, questions.length - 1);
  activeQIdx = newIdx >= 0 ? newIdx : null;
  renderQList();
  const center = document.getElementById("builder-center");
  const old = center.querySelector(".q-editor-card");
  if (old) old.remove();
  if (activeQIdx !== null) renderQEditor(activeQIdx);
  scheduleSave();
}

// ── Settings panel ────────────────────────────────────────────
function renderSettingsPanel() {
  const s = settings;
  const body = document.getElementById("settings-body");
  const wsShortId = formData?.workspace_id ? "" : ""; // filled below
  const formSlug  = s.slug || formData?.short_id || "";

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
      <div class="hint">Leave blank to use auto-generated ID.</div>
    </div>
    <div class="settings-sep"></div>
    <div class="field">
      <label>Target</label>
      <select id="s-target">
        <option value="wa"   ${(s.target||"wa")==="wa"?"selected":""}>WhatsApp only</option>
        <option value="tg"   ${s.target==="tg"?"selected":""}>Telegram only</option>
        <option value="both" ${s.target==="both"?"selected":""}>WhatsApp + Telegram</option>
      </select>
    </div>

    <div id="s-wa-wrap" class="${(s.target||"wa")==="tg"?"":""}">
      <div class="field">
        <label>WhatsApp number</label>
        <div class="phone-wrap">
          <select id="s-wa-prefix" class="phone-prefix">
            ${COUNTRY_CODES.map(c=>`<option value="${c.code}" ${(s.waPrefix||"+62")===c.code?"selected":""}>${c.code} ${c.label.split(" ")[0]}</option>`).join("")}
          </select>
          <input type="text" id="s-wa-number" value="${esc(s.waNumber||"")}" placeholder="8123456789">
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
    <div class="field">
      <label>Submit button text</label>
      <input type="text" id="s-submit-label" value="${esc(s.submitLabel||"")}" placeholder="Send WateForm to WhatsApp">
    </div>
  `;

  updateTargetVisibility();

  // Wire events
  document.getElementById("s-target").addEventListener("change", () => {
    settings.target = document.getElementById("s-target").value;
    updateTargetVisibility();
    saveSetting();
  });

  ["s-title","s-desc","s-slug","s-wa-number","s-tg-user","s-submit-label"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", () => saveSetting());
  });
  ["s-wa-prefix","s-lang"].forEach(id => {
    document.getElementById(id)?.addEventListener("change", () => saveSetting());
  });
}

function updateTargetVisibility() {
  const t = document.getElementById("s-target")?.value || "wa";
  const waWrap = document.getElementById("s-wa-wrap");
  const tgWrap = document.getElementById("s-tg-wrap");
  if (waWrap) waWrap.style.display = t === "tg" ? "none" : "block";
  if (tgWrap) tgWrap.style.display = t === "wa" ? "none" : "block";
}

async function saveSetting() {
  const title = document.getElementById("s-title")?.value.trim();
  if (title) {
    formData.title = title;
    document.getElementById("topbar-form-title").textContent = title;
    await _sb.from("forms").update({ title, description: document.getElementById("s-desc")?.value.trim() || null }).eq("id", formId);
  }
  settings.slug        = document.getElementById("s-slug")?.value.trim() || null;
  settings.target      = document.getElementById("s-target")?.value || "wa";
  settings.waPrefix    = document.getElementById("s-wa-prefix")?.value || "+62";
  settings.waNumber    = document.getElementById("s-wa-number")?.value.trim() || "";
  settings.tgUsername  = document.getElementById("s-tg-user")?.value.trim() || "";
  settings.language    = document.getElementById("s-lang")?.value || "en";
  settings.submitLabel = document.getElementById("s-submit-label")?.value.trim() || "";
  scheduleSave();
}

// ── Publish ───────────────────────────────────────────────────
function updatePublishBtn() {
  const btn = document.getElementById("publish-btn");
  const published = formData?.is_published;
  btn.innerHTML = published
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M20 6 9 17l-5-5"/></svg> Published`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M5 12h14M12 5l7 7-7 7"/></svg> Publish`;
  btn.style.background = published ? "var(--teal-deep)" : "";
}

document.getElementById("publish-btn").addEventListener("click", async () => {
  const newState = !formData?.is_published;
  await saveNow();
  const { error } = await _sb.from("forms").update({ is_published: newState }).eq("id", formId);
  if (error) { toast("Failed to " + (newState ? "publish" : "unpublish"), "error"); return; }
  formData.is_published = newState;
  updatePublishBtn();
  toast(newState ? "Form published!" : "Form unpublished");
});

// ── Settings toggle ───────────────────────────────────────────
document.getElementById("settings-toggle-btn").addEventListener("click", () => {
  const panel = document.getElementById("settings-panel");
  panel.classList.toggle("open");
});
document.getElementById("settings-close-btn").addEventListener("click", () => {
  document.getElementById("settings-panel").classList.remove("open");
});

// ── Preview ───────────────────────────────────────────────────
document.getElementById("preview-btn").addEventListener("click", () => {
  const body = document.getElementById("preview-body");
  const s = settings;
  const target = s.target || "wa";
  const submitLabel = s.submitLabel ||
    (target === "wa" ? "Send WateForm to WhatsApp" :
     target === "tg" ? "Send WateForm to Telegram" :
     "Send WateForm");

  let html = `<h2 style="font-size:18px;font-weight:800;margin:0 0 6px">${esc(formData?.title || "Form")}</h2>`;
  if (formData?.description) html += `<p style="font-size:13.5px;color:var(--text-soft);margin:0 0 20px">${esc(formData.description)}</p>`;

  questions.forEach((q, i) => {
    html += buildPreviewField(q, i);
  });

  html += `
    <div style="margin-top:24px;display:flex;gap:8px;flex-wrap:wrap">
      ${target !== "tg" ? `<button class="btn btn-solid" style="background:var(--wa);color:#fff;border-color:var(--wa);flex:1;min-width:160px">
        <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.997 0C5.373 0 0 5.373 0 12c0 2.122.559 4.112 1.532 5.835L.054 23.94l6.285-1.448A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.624 0 11.997 0zm.003 21.818a9.82 9.82 0 0 1-5.022-1.376l-.36-.214-3.733.979 1.001-3.656-.234-.376A9.82 9.82 0 0 1 2.182 12c0-5.421 4.41-9.818 9.818-9.818 5.42 0 9.818 4.397 9.818 9.818 0 5.42-4.397 9.818-9.818 9.818z"/></svg>
        Send to WhatsApp
      </button>` : ""}
      ${target !== "wa" ? `<button class="btn btn-solid" style="background:var(--tg);color:#fff;border-color:var(--tg);flex:1;min-width:160px">
        <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 14.147l-2.95-.924c-.64-.203-.655-.64.136-.953l11.57-4.461c.537-.194 1.006.131.968.412z"/></svg>
        Send to Telegram
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
  const ph = esc(q.placeholder || "Your answer…");
  if (q.type === "short")    control = `<input type="text" placeholder="${ph}" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--bg-raised);color:var(--text)">`;
  if (q.type === "long")     control = `<textarea placeholder="${ph}" rows="3" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--bg-raised);color:var(--text);resize:vertical"></textarea>`;
  if (q.type === "number")   control = `<input type="number" placeholder="${ph}" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--bg-raised);color:var(--text)">`;
  if (q.type === "date")     control = `<input type="date" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--bg-raised);color:var(--text)">`;
  if (q.type === "email")    control = `<input type="email" placeholder="${q.gmailOnly ? "you@gmail.com" : ph}" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--bg-raised);color:var(--text)">`;
  if (q.type === "checkbox") control = `<label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox"> <span style="font-size:14px">${esc(q.title)}</span></label>`;
  if (q.type === "phone")    control = `<div style="display:flex;gap:8px"><select style="width:120px;padding:8px;border:1px solid var(--border);border-radius:8px;font-size:13px;background:var(--bg-raised);color:var(--text)"><option>${esc(q.phonePrefix||"+62")}</option></select><input type="tel" placeholder="${ph}" style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;background:var(--bg-raised);color:var(--text)"></div>`;
  if (q.type === "rating")   control = `<div style="display:flex;gap:6px">${"★".repeat(q.maxRating||5).split("").map(s=>`<span style="font-size:24px;cursor:pointer;color:var(--teal)">★</span>`).join("")}</div>`;
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

// ── Boot ──────────────────────────────────────────────────────
init();
