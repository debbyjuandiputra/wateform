/**
 * WateForm — front-end behavior
 *
 * Dependencies loaded from CDN in login.html:
 *   @supabase/supabase-js  (window.supabase)
 *   hCaptcha DINONAKTIFKAN sementara
 */

// ── CONFIG ───────────────────────────────────────────────────
const SUPABASE_URL      = "https://zaaqlfxtymuafalkeftd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphYXFsZnh0eW11YWZhbGtlZnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4Nzg2NjMsImV4cCI6MjEwMTQ1NDY2M30.NKBBX7Qcb4T22tvAjjAzh4Scmbt-bJN1kb1ADBr6Bro";

const EDGE_BASE = `${SUPABASE_URL}/functions/v1`;
const DASH_URL  = "https://dash.wateform.my.id/dashboard/";

// ── Supabase client ───────────────────────────────────────────
let _sb = null;
function sb() {
  if (!_sb && window.supabase) {
    _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession:   true,
        storageKey:       "wf-session",
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return _sb;
}

// ── Theme ─────────────────────────────────────────────────────
(function initTheme() {
  const root       = document.documentElement;
  const toggleBtns = document.querySelectorAll("[data-theme-toggle]");

  function setTheme(theme) {
    theme === "dark"
      ? root.setAttribute("data-theme", "dark")
      : root.removeAttribute("data-theme");
    toggleBtns.forEach((btn) =>
      btn.setAttribute("aria-pressed", String(theme === "dark"))
    );
    try { localStorage.setItem("wf-theme", theme); } catch (_) {}
  }

  const saved = (() => {
    try { return localStorage.getItem("wf-theme"); } catch (_) { return null; }
  })();
  setTheme(saved === "dark" ? "dark" : "light");

  toggleBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
    })
  );
})();

