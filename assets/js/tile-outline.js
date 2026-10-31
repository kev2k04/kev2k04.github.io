/* =========================================================================
   Sizes the hover lines on the photo tiles (_includes/tile-outline.html).
   The SVG stretches with the tile; each line's dash pattern is set in screen
   pixels (the stroke is non-scaling); CSS runs the animation.
   ========================================================================= */
(function () {
  var SEG_PX = 53;   // visible length of each line, about 1.4 cm
  var svgs = Array.prototype.slice.call(document.querySelectorAll('.tile-outline'));
  if (!svgs.length) return;

  function size() {
    svgs.forEach(function (svg) {
      var scale = svg.getBoundingClientRect().width / 300;
      if (!scale) return;
      // The stroke is non-scaling, so dashes are measured in screen pixels:
      // convert each path's length from SVG units to pixels.
      var seg = SEG_PX;
      Array.prototype.forEach.call(svg.querySelectorAll('path'), function (p) {
        var len = p.getTotalLength() * scale;
        p.style.setProperty('--seg', seg + 'px');
        p.style.setProperty('--gap', (len + seg) + 'px');
        p.style.setProperty('--end', (-len) + 'px');
      });
    });
  }
  // Play once per hover: the run always finishes even if the pointer leaves,
  // and a tile can't replay until 1s after its last run ended.
  var COOLDOWN_MS = 1000;
  svgs.forEach(function (svg) {
    var tile = svg.closest('.photo-tile');
    var first = svg.querySelector('path');
    if (!tile || !first) return;
    var running = false, readyAt = 0;
    function trace() {
      if (running || Date.now() < readyAt) return;
      running = true;
      tile.classList.add('is-tracing');
    }
    first.addEventListener('animationend', function () {
      tile.classList.remove('is-tracing');
      running = false;
      readyAt = Date.now() + COOLDOWN_MS;
    });
    tile.addEventListener('pointerenter', trace);
    tile.addEventListener('focus', trace);
  });

  size();
  window.addEventListener('resize', size);
  window.addEventListener('load', size);
})();
