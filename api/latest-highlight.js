/* =========================================================================
   GET /api/latest-highlight  (serverless, server-side only)

   Pulls the most recent video from the @RoundballBC YouTube channel whose
   title contains the team name (TEAM_TITLE_MATCH, e.g. "Bagwork 2.0") via the
   YouTube Data API v3. The API key is read from YOUTUBE_API_KEY and NEVER
   leaves the server.

   Responds 200 with JSON:
     { found: boolean, videoId, title, url, publishedAt }
   When the key is missing or no match is found, returns { found: false }.
   Never throws. Cached server-side to protect the daily quota.
   ========================================================================= */
const cfg = require('./_config');

let cache = { at: 0, data: null };

const NOT_FOUND = { found: false };

async function ytGet(endpoint, params) {
  var url = new URL('https://www.googleapis.com/youtube/v3/' + endpoint);
  params.key = cfg.YOUTUBE_API_KEY;
  Object.keys(params).forEach(function (k) { url.searchParams.set(k, params[k]); });
  var res = await fetch(url.toString());
  if (!res.ok) return null;
  return res.json();
}

async function resolveChannelId() {
  // Preferred: resolve the @handle directly.
  var byHandle = await ytGet('channels', {
    part: 'id', forHandle: cfg.YOUTUBE_CHANNEL_HANDLE
  });
  if (byHandle && byHandle.items && byHandle.items.length) return byHandle.items[0].id;

  // Fallback: search for the channel by handle text.
  var search = await ytGet('search', {
    part: 'snippet', type: 'channel', q: cfg.YOUTUBE_CHANNEL_HANDLE, maxResults: 1
  });
  if (search && search.items && search.items.length) {
    return search.items[0].snippet.channelId || (search.items[0].id && search.items[0].id.channelId);
  }
  return null;
}

async function findLatestHighlight() {
  if (!cfg.YOUTUBE_API_KEY) return NOT_FOUND;

  var channelId = await resolveChannelId();
  if (!channelId) return NOT_FOUND;

  // Recent uploads, newest first, biased by the team-name query.
  var search = await ytGet('search', {
    part: 'snippet',
    channelId: channelId,
    q: cfg.TEAM_TITLE_MATCH,
    type: 'video',
    order: 'date',
    maxResults: 25
  });
  if (!search || !search.items) return NOT_FOUND;

  var needle = cfg.TEAM_TITLE_MATCH.toLowerCase();
  for (var i = 0; i < search.items.length; i++) {
    var item = search.items[i];
    var title = (item.snippet && item.snippet.title) || '';
    if (title.toLowerCase().indexOf(needle) !== -1) {
      var id = item.id && item.id.videoId;
      if (!id) continue;
      return {
        found: true,
        videoId: id,
        title: title,
        url: 'https://www.youtube.com/watch?v=' + id,
        publishedAt: item.snippet.publishedAt || null
      };
    }
  }
  return NOT_FOUND;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req && req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  try {
    var now = Date.now();
    if (cache.data && now - cache.at < cfg.VIDEO_CACHE_MS) {
      return send(res, 200, cache.data);
    }
    var data = await findLatestHighlight();
    // Only cache positive results long-term; cache "not found" briefly too so
    // a missing key doesn't hammer the API.
    cache = { at: now, data: data };
    return send(res, 200, data);
  } catch (e) {
    return send(res, 200, NOT_FOUND);
  }
};

function send(res, status, body) {
  try {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=' + cfg.EDGE_CACHE_SECONDS + ', stale-while-revalidate');
    res.statusCode = status;
    res.end(JSON.stringify(body));
  } catch (e) { /* already sent */ }
}
