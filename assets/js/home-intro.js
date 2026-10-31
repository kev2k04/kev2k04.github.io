/* =========================================================================
   Homepage opening.

   Title card: the hero fills the screen. One scroll gesture down (wheel,
   swipe, Page Down, arrow, space) glides the page to the top of the content,
   and the content sheet covers the hero. From the top of the content, a
   deliberate scroll up glides back to the full-screen hero. Below the top of
   the content, scrolling is normal.

   Hint: a small "Swipe down!" appears 5 seconds after load and hides once the
   visitor scrolls. Idle: after 10 seconds at the top with no activity, the
   top edge of the sheet rises into the bottom 5% of the screen (CSS).

   The glide is a custom eased animation rather than native smooth scrolling,
   so both directions move at the same unhurried pace.
   ========================================================================= */
(function () {
  var root = document.documentElement;
  var sheet = document.querySelector('.home-sheet');
  if (!sheet) return;

  var IDLE_MS = 10000;
  var HINT_MS = 5000;
  var UP_THRESHOLD = 30;   // px of upward wheel travel at the content top before the hero returns
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  var idleTimer = null;
  var gliding = false;
  var absorbing = false;   // eating the tail of a trackpad flick after a glide
  var absorbTimer = null;
  var upTravel = 0;
  var upTimer = null;
  var touchY = null;
  var frame = null;

  function y() { return window.pageYOffset || root.scrollTop || 0; }
  function atTop() { return y() < 40; }
  function jump(to) { window.scrollTo({ top: to, behavior: 'instant' }); }

  // Where the content starts: the sheet's top edge, just under the header.
  function contentTop() {
    var nav = parseFloat(getComputedStyle(root).getPropertyValue('--nav-h')) || 0;
    var shift = parseFloat(getComputedStyle(sheet).translate.split(' ')[1]) || 0;  // idle peek
    return Math.round(sheet.getBoundingClientRect().top - shift + y() - nav);
  }
  // In the title-card zone: anywhere above the start of the content.
  function inIntro() { return y() < contentTop() - 2; }
  // Resting at the start of the content (where scrolling up brings the hero back).
  function atContentTop() { return Math.abs(y() - contentTop()) < 24; }

  // Trackpads keep sending wheel events for a second after a flick. After a
  // glide, swallow them until the stream goes quiet, so the page doesn't
  // lurch past where the glide landed.
  function absorb() {
    absorbing = true;
    clearTimeout(absorbTimer);
    absorbTimer = setTimeout(function () { absorbing = false; }, 180);
  }

  function ease(t) {   // easeInOutCubic, softer at both ends than native smooth scroll
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  function glide(to) {
    cancelAnimationFrame(frame);
    upTravel = 0;
    root.classList.remove('home-nudge');
    if (reduce.matches) { jump(to); absorb(); return; }
    var from = y();
    var dist = to - from;
    if (Math.abs(dist) < 2) return;
    var dur = Math.min(1100, 620 + Math.abs(dist) * 0.35);
    var start = null;
    gliding = true;
    function step(now) {
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / dur);
      jump(from + dist * ease(t));
      if (t < 1) { frame = requestAnimationFrame(step); return; }
      gliding = false;
      absorb();
    }
    frame = requestAnimationFrame(step);
  }
  function toContent() { glide(contentTop()); }
  function toHero() { glide(0); }

  function arm() {
    clearTimeout(idleTimer);
    root.classList.remove('home-nudge');
    idleTimer = setTimeout(function () {
      if (atTop()) root.classList.add('home-nudge');
    }, IDLE_MS);
  }

  // ---- Wheel / trackpad ----
  window.addEventListener('wheel', function (e) {
    arm();
    if (e.ctrlKey) return;                      // pinch-zoom
    if (gliding || absorbing) { e.preventDefault(); if (absorbing) absorb(); return; }
    var top = contentTop();
    if (e.deltaY > 0 && inIntro()) {
      e.preventDefault();
      toContent();
    } else if (e.deltaY < 0 && inIntro()) {
      e.preventDefault();
      toHero();
    } else if (e.deltaY < 0 && atContentTop()) {
      // At the top of the content: a short deliberate pull up brings the hero back.
      e.preventDefault();
      upTravel += -e.deltaY;
      clearTimeout(upTimer);
      upTimer = setTimeout(function () { upTravel = 0; }, 300);
      if (upTravel > UP_THRESHOLD) toHero();
    } else if (e.deltaY < 0 && y() + e.deltaY < top) {
      // Scrolling up through the content: stop at its top first instead of
      // sailing on into the hero.
      e.preventDefault();
      jump(top);
      absorb();
    } else {
      upTravel = 0;
    }
  }, { passive: false });

  // ---- Touch: swipe up to leave the hero, pull down at the content top to return ----
  window.addEventListener('touchstart', function (e) {
    arm();
    touchY = e.touches[0].clientY;
  }, { passive: true });
  window.addEventListener('touchmove', function (e) {
    if (touchY === null) return;
    var dy = touchY - e.touches[0].clientY;   // > 0: finger moved up (scroll down)
    if (gliding) { e.preventDefault(); return; }
    if (dy > 24 && inIntro()) {
      e.preventDefault(); touchY = null; toContent();
    } else if (dy < -24 && inIntro()) {
      e.preventDefault(); touchY = null; toHero();
    } else if (dy < -50 && atContentTop()) {
      e.preventDefault(); touchY = null; toHero();
    }
  }, { passive: false });
  window.addEventListener('touchend', function () { touchY = null; }, { passive: true });

  // ---- Keyboard ----
  window.addEventListener('keydown', function (e) {
    arm();
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    var down = e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey);
    var up = e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey);
    if (down && inIntro()) { e.preventDefault(); toContent(); }
    else if (up && (inIntro() || atContentTop())) { e.preventDefault(); toHero(); }
  });

  // If the page comes to rest part-way through the hero (scrollbar drag,
  // anchor jump), settle on whichever end is closer.
  var settleTimer = null;
  window.addEventListener('scroll', function () {
    root.classList.toggle('home-scrolled', !atTop());
    if (!atTop()) root.classList.remove('home-nudge');
    clearTimeout(settleTimer);
    if (gliding) return;
    settleTimer = setTimeout(function () {
      if (gliding || absorbing || !inIntro() || atTop()) return;
      if (y() > contentTop() / 2) toContent(); else toHero();
    }, 160);
  }, { passive: true });

  ['pointermove', 'pointerdown'].forEach(function (type) {
    window.addEventListener(type, arm, { passive: true });
  });

  setTimeout(function () { root.classList.add('home-hint'); }, HINT_MS);
  root.classList.toggle('home-scrolled', !atTop());
  arm();
})();
