/* =========================================================================
   Lyrics popup — a centered, scrollable lyric sheet that pops open from the
   "Lyrics" button. As you scroll down, the lyrics drift slower (parallax) and
   fade out, vanishing at the bottom. Back button / scrim / Esc close it.
   ========================================================================= */
(function () {
  var overlays = Array.prototype.slice.call(document.querySelectorAll('[data-lyrics-overlay]'));
  if (!overlays.length) return;

  // Relocate to <body> so the fixed full-screen overlay isn't positioned
  // relative to the transformed panel it was authored inside.
  overlays.forEach(function (o) { document.body.appendChild(o); });

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var active = null;
  var closeTimer = null;

  // Drift slower + fade toward the bottom, based on scroll position.
  function applyFade(o) {
    var scroll = o.querySelector('[data-lyrics-scroll]');
    var inner = o.querySelector('[data-lyrics-inner]');
    if (!scroll || !inner) return;
    var max = scroll.scrollHeight - scroll.clientHeight;
    var y = scroll.scrollTop;
    var frac = max > 0 ? y / max : 0;
    var opacity = 1 - Math.max(0, (frac - 0.25) / 0.75); // full until 25%, gone at bottom
    inner.style.opacity = opacity.toFixed(3);
    inner.style.transform = 'translateY(' + (0.35 * y).toFixed(1) + 'px)'; // lag the scroll
  }

  function open(id) {
    var o = document.getElementById('lyrics-' + id);
    if (!o || active) return;
    active = o;
    clearTimeout(closeTimer);
    o.hidden = false;
    var scroll = o.querySelector('[data-lyrics-scroll]');
    var inner = o.querySelector('[data-lyrics-inner]');
    if (scroll) scroll.scrollTop = 0;
    if (inner) { inner.style.opacity = '1'; inner.style.transform = 'translateY(0)'; }
    requestAnimationFrame(function () { o.classList.add('is-active'); });
    var back = o.querySelector('[data-lyrics-close]');
    if (back) { try { back.focus({ preventScroll: true }); } catch (e) { back.focus(); } }
  }

  function close() {
    if (!active) return;
    var o = active;
    o.classList.remove('is-active');
    var finish = function () { o.hidden = true; };
    if (reduce) { finish(); }
    else { clearTimeout(closeTimer); closeTimer = setTimeout(finish, 450); }
    active = null;
  }

  overlays.forEach(function (o) {
    var scroll = o.querySelector('[data-lyrics-scroll]');
    if (scroll) {
      var ticking = false;
      scroll.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () { applyFade(o); ticking = false; });
      }, { passive: true });
    }
    o.addEventListener('click', function (e) {
      if (e.target.closest('[data-lyrics-close]')) close();
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-lyrics-open]'), function (btn) {
    btn.addEventListener('click', function () { open(btn.getAttribute('data-lyrics-open')); });
  });

  // Capture phase so Esc closes the lyrics before the panel's own Esc handler.
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && active) { close(); e.stopImmediatePropagation(); }
  }, true);
})();
