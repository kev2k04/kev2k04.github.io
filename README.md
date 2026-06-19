# Finance Portfolio: Jekyll + GitHub Pages

A clean, institutional personal portfolio for a finance professional. Built with
[Jekyll](https://jekyllrb.com/) and designed to deploy on **GitHub Pages** with
zero build configuration. Heading typography uses **Cambria / Cambria Bold**
(with Georgia / Times fallbacks) for a trustworthy, capital-markets feel.

## Features

- **Landing page**: hero, headline stats, about, expertise tags
- **Projects showcase**: data-driven cards (`_data/projects.yml`)
- **Résumé page**: experience, education, certifications, skills (`_data/resume.yml`)
- **Social links**: LinkedIn, GitHub, X, email (configurable, with inline SVG icons)
- Fully responsive with a pure-CSS mobile nav. No JavaScript.

## Quick start: make it yours

Everything you'll typically edit lives in two places:

| File | What it controls |
|------|------------------|
| `_config.yml` | Site title, tagline, email, and the deployment `url` / `baseurl` |
| `_data/profile.yml` | Name, role, bio, stats, expertise, **social links** |
| `_data/projects.yml` | The project cards |
| `_data/resume.yml` | The `/resume/` page content |

Colors and fonts live as CSS variables at the top of `assets/css/main.scss`.

## Deploy to GitHub Pages

1. Create a repository and push this folder to it.
   - For a **user site**, name the repo `your-username.github.io` and leave
     `baseurl: ""` in `_config.yml`.
   - For a **project site**, use any repo name and set
     `baseurl: "/your-repo-name"` and `url: "https://your-username.github.io"`.
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source = Deploy from a branch**,
   pick your branch (e.g. `main`) and the `/ (root)` folder, then **Save**.
4. Wait ~1 minute; your site goes live at the URL shown on that page.

GitHub Pages builds the Jekyll site for you; no Actions workflow required.

## Run locally (optional)

Requires Ruby (>= 3.0). A helper script, `env.sh`, sets up everything in one
step; it puts the Bundler executable on your `PATH`, installs Bundler if it's
missing, and installs the site's gems into a project-local `vendor/bundle`
(avoiding the permission errors you hit when the system gem dir is root-owned):

```bash
source ./env.sh
bundle exec jekyll serve
```

Use `source ./env.sh` (not `./env.sh`) so the `PATH` change applies to your
current shell. To make that change permanent, add the `export PATH=...` line the
script prints to your `~/.bashrc` or `~/.zshrc`.

Already set up? Just run:

```bash
bundle exec jekyll serve
```

Open <http://localhost:4000>.
