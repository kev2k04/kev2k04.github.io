/* =========================================================================
   Experience page — origin-aware "zoom from button" panels.

   Approach (vanilla FLIP): the panel is laid out at its final, centred size,
   then we measure the clicked button's rect and apply the transform that maps
   the panel back onto that button (translate + non-uniform scale). On the next
   frame we clear the transform so it animates up to full size from the button's
   exact spot. Closing plays the same mapping in reverse. transform/opacity only,
   so it stays on the compositor.
   ========================================================================= */
(function () {
  var overlay = document.getElementById('exp-overlay');
  if (!overlay) return;

  var cards = Array.prototype.slice.call(document.querySelectorAll('.exp-card'));
  var panels = {};
  Array.prototype.forEach.call(document.querySelectorAll('.exp-panel'), function (p) {
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

    // Start the panel collapsed onto the button, then release to full size.
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
    panel.classList.remove('is-open'); // fades inner content out

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
    var back = panel.querySelector('[data-exp-close]');
    if (back) { try { back.focus({ preventScroll: true }); } catch (e) { back.focus(); } }
  }

  cards.forEach(function (card) {
    card.addEventListener('click', function () { open(card.dataset.exp, card); });
  });

  overlay.addEventListener('click', function (e) {
    if (e.target.closest('[data-exp-close]')) close();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && activePanel) close();
  });
})();
