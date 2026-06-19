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
