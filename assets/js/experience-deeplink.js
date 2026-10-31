/* =========================================================================
   Deep link: arriving at /experience/#exp-card-<id> (from the homepage
   "Where I've worked" list) scrolls to that role and opens its details panel,
   zooming out of the card (experience.js handles the click).
   ========================================================================= */
(function () {
  function openFromHash() {
    var id = (location.hash || '').slice(1);
    var el = id && document.getElementById(id);
    if (!el || !el.hasAttribute('data-exp')) return;
    if (document.querySelector('.exp-panel:not([hidden])')) return;
    el.scrollIntoView({ behavior: 'instant', block: 'center' });
    setTimeout(function () { el.click(); }, 120);
  }
  if (location.hash) setTimeout(openFromHash, 200);   // let layout settle first
  window.addEventListener('hashchange', openFromHash);
})();
