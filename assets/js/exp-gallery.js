/* =========================================================================
   Experience photo gallery — the "Photo Gallery" button in a panel head flips
   that panel between its details and a grid of photos. Resets to details when
   the panel is closed/reopened.
   ========================================================================= */
(function () {
  var toggles = Array.prototype.slice.call(document.querySelectorAll('[data-gallery-toggle]'));
  if (!toggles.length) return;

  function setView(panel, btn, on) {
    panel.classList.toggle('is-gallery', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    var label = btn.querySelector('[data-gallery-label]');
    if (label) label.textContent = on ? 'Back to details' : 'Photo Gallery';
    if (panel.scrollTo) { try { panel.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { panel.scrollTop = 0; } }
  }

  toggles.forEach(function (btn) {
    var panel = btn.closest('.exp-panel');
    if (!panel) return;
    btn.addEventListener('click', function () {
      setView(panel, btn, !panel.classList.contains('is-gallery'));
    });
  });

  // Reset all panels back to the details view whenever the overlay is closed
  // (click on a close target or Esc), so reopening never lands on the gallery.
  function resetAll() {
    toggles.forEach(function (btn) {
      var panel = btn.closest('.exp-panel');
      if (panel && panel.classList.contains('is-gallery')) setView(panel, btn, false);
    });
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-exp-close]')) resetAll();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') resetAll();
  });
})();
