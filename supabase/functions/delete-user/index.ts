/**
 * WateForm — Edge Function: delete-user
 *
 * POST /functions/v1/delete-user
 * Header: Authorization: Bearer <user_access_token>
 *
 * Menghapus akun user yang sedang login secara permanen:
 * 1. Verifikasi JWT user dari header Authorization
 * 2. Hapus data di tabel profiles (cascades ke tabel lain via FK)
 * 3. Hapus auth user via Admin API
 *
 * Returns:
 *   200 { success: true }
 *   401 { error: "Unauthorized" }
 *   500 { error: "..." }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL          = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY     = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── 1. Verifikasi user dari token ──────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");

  // Client dengan token user (untuk verifikasi)
  const sbUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error: userErr } = await sbUser.auth.getUser();
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── 2. Hapus data user (profiles + cascade) ────────────────
  // Admin client untuk operasi yang butuh service role
  const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { error: profileErr } = await sbAdmin
    .from("profiles")
    .delete()
    .eq("id", user.id);

  if (profileErr) {
    console.error("Profile delete error:", profileErr);
    // Non-fatal — lanjut hapus auth user
  }

  // ── 3. Hapus auth user ─────────────────────────────────────
  const { error: deleteErr } = await sbAdmin.auth.admin.deleteUser(user.id);
  if (deleteErr) {
    console.error("Auth delete error:", deleteErr);
    return new Response(JSON.stringify({ error: "Failed to delete account" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
