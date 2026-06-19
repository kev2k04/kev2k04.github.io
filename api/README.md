# Serverless API (`/api`)

Two server-side functions that power the Basketball page. **Secrets and
scraping never run in the browser** — only these functions touch the YouTube
API key and `stats.roundball.ca`.

| Function | Route | Returns |
| --- | --- | --- |
| `basketball-stats.js` | `GET /api/basketball-stats` | `{ seasonStarted, ppg, apg, rpg, lastUpdated, source }` |
| `latest-highlight.js` | `GET /api/latest-highlight` | `{ found, videoId, title, url, publishedAt }` |

Shared config lives in [`_config.js`](_config.js). Both functions are written
in the Vercel/Node style (`module.exports = (req, res) => …`), cache results
in-memory to protect quota, send permissive CORS headers, and **never throw** —
any failure degrades to a pre-season / "not found" state.

## To go live

1. **Stats** — either:
   - **Manual (easiest, works even on plain GitHub Pages):** edit
     [`../assets/data/basketball-stats.json`](../assets/data/basketball-stats.json),
     set `"seasonStarted": true`, and fill in `ppg`/`apg`/`rpg`. This takes
     priority over scraping.
   - **Live scrape:** set `ROUNDBALL_PLAYER_URL` in `_config.js` (or as an env
     var) to your player page on stats.roundball.ca. The parser looks for the
     row containing `PLAYER_NAME` ("Kevin Liu") and reads the PPG/APG/RPG
     columns. `TODO(Kevin)`: tighten the selectors in `parseStats()` once you
     can see the real page markup.
2. **Highlight video** — set the `YOUTUBE_API_KEY` env var (see
   [`../.env.example`](../.env.example)).

## Deploying

The site is a Jekyll static site (GitHub Pages). GitHub Pages **cannot** run
these functions. Two supported options:

- **Recommended — keep the site on GitHub Pages, host the API on Vercel:**
  deploy this repo (or just `/api`) to Vercel, add the env vars there, then set
  `api_base: "https://<your-app>.vercel.app"` in
  [`../_data/basketball.yml`](../_data/basketball.yml). The frontend calls that
  origin (CORS is already open). Until you do this, the page falls back to the
  static JSON and shows graceful placeholders — nothing breaks.
- **All-in-one on Vercel/Netlify:** deploy the whole site there so `/api/*` is
  same-origin; leave `api_base` blank.

## Local test

```bash
npm install
node -e "require('./api/basketball-stats.js')({method:'GET'},{setHeader(){},end(b){console.log(b)}})"
```
