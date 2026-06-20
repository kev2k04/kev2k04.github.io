/* =========================================================================
   Music panel — custom mini audio player.

   Replaces native <audio controls> so the play button can be a styled gradient
   "orb". Each [data-aplayer] gets: play/pause toggle, a seekable progress bar,
   and a time readout. Starting one track pauses the others, and closing the
   Passions overlay pauses everything.
   ========================================================================= */
(function () {
  var players = Array.prototype.slice.call(document.querySelectorAll('[data-aplayer]'));
  if (!players.length) return;

  var audios = [];

  function fmt(t) {
    if (!isFinite(t) || t < 0) t = 0;
    var m = Math.floor(t / 60);
    var s = Math.floor(t % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  players.forEach(function (el) {
    var audio = el.querySelector('audio');
    var btn = el.querySelector('.aplayer__btn');
    var bar = el.querySelector('.aplayer__bar');
    var fill = el.querySelector('.aplayer__progress');
    var time = el.querySelector('.aplayer__time');
    if (!audio || !btn) return;
    audios.push(audio);

    function showTime(t) { if (time) time.textContent = fmt(t); }

    audio.addEventListener('loadedmetadata', function () { showTime(audio.duration); });

    audio.addEventListener('timeupdate', function () {
      var d = audio.duration || 0;
      var c = audio.currentTime || 0;
      if (fill) fill.style.width = (d ? (c / d) * 100 : 0).toFixed(2) + '%';
      showTime(c);
    });

    audio.addEventListener('play', function () {
      el.classList.add('is-playing');
      btn.setAttribute('aria-label', 'Pause');
      audios.forEach(function (a) { if (a !== audio) a.pause(); });
    });
    audio.addEventListener('pause', function () {
      el.classList.remove('is-playing');
      btn.setAttribute('aria-label', 'Play');
    });
    audio.addEventListener('ended', function () {
      el.classList.remove('is-playing');
      if (fill) fill.style.width = '0%';
      showTime(audio.duration);
    });

    btn.addEventListener('click', function () {
      if (audio.paused) { audio.play(); } else { audio.pause(); }
    });

    if (bar) {
      bar.addEventListener('click', function (e) {
        if (!audio.duration) return;
        var r = bar.getBoundingClientRect();
        var ratio = (e.clientX - r.left) / r.width;
        audio.currentTime = Math.max(0, Math.min(1, ratio)) * audio.duration;
      });
    }
  });

  // Pause all tracks when the Passions overlay closes (panel hidden / inactive).
  var overlay = document.getElementById('pass-overlay');
  if (overlay && 'MutationObserver' in window) {
    new MutationObserver(function () {
      if (overlay.hidden || !overlay.classList.contains('is-active')) {
        audios.forEach(function (a) { a.pause(); });
      }
    }).observe(overlay, { attributes: true, attributeFilter: ['class', 'hidden'] });
  }
})();
