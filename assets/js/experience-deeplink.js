/* =========================================================================
   Deep-link highlight: arriving at /experience/#exp-card-<id> (e.g. from the
   homepage "Current Position" card) scrolls to that company's card and gives
   it a brief highlight pulse.
   ========================================================================= */
(function () {
  function flag() {
    var id = (location.hash || '').slice(1);
    if (!id) return;
    var el = document.getElementById(id);
    if (!el || el.className.indexOf('exp-card') === -1) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.remove('is-flag');
    void el.offsetWidth;            // restart the animation if re-triggered
    el.classList.add('is-flag');
    setTimeout(function () { el.classList.remove('is-flag'); }, 2800);
  }
  if (location.hash) setTimeout(flag, 350);   // let layout settle first
  window.addEventListener('hashchange', flag);
})();
