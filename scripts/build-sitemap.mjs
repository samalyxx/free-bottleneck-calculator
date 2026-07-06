/**
 * Merge homepage, build pages, and blog URLs into sitemap.xml
 * Run: node scripts/build-sitemap.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { SITE_URL } from "./lib/site.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const today = new Date().toISOString().slice(0, 10);

function readBuildUrls() {
  const buildDir = path.join(root, "build");
  if (!fs.existsSync(buildDir)) return [];
  return fs
    .readdirSync(buildDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => ({
      loc: `${SITE_URL}/build/${d.name}/`,
      lastmod: today,
      priority: "0.85"
    }));
}

function readBlogUrls() {
  const file = path.join(root, "data/blog-urls.json");
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeSitemap(urls) {
  const entries = urls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod || today}</lastmod>
    <changefreq>${u.changefreq || "monthly"}</changefreq>
    <priority>${u.priority || "0.8"}</priority>
  </url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
${entries}
</urlset>
`;
  fs.writeFileSync(path.join(root, "sitemap.xml"), xml);
}

function readInfoUrls() {
  const file = path.join(root, "data/info-urls.json");
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const all = [...readBuildUrls(), ...readBlogUrls(), ...readInfoUrls()];
writeSitemap(all);
console.log(`Sitemap written with ${all.length + 1} URLs`);
