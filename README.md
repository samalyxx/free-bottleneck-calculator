# Free PC Bottleneck Calculator v5

A standalone static website for estimating CPU, GPU, RAM, and storage bottlenecks using per-resolution FPS modeling, a CI-driven data pipeline, and SEO content hub.

**Live domain:** `https://freebottleneckcalculator.com`

## Architecture

```
data/sources/*.csv     -->  scripts/build-data.mjs   -->  data/cpus.js, data/gpus.js
content/blog/*.md      -->  scripts/build-blog.mjs   -->  blog/*/index.html
                       -->  scripts/build-pages.mjs  -->  build/*/index.html
                       -->  scripts/build-sitemap.mjs --> sitemap.xml
scripts/enrich-specs.mjs (Wikidata CC0, optional) --> updates CSV specs only
```

The runtime site stays static (no backend). Netlify runs `npm run build` on deploy to regenerate all pages.

## Files

| Path | Purpose |
|------|---------|
| `index.html` | Main calculator UI + SEO landing content |
| `assets/app.js` | Matched-FPS engine, compare mode, URL state |
| `assets/combobox.js` | Searchable CPU/GPU pickers |
| `assets/theme.js` | Dark mode for blog/build pages |
| `content/blog/*.md` | **Blog source files** (edit these) |
| `blog/` | Auto-generated blog pages |
| `data/sources/cpus.csv` | **Canonical CPU data** (edit this) |
| `data/sources/gpus.csv` | **Canonical GPU data** (edit this) |
| `build/<cpu>-<gpu>/` | Auto-generated SEO build pages |
| `scripts/build-blog.mjs` | Markdown → HTML blog generator |
| `scripts/build-sitemap.mjs` | Unified sitemap generator |
| `scripts/lib/site.mjs` | Shared SEO HTML shell (head, nav, footer) |
| `docs/SEO-STRATEGY.md` | Off-page SEO playbook |

## v5 SEO Features

- Real domain wired across canonical URLs, sitemap, robots.txt, and structured data
- Expanded homepage content (~1,500+ words): what-is, how-to, glossary, 10 FAQ entries
- Markdown blog pipeline with 6 seed articles targeting core bottleneck keywords
- Unified sitemap including homepage, blog, and build pages
- OG image, favicon, web manifest, WebSite + Organization + FAQPage JSON-LD
- Mobile-responsive nav toggle, 480px breakpoint, blog prose styles
- Richer `/build/` pages with FAQ schema and internal links

## Commands

```sh
npm install         # Install marked + gray-matter
npm run build:data  # Regenerate data/cpus.js and data/gpus.js from CSV
npm run build:pages # Generate SEO build pages
npm run build:blog  # Generate blog from content/blog/*.md
npm run build:sitemap # Merge all URLs into sitemap.xml
npm run build       # Full build pipeline
npm test            # Data integrity + SEO tests
```

## Adding a blog post

1. Create `content/blog/my-post.md` with frontmatter:

```yaml
---
title: My Post Title
description: Meta description for SEO (150-160 chars)
slug: my-post-slug
date: 2026-07-06
tags:
  - bottleneck
---
```

2. Write content in Markdown below the frontmatter
3. Run `npm run build`
4. New post appears at `/blog/my-post-slug/` and in sitemap

## Adding hardware

1. Add a row to `data/sources/cpus.csv` or `data/sources/gpus.csv`
2. Run `npm run build`
3. Run `npm test` to verify
4. Commit CSV + generated files

## Deploy on Netlify

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Publish directory | `.` |
| Environment | `SITE_URL=https://freebottleneckcalculator.com` (set in netlify.toml) |

After deploy, submit `https://freebottleneckcalculator.com/sitemap.xml` to Google Search Console and Bing Webmaster Tools. See `docs/SEO-STRATEGY.md` for the full off-page checklist.

## Analytics hook

```js
window.__bottleneckTrack = function(event, data) {
  console.log(event, data);
};
```

Events: `page_load`, `calculate`, `preset_apply`, `theme_toggle`, `share_copy`.
