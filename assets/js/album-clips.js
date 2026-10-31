/* =========================================================================
   Album previews (Music page). The play button on each album cover plays a
   30-second clip of one song. The clip files already fade in and out; this
   adds a short volume fade when paused early, a progress ring on the button,
   and stops any other audio on the page (the track player, a video) so only
   one thing plays at a time.
   ========================================================================= */
(function () {
  var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-album-clip]'));
  if (!buttons.length) return;

  var CLIP_S = 30;
  var FADE_MS = 400;
  var clip = new Audio();
  clip.preload = 'none';
  var active = null;   // the button whose clip is loaded
  var fadeFrame = null;

  function setState(btn, playing) {
    btn.classList.toggle('is-playing', playing);
    btn.closest('.album').classList.toggle('is-clip-playing', playing);
    btn.setAttribute('aria-pressed', playing ? 'true' : 'false');
  }

  function rampTo(target, ms, done) {
    cancelAnimationFrame(fadeFrame);
    var from = clip.volume, start = null;
    function step(now) {
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / ms);
      clip.volume = from + (target - from) * t;
      if (t < 1) fadeFrame = requestAnimationFrame(step); else if (done) done();
    }
    fadeFrame = requestAnimationFrame(step);
  }

  function stop(fade) {
    if (!active) return;
    var btn = active;
    setState(btn, false);
    if (fade && !clip.paused) {
      rampTo(0, FADE_MS, function () { clip.pause(); });
    } else {
      clip.pause();
    }
  }

  function start(btn) {
    if (active && active !== btn) { stop(false); btn.style.removeProperty('--clip'); }
    if (active !== btn) {
      active = btn;
      clip.src = btn.dataset.albumClip;
      clip.currentTime = parseFloat(btn.dataset.clipStart) || 0;
    } else if (clip.currentTime >= CLIP_S - 0.1) {
      clip.currentTime = parseFloat(btn.dataset.clipStart) || 0;
    }
    // Only one thing plays at a time.
    Array.prototype.forEach.call(document.querySelectorAll('audio, video'), function (m) {
      if (m !== clip && !m.paused) m.pause();
    });
    cancelAnimationFrame(fadeFrame);
    clip.volume = 1;
    var p = clip.play();
    if (p && p.catch) p.catch(function () { setState(btn, false); });
    setState(btn, true);
  }

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (btn.classList.contains('is-missing')) return;
      if (active === btn && !clip.paused && btn.classList.contains('is-playing')) stop(true);
      else start(btn);
    });
  });

  clip.addEventListener('timeupdate', function () {
    if (!active) return;
    var begin = parseFloat(active.dataset.clipStart) || 0;
    var t = (clip.currentTime - begin) / CLIP_S;
    active.style.setProperty('--clip', Math.max(0, Math.min(1, t)).toFixed(3));
    if (t >= 1) { clip.pause(); setState(active, false); }
  });
  clip.addEventListener('ended', function () {
    if (active) { setState(active, false); active.style.setProperty('--clip', '1'); }
  });
  clip.addEventListener('error', function () {
    if (!active) return;
    setState(active, false);
    active.classList.add('is-missing');
    active.setAttribute('title', 'Preview not available yet');
  });

  // Anything else starting to play (a track, the video) stops the clip.
  document.addEventListener('play', function (e) {
    if (e.target !== clip) stop(false);
  }, true);
})();
