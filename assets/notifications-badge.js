/**
 * WateForm — badge dot merah utk notifikasi belum dibaca
 * Dipasang di halaman yang punya elemen:
 *   [data-notif-bell]     → ikon lonceng notifications
 *   [data-hamburger-menu] → ikon hamburger (nav mobile)
 * Tiap elemen wajib punya child <span class="notif-dot" hidden></span>
 */

(function () {
  // ── Supabase client (duplikat dari auth.js/profile.js agar mandiri) ──
  const SUPABASE_URL      = "https://zaaqlfxtymuafalkeftd.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphYXFsZnh0eW11YWZhbGtlZnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4Nzg2NjMsImV4cCI6MjEwMTQ1NDY2M30.NKBBX7Qcb4T22tvAjjAzh4Scmbt-bJN1kb1ADBr6Bro";

  let _sb = null;
  function sb() {
    if (!_sb && window.supabase) {
      _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, storageKey: "wf-session", autoRefreshToken: true, detectSessionInUrl: false },
      });
    }
    return _sb;
  }

  // ── Badge control ──────────────────────────────────────────────
  function setDots(hasUnread) {
    document
      .querySelectorAll("[data-notif-bell] .notif-dot, [data-hamburger-menu] .notif-dot")
      .forEach((dot) => { dot.hidden = !hasUnread; });
  }

  async function refreshUnreadBadge() {
    const client = sb();
    if (!client) return;

    const { data: { user } = {} } = await client.auth.getUser();
    if (!user) { setDots(false); return; }

    const { count, error } = await client
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) { console.error("notif badge:", error.message); return; }
    setDots((count || 0) > 0);
  }

  // ── Realtime: update seketika saat ada notif baru / ditandai dibaca ─
  function subscribeRealtime(userId) {
    const client = sb();
    if (!client) return;

    client
      .channel("wf-notif-badge")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => refreshUnreadBadge()
      )
      .subscribe();
  }

  // ── Init ───────────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", async () => {
    const client = sb();
    if (!client) return;

    await refreshUnreadBadge();

    const { data: { user } = {} } = await client.auth.getUser();
    if (user) subscribeRealtime(user.id);

    client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        refreshUnreadBadge();
        subscribeRealtime(session.user.id);
      } else {
        setDots(false);
      }
    });
  });
})();