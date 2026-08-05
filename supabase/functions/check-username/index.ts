/**
 * WateForm — Edge Function: check-username
 *
 * POST /functions/v1/check-username
 * Body: { "username": "nadia.putri" }
 *
 * Returns:
 *   200 { available: true }
 *   200 { available: false, reason: "taken" }
 *   400 { error: "..." }         — bad input
 *   429 { error: "..." }         — rate limit (basic, in-memory per isolate)
 *
 * This function is intentionally PUBLIC (no auth header required) so the
 * register form can check availability before the user even has a session.
 * It only reads a boolean — no sensitive data is exposed.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── In-memory rate limiter ───────────────────────────────────
// Edge isolates are short-lived, so this is "best effort" rather than
// strict. For production, use Upstash Redis or similar.
const hits = new Map<string, { count: number; reset: number }>();
const WINDOW_MS  = 60_000; // 1 minute
const MAX_HITS   = 20;     // per IP per window

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.reset) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > MAX_HITS;
}

// ── Username validation (mirrors DB constraint) ──────────────
const USERNAME_RE = /^[a-zA-Z0-9_.]{3,20}$/;

// ── Reserved names ───────────────────────────────────────────
const RESERVED = new Set([
  "admin", "administrator", "support", "help", "wateform",
  "root", "system", "api", "bot", "null", "undefined",
  "moderator", "staff", "billing", "security", "noreply",
]);

// ── Handler ──────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // Basic rate limiting
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("cf-connecting-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return json({ error: "Too many requests — slow down." }, 429);
  }

  // Parse body
  let body: { username?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const raw = body.username;
  if (typeof raw !== "string" || raw.trim() === "") {
    return json({ error: "username is required" }, 400);
  }

  const username = raw.trim();

  // Format check
  if (!USERNAME_RE.test(username)) {
    return json(
      {
        available: false,
        reason: "format",
        message:
          "Username must be 3–20 characters and contain only letters, numbers, underscores, or dots.",
      },
      200,
    );
  }

  // Reserved words check
  if (RESERVED.has(username.toLowerCase())) {
    return json({ available: false, reason: "reserved" }, 200);
  }

  // DB lookup
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // service role bypasses RLS for this read
    { auth: { persistSession: false } },
  );

  const { data, error } = await supabase.rpc("username_available", {
    uname: username,
  });

  if (error) {
    console.error("DB error:", error.message);
    return json({ error: "Internal error — please try again." }, 500);
  }

  return json({ available: data as boolean }, 200);
});

// ── Helpers ──────────────────────────────────────────────────
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  });
}
