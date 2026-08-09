/**
 * WateForm — Message Formatter
 * Builds submission messages for WhatsApp and Telegram.
 *
 * Usage:
 *   const msg = formatMessage(questions, answers, formTitle, "wa");
 *   const msg = formatMessage(questions, answers, formTitle, "tg");
 *
 * @param {Array}  questions  - array of question objects from builder
 * @param {Object} answers    - { [questionId]: value }
 * @param {string} formTitle  - title of the form
 * @param {string} target     - "wa" | "tg" | "both" (returns { wa, tg } if "both")
 */
function formatMessage(questions, answers, formTitle, target = "wa") {
  if (target === "both") {
    return {
      wa: formatMessage(questions, answers, formTitle, "wa"),
      tg: formatMessage(questions, answers, formTitle, "tg"),
    };
  }

  const isTg = target === "tg";

  // Bold helper: WA uses *text*, Telegram uses *text* (MarkdownV2)
  const bold = (text) => isTg ? `*${escapeTg(text)}*` : `*${text}*`;

  const lines = [];

  // ── Header ────────────────────────────────────────────────────
  lines.push(bold(formTitle || "Form"));
  lines.push(""); // blank line after title

  // ── Questions ─────────────────────────────────────────────────
  for (const q of questions) {
    // Skip display-only types
    if (["title", "image", "video", "url_input", "button", "divider"].includes(q.type)) continue;

    const label = q.title || q.label || q.type;
    const raw   = answers?.[q.id];
    const val   = formatAnswer(q, raw, isTg);

    if (isTg) {
      // Telegram: label plain, answer after colon
      lines.push(`${escapeTg(label)}: ${val}`);
    } else {
      // WhatsApp: label plain, answer after colon
      lines.push(`${label}: ${val}`);
    }
  }

  // ── Footer ────────────────────────────────────────────────────
  lines.push("");
  if (isTg) {
    lines.push(`_Created by wateform\\.my\\.id_`); // Telegram MarkdownV2 italic
  } else {
    lines.push("_Created by wateform.my.id_");     // WhatsApp italic
  }

  return lines.join("\n");
}

/**
 * Formats a single answer based on question type.
 * Returns a plain string (already escaped for TG if isTg=true).
 */
