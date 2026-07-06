/**
 * Generate About, Privacy, and Contact pages from content/pages/*.md
 * Run: node scripts/build-info-pages.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { marked } from "marked";
import { SITE_URL, escapeHtml, renderPageShell } from "./lib/site.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const srcDir = path.join(root, "content/pages");
const today = new Date().toISOString().slice(0, 10);

marked.setOptions({ gfm: true, headerIds: true, mangle: false });

function readPages() {
  if (!fs.existsSync(srcDir)) return [];
  return fs
    .readdirSync(srcDir)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(srcDir, file), "utf8");
      const { data, content } = matter(raw);
      const slug = data.slug || file.replace(/\.md$/, "");
      const dateRaw = data.date || today;
      const date = dateRaw instanceof Date ? dateRaw.toISOString().slice(0, 10) : String(dateRaw);
      return {
        slug,
        title: data.title,
        description: data.description,
        date,
        html: marked.parse(content)
      };
    })
    .filter((p) => p.title && p.description);
}

function fixLinks(html) {
  return html
    .replace(/href="\/contact\/"/g, 'href="../contact/"')
    .replace(/href="\/about\/"/g, 'href="../about/"')
    .replace(/href="\/privacy\/"/g, 'href="../privacy/"')
    .replace(/href="\/index\.html/g, 'href="../index.html')
    .replace(/href="\/blog\/"/g, 'href="../blog/"');
}

function renderPage(page) {
  const canonical = `${SITE_URL}/${page.slug}/`;
  const body = `<main class="site-wrap py-10 md:py-12">
    <article class="panel-card p-6 md:p-8 max-w-3xl mx-auto">
      <p class="section-eyebrow">Information</p>
      <h1 class="text-2xl md:text-3xl font-semibold text-on-surface mb-2">${escapeHtml(page.title)}</h1>
      <p class="text-sm text-on-surface-variant font-mono mb-6">Last updated ${escapeHtml(page.date)}</p>
      <div class="prose-blog">${fixLinks(page.html)}</div>
      <div class="mt-10 pt-6 border-t border-outline-variant flex flex-wrap gap-3">
        <a class="btn-secondary" href="../index.html#calculator">Open calculator</a>
        <a class="btn-secondary" href="../about/">About</a>
        <a class="btn-secondary" href="../privacy/">Privacy</a>
        <a class="btn-secondary" href="../contact/">Contact</a>
      </div>
    </article>
  </main>`;

  return renderPageShell({
    title: `${page.title} | PC Bottleneck Calculator`,
    description: page.description,
    canonical,
    depth: 1,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: page.title,
      description: page.description,
      url: canonical,
      dateModified: page.date
    },
    body,
    scripts: `<script src="../assets/theme.js" defer></script>`
  });
}

const pages = readPages();
const sitemapEntries = [];

for (const page of pages) {
  const outDir = path.join(root, page.slug);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), renderPage(page));
  sitemapEntries.push({
    loc: `${SITE_URL}/${page.slug}/`,
    lastmod: page.date,
    priority: page.slug === "privacy" ? "0.5" : "0.6",
    changefreq: "yearly"
  });
  console.log(`Generated /${page.slug}/`);
}

fs.writeFileSync(path.join(root, "data/info-urls.json"), JSON.stringify(sitemapEntries, null, 2));
console.log(`Generated ${pages.length} info pages`);
