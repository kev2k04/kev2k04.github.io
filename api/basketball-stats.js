/* =========================================================================
   GET /api/basketball-stats  (serverless, server-side only)

   Resolution order:
     1. Manual override — assets/data/basketball-stats.json. If its
        "seasonStarted" is true, those numbers win (your "just type them in
        each week" option). This file is also what the static site reads
        directly when no function is deployed.
     2. Live scrape — if ROUNDBALL_PLAYER_URL is configured, fetch that
        server-rendered page and parse the row for PLAYER_NAME with cheerio.
     3. Otherwise → graceful pre-season state.

   Always responds 200 with JSON shaped:
     { seasonStarted: boolean, ppg, apg, rpg, lastUpdated, source }
   Never throws; any failure degrades to { seasonStarted: false }.
   ========================================================================= */
const fs = require('fs');
const path = require('path');
const cfg = require('./_config');

let cheerio = null;
try { cheerio = require('cheerio'); } catch (e) { /* parsed lazily below */ }

// Simple module-scoped cache (warm between invocations on a hot instance).
let cache = { at: 0, data: null };

const PRESEASON = { seasonStarted: false, ppg: null, apg: null, rpg: null, lastUpdated: null };

function readManualOverride() {
  // Bundled with the deployment; also served statically by the site.
  var candidates = [
    path.join(process.cwd(), 'assets', 'data', 'basketball-stats.json'),
    path.join(__dirname, '..', 'assets', 'data', 'basketball-stats.json')
  ];
  for (var i = 0; i < candidates.length; i++) {
    try {
      var raw = fs.readFileSync(candidates[i], 'utf8');
      return JSON.parse(raw);
    } catch (e) { /* try next */ }
  }
  return null;
}

function num(v) {
  if (v === null || v === undefined) return null;
  var n = parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? null : n;
}

/* Best-effort scrape of a RecLeague.net / stats.roundball.ca player page.
   The exact markup isn't known yet (season hasn't started), so this walks
   the stat table generically: find the row whose text includes the player's
   name, then read PPG/APG/RPG by matching the column headers.
   TODO(Kevin): once you have the real page, tighten the selectors here. */
function parseStats(html) {
  if (!cheerio) return null;
  var $ = cheerio.load(html);

  var result = null;
  $('table').each(function () {
    if (result) return;
    var $table = $(this);

    // Map header label -> column index.
    var headers = [];
    $table.find('tr').first().find('th, td').each(function (i) {
      headers[i] = $(this).text().trim().toLowerCase();
    });
    function colFor(matchers) {
      for (var i = 0; i < headers.length; i++) {
        for (var m = 0; m < matchers.length; m++) {
          if (headers[i] === matchers[m] || headers[i].indexOf(matchers[m]) !== -1) return i;
        }
      }
      return -1;
    }
    var ppgCol = colFor(['ppg', 'pts/g', 'points per game', 'pts']);
    var apgCol = colFor(['apg', 'ast/g', 'assists per game', 'ast']);
    var rpgCol = colFor(['rpg', 'reb/g', 'rebounds per game', 'reb']);

    $table.find('tr').each(function () {
      if (result) return;
      var $row = $(this);
      var rowText = $row.text().toLowerCase();
      if (rowText.indexOf(cfg.PLAYER_NAME.toLowerCase()) === -1) return;
      var cells = $row.find('td');
      if (!cells.length) return;
      var get = function (idx) { return idx >= 0 && cells[idx] ? num($(cells[idx]).text()) : null; };
      var ppg = get(ppgCol), apg = get(apgCol), rpg = get(rpgCol);
      if (ppg !== null || apg !== null || rpg !== null) {
        result = { ppg: ppg, apg: apg, rpg: rpg };
      }
    });
  });
  return result;
}

async function scrape(url) {
  var res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (portfolio-stats-bot)' }
  });
  if (!res.ok) return null;
  var html = await res.text();
  var parsed = parseStats(html);
  if (!parsed) return null;
  // Consider the season started only if at least one stat parsed as a number.
  var started = parsed.ppg !== null || parsed.apg !== null || parsed.rpg !== null;
  if (!started) return null;
  return {
    seasonStarted: true,
    ppg: parsed.ppg, apg: parsed.apg, rpg: parsed.rpg,
    lastUpdated: new Date().toISOString(),
    source: 'scrape'
  };
}

async function resolve() {
  // 1) Manual override wins when the season is flagged started.
  var manual = readManualOverride();
  if (manual && manual.seasonStarted === true) {
    return {
      seasonStarted: true,
      ppg: num(manual.ppg), apg: num(manual.apg), rpg: num(manual.rpg),
      lastUpdated: manual.lastUpdated || new Date().toISOString(),
      source: 'manual'
    };
  }
  // 2) Live scrape when a URL is configured.
  if (cfg.ROUNDBALL_PLAYER_URL) {
    try {
      var scraped = await scrape(cfg.ROUNDBALL_PLAYER_URL);
      if (scraped) return scraped;
    } catch (e) { /* fall through to pre-season */ }
  }
  // 3) Pre-season.
  return Object.assign({}, PRESEASON, { source: 'preseason' });
}

module.exports = async function handler(req, res) {
  // Public, read-only endpoint — allow cross-origin so the site can live on
  // GitHub Pages while the API is hosted elsewhere (see api_base).
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req && req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  try {
    var now = Date.now();
    if (cache.data && now - cache.at < cfg.STATS_CACHE_MS) {
      return send(res, 200, cache.data);
    }
    var data = await resolve();
    cache = { at: now, data: data };
    return send(res, 200, data);
  } catch (e) {
    // Never crash — degrade to pre-season.
    return send(res, 200, Object.assign({}, PRESEASON, { source: 'error' }));
  }
};

function send(res, status, body) {
  try {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=' + cfg.EDGE_CACHE_SECONDS + ', stale-while-revalidate');
    res.statusCode = status;
    res.end(JSON.stringify(body));
  } catch (e) { /* response already sent */ }
}
