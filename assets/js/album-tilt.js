/* =========================================================================
   Favourite Albums — visual-only hover tilt.

   On hover, each album scales up (bouncy easing lives in CSS) and tilts in 3D
   toward the cursor. Purely decorative: albums are <figure>s with no links, so
   nothing is clickable here. transform only, via CSS custom properties.
   ========================================================================= */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var MAX_TILT = 12; // degrees of rotation at the card's edges

  Array.prototype.forEach.call(document.querySelectorAll('.album'), function (album) {
    function onMove(e) {
      var r = album.getBoundingClientRect();
      // Normalised cursor position within the card: -0.5 (edge) .. 0.5 (edge).
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      album.style.setProperty('--album-ry', (px * MAX_TILT).toFixed(2) + 'deg');
      album.style.setProperty('--album-rx', (-py * MAX_TILT).toFixed(2) + 'deg');
    }

    function reset() {
      album.style.setProperty('--album-rx', '0deg');
      album.style.setProperty('--album-ry', '0deg');
    }

    album.addEventListener('mousemove', onMove);
    album.addEventListener('mouseleave', reset);
  });
})();
