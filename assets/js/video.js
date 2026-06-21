/* =========================================================================
   Video popup (e.g. the 2hollis clip). Opens from an album's "View" button:
   a flash-lights warning gate first, then on "play" the square video reveals
   on a blurred album-art stage. Back / scrim / Esc close it (and stop + reset
   the video). Relocated to <body> so the fixed overlay escapes the panel.
   ========================================================================= */
(function () {
  var overlays = Array.prototype.slice.call(document.querySelectorAll('[data-video-overlay]'));
  if (!overlays.length) return;

  overlays.forEach(function (o) { document.body.appendChild(o); });

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var active = null;
  var closeTimer = null;

  function reset(o) {
    var warn = o.querySelector('[data-video-warn]');
    var stage = o.querySelector('[data-video-stage]');
    var vid = o.querySelector('[data-video-el]');
    if (vid) { try { vid.pause(); vid.currentTime = 0; } catch (e) {} }
    if (stage) stage.hidden = true;
    if (warn) warn.hidden = false;
    o.classList.remove('is-playing');
  }

  function open(id) {
    var o = document.getElementById('video-' + id);
    if (!o || active) return;
    active = o;
    clearTimeout(closeTimer);
    reset(o);
    o.hidden = false;
    requestAnimationFrame(function () { o.classList.add('is-active'); });
    var go = o.querySelector('[data-video-proceed]');
    if (go) { try { go.focus({ preventScroll: true }); } catch (e) { go.focus(); } }
  }

  function proceed(o) {
    var warn = o.querySelector('[data-video-warn]');
    var stage = o.querySelector('[data-video-stage]');
    var vid = o.querySelector('[data-video-el]');
    if (warn) warn.hidden = true;
    if (stage) stage.hidden = false;
    o.classList.add('is-playing');
    if (vid) { var p = vid.play(); if (p && p.catch) p.catch(function () {}); }
  }

  function close() {
    if (!active) return;
    var o = active;
    o.classList.remove('is-active');
    var finish = function () { o.hidden = true; reset(o); };
    if (reduce) { finish(); }
    else { clearTimeout(closeTimer); closeTimer = setTimeout(finish, 450); }
    active = null;
  }

  overlays.forEach(function (o) {
    o.addEventListener('click', function (e) {
      if (e.target.closest('[data-video-proceed]')) { proceed(o); return; }
      if (e.target.closest('[data-video-close]')) { close(); }
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-video-open]'), function (btn) {
    btn.addEventListener('click', function () { open(btn.getAttribute('data-video-open')); });
  });

  // Capture phase so Esc closes the video before the panel's own Esc handler.
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && active) { close(); e.stopImmediatePropagation(); }
  }, true);
})();
