/* =========================================================================
   Highlight photo lightbox — a KEY experience highlight (.exp-point--key with a
   data-hl-image) opens a centered photo on click. A full-screen scrim makes it
   trivial to dismiss: click anywhere off the image, hit the ×, or press Esc.
   ========================================================================= */
(function () {
  var lb = document.getElementById('hl-lightbox');
  if (!lb) return;

  var img = lb.querySelector('[data-hl-img]');
  var scrim = lb.querySelector('.hl-lightbox__scrim');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lastFocus = null;
  var closeTimer = null;

  function open(el) {
    var src = el.getAttribute('data-hl-image');
    if (!src) return;
    lastFocus = el;
    img.src = src;
    img.alt = el.getAttribute('data-hl-alt') || '';
    clearTimeout(closeTimer);
    lb.hidden = false;
    requestAnimationFrame(function () { lb.classList.add('is-active'); });
    var btn = lb.querySelector('.hl-lightbox__close');
    if (btn) { try { btn.focus({ preventScroll: true }); } catch (e) { btn.focus(); } }
  }

  function close() {
    if (lb.hidden) return;
    lb.classList.remove('is-active');
    var finish = function () { lb.hidden = true; img.src = ''; if (lastFocus) { try { lastFocus.focus(); } catch (e) {} } };
    if (reduce) finish();
    else { clearTimeout(closeTimer); closeTimer = setTimeout(finish, 260); }
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-hl-image]'), function (el) {
    el.addEventListener('click', function () { open(el); });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(el); }
    });
  });

  lb.addEventListener('click', function (e) {
    if (e.target === scrim || e.target.closest('[data-hl-close]')) close();
  });
  // Capture phase so Esc closes the photo before the panel's own Esc handler.
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !lb.hidden) { close(); e.stopImmediatePropagation(); }
  }, true);
})();
