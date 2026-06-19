/* =========================================================================
   Scroll-fade — fade + parallax-drift an element out as the page scrolls down.
   Tag any element with `data-scroll-fade`: it's fully visible at the top,
   drifts up slower than the scroll, and is gone (and non-interactive) by
   ~1/5 of the way down. Reappears on the way back up.
   ========================================================================= */
(function () {
  var els = Array.prototype.slice.call(document.querySelectorAll('[data-scroll-fade]'));
  if (!els.length) return;

  var FADE_FRACTION = 0.2; // 1/5 of the scrollable distance
  var PARALLAX = 0.33;     // follows the scroll slower → drifts up as you go
  var ticking = false;

  function update() {
    var doc = document.documentElement;
    var maxScroll = doc.scrollHeight - window.innerHeight;
    var fadeEnd = FADE_FRACTION * maxScroll;
    var y = window.pageYOffset || doc.scrollTop || 0;

    var opacity = fadeEnd > 0 ? 1 - Math.min(1, y / fadeEnd) : 1;
    var drift = 'translateY(' + (-PARALLAX * y).toFixed(1) + 'px)';

    els.forEach(function (el) {
      el.style.opacity = opacity.toFixed(3);
      // Lag the viewport: drift upward at a fraction of the scroll speed.
      el.style.transform = drift;
      if (opacity <= 0.02) {
        // Fully gone — remove from interaction and the accessibility tree.
        el.style.visibility = 'hidden';
        el.style.pointerEvents = 'none';
      } else {
        el.style.visibility = 'visible';
        el.style.pointerEvents = 'auto';
      }
    });
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { update(); ticking = false; });
  }

  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', update);
})();