// ── Auth page logic ───────────────────────────────────────────
(function initAuth() {
  const tabs   = document.querySelectorAll(".auth-tab[data-tab]");
  const panels = document.querySelectorAll("[data-panel]");
  if (!tabs.length) return;

  // State yang dibutuhkan saat verifikasi OTP
  let pendingEmail = null;

  // ── Tab switching ─────────────────────────────────────────
  function switchTab(name) {
    tabs.forEach((t)   => t.classList.toggle("active", t.dataset.tab === name));
    panels.forEach((p) => (p.style.display = p.dataset.panel === name ? "block" : "none"));
    history.replaceState(null, "", name === "register" ? "#register" : "#login");
  }

  tabs.forEach((tab) =>
    tab.addEventListener("click", () => switchTab(tab.dataset.tab))
  );

  if (location.hash === "#register") switchTab("register");

  // ── hCaptcha — DINONAKTIFKAN ──────────────────────────────
  // TODO: aktifkan kembali setelah hCaptcha dikonfigurasi di Supabase
  window.onHCaptchaLoad = function () { /* no-op */ };

  // ── UI helpers ────────────────────────────────────────────
  function setFieldError(fieldEl, msg) {
    fieldEl.classList.add("invalid");
    const errEl = fieldEl.querySelector(".error-text");
    if (errEl) errEl.textContent = msg;
  }
  function clearFieldError(fieldEl) {
    fieldEl.classList.remove("invalid");
  }
  function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) { el.textContent = msg; el.style.display = "block"; }
  }
  function clearError(id) {
    const el = document.getElementById(id);
    if (el) { el.textContent = ""; el.style.display = "none"; }
  }
  function setLoading(btn, loading) {
    btn.disabled = loading;
    btn.dataset.origText = btn.dataset.origText || btn.textContent;
    btn.textContent = loading ? "Please wait…" : btn.dataset.origText;
  }

  // ── Username availability (debounced) ─────────────────────
  let usernameTimer = null;
  const regUsername   = document.getElementById("reg-username");
  const usernameHint  = regUsername?.closest(".field")?.querySelector(".hint");
  const usernameField = regUsername?.closest(".field");

  if (regUsername) {
    regUsername.addEventListener("input", () => {
      clearTimeout(usernameTimer);
      const val = regUsername.value.trim();

      if (!val) {
        if (usernameHint) usernameHint.textContent =
          "This is what teammates type to invite you into a workspace.";
        clearFieldError(usernameField);
        return;
      }

      if (usernameHint) usernameHint.textContent = "Checking…";

      usernameTimer = setTimeout(async () => {
        try {
          const res  = await fetch(`${EDGE_BASE}/check-username`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ username: val }),
          });
          const data = await res.json();

          if (data.available === true) {
            clearFieldError(usernameField);
            if (usernameHint) usernameHint.textContent = "✓ Available";
          } else {
            setFieldError(usernameField,
              data.reason === "format"   ? (data.message || "Invalid format.") :
              data.reason === "reserved" ? "That username is reserved." :
              "Username is already taken."
            );
            if (usernameHint) usernameHint.textContent = "";
          }
        } catch {
          if (usernameHint) usernameHint.textContent = "Could not check availability.";
        }
      }, 450);
    });
  }

  // ── LOGIN form ────────────────────────────────────────────
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearError("login-general-error");

      const emailEl = document.getElementById("login-email");
      const passEl  = document.getElementById("login-password");
      const btn     = loginForm.querySelector("[type=submit]");

      setLoading(btn, true);

      const { error } = await sb().auth.signInWithPassword({
        email:    emailEl.value.trim(),
        password: passEl.value,
      });

      setLoading(btn, false);

      if (error) {
        showError("login-general-error",
          error.message.includes("Invalid login")
            ? "Email or password is incorrect."
            : error.message
        );
        return;
      }

      window.location.href = DASH_URL;
    });
  }

  // ── REGISTER form ─────────────────────────────────────────
  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearError("register-general-error");

      let valid = true;

      const fullnameEl = document.getElementById("reg-fullname");
      const usernameEl = document.getElementById("reg-username");
      const emailEl    = document.getElementById("reg-email");
      const pw1El      = document.getElementById("reg-password");
      const pw2El      = document.getElementById("reg-password-confirm");
      const btn        = registerForm.querySelector("[type=submit]");

      // Full name
      const fullnameField = fullnameEl.closest(".field");
      if (!fullnameEl.value.trim()) {
        setFieldError(fullnameField, "Full name is required.");
        valid = false;
      } else clearFieldError(fullnameField);

      // Username
      const uField = usernameEl.closest(".field");
      if (!/^[a-zA-Z0-9_.]{3,20}$/.test(usernameEl.value.trim())) {
        setFieldError(uField, "3–20 characters: letters, numbers, _ or .");
        valid = false;
      } else clearFieldError(uField);

      // Email — Gmail only
      const emailField = emailEl.closest(".field");
      const emailErrEl = emailField.querySelector(".error-text");
      const isGmail    = /^[^\s@]+@gmail\.com$/i.test(emailEl.value.trim());
      if (!isGmail) {
        emailField.classList.add("invalid");
        if (emailErrEl) emailErrEl.textContent = "Please use a @gmail.com address.";
        valid = false;
      } else clearFieldError(emailField);

      // Passwords
      const pw2Field = pw2El.closest(".field");
      const pw2ErrEl = pw2Field.querySelector(".error-text");
      const pwMatch  = pw1El.value.length >= 8 && pw1El.value === pw2El.value;
      if (!pwMatch) {
        pw2Field.classList.add("invalid");
        if (pw2ErrEl) pw2ErrEl.textContent =
          pw1El.value.length < 8
            ? "Password must be at least 8 characters."
            : "Passwords don't match.";
        valid = false;
      } else clearFieldError(pw2Field);

      if (!valid) return;

      setLoading(btn, true);

      // Final username check
      try {
        const availRes  = await fetch(`${EDGE_BASE}/check-username`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ username: usernameEl.value.trim() }),
        });
        const availData = await availRes.json();
        if (!availData.available) {
          setFieldError(uField, availData.reason === "reserved"
            ? "That username is reserved."
            : "Username was just taken — please choose another.");
          setLoading(btn, false);
          return;
        }
      } catch { /* non-fatal, DB constraint will catch this */ }

      const { error } = await sb().auth.signUp({
        email:    emailEl.value.trim(),
        password: pw1El.value,
        options: {
          data: {
            full_name: fullnameEl.value.trim(),
            username:  usernameEl.value.trim(),
          },
          emailRedirectTo: undefined,
        },
      });

      setLoading(btn, false);

      if (error) {
        showError("register-general-error",
          error.message.includes("already registered")
            ? "An account with this email already exists."
            : error.message
        );
        return;
      }

      // Email confirmation dimatikan di Supabase — langsung login
      const { error: signInErr } = await sb().auth.signInWithPassword({
        email:    emailEl.value.trim(),
        password: pw1El.value,
      });

      if (signInErr) {
        showError("register-general-error", "Account created — please log in.");
        document.querySelector("[data-tab='login']")?.click();
        return;
      }

      window.location.href = DASH_URL;
    });
  }

  // ── OTP PANEL ────────────────────────────────────────────
  // Tampil setelah signUp() berhasil — user masukkan 6 digit dari email
  function showOtpPanel(email) {
    const panel = document.querySelector("[data-panel='register']");
    if (!panel) return;

    // Render panel OTP
    panel.innerHTML = `
      <div class="otp-panel">
        <div class="otp-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="m2 7 10 7 10-7"/>
          </svg>
        </div>

        <h1>Check your email</h1>
        <p class="sub">
          We sent a 6-digit verification code to<br>
          <strong>${escHtml(email)}</strong>
        </p>

        <div id="otp-general-error" class="error-banner" style="display:none;"></div>

        <form id="otp-form" novalidate>
          <div class="otp-inputs" role="group" aria-label="Verification code">
            <input class="otp-digit" type="text" inputmode="numeric" maxlength="1" aria-label="Digit 1" autocomplete="one-time-code">
            <input class="otp-digit" type="text" inputmode="numeric" maxlength="1" aria-label="Digit 2">
            <input class="otp-digit" type="text" inputmode="numeric" maxlength="1" aria-label="Digit 3">
            <span class="otp-sep" aria-hidden="true">—</span>
            <input class="otp-digit" type="text" inputmode="numeric" maxlength="1" aria-label="Digit 4">
            <input class="otp-digit" type="text" inputmode="numeric" maxlength="1" aria-label="Digit 5">
            <input class="otp-digit" type="text" inputmode="numeric" maxlength="1" aria-label="Digit 6">
          </div>

          <button type="submit" class="btn btn-solid auth-submit" id="otp-submit-btn">
            Verify email
          </button>
        </form>

        <div class="otp-resend">
          Didn't get it?
          <button class="link-btn" id="resend-btn">Resend code</button>
          <span id="resend-countdown" style="display:none;color:var(--text-soft);font-size:13px;"></span>
        </div>
      </div>
    `;

    initOtpInputs();
    initResendButton(email);
  }

  // Escape HTML untuk keamanan
  function escHtml(str) {
    return str.replace(/[&<>"']/g, (c) =>
      ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" })[c]
    );
  }

  // ── OTP input: auto-navigate between boxes ──────────────
  function initOtpInputs() {
    const digits  = document.querySelectorAll(".otp-digit");
    const otpForm = document.getElementById("otp-form");

    digits.forEach((input, i) => {
      // Paste handler — user paste 6 digit langsung
      input.addEventListener("paste", (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData)
          .getData("text")
          .replace(/\D/g, "")
          .slice(0, 6);
        [...pasted].forEach((ch, idx) => {
          if (digits[idx]) digits[idx].value = ch;
        });
        // Focus on the last filled box
        const lastFilled = Math.min(pasted.length, digits.length) - 1;
        if (digits[lastFilled]) digits[lastFilled].focus();
        if (pasted.length === 6) tryAutoSubmit();
      });

      input.addEventListener("input", (e) => {
        const val = e.target.value.replace(/\D/g, "");
        e.target.value = val.slice(-1); // hanya 1 digit
        if (val && i < digits.length - 1) digits[i + 1].focus();
        if (i === digits.length - 1 && val) tryAutoSubmit();
      });

      input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !input.value && i > 0) {
          digits[i - 1].focus();
          digits[i - 1].value = "";
        }
        // Arrow keys
        if (e.key === "ArrowLeft"  && i > 0) { e.preventDefault(); digits[i - 1].focus(); }
        if (e.key === "ArrowRight" && i < digits.length - 1) { e.preventDefault(); digits[i + 1].focus(); }
      });

      // Click on box: select text for easy replacement
      input.addEventListener("click", () => input.select());
    });

    // Focus on the first box
    digits[0]?.focus();

    // Auto-submit saat semua 6 digit terisi
    function tryAutoSubmit() {
      const code = [...digits].map((d) => d.value).join("");
      if (code.length === 6) otpForm.requestSubmit();
    }

    // Submit handler
    otpForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const code = [...digits].map((d) => d.value).join("");

      if (code.length < 6) {
        showError("otp-general-error", "Please enter all 6 digits.");
        return;
      }

      if (!pendingEmail) {
        showError("otp-general-error", "Session expired — please register again.");
        return;
      }

      const btn = document.getElementById("otp-submit-btn");
      setLoading(btn, true);
      showError("otp-general-error", ""); // clear

      const { error } = await sb().auth.verifyOtp({
        email: pendingEmail,
        token: code,
        type:  "signup",
      });

      setLoading(btn, false);

      if (error) {
        // Clear all boxes and re-focus from the start
        digits.forEach((d) => (d.value = ""));
        digits[0]?.focus();

        showError("otp-general-error",
          error.message.includes("expired")
            ? "Code has expired — request a new one below."
            : error.message.includes("invalid") || error.message.includes("Token")
              ? "Incorrect code. Please check your email and try again."
              : error.message
        );
        return;
      }

      // Verifikasi berhasil → langsung ke dashboard
      pendingEmail = null;
      window.location.href = DASH_URL;
    });
  }

  // ── Resend OTP dengan countdown ───────────────────────────
  function initResendButton(email) {
    const resendBtn       = document.getElementById("resend-btn");
    const countdownEl     = document.getElementById("resend-countdown");
    let   countdownTimer  = null;
    const COOLDOWN        = 60; // detik

    function startCooldown() {
      let remaining = COOLDOWN;
      resendBtn.disabled = true;
      resendBtn.style.display = "none";
      countdownEl.style.display = "inline";

      function tick() {
        countdownEl.textContent = `Resend in ${remaining}s`;
        if (remaining <= 0) {
          clearInterval(countdownTimer);
          resendBtn.disabled = false;
          resendBtn.style.display = "inline";
          countdownEl.style.display = "none";
        }
        remaining--;
      }

      tick();
      countdownTimer = setInterval(tick, 1000);
    }

    resendBtn?.addEventListener("click", async () => {
      resendBtn.disabled = true;

      // Supabase: kirim ulang OTP dengan resend()
      const { error } = await sb().auth.resend({
        type:  "signup",
        email: email,
      });

      if (error) {
        showError("otp-general-error",
          error.message.includes("rate")
            ? "Too many attempts. Please wait before requesting a new code."
            : "Failed to resend — please try again."
        );
        resendBtn.disabled = false;
        return;
      }

      // Reset input
      document.querySelectorAll(".otp-digit").forEach((d) => (d.value = ""));
      document.querySelectorAll(".otp-digit")[0]?.focus();
      showError("otp-general-error", "");

      startCooldown();
    });

    // Mulai cooldown langsung (email baru saja dikirim)
    startCooldown();
  }
})();