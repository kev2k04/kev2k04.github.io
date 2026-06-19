# Overnight Build Log

Autonomous build session. Newest sections are appended at the bottom; the
**Start here in the morning** list at the top is the quick summary.

---

## ☀️ START HERE IN THE MORNING

**What got built tonight (all on branch `overnight-build`, baseline commit first so you can revert anytime):**

1. **Light mode** — site-wide light/dark toggle (sun/moon button in the header), persists across reloads, animates smoothly. Dark stays the default. Works alongside the existing Minecraft theme.
2. **Passions & Interests page** (`/passions/`) — 4 cards (Music, Gaming, Sports, Gym) using the same zoom-from-origin + dim/blur interaction as the Experience page. Music/Gaming/Gym are themed placeholder panels; **Sports opens the full basketball page**.
3. **Basketball page** (`/basketball/`) — court-themed, 3 stat cards (PPG/APG/RPG) + a highlight-video box. Currently shows the correct **pre-season empty state** for both stats and video.
4. **Serverless API functions** (`/api/`) for stats scraping + YouTube highlights — keys/scraping stay server-side.

### ✅ TO "TURN ON" LIVE FEATURES (the only things you need to do):

1. **Live basketball stats** — open [`api/_config.js`](api/_config.js) and set `ROUNDBALL_PLAYER_URL` to your stats.roundball.ca player/team page once the season starts. *(Search for `TODO(Kevin)`.)*
   - **OR** the easy weekly option: just edit [`assets/data/basketball-stats.json`](assets/data/basketball-stats.json) and type in your numbers — that takes priority over scraping. Set `"seasonStarted": true` and fill `ppg`/`apg`/`rpg`.
2. **Highlight video** — add a YouTube Data API v3 key as the `YOUTUBE_API_KEY` environment variable (see [`.env.example`](.env.example)).
3. **Deploy the API** — GitHub Pages can't run serverless functions (it's static hosting). The `/api/` functions are written Vercel/Netlify-style. See **"Deploying the API"** below. *Until deployed, the site still works perfectly* — it falls back to the static `basketball-stats.json` and shows graceful placeholders.

### ⚠️ Things to review / decisions I made (details below):
- I used `data-mode="light"` for light/dark (the existing Minecraft toggle already owns `data-theme`). No collision.
- Sports card **navigates** to a full `/basketball/` page rather than opening an in-place panel (basketball is too big/API-driven for a modal; better for mobile + SEO).
- Anywhere I invented personal copy it's marked `TODO(Kevin)` — search the repo for it.

---

## Decisions & build notes (chronological)

### Setup
- Repo had **no commits**. Made a clean baseline commit on `main`, then branched `overnight-build` for all work so reverting is trivial.
- Stack confirmed: **Jekyll static site** (GitHub Pages, `.github/workflows/jekyll.yml`), Liquid templates, SCSS compiled to CSS, vanilla JS. No React. Local Ruby is too old to run Jekyll (per project memory), so I validate SCSS with `npx sass` and reason about Liquid by hand.
- Existing theme system: a header toggle flips `html[data-theme="minecraft"]` (localStorage `kl-theme`) between the **pro** (dark navy "Midnight & Azure") and **Minecraft** themes. The pro theme is the default.

