/**
 * SEO integrity checks for v5
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const SITE = "https://freebottleneckcalculator.com";
let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) passed++;
  else {
    failed++;
    console.error(`FAIL: ${msg}`);
  }
}

function read(p) {
  return fs.readFileSync(path.join(root, p), "utf8");
}

function walkHtml(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, acc);
    else if (entry.name === "index.html") acc.push(full);
  }
  return acc;
}

function testNoExampleDomain() {
  const files = [
    "index.html",
    "robots.txt",
    "data/config.js",
    "scripts/build-pages.mjs",
    "scripts/lib/site.mjs",
    "netlify.toml"
  ];
  for (const f of files) {
    if (!fs.existsSync(path.join(root, f))) continue;
    assert(!read(f).includes("example.com"), `${f} must not contain example.com`);
  }
}

function testHomepageHead() {
  const html = read("index.html");
  assert(html.includes(`href="${SITE}/"`), "homepage canonical");
  assert(html.includes("og:image"), "homepage og:image");
  assert(html.includes("WebSite"), "WebSite JSON-LD");
  assert(html.includes("Organization"), "Organization JSON-LD");
  assert(html.includes("FAQPage"), "FAQPage JSON-LD");
  assert(html.includes('defer></script>'), "deferred scripts");
  assert(html.includes('href="blog/"'), "guides nav link");
  assert(html.includes('href="about/"'), "about footer link");
  assert(html.includes('href="contact/"'), "contact footer link");
  assert(html.includes('href="privacy/"'), "privacy footer link");
}

function testSitemap() {
  const xml = read("sitemap.xml");
  assert(xml.includes(`${SITE}/`), "sitemap homepage");
  assert(xml.includes(`${SITE}/blog/`), "sitemap blog index");
  assert(xml.includes(`${SITE}/build/`), "sitemap build pages");
  assert(xml.includes(`${SITE}/about/`), "sitemap about page");
  assert(xml.includes(`${SITE}/privacy/`), "sitemap privacy page");
  assert(xml.includes(`${SITE}/contact/`), "sitemap contact page");
  assert(!xml.includes("example.com"), "sitemap no example.com");
  const count = (xml.match(/<loc>/g) || []).length;
  assert(count >= 20, `sitemap URL count (${count})`);
}

function testBlogPages() {
  const blogDir = path.join(root, "blog");
  assert(fs.existsSync(blogDir), "blog directory exists");
  const posts = walkHtml(blogDir);
  assert(posts.length >= 7, `blog pages generated (${posts.length})`);
  for (const file of posts) {
    const html = fs.readFileSync(file, "utf8");
    assert(html.includes("<title>"), `${file} has title`);
    assert(html.includes('name="description"'), `${file} has meta description`);
    assert(html.includes('rel="canonical"'), `${file} has canonical`);
    assert(!html.includes("example.com"), `${file} no example.com`);
  }
}

function testBuildPages() {
  const buildDir = path.join(root, "build");
  const pages = walkHtml(buildDir);
  assert(pages.length >= 10, `build pages (${pages.length})`);
  const sample = fs.readFileSync(pages[0], "utf8");
  assert(sample.includes("FAQPage"), "build page FAQ schema");
  assert(sample.includes("Related resources") || sample.includes("guide-list"), "build page internal links");
}

function testBlogSource() {
  const src = path.join(root, "content/blog");
  const md = fs.readdirSync(src).filter((f) => f.endsWith(".md"));
  assert(md.length >= 6, `blog markdown sources (${md.length})`);
}

function testInfoPages() {
  for (const slug of ["about", "privacy", "contact"]) {
    const file = path.join(root, slug, "index.html");
    assert(fs.existsSync(file), `${slug} page exists`);
    const html = fs.readFileSync(file, "utf8");
    assert(html.includes("<title>"), `${slug} has title`);
    assert(html.includes('rel="canonical"'), `${slug} has canonical`);
    assert(html.includes(`${SITE}/`), `${slug} canonical domain`);
  }
}

testNoExampleDomain();
testHomepageHead();
testSitemap();
testBlogPages();
testBuildPages();
testBlogSource();
testInfoPages();

console.log(`\nSEO checks: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
