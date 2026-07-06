"use strict";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseCsv } from "../scripts/lib/csv.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

global.window = global;
await import(`file://${path.join(root, "data/config.js").replace(/\\/g, "/")}`);
await import(`file://${path.join(root, "data/cpus.js").replace(/\\/g, "/")}`);
await import(`file://${path.join(root, "data/gpus.js").replace(/\\/g, "/")}`);

const RESOLUTIONS = ["1080p", "1440p", "4k", "ultrawide"];
const CPU_TIERS = ["entry", "budget", "mainstream", "performance", "high-end", "enthusiast"];
const GPU_TIERS = ["entry", "budget", "mainstream", "performance", "high-end", "enthusiast", "flagship"];
const BRANDS = ["AMD", "Intel", "NVIDIA"];

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) passed++;
  else {
    failed++;
    console.error("FAIL:", message);
  }
}

function assertUniqueNames(items, label) {
  const names = items.map((i) => i.name);
  assert(names.length === new Set(names).size, `${label}: duplicate names`);
}

function testCsvSources() {
  const cpuCsv = parseCsv(fs.readFileSync(path.join(root, "data/sources/cpus.csv"), "utf8"));
  const gpuCsv = parseCsv(fs.readFileSync(path.join(root, "data/sources/gpus.csv"), "utf8"));
  assert(cpuCsv.length >= 50, "cpus.csv has sufficient rows");
  assert(gpuCsv.length >= 60, "gpus.csv has sufficient rows");
  cpuCsv.forEach((row) => {
    assert(row.name && row.fps1080p && row.source && row.lastVerified, `CPU CSV row valid: ${row.name}`);
  });
  gpuCsv.forEach((row) => {
    assert(row.name && row.fps1440p && row.source && row.lastVerified, `GPU CSV row valid: ${row.name}`);
  });
}

function testCpus() {
  assert(Array.isArray(CPU_DATA) && CPU_DATA.length >= 50, "CPU_DATA sufficient");
  assertUniqueNames(CPU_DATA, "CPU");
  CPU_DATA.forEach((cpu) => {
    assert(typeof cpu.name === "string", `CPU name: ${cpu.name}`);
    assert(BRANDS.includes(cpu.brand), `CPU brand: ${cpu.name}`);
    assert(typeof cpu.gameFps === "number", `CPU gameFps: ${cpu.name}`);
    assert(typeof cpu.cpuFps === "object", `CPU cpuFps: ${cpu.name}`);
    RESOLUTIONS.forEach((r) => assert(typeof cpu.cpuFps[r] === "number", `CPU ${cpu.name} cpuFps.${r}`));
    assert(typeof cpu.low1Ratio === "number", `CPU low1Ratio: ${cpu.name}`);
    assert(typeof cpu.sampleCount === "number", `CPU sampleCount: ${cpu.name}`);
    assert(cpu.lastVerified, `CPU lastVerified: ${cpu.name}`);
    assert(CPU_TIERS.includes(cpu.tier), `CPU tier: ${cpu.name}`);
  });
  const x3d = CPU_DATA.find((c) => c.name.includes("9800X3D"));
  const old = CPU_DATA.find((c) => c.name.includes("i3-10100"));
  if (x3d && old) {
    assert(x3d.cpuFps["1080p"] > old.cpuFps["1080p"], "9800X3D beats i3-10100 at 1080p");
    assert(x3d.cpuFps["1080p"] >= x3d.cpuFps["4k"], "CPU fps drops at 4K vs 1080p");
  }
}

function testGpus() {
  assert(Array.isArray(GPU_DATA) && GPU_DATA.length >= 120, "GPU_DATA sufficient");
  const mobileCount = GPU_DATA.filter((g) => g.segment === "mobile").length;
  assert(mobileCount >= 30, `mobile GPU count (${mobileCount})`);
  assertUniqueNames(GPU_DATA, "GPU");
  GPU_DATA.forEach((gpu) => {
    assert(BRANDS.includes(gpu.brand), `GPU brand: ${gpu.name}`);
    assert(typeof gpu.vram === "number", `GPU vram: ${gpu.name}`);
    assert(["desktop", "mobile"].includes(gpu.segment), `GPU segment: ${gpu.name}`);
    assert(typeof gpu.low1Ratio === "number", `GPU low1Ratio: ${gpu.name}`);
    assert(typeof gpu.sampleCount === "number", `GPU sampleCount: ${gpu.name}`);
    RESOLUTIONS.forEach((r) => assert(typeof gpu.fps[r] === "number", `GPU ${gpu.name} fps.${r}`));
    assert(gpu.fps["1080p"] >= gpu.fps["1440p"], `${gpu.name}: 1080p >= 1440p`);
    assert(gpu.fps["1440p"] >= gpu.fps["4k"], `${gpu.name}: 1440p >= 4k`);
  });
}

function testConfig() {
  assert(CONFIG.vendorUpscaling?.NVIDIA?.balanced?.multiplier > 1, "NVIDIA upscaling config");
  assert(CONFIG.vendorUpscaling?.AMD?.balanced?.multiplier > 1, "AMD upscaling config");
  assert(CONFIG.buildPresets?.length >= 3, "Build presets defined");
}

function testPerResolutionCpuModel() {
  const cpu5600 = CPU_DATA.find((c) => c.name === "AMD Ryzen 5 5600");
  const gpu5090 = GPU_DATA.find((g) => g.name === "NVIDIA GeForce RTX 5090");
  if (!cpu5600 || !gpu5090) return;
  const cpu1080 = cpu5600.cpuFps["1080p"];
  const cpu4k = cpu5600.cpuFps["4k"];
  const gap1080 = ((gpu5090.fps["1080p"] - cpu1080) / gpu5090.fps["1080p"]) * 100;
  const gap4k = ((gpu5090.fps["4k"] - cpu4k) / gpu5090.fps["4k"]) * 100;
  assert(gap1080 > gap4k, "5600+5090: larger relative CPU gap at 1080p than 4K");
}

function testSeoPages() {
  const buildDir = path.join(root, "build");
  assert(fs.existsSync(buildDir), "build/ directory exists");
  const pages = fs.readdirSync(buildDir, { withFileTypes: true }).filter((d) => d.isDirectory());
  assert(pages.length >= 10, "At least 10 SEO pages generated");
  const sample = path.join(buildDir, pages[0].name, "index.html");
  const html = fs.readFileSync(sample, "utf8");
  assert(html.includes("<title>"), "SEO page has title");
  assert(html.includes("application/ld+json"), "SEO page has structured data");
}

function testSitemap() {
  const xml = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
  assert(xml.includes("<urlset"), "sitemap.xml valid");
  assert(xml.includes("/build/"), "sitemap includes build pages");
  assert(xml.includes("<lastmod>"), "sitemap has lastmod");
}

function testPopularPairingsJs() {
  const js = fs.readFileSync(path.join(root, "data/popular-pairings.js"), "utf8");
  assert(js.includes("POPULAR_PAIRINGS"), "popular-pairings.js exists");
}

testCsvSources();
testCpus();
testGpus();
testConfig();
testPerResolutionCpuModel();
testSeoPages();
testSitemap();
testPopularPairingsJs();

console.log(`\nData integrity: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
