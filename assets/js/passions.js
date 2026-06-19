/* =========================================================================
   Passions page — origin-aware "zoom from card" panels.

   Same vanilla-FLIP pattern as the Experience page (assets/js/experience.js):
   the panel is laid out centred at full size, we measure the clicked card and
   transform the panel back onto it, then clear the transform on the next frame
   so it animates up from the card's exact spot. transform/opacity only.

   Kept as a separate file (rather than refactoring experience.js) so the
   working Experience feature is never put at risk. Only "panel" cards wire up
   here — the Sports card is a normal link to /basketball/.
   ========================================================================= */
(function () {
  var overlay = document.getElementById('pass-overlay');
  if (!overlay) return;

  var cards = Array.prototype.slice.call(document.querySelectorAll('.pass-card[data-pass]'));
  var panels = {};
  Array.prototype.forEach.call(document.querySelectorAll('.pass-panel'), function (p) {
    panels[p.dataset.panel] = p;
  });

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var activeCard = null;
  var activePanel = null;
  var closeTimer = null;

  function mapPanelToCard(panel, card) {
    var c = card.getBoundingClientRect();
    var p = panel.getBoundingClientRect();
    var sx = c.width / p.width;
    var sy = c.height / p.height;
    var tx = c.left - p.left;
    var ty = c.top - p.top;
    return 'translate(' + tx + 'px, ' + ty + 'px) scale(' + sx + ', ' + sy + ')';
  }

  function open(id, card) {
    var panel = panels[id];
    if (!panel || activePanel) return;
    activeCard = card;
    activePanel = panel;

    overlay.hidden = false;
    panel.hidden = false;
    overlay.classList.add('is-active');
    document.body.classList.add('exp-lock');

    if (reduce) {
      panel.classList.add('is-open');
      focusInto(panel);
      return;
    }

    var start = mapPanelToCard(panel, card);
    panel.style.transition = 'none';
    panel.style.transform = start;
    void panel.offsetWidth; // flush styles so the next frame animates
    requestAnimationFrame(function () {
      panel.style.transition = '';
      panel.style.transform = '';
      panel.classList.add('is-open');
    });
    focusInto(panel);
  }

  function close() {
    if (!activePanel) return;
    var panel = activePanel;
    var card = activeCard;

    overlay.classList.remove('is-active');
    panel.classList.remove('is-open');

    if (reduce) { finish(); return; }

    panel.style.transform = mapPanelToCard(panel, card);

    var done = function (e) {
      if (e && (e.target !== panel || e.propertyName !== 'transform')) return;
      panel.removeEventListener('transitionend', done);
      finish();
    };
    panel.addEventListener('transitionend', done);
    clearTimeout(closeTimer);
    closeTimer = setTimeout(finish, 600); // safety net
  }

  function finish() {
    clearTimeout(closeTimer);
    var card = activeCard;
    if (activePanel) {
      activePanel.hidden = true;
      activePanel.style.transition = '';
      activePanel.style.transform = '';
      activePanel.classList.remove('is-open');
    }
    overlay.hidden = true;
    document.body.classList.remove('exp-lock');
    if (card) { try { card.focus({ preventScroll: true }); } catch (e) { card.focus(); } }
    activeCard = null;
    activePanel = null;
  }

  function focusInto(panel) {
    var back = panel.querySelector('[data-pass-close]');
    if (back) { try { back.focus({ preventScroll: true }); } catch (e) { back.focus(); } }
  }

  cards.forEach(function (card) {
    card.addEventListener('click', function () { open(card.dataset.pass, card); });
  });

  overlay.addEventListener('click', function (e) {
    if (e.target.closest('[data-pass-close]')) close();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && activePanel) close();
  });
})();
