/* =========================================================================
   Ambient photo glow (see _includes/pass-glow.html). Lights the blurred copy
   of whichever passion tile sits nearest the middle of the screen; hovering
   or focusing a tile switches to that one instead.
   ========================================================================= */
(function () {
  var glow = document.querySelector('.pass-glow');
  if (!glow) return;
  var layers = {};
  Array.prototype.forEach.call(glow.querySelectorAll('[data-glow]'), function (l) {
    layers[l.dataset.glow] = l;
  });
  var tiles = Array.prototype.slice.call(document.querySelectorAll('[data-glow-for]'));
  if (!tiles.length) return;

  var current = null;
  var hovered = null;
  function show(id) {
    if (id === current || !layers[id]) return;
    if (current && layers[current]) layers[current].classList.remove('is-on');
    layers[id].classList.add('is-on');
    current = id;
  }

  function nearest() {
    var mid = window.innerHeight / 2, best = null, bestD = Infinity;
    tiles.forEach(function (t) {
      var r = t.getBoundingClientRect();
      var d = Math.abs(r.top + r.height / 2 - mid);
      if (d < bestD) { bestD = d; best = t; }
    });
    return best && best.dataset.glowFor;
  }

  var ticking = false;
  function update() {
    ticking = false;
    show(hovered || nearest());
  }
  function queue() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

  tiles.forEach(function (t) {
    t.addEventListener('pointerenter', function () { hovered = t.dataset.glowFor; queue(); });
    t.addEventListener('pointerleave', function () { hovered = null; queue(); });
    t.addEventListener('focus', function () { hovered = t.dataset.glowFor; queue(); });
    t.addEventListener('blur', function () { hovered = null; queue(); });
  });
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  update();
})();