function formatAnswer(q, raw, isTg = false) {
  const esc = isTg ? escapeTg : (s) => String(s ?? "");

  if (raw === null || raw === undefined || raw === "") return esc("-");

  switch (q.type) {
    // ── Simple text ───────────────────────────────────────────
    case "short":
    case "long":
    case "email":
    case "phone":
    case "number":
    case "url_input":
    case "password":
      return esc(raw);

    // ── Date / Time ───────────────────────────────────────────
    case "datetime":
      return esc(raw);

    // ── Rating (star): x/max ─────────────────────────────────
    case "rating":
      return esc(`${raw}/${q.maxRating || 5}`);

    // ── Emoji Rating ─────────────────────────────────────────
    case "emoji_rating": {
      const sets = {
        "2": ["👎", "👍"],
        "3": ["😞", "😐", "😊"],
        "5": ["😢", "😠", "😐", "😊", "😁"],
      };
      const emojis = sets[String(q.emojiSet || "5")] || sets["5"];
      const idx = parseInt(raw, 10);
      return emojis[idx] ?? esc(raw);
    }

    // ── Checkbox: Ans1, Ans2 ─────────────────────────────────
    case "checkbox":
      if (Array.isArray(raw)) return raw.map(esc).join(", ") || esc("-");
      return esc(raw);

    // ── Multiple choice ───────────────────────────────────────
    case "choice":
      return esc(raw);

    // ── Dropdown ─────────────────────────────────────────────
    case "dropdown":
      return esc(raw);

    // ── MultiSelect Dropdown: Ans1, Ans2 ─────────────────────
    case "multiselect":
      if (Array.isArray(raw)) return raw.map(esc).join(", ") || esc("-");
      return esc(raw);

    // ── Toggle Switch ─────────────────────────────────────────
    case "toggle":
      return esc(raw ? "Yes" : "No");

    // ── Slider: value/max ─────────────────────────────────────
    case "slider":
      return esc(`${raw}/${q.sliderMax ?? 100}`);

    // ── NPS: value/10 ────────────────────────────────────────
    case "nps_score":
      return esc(`${raw}/10`);

    // ── File Upload: FileName, url ────────────────────────────
    case "file_upload": {
      if (Array.isArray(raw)) {
        return raw.map(f => {
          const name = f.name || f.fileName || "file";
          const url  = f.url  || f.publicUrl || "";
          return url ? `${esc(name)}, ${esc(url)}` : esc(name);
        }).join("\n") || esc("-");
      }
      return esc(raw);
    }

    // ── Color Picker: #HEX, RGB, HSL ─────────────────────────
    case "color_picker": {
      if (typeof raw === "object" && raw !== null) {
        const hex = raw.hex || "";
        const rgb = raw.rgb ? `RGB(${raw.rgb.r},${raw.rgb.g},${raw.rgb.b})` : "";
        const hsl = raw.hsl ? `HSL(${Math.round(raw.hsl.h)},${Math.round(raw.hsl.s)}%,${Math.round(raw.hsl.l)}%)` : "";
        return [hex, rgb, hsl].filter(Boolean).map(esc).join(", ");
      }
      return esc(raw);
    }

    // ── Map / Location ────────────────────────────────────────
    case "map": {
      if (typeof raw === "object" && raw !== null) {
        const addr = raw.address || raw.label || "";
        const lat  = raw.lat  ?? raw.latitude  ?? "";
        const lng  = raw.lng  ?? raw.longitude ?? "";
        if (addr) return esc(addr);
        if (lat && lng) return esc(`${lat}, ${lng}`);
      }
      return esc(raw);
    }

    // ── Likert Scale: Statement-Value, ... ───────────────────
    case "likert": {
      if (typeof raw === "object" && raw !== null) {
        return Object.entries(raw)
          .map(([row, val]) => `${esc(row)}-${esc(val)}`)
          .join(", ");
      }
      return esc(raw);
    }

    // ── Multi Input: Val1, Val2 ───────────────────────────────
    case "multi_input": {
      if (typeof raw === "object" && raw !== null) {
        return Object.values(raw).map(esc).join(", ");
      }
      if (Array.isArray(raw)) return raw.map(esc).join(", ");
      return esc(raw);
    }

    // ── Ranking: 1.Ans1, 2.Ans2 ──────────────────────────────
    case "ranking": {
      if (Array.isArray(raw)) {
        return raw.map((item, i) => `${i + 1}.${esc(item)}`).join(", ");
      }
      return esc(raw);
    }

    // ── Matrix/Grid: Row1-Col1, Row1-Col2 ────────────────────
    case "matrix": {
      if (typeof raw === "object" && raw !== null) {
        const parts = [];
        for (const [row, cols] of Object.entries(raw)) {
          if (typeof cols === "object") {
            for (const [col, val] of Object.entries(cols)) {
              if (val) parts.push(`${esc(row)}-${esc(col)}`);
            }
          } else {
            parts.push(`${esc(row)}-${esc(cols)}`);
          }
        }
        return parts.join(", ") || esc("-");
      }
      return esc(raw);
    }

    // ── Table: Row1-Col1=Val, Row2-Col2=Val ──────────────────
    case "table": {
      if (Array.isArray(raw)) {
        const parts = [];
        (q.tableRows || []).forEach((row, ri) => {
          (q.tableCols || []).forEach((col, ci) => {
            const cell = raw[ri]?.[ci];
            if (cell) parts.push(`${esc(row)}-${esc(col)}=${esc(cell)}`);
          });
        });
        return parts.join(", ") || esc("-");
      }
      return esc(raw);
    }

    default:
      if (Array.isArray(raw)) return raw.map(esc).join(", ");
      if (typeof raw === "object") return esc(JSON.stringify(raw));
      return esc(String(raw));
  }
}

/**
 * Escape special characters for Telegram MarkdownV2.
 * Required chars: _ * [ ] ( ) ~ ` > # + - = | { } . !
 */
function escapeTg(text) {
  return String(text ?? "").replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

// ── Export (works in both browser global and ES module) ───────
if (typeof module !== "undefined" && module.exports) {
  module.exports = { formatMessage, formatAnswer, escapeTg };
}
