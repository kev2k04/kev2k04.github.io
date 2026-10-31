# kevliu.ca

Personal site of Kevin Liu, built with Jekyll and served by GitHub Pages at
[www.kevliu.ca](https://www.kevliu.ca).

## Where things live

| Path | What it holds |
|------|---------------|
| `_data/profile.yml` | Name, bio, skills, social links |
| `_data/experiences.yml` | Experience entries and galleries |
| `_data/passions.yml` | Passions page tiles and panels |
| `_data/basketball.yml` | Basketball page copy |
| `_data/resume.yml` | Résumé page |
| `assets/css/main.scss` | All styles (design tokens at the top) |
| `assets/data/*.json` | Basketball stats and the latest highlight (updated by `.github/workflows/highlight.yml`) |
| `api/` | Optional serverless functions for Vercel (not part of the static site) |

## Run locally

```bash
bundle install
bundle exec jekyll serve
```

Then open http://localhost:4000.
