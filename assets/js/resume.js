/* =========================================================================
   Résumé page — fade the floating Download button on scroll.
   Fully visible at the top; fades out as you scroll and is gone (and
   non-interactive) by ~2/5 of the way down. Reappears on the way back up.
   ========================================================================= */
(function () {
  var btn = document.querySelector('.resume__header .btn');
  if (!btn) return;

  var FADE_FRACTION = 0.2; // 1/5 of the scrollable distance
  var PARALLAX = 0.33;     // follows the scroll slower → drifts up as you go
  var ticking = false;

  function update() {
    var doc = document.documentElement;
    var maxScroll = doc.scrollHeight - window.innerHeight;
    var fadeEnd = FADE_FRACTION * maxScroll;
    var y = window.pageYOffset || doc.scrollTop || 0;

    var opacity = fadeEnd > 0 ? 1 - Math.min(1, y / fadeEnd) : 1;
    btn.style.opacity = opacity.toFixed(3);
    // Lag the viewport: drift upward at a fraction of the scroll speed.
    btn.style.transform = 'translateY(' + (-PARALLAX * y).toFixed(1) + 'px)';

    if (opacity <= 0.02) {
      // Fully gone — remove from interaction and the accessibility tree.
      btn.style.visibility = 'hidden';
      btn.style.pointerEvents = 'none';
    } else {
      btn.style.visibility = 'visible';
      btn.style.pointerEvents = 'auto';
    }
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
