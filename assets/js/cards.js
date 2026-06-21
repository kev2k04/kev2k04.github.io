/* =========================================================================
   Hero quick-link cards (01–04). They're quietly interactive: a brief physical
   compress on click, then navigate. Card 03 is split — the whole card goes to
   Passions, but the "Music" word is its own external link.
   ========================================================================= */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Compress (~80ms) → release → run `done`. Reduced-motion navigates at once.
  function press(el, done) {
    if (reduce) { done(); return; }
    el.classList.add('is-press');
    setTimeout(function () { el.classList.remove('is-press'); }, 90);
    setTimeout(done, 240);
  }

  function plainClick(e) {
    return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
  }

  // 01, 02, 04 — real links with a press; 04 smooth-scrolls instead of jumping.
  Array.prototype.forEach.call(document.querySelectorAll('.hero__facet[data-press]'), function (a) {
    a.addEventListener('click', function (e) {
      if (!plainClick(e)) return;            // let cmd/ctrl-click open a tab
      e.preventDefault();
      var href = a.getAttribute('href');
      var scroll = a.hasAttribute('data-scroll');
      press(a, function () {
        if (scroll) {
          var target = document.querySelector(href);
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.location.href = href;
        }
      });
    });
  });

  // 03 — card → Passions, but clicks on the Music link are left alone.
  Array.prototype.forEach.call(document.querySelectorAll('.hero__facet[data-card]'), function (card) {
    function go() { press(card, function () { window.location.href = card.getAttribute('data-href'); }); }
    card.addEventListener('click', function (e) {
      if (e.target.closest('.facet__music')) return;   // Music handles its own nav
      if (!plainClick(e)) return;
      go();
    });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
  });

  // Music links with no real URL yet (placeholder "#") shouldn't jump to top.
  Array.prototype.forEach.call(document.querySelectorAll('.facet__music'), function (m) {
    m.addEventListener('click', function (e) {
      var href = m.getAttribute('href');
      if (!href || href === '#') e.preventDefault();
    });
  });
})();
