export const SITE_URL = process.env.SITE_URL || "https://freebottleneckcalculator.com";
export const SITE_NAME = "Free PC Bottleneck Calculator";
export const OG_IMAGE = `${SITE_URL}/assets/og-image.png`;

export function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function assetPrefix(depth) {
  return depth > 0 ? "../".repeat(depth) : "./";
}

export function renderHead({ title, description, canonical, depth = 0, ogType = "website", jsonLd = [] }) {
  const prefix = assetPrefix(depth);
  const canonicalUrl = canonical || SITE_URL + "/";
  const blocks = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
  const ldScripts = blocks
    .filter(Boolean)
    .map((obj) => `  <script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n  </script>`)
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  <meta name="theme-color" content="#0055ff">
  <link rel="icon" href="${prefix}assets/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="${prefix}assets/apple-touch-icon.png">
  <link rel="manifest" href="${prefix}site.webmanifest">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" rel="stylesheet">
  <meta property="og:type" content="${ogType}">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta property="og:image" content="${OG_IMAGE}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${OG_IMAGE}">
  <link rel="stylesheet" href="${prefix}assets/styles.css">
${ldScripts}
</head>`;
}

export function renderHeader({ depth = 0, active = "" }) {
  const prefix = assetPrefix(depth);
  const home = depth === 0 ? "./" : `${prefix}index.html`;
  const calc = `${home}#calculator`;
  const blog = depth === 0 ? "blog/" : `${prefix}blog/`;
  const link = (id, href, label) => {
    const cls = active === id ? "nav-link nav-link-active" : "nav-link";
    return `<a class="${cls}" href="${href}">${label}</a>`;
  };

  return `<header class="bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-50">
    <nav class="site-wrap flex flex-wrap items-center justify-between gap-3 h-16" aria-label="Primary navigation">
      <a class="font-bold text-primary flex items-center gap-2 no-underline text-on-surface" href="${home}">
        <span class="material-symbols-outlined material-symbols-filled text-primary-container">memory</span>
        <span class="text-lg tracking-tight uppercase">PC Bottleneck</span>
      </a>
      <div class="flex items-center gap-4">
        <div class="hidden md:flex items-center gap-6">
          ${link("calculator", calc, "Calculator")}
          ${link("blog", blog, "Guides")}
          ${link("popular", `${home}#popular`, "Popular Builds")}
          ${link("methodology", `${home}#methodology`, "Methodology")}
          ${link("faq", `${home}#faq`, "FAQ")}
        </div>
        <button type="button" id="themeToggle" class="btn-secondary" aria-label="Toggle dark mode">Dark mode</button>
      </div>
    </nav>
  </header>`;
}

export function renderFooter({ depth = 0 }) {
  const prefix = assetPrefix(depth);
  return `<footer class="bg-surface-container-low border-t border-outline-variant mt-auto">
    <div class="site-wrap py-8 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <strong class="text-primary uppercase tracking-tight">${SITE_NAME}</strong>
        <p class="text-sm text-on-surface-variant mt-2">Estimates are educational. Confirm with game-specific benchmarks before buying hardware.</p>
      </div>
      <div class="flex flex-wrap gap-4 md:justify-end font-mono text-xs uppercase">
        <a class="nav-link" href="${prefix}index.html#calculator">Calculator</a>
        <a class="nav-link" href="${prefix}blog/">Guides</a>
        <a class="nav-link" href="${prefix}about/">About</a>
        <a class="nav-link" href="${prefix}contact/">Contact</a>
        <a class="nav-link" href="${prefix}privacy/">Privacy</a>
      </div>
    </div>
    <div class="site-wrap pb-8 text-xs text-on-surface-variant/70 font-mono flex flex-wrap gap-x-4 gap-y-1">
      <span>Data last reviewed July 2026</span>
      <a class="text-primary hover:underline" href="${SITE_URL}/sitemap.xml">Sitemap</a>
    </div>
  </footer>`;
}

export function renderPageShell({ title, description, canonical, depth = 0, ogType, jsonLd, body, scripts = "" }) {
  return `${renderHead({ title, description, canonical, depth, ogType, jsonLd })}
<body class="flex flex-col min-h-screen">
${renderHeader({ depth })}
${body}
${renderFooter({ depth })}
${scripts}
</body>
</html>`;
}