### Task 1 — Light mode ✅
- **Axis choice:** `data-theme` is already taken by Minecraft, so light/dark is a separate axis on `data-mode` (`light` | unset=dark) with its own localStorage key `kl-mode`. No collision; the two toggles are independent.
- **Default:** kept **dark** as the first-visit default (the prompt says the dark palette stays the default, and it's the established brand). I did *not* auto-adopt `prefers-color-scheme` — a deliberate, predictable default beats guessing, and the toggle is one click away. Easy to change later in `theme.js`/`head.html` if you'd rather respect the OS setting.
- **Palette:** designed a real light theme ("Daylight & Azure") — cool paper `#f5f8fd`, deep navy ink, and a darker azure `#2160d8` that holds AA contrast on white (the dark theme's bright `#5b9cff` would fail on white). Scoped `html[data-mode="light"]:not([data-theme="minecraft"])` so it never leaks into Minecraft.
- **No-flash:** the pre-paint inline script in `head.html` now also applies `data-mode` before first paint.
- **Adaptive tokens:** replaced several hard-coded colors with variables so both modes work everywhere — hero gradient now uses `--accent-rgb`; added `--scrim`, `--nav-link`, `--footer-soft`, `--footer-chip` (nav links + footer fine print were cream-on-dark literals that would've been invisible on light).
- **Toggle:** a compact sun/moon sliding-pill switch (`.mode-toggle`) in the header, left of the Minecraft toggle. Hidden while the Minecraft theme is active (light/dark doesn't apply there). Smooth `0.4s` color transition on structural surfaces, gated behind `prefers-reduced-motion`.
- **Files:** `head.html`, `header.html`, `assets/css/main.scss`, `assets/css/minecraft.scss`, new `assets/js/theme.js`, `_layouts/default.html`. Both stylesheets validated with dart-sass.
- **Verified:** rendered the home/passions markup with the compiled CSS via headless Chrome in both modes — contrast and the sliding sun/moon switch look correct.

### Task 2 — Passions & Interests ✅
- New page `passions.html` → `/passions/`, added **Passions** to the header nav (shows on every page, existing style).
- **Title:** kept the prompt's "Passions & Interests" — it's clear and reads well.
- Four themed tiles driven by `_data/passions.yml`; each card carries its own `--card-accent` RGB triplet (Music=violet, Gaming=emerald, Sports=orange, Gym=rose) used for the icon tint, hover wash, glow, and panel accent bar — so the grid reads as four distinct tiles in both themes.
- **Interaction:** reused the Experience page's origin-aware FLIP zoom + scrim dim/blur. Music/Gaming/Gym open in-page zoom panels with **TODO(Kevin)** placeholder copy + an image placeholder. **Sports is a `kind: link` card that navigates to `/basketball/`** (Task 3) rather than opening a panel — a full API-driven page is better than a modal for that content, and the card still matches the others visually.
- **Reuse decision:** I *copied* the FLIP logic into `assets/js/passions.js` (targeting `.pass-*`) instead of refactoring `experience.js`, to keep the working Experience feature zero-risk. The two could be unified into one generic `[data-zoom]` module later — noted as a possible cleanup.
- Icons: added `music`, `gamepad`, `basketball`, `dumbbell` to the shared `_includes/icon.html`.
- Responsive: 4 → 2 → 1 columns. Esc-to-close + focus management inherited from the FLIP pattern.

### Task 3 — Basketball page ✅
- New page `basketball.html` → `/basketball/`; the Sports passion card links here. Content config in `_data/basketball.yml` (team, league, jersey, position, blurb — invented bits marked `TODO(Kevin)`).
- **Theme:** court-styled hero (charcoal-hardwood gradient + painted center-circle/key/arc lines, orange accent), intentionally dark in *both* light/dark modes because it reads as a court; the rest of the page (stat cards, blurb) uses the theme surfaces so it adapts. Verified both modes with headless Chrome.
- **A) Stat cards** (PPG/APG/RPG): scoreboard tiles with four states driven by `data-state` — `loading` (shimmer skeleton), `preseason` (muted "—" + the required "Season hasn't started yet…" message), `live` (orange numbers + "updated <date>"), and `error`. Fully wired: the moment real data exists they populate with no code change.
- **B) Highlight video:** large 16:9 box. JS injects a privacy-mode YouTube `<iframe>` when the API returns a match; otherwise the graceful "Latest Bagwork 2.0 highlights will appear here." placeholder stays. Loading + empty states handled.
- **C)** `TODO(Kevin)` blurb area + a team/action photo placeholder.
- **Frontend data flow** (`assets/js/basketball.js`): tries `{api_base}/api/basketball-stats` first, then falls back to the static `assets/data/basketball-stats.json` — so the page works on plain GitHub Pages today and upgrades to live data automatically once the API is deployed. `fetchJson()` only accepts OK + `application/json` responses, so a GitHub Pages 404 HTML page is safely ignored. Nothing can throw uncaught.

### Task 3b/3c — Serverless API ✅
- `api/basketball-stats.js`: **manual override** (`assets/data/basketball-stats.json`) wins when `seasonStarted:true`; otherwise scrapes `ROUNDBALL_PLAYER_URL` with **cheerio** (generic table walk → finds the "Kevin Liu" row → reads PPG/APG/RPG columns by header); otherwise pre-season. Returns `{seasonStarted, ppg, apg, rpg, lastUpdated, source}`. **Tested**: pre-season path + a sample scrape correctly parsed `PPG 14.6 / APG 6.2 / RPG 5.4`.
- `api/latest-highlight.js`: resolves `@RoundballBC` → channelId, searches recent uploads for a title containing "Bagwork 2.0", returns the newest. Key read from `YOUTUBE_API_KEY` env (**server-side only**). **Tested**: no key → `{found:false}`.
- Both: in-memory cache (10 min stats / 30 min video) + `s-maxage` edge cache header to protect quota; permissive CORS so the API can be hosted separately from the site; never throw.
- Config in `api/_config.js` (the one constant you set: `ROUNDBALL_PLAYER_URL`). Secrets documented in `.env.example`. `package.json` pins cheerio. `api/README.md` has full deploy notes.
- **Jekyll safety:** added `api`, `node_modules`, `package.json`, `.env*`, `OVERNIGHT_LOG.md` to `_config.yml` `exclude` so the static build ignores them; `node_modules`/`.env` gitignored.

### How to deploy the API (summary — full version in `api/README.md`)
GitHub Pages can't run functions. **Recommended:** keep the site on GitHub Pages, deploy `/api` to Vercel, add the two env vars there, and set `api_base` in `_data/basketball.yml` to the Vercel URL. Or deploy the whole site to Vercel/Netlify (leave `api_base` blank, `/api/*` is same-origin).
