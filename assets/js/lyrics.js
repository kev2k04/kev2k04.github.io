/* =========================================================================
   Lyrics popup — a centered, scrollable lyric sheet that pops open from the
   "Lyrics" button. Back button / scrim / Esc close it. The lyrics simply
   scroll normally (no fade or parallax).
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

  function open(id) {
    var o = document.getElementById('lyrics-' + id);
    if (!o || active) return;
    active = o;
    clearTimeout(closeTimer);
    o.hidden = false;
    var scroll = o.querySelector('[data-lyrics-scroll]');
    if (scroll) scroll.scrollTop = 0;
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
