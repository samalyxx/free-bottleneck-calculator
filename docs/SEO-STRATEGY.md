# SEO Strategy Playbook — freebottleneckcalculator.com

This document is your off-page SEO execution checklist. On-page and technical SEO are handled in the codebase (v5). Off-page requires manual outreach and consistency.

## Primary keyword targets

| Priority | Keyword | Target page |
|----------|---------|-------------|
| P0 | bottleneck calculator | `/` (homepage) |
| P0 | pc bottleneck calculator | `/` |
| P0 | free bottleneck calculator | `/` |
| P1 | cpu bottleneck calculator | `/` + blog |
| P1 | gpu bottleneck calculator | `/` + blog |
| P1 | cpu bottleneck | `/blog/what-is-cpu-bottleneck/` |
| P1 | gpu bottleneck | `/blog/how-to-fix-gpu-bottleneck/` |
| P2 | bottleneck percentage | `/blog/is-bottleneck-bad/` |
| P2 | cpu vs gpu bottleneck | `/blog/cpu-vs-gpu-bottleneck/` |
| P2 | best cpu gpu pairing 2026 | `/blog/best-cpu-gpu-pairings-2026/` |
| P2 | [cpu] + [gpu] bottleneck | `/build/[slug]/` pages |

## Search engine setup (do first)

### Google Search Console
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property: `https://freebottleneckcalculator.com`
3. Verify via DNS TXT record (recommended) or Netlify meta tag
4. Submit sitemap: `https://freebottleneckcalculator.com/sitemap.xml`
5. Request indexing for homepage and `/blog/` within 48 hours of launch
6. Monitor: Coverage, Core Web Vitals, Search Performance weekly

### Bing Webmaster Tools
1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Import from Google Search Console (fastest) or verify manually
3. Submit the same sitemap URL
4. Enable URL submission API for new blog posts

### IndexNow (optional, Bing/Yandex)
- Submit new blog URLs when published via IndexNow API after each deploy

## Backlink targets (prioritized)

### Tier 1 — High authority, high relevance
| Platform | Action | Link target |
|----------|--------|-------------|
| Reddit r/buildapc | Answer bottleneck questions with calculator link | Homepage or relevant blog post |
| Reddit r/pcmasterrace | Share tool in "useful resources" threads | Homepage |
| Tom's Hardware forums | Reply to "is my build balanced?" threads | Relevant `/build/` page |
| Linus Tech Tips forum | Contribute to upgrade advice threads | Blog guides |
| PCPartPicker forums | Link in build advice replies | Homepage |

### Tier 2 — Tool directories and listings
| Platform | Action |
|----------|--------|
| AlternativeTo | List as alternative to PC-Build's Bottleneck Calculator |
| Product Hunt | Launch as "Free PC Bottleneck Calculator" |
| SaaSHub / ToolFinder | Submit free tool listing |
| Indie Hackers | Share build story + tool |
| Hacker News (Show HN) | Launch post with methodology transparency |

### Tier 3 — Content syndication and guest posts
| Platform | Angle |
|----------|-------|
| Medium | Republish blog posts with canonical link back |
| Dev.to | "How I built a bottleneck calculator with static site + CI" |
| Hashnode | Technical blog about the matched-FPS model |
| Guest posts on PC hardware blogs | "How to choose balanced CPU/GPU pairings in 2026" |

## Digital PR angles

1. **"5600 + 5090 bottleneck"** — The extreme mismatch pairing is highly searched. Promote the pre-built analysis page.
2. **"X3D vs non-X3D for gaming"** — Compare 7800X3D vs 9700X pairings using the calculator.
3. **"Laptop GPU vs desktop GPU"** — Now that mobile GPUs are in the database, compare RTX 5070 vs RTX 5070 Laptop.
4. **Monthly hardware updates** — Press release angle when new CPUs/GPUs are added via CI.

## Social distribution checklist

- [ ] Create Twitter/X account: share popular pairing results weekly
- [ ] Create YouTube Shorts: screen-record calculator showing famous mismatches
- [ ] Pin calculator link in Reddit profile
- [ ] Share in Discord PC building servers (PCPartPicker, Hardware Unboxed community)
- [ ] Post in Facebook PC building groups with value-first approach (answer question, then link)

## Internal linking rules (maintain in code)

- Every blog post links to homepage calculator (CTA block)
- Every `/build/` page links to 2+ blog posts + homepage
- Homepage links to all 6 blog posts in Guides section
- Footer links to Calculator, Guides, Popular builds, FAQ on every page

## Content calendar (post-launch)

| Week | Action |
|------|--------|
| 1 | Submit sitemap to GSC + Bing. Request indexing. Post on r/buildapc. |
| 2 | Submit to AlternativeTo + Product Hunt. |
| 3 | Publish 7th blog post: "RTX 50 series bottleneck guide" |
| 4 | Guest post outreach to 5 PC hardware blogs |
| Monthly | Add 1-2 new blog posts targeting long-tail keywords |
| Monthly | Add 5-10 new `/build/` pages for trending CPU+GPU combos |
| Quarterly | Refresh benchmark data via CI pipeline |

## KPIs to track in GSC

- Impressions for "bottleneck calculator" (target: top 10 in 90 days, #1 in 6-12 months)
- Click-through rate on homepage (target: 5%+)
- Average position for P0 keywords
- Indexed pages count (target: 25+ within 30 days)
- Core Web Vitals: all green (static site should pass easily)

## Competitive differentiation (mention in outreach)

- Per-resolution FPS model (not a single abstract score)
- RAM, VRAM, and storage checks included
- 120+ GPUs including laptop/mobile variants
- Compare two builds side by side
- Shareable URL with pre-filled build
- Data updated through June 2026 with CI pipeline
- Free, no signup, no ads

## What NOT to do

- Do not buy backlinks from Fiverr or link farms
- Do not keyword-stuff anchor text (vary: "bottleneck calculator", "check your build", "free tool")
- Do not copy competitor content verbatim
- Do not create doorway pages (each `/build/` page has unique FAQ + advice)
- Do not ignore mobile — 40%+ of PC building searches are mobile
