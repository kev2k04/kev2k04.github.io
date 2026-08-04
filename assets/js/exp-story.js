/* =========================================================================
   Experience feature story — the "Read the story" card inside a panel's
   details flips that panel to a third view (details / gallery / story).
   Mirrors exp-gallery.js: the view resets when the panel is closed, so
   reopening always lands back on the details.
   ========================================================================= */
(function () {
  var openers = Array.prototype.slice.call(document.querySelectorAll('[data-story-open]'));
  if (!openers.length) return;

  function setView(panel, on) {
    // Story and gallery are mutually exclusive views of the same panel.
    if (on) panel.classList.remove('is-gallery');
    panel.classList.toggle('is-story', on);
    if (panel.scrollTo) {
      try { panel.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { panel.scrollTop = 0; }
    }
  }

  function panelOf(el) { return el.closest('.exp-panel'); }

  openers.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var panel = panelOf(btn);
      if (panel) setView(panel, true);
    });
  });

  document.addEventListener('click', function (e) {
    // Back out of the story.
    var back = e.target.closest('[data-story-close]');
    if (back) {
      var panel = panelOf(back);
      if (panel) setView(panel, false);
      return;
    }

    // Switching to the gallery leaves the story behind.
    var gal = e.target.closest('[data-gallery-toggle]');
    if (gal) {
      var gpanel = panelOf(gal);
      if (gpanel) gpanel.classList.remove('is-story');
      return;
    }

    // Closing the overlay resets every panel back to its details.
    if (e.target.closest('[data-exp-close]')) resetAll();
  });

  function resetAll() {
    Array.prototype.slice.call(document.querySelectorAll('.exp-panel.is-story'))
      .forEach(function (panel) { setView(panel, false); });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') resetAll();
  });
})();
