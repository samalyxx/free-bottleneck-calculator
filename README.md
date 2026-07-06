# Free PC Bottleneck Calculator

A standalone static website for estimating likely CPU, GPU, RAM, and storage bottlenecks in a gaming PC.

## Files

- `index.html` - self-contained app with embedded CSS, JavaScript, structured data, CPU data, and GPU data.
- `robots.txt` - permissive crawler instructions plus sitemap reference.
- `sitemap.xml` - one-page XML sitemap.

## Features

- CPU, GPU, resolution, RAM amount, RAM speed, storage, and purpose inputs.
- Maintained as plain JavaScript data arrays for easy hardware additions.
- Responsive layout with no external CSS or JavaScript dependencies.
- Methodology and FAQ sections written for users first, with crawlable explanatory text.
- Basic structured data using `WebApplication` schema.

## Methodology

The calculator compares relative CPU game throughput, GPU render throughput, RAM pressure, and storage class. Resolution and purpose modify those weights:

- Lower resolutions and esports workloads make CPU limits more visible.
- Higher resolutions and AAA visual settings make GPU limits more visible.
- Streaming and creator workloads increase CPU and RAM pressure.
- Slow storage is treated as a stutter/load-time risk rather than a direct average-FPS limiter.

The scores are practical estimates, not benchmark claims. Validate upgrade decisions against independent benchmarks for the exact games, settings, and parts being considered.

## SEO Notes

The page follows current Google Search Central guidance where relevant by using descriptive titles, useful visible content, structured data, mobile-friendly design, a sitemap, and a robots.txt file. These practices help search engines discover and understand the page, but they do not guarantee rankings.

Before publishing, replace `https://example.com/` in `index.html`, `robots.txt`, and `sitemap.xml` with the production URL.

## Local Verification

Open `index.html` directly in a browser, or serve the folder with any static file server:

```sh
python3 -m http.server 8080
```

