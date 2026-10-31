/* =========================================================================
   Music panel player. Every [data-track] cover (and [data-track-play] button)
   plays through one shared player bar pinned to the bottom of the panel,
   beat-store style: play/pause, previous/next, a seek bar, volume, and auto
   advance to the next track.
   ========================================================================= */
(function () {
  var bar = document.querySelector('[data-mx-player]');
  if (!bar) return;

  var audio = bar.querySelector('[data-mx-audio]');
  var toggle = bar.querySelector('[data-mx-toggle]');
  var seek = bar.querySelector('[data-mx-seek]');
  var vol = bar.querySelector('[data-mx-vol]');
  var now = bar.querySelector('[data-mx-now]');
  var dur = bar.querySelector('[data-mx-dur]');
  var titleEl = bar.querySelector('[data-mx-title]');
  var genreEl = bar.querySelector('[data-mx-genre]');
  var coverEl = bar.querySelector('[data-mx-cover]');
  var wordEl = bar.querySelector('[data-mx-word]');

  // One entry per playable track, in queue order (data-track is its index).
  var queue = [];
  Array.prototype.forEach.call(document.querySelectorAll('[data-track]'), function (el) {
    var i = +el.getAttribute('data-track');
    queue[i] = {
      src: el.getAttribute('data-src'),
      title: el.getAttribute('data-title'),
      genre: el.getAttribute('data-genre'),
      featured: el.classList.contains('mx-cover--featured')
    };
  });
  var current = -1;
  var seeking = false;

  function fmt(t) {
    if (!isFinite(t) || t < 0) t = 0;
    var m = Math.floor(t / 60), s = Math.floor(t % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  // Mark the playing track everywhere it appears (cover, row, featured button).
  function paint() {
    var playing = !audio.paused;
    Array.prototype.forEach.call(document.querySelectorAll('[data-track], [data-track-play], [data-row]'), function (el) {
      var i = +(el.getAttribute('data-track') || el.getAttribute('data-track-play') || el.getAttribute('data-row'));
      var on = i === current;
      el.classList.toggle('is-current', on);
      el.classList.toggle('is-playing', on && playing);
      if (el.hasAttribute('data-track')) {
        el.setAttribute('aria-label', (on && playing ? 'Pause ' : 'Play ') + queue[i].title);
      }
    });
    bar.classList.toggle('is-playing', playing);
    toggle.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  }

  function load(i) {
    var t = queue[i];
    if (!t) return;
    current = i;
    audio.src = t.src;
    titleEl.textContent = t.title;
    genreEl.textContent = t.genre;
    wordEl.textContent = t.title.toLowerCase();
    coverEl.classList.toggle('mx-cover--featured', t.featured);
    coverEl.setAttribute('data-genre', t.genre);
    seek.value = 0;
    now.textContent = '0:00';
    if (bar.hidden) {
      bar.hidden = false;
      setTimeout(function () { bar.classList.add('is-in'); }, 20);
    }
  }

  function play(i) {
    if (i !== current) load(i);
    var p = audio.play();
    if (p && p.catch) p.catch(function () {});
  }

  function toggleTrack(i) {
    if (i === current && !audio.paused) audio.pause();
    else play(i);
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-track], [data-track-play]');
    if (!el) return;
    toggleTrack(+(el.getAttribute('data-track') || el.getAttribute('data-track-play')));
  });

  toggle.addEventListener('click', function () {
    if (current < 0) return;
    if (audio.paused) play(current); else audio.pause();
  });
  bar.querySelector('[data-mx-prev]').addEventListener('click', function () {
    // Like most players: restart the track unless we're near its start.
    if (audio.currentTime > 3) { audio.currentTime = 0; return; }
    play((current - 1 + queue.length) % queue.length);
  });
  bar.querySelector('[data-mx-next]').addEventListener('click', function () {
    play((current + 1) % queue.length);
  });

  audio.addEventListener('play', paint);
  audio.addEventListener('pause', paint);
  audio.addEventListener('loadedmetadata', function () { dur.textContent = fmt(audio.duration); });
  audio.addEventListener('timeupdate', function () {
    if (seeking || !audio.duration) return;
    seek.value = Math.round(audio.currentTime / audio.duration * 1000);
    seek.style.setProperty('--fill', (seek.value / 10) + '%');
    now.textContent = fmt(audio.currentTime);
  });
  audio.addEventListener('ended', function () {
    if (current < queue.length - 1) play(current + 1);
    else paint();
  });

  seek.addEventListener('input', function () {
    seeking = true;
    seek.style.setProperty('--fill', (seek.value / 10) + '%');
    if (audio.duration) now.textContent = fmt(seek.value / 1000 * audio.duration);
  });
  seek.addEventListener('change', function () {
    if (audio.duration) audio.currentTime = seek.value / 1000 * audio.duration;
    seeking = false;
  });

  function setVol() {
    audio.volume = vol.value / 100;
    vol.style.setProperty('--fill', vol.value + '%');
  }
  vol.addEventListener('input', setVol);
  setVol();

  // The bar is sticky to the bottom of the screen until the song lists end.
  // A zero-height marker right after it tracks where the bar lets go; the bar
  // starts fading a little before that (5% of the screen height) and is gone
  // ~160px after, so it never sits over the albums below.
  var FADE_PX = 160;
  var LEAD = 0.05;
  var marker = document.createElement('span');
  marker.setAttribute('aria-hidden', 'true');
  marker.style.cssText = 'display:block;height:0;margin:0;padding:0';
  bar.insertAdjacentElement('afterend', marker);
  function fadeNearEnd() {
    var stuckBottom = window.innerHeight - (parseFloat(getComputedStyle(bar).bottom) || 0);
    var lead = window.innerHeight * LEAD;
    var risen = stuckBottom - marker.getBoundingClientRect().top + lead;
    var fade = Math.max(0, Math.min(1, 1 - risen / (FADE_PX + lead)));
    bar.style.setProperty('--mx-fade', fade.toFixed(3));
    bar.classList.toggle('is-faded', fade < 0.05);
  }
  window.addEventListener('scroll', fadeNearEnd, { passive: true });
  window.addEventListener('resize', fadeNearEnd);
  fadeNearEnd();
})();
