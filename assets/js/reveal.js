/* =========================================================================
   Scroll reveal — content lifts + fades in as it scrolls into view, once.
   Stays revealed for the rest of the visit; resets on a fresh load or when the
   page is restored from bfcache (returning from another page in the site). The
   hidden state + the `reveal-enabled` gate live in CSS (set in <head> before
   paint) so there's no flash before this script runs.
   ========================================================================= */
(function () {
  // No IntersectionObserver -> the gate class was never added, so everything is
  // already visible. Nothing to do.
  if (!('IntersectionObserver' in window)) return;
  if (!document.documentElement.classList.contains('reveal-enabled')) return;

  // Must stay in sync with the selector list in main.scss.
  var SELECTOR = [
    '.stats .stat',
    '#about .section__head', '.about__body', '.about__expertise',
    '.contact__inner > *',
    '.exp__head', '.exp-card',
    '.pass__head', '.pass-card',
    '.resume__block',
    '.build .section__head', '.build__body > p',
    '.bball-hero__inner > *', '.bball-stat', '.bball-status', '.bball-about', '.bball-reel'
  ].join(', ');

  var els = Array.prototype.slice.call(document.querySelectorAll(SELECTOR));
  if (!els.length) return;

  var io = new IntersectionObserver(function (entries) {
    // Reveal in natural reading order (top-to-bottom, then left-to-right) and
    // stagger anything that enters together so rows/grids cascade cleanly.
    var batch = entries.filter(function (e) { return e.isIntersecting; });
    batch.sort(function (a, b) {
      var ra = a.boundingClientRect, rb = b.boundingClientRect;
      return (ra.top - rb.top) || (ra.left - rb.left);
    });
    batch.forEach(function (e, i) {
      var el = e.target;
      io.unobserve(el);
      // Stagger via a delayed class add (not transition-delay) so the element's
      // own hover transitions are never left with a lingering delay.
      setTimeout(function () { el.classList.add('is-revealed'); }, Math.min(i, 6) * 80);
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -10% 0px' });

  els.forEach(function (el) { io.observe(el); });

  // Returning via back/forward (bfcache) restores the already-revealed DOM —
  // reset so the page reveals again, just like a fresh load.
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    els.forEach(function (el) {
      el.classList.remove('is-revealed');
      io.observe(el);
    });
  });
})();
