/* =========================================================================
   Basketball page — stat cards + highlight video.

   Data sources (all server-side; no keys or scraping ever run here):
     • Stats   → {apiBase}/api/basketball-stats  (manual JSON override first,
                 then a server-side scrape of the Roundball player page).
                 Falls back to the static /assets/data/basketball-stats.json
                 so the page still works on plain GitHub Pages (no functions).
     • Video   → {apiBase}/api/latest-highlight   (YouTube Data API, key stays
                 server-side). Graceful placeholder when unavailable.

   Every path degrades gracefully: pre-season, loading, and error states are
   all handled, and nothing here can throw uncaught.
   ========================================================================= */
(function () {
  'use strict';

  var root = document.querySelector('.bball');
  if (!root) return;

  var apiBase = (root.getAttribute('data-api-base') || '').replace(/\/$/, '');
  var staticStats = root.getAttribute('data-static-stats') || '/assets/data/basketball-stats.json';
  var team = root.getAttribute('data-team') || 'the team';

  /* Fetch a URL and resolve to parsed JSON only when the response is OK and
     actually JSON (a 404 HTML page from GitHub Pages resolves to null). */
  function fetchJson(url) {
    if (!url) return Promise.resolve(null);
    return fetch(url, { headers: { Accept: 'application/json' } })
      .then(function (res) {
        if (!res.ok) return null;
        var type = res.headers.get('content-type') || '';
        if (type.indexOf('application/json') === -1) return null;
        return res.json();
      })
      .catch(function () { return null; });
  }

  /* ---------------- Stats ---------------------------------------------- */
  var statsEl = document.getElementById('bball-stats');
  var statusEl = document.getElementById('bball-status');

  function fmt(n) {
    if (n === null || n === undefined || n === '' || isNaN(Number(n))) return null;
    return Number(n).toFixed(1);
  }

  function setStat(key, val) {
    var card = statsEl.querySelector('[data-stat="' + key + '"] [data-value]');
    if (card) card.innerHTML = val === null ? '&mdash;' : val;
  }

  function renderStats(data) {
    if (!data || data.seasonStarted !== true) {
      statsEl.setAttribute('data-state', 'preseason');
      setStat('ppg', null); setStat('apg', null); setStat('rpg', null);
      statusEl.textContent =
        "Season hasn't started yet — stats will appear here once games begin.";
      return;
    }
    statsEl.setAttribute('data-state', 'live');
    setStat('ppg', fmt(data.ppg));
    setStat('apg', fmt(data.apg));
    setStat('rpg', fmt(data.rpg));
    statusEl.textContent = data.lastUpdated
      ? 'Live stats · updated ' + formatDate(data.lastUpdated)
      : 'Live season stats.';
  }

  function formatDate(iso) {
    try {
      var d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) { return iso; }
  }

  function loadStats() {
    statsEl.setAttribute('data-state', 'loading');
    statusEl.textContent = 'Loading the latest stats…';
    // Try the serverless endpoint first, then the static JSON fallback.
    fetchJson(apiBase + '/api/basketball-stats')
      .then(function (data) { return data || fetchJson(staticStats); })
      .then(function (data) { renderStats(data); })
      .catch(function () {
        statsEl.setAttribute('data-state', 'error');
        statusEl.textContent = 'Stats are taking a breather — check back soon.';
      });
  }

  /* ---------------- Highlight video ------------------------------------ */
  var videoEl = document.getElementById('bball-video');
  var videoMsg = document.getElementById('bball-video-msg');

  function showVideoMessage(state, msg) {
    videoEl.setAttribute('data-state', state);
    if (videoMsg) videoMsg.textContent = msg;
  }

  function embedVideo(v) {
    var id = v && v.videoId;
    if (!id) return false;
    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id);
    iframe.title = v.title || (team + ' highlight');
    iframe.loading = 'lazy';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.setAttribute('allowfullscreen', '');
    iframe.frameBorder = '0';
    videoEl.innerHTML = '';
    videoEl.appendChild(iframe);
    videoEl.setAttribute('data-state', 'ready');
    if (v.title) {
      var cap = document.createElement('p');
      cap.className = 'bball-video__caption';
      cap.textContent = v.title;
      videoEl.appendChild(cap);
    }
    return true;
  }

  function loadVideo() {
    showVideoMessage('loading', 'Loading the latest highlight…');
    fetchJson(apiBase + '/api/latest-highlight')
      .then(function (data) {
        if (data && data.found && embedVideo(data)) return;
        showVideoMessage('empty', 'Latest ' + team + ' highlights will appear here.');
      })
      .catch(function () {
        showVideoMessage('empty', 'Latest ' + team + ' highlights will appear here.');
      });
  }

  loadStats();
  loadVideo();
})();
