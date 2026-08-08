/**
 * WateForm — dropdown menu utk tombol hamburger
 * Butuh markup:
 *   <div class="hamburger-wrap">
 *     <button data-hamburger-menu> ... </button>
 *     <div class="hamburger-dropdown" data-hamburger-dropdown hidden> ...links... </div>
 *   </div>
 */
(function () {
  function closeAll() {
    document.querySelectorAll("[data-hamburger-dropdown]").forEach((d) => (d.hidden = true));
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-hamburger-menu]").forEach((btn) => {
      const wrap     = btn.closest(".hamburger-wrap") || btn.parentElement;
      const dropdown = wrap?.querySelector("[data-hamburger-dropdown]");
      if (!dropdown) return;

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const willOpen = dropdown.hidden;
        closeAll();
        dropdown.hidden = !willOpen;
      });
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest("[data-hamburger-dropdown]")) closeAll();
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(); });
  });
})();