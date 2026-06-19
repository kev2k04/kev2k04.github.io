/* =========================================================================
   Shared config for the serverless API functions.

   These run SERVER-SIDE only (Vercel/Netlify-style functions). No secret or
   scraping logic ever ships to the browser. To go live you only need to:
     1. Set ROUNDBALL_PLAYER_URL below (or the env var of the same name).
     2. Add YOUTUBE_API_KEY to your deployment's environment variables.
   ========================================================================= */

module.exports = {
  // -------- Basketball stats (stats.roundball.ca) ------------------------
  // TODO(Kevin): set this to your player/team/league page URL on
  // stats.roundball.ca once the season starts. Until then it stays blank and
  // the API reports a graceful pre-season state. You can also set it via an
  // env var (ROUNDBALL_PLAYER_URL) instead of editing this file.
  ROUNDBALL_PLAYER_URL: process.env.ROUNDBALL_PLAYER_URL || '',

  // The player to look for in the scraped stats table.
  PLAYER_NAME: 'Kevin Liu',

  // -------- Highlight video (YouTube Data API v3) ------------------------
  // The channel handle to pull highlights from, and the team-name filter:
  // we pick the most recent video whose title contains this string.
  YOUTUBE_CHANNEL_HANDLE: 'RoundballBC',
  TEAM_TITLE_MATCH: 'Bagwork 2.0',
  // Read from the environment — never hard-code the key. See .env.example.
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || '',

  // -------- Server-side cache TTLs (ms) to protect API quota -------------
  STATS_CACHE_MS: 10 * 60 * 1000,    // 10 minutes
  VIDEO_CACHE_MS: 30 * 60 * 1000,    // 30 minutes

  // CDN cache header (seconds) returned to the platform's edge.
  EDGE_CACHE_SECONDS: 600
};
