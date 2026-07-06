/**
 * Generate blog pages from Markdown in content/blog/
 * Run: node scripts/build-blog.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { marked } from "marked";
import {
  SITE_URL,
  escapeHtml,
  renderPageShell
} from "./lib/site.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const blogSrc = path.join(root, "content/blog");
const blogOut = path.join(root, "blog");
const today = new Date().toISOString().slice(0, 10);

marked.setOptions({ gfm: true, headerIds: true, mangle: false });

function readPosts() {
  if (!fs.existsSync(blogSrc)) return [];
  return fs
    .readdirSync(blogSrc)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(blogSrc, file), "utf8");
      const { data, content } = matter(raw);
      const slug = data.slug || file.replace(/\.md$/, "");
      const dateRaw = data.date || today;
      const date = dateRaw instanceof Date ? dateRaw.toISOString().slice(0, 10) : String(dateRaw);
      return {
        slug,
        title: data.title,
        description: data.description,
        date,
        tags: data.tags || [],
        content,
        html: marked.parse(content)
      };
    })
    .filter((p) => p.title && p.description)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function articleJsonLd(post) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Organization",
      name: "Free PC Bottleneck Calculator",
      url: SITE_URL
    },
    publisher: {
      "@type": "Organization",
      name: "Free PC Bottleneck Calculator",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/assets/og-image.png`
      }
    },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}/`,
    image: `${SITE_URL}/assets/og-image.png`
  };
}

function breadcrumbJsonLd(post) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE_URL}/blog/` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${SITE_URL}/blog/${post.slug}/` }
    ]
  };
}

function renderPostPage(post, allPosts) {
  const canonical = `${SITE_URL}/blog/${post.slug}/`;
  const related = allPosts.filter((p) => p.slug !== post.slug).slice(0, 3);
  const tagHtml = post.tags.length
    ? `<div class="tag-row">${post.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>`
    : "";

  const relatedHtml = related.length
    ? `<section class="related-posts">
        <h2>Related guides</h2>
        <ul class="guide-list">
          ${related.map((r) => `<li><a href="../${r.slug}/">${escapeHtml(r.title)}</a></li>`).join("")}
        </ul>
      </section>`
    : "";

  const body = `<main class="site-wrap py-10 md:py-12 blog-page">
    <article class="panel-card p-6 md:p-8">
      <p class="section-eyebrow">PC bottleneck guide</p>
      <h1 class="text-2xl md:text-3xl font-semibold text-on-surface mb-2">${escapeHtml(post.title)}</h1>
      <p class="text-sm text-on-surface-variant font-mono mb-4">Published ${escapeHtml(post.date)}</p>
      ${tagHtml}
      <div class="prose-blog">${post.html}</div>
      <div class="mt-8 panel-card p-5 bg-surface-container-low">
        <h2 class="text-lg font-semibold text-on-surface mb-2">Check your build now</h2>
        <p class="text-sm text-on-surface-variant mb-4">Use our free bottleneck calculator to see whether your CPU or GPU is limiting performance at your target resolution.</p>
        <a class="btn-primary" href="../../index.html#calculator">Open bottleneck calculator</a>
      </div>
      ${relatedHtml}
    </article>
  </main>`;

  return renderPageShell({
    title: `${post.title} | PC Bottleneck Calculator`,
    description: post.description,
    canonical,
    depth: 2,
    ogType: "article",
    jsonLd: [articleJsonLd(post), breadcrumbJsonLd(post)],
    body,
    scripts: `<script src="../../assets/theme.js" defer></script>`
  });
}

function renderBlogIndex(posts) {
  const cards = posts
    .map(
      (p) => `<article class="panel-card p-5">
        <p class="section-eyebrow">${escapeHtml(p.date)}</p>
        <h2 class="text-lg font-semibold mb-2"><a class="text-on-surface hover:text-primary no-underline" href="${p.slug}/">${escapeHtml(p.title)}</a></h2>
        <p class="text-sm text-on-surface-variant mb-3">${escapeHtml(p.description)}</p>
        <a href="${p.slug}/" class="text-sm font-bold text-primary no-underline">Read guide →</a>
      </article>`
    )
    .join("");

  const body = `<main class="site-wrap py-10 md:py-12 blog-index">
    <section class="mb-8">
      <p class="section-eyebrow">Guides &amp; tutorials</p>
      <h1 class="text-3xl md:text-4xl font-semibold text-on-surface mb-3">PC Bottleneck Guides</h1>
      <p class="text-base text-on-surface-variant max-w-2xl">Learn how CPU and GPU bottlenecks work, what bottleneck percentages mean, and how to build a balanced gaming PC in 2026.</p>
    </section>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">${cards}</div>
    <section class="mt-10 panel-card p-6 bg-surface-container-low">
      <h2 class="text-lg font-semibold text-on-surface mb-2">Ready to test your build?</h2>
      <p class="text-sm text-on-surface-variant mb-4">Enter your CPU, GPU, resolution, and RAM in our free calculator for an instant bottleneck estimate.</p>
      <a class="btn-primary" href="../index.html#calculator">Open bottleneck calculator</a>
    </section>
  </main>`;

  return renderPageShell({
    title: "PC Bottleneck Guides & Tutorials | Free Bottleneck Calculator",
    description: "Expert guides on CPU bottlenecks, GPU bottlenecks, acceptable bottleneck percentages, and balanced PC builds for 2026.",
    canonical: `${SITE_URL}/blog/`,
    depth: 1,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "PC Bottleneck Guides",
      description: "Guides on CPU and GPU bottlenecks for gaming PCs.",
      url: `${SITE_URL}/blog/`
    },
    body,
    scripts: `<script src="../assets/theme.js" defer></script>`
  });
}

if (fs.existsSync(blogOut)) fs.rmSync(blogOut, { recursive: true });
fs.mkdirSync(blogOut, { recursive: true });

const posts = readPosts();
fs.writeFileSync(path.join(blogOut, "index.html"), renderBlogIndex(posts));

const sitemapEntries = [{ loc: `${SITE_URL}/blog/`, lastmod: today, priority: "0.9" }];

for (const post of posts) {
  const dir = path.join(blogOut, post.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), renderPostPage(post, posts));
  sitemapEntries.push({
    loc: `${SITE_URL}/blog/${post.slug}/`,
    lastmod: post.date,
    priority: "0.85"
  });
}

fs.writeFileSync(
  path.join(root, "data/blog-urls.json"),
  JSON.stringify(sitemapEntries, null, 2)
);
console.log(`Generated ${posts.length} blog posts and blog index`);
