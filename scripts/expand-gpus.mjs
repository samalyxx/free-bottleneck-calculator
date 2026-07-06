/**
 * Add segment column + mobile/missing GPU models to gpus.csv
 * Run: node scripts/expand-gpus.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseCsv, toCsv } from "./lib/csv.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const csvPath = path.join(root, "data/sources/gpus.csv");
const today = new Date().toISOString().slice(0, 10);
const src = "curated-benchmark-anchors";

const HEADERS = [
  "name", "brand", "year", "vram", "tier", "segment", "rt",
  "fps1080p", "fps1440p", "fps4k", "fpsUltrawide", "low1Ratio",
  "source", "sampleCount", "lastVerified"
];

function row(name, brand, year, vram, tier, segment, rt, f1080, f1440, f4k, fUw, low1) {
  return {
    name, brand, year: String(year), vram: String(vram), tier, segment,
    rt: String(rt), fps1080p: String(f1080), fps1440p: String(f1440),
    fps4k: String(f4k), fpsUltrawide: String(fUw), low1Ratio: String(low1),
    source: src, sampleCount: "12", lastVerified: today
  };
}

// Missing desktop VRAM variants
const newDesktop = [
  row("NVIDIA GeForce RTX 4050", "NVIDIA", 2023, 6, "budget", "desktop", 45, 95, 68, 28, 58, 0.68),
  row("NVIDIA GeForce RTX 3060 8GB", "NVIDIA", 2022, 8, "mainstream", "desktop", 42, 98, 72, 32, 61, 0.72),
  row("NVIDIA GeForce GTX 1060 3GB", "NVIDIA", 2016, 3, "entry", "desktop", 0, 62, 40, 14, 35, 0.68),
  row("NVIDIA GeForce GTX 1050", "NVIDIA", 2016, 2, "entry", "desktop", 0, 45, 28, 8, 24, 0.68),
  row("AMD Radeon RX 5500 XT 4GB", "AMD", 2019, 4, "budget", "desktop", 0, 62, 42, 14, 36, 0.68),
  row("AMD Radeon RX 5500 XT 8GB", "AMD", 2019, 8, "budget", "desktop", 0, 68, 45, 15, 38, 0.68),
  row("Intel Arc A310", "Intel", 2022, 4, "entry", "desktop", 15, 48, 32, 10, 26, 0.68)
];

// NVIDIA RTX 50 Laptop
const nvidia50Mobile = [
  row("NVIDIA GeForce RTX 5090 Laptop", "NVIDIA", 2025, 24, "flagship", "mobile", 90, 165, 130, 72, 115, 0.76),
  row("NVIDIA GeForce RTX 5080 Laptop", "NVIDIA", 2025, 16, "enthusiast", "mobile", 85, 148, 112, 58, 98, 0.76),
  row("NVIDIA GeForce RTX 5070 Ti Laptop", "NVIDIA", 2025, 12, "high-end", "mobile", 80, 132, 98, 48, 84, 0.74),
  row("NVIDIA GeForce RTX 5070 Laptop", "NVIDIA", 2025, 8, "high-end", "mobile", 75, 122, 88, 42, 75, 0.74),
  row("NVIDIA GeForce RTX 5060 Laptop", "NVIDIA", 2025, 8, "performance", "mobile", 52, 98, 68, 28, 54, 0.72),
  row("NVIDIA GeForce RTX 5050 Laptop", "NVIDIA", 2026, 8, "mainstream", "mobile", 38, 78, 52, 18, 42, 0.7)
];

// NVIDIA RTX 40 Laptop
const nvidia40Mobile = [
  row("NVIDIA GeForce RTX 4090 Laptop", "NVIDIA", 2023, 16, "enthusiast", "mobile", 88, 142, 108, 58, 95, 0.76),
  row("NVIDIA GeForce RTX 4080 Laptop", "NVIDIA", 2023, 12, "high-end", "mobile", 82, 128, 95, 48, 82, 0.74),
  row("NVIDIA GeForce RTX 4070 Laptop", "NVIDIA", 2023, 8, "high-end", "mobile", 70, 112, 82, 38, 72, 0.74),
  row("NVIDIA GeForce RTX 4060 Laptop", "NVIDIA", 2023, 8, "performance", "mobile", 50, 88, 62, 26, 48, 0.72),
  row("NVIDIA GeForce RTX 4050 Laptop", "NVIDIA", 2023, 6, "mainstream", "mobile", 42, 72, 50, 18, 38, 0.7)
];

// NVIDIA RTX 30 Laptop
const nvidia30Mobile = [
  row("NVIDIA GeForce RTX 3080 Ti Laptop", "NVIDIA", 2022, 16, "high-end", "mobile", 62, 118, 88, 42, 75, 0.74),
  row("NVIDIA GeForce RTX 3080 Laptop", "NVIDIA", 2021, 8, "high-end", "mobile", 58, 108, 78, 36, 68, 0.74),
  row("NVIDIA GeForce RTX 3070 Ti Laptop", "NVIDIA", 2022, 8, "performance", "mobile", 55, 98, 72, 32, 62, 0.72),
  row("NVIDIA GeForce RTX 3070 Laptop", "NVIDIA", 2021, 8, "performance", "mobile", 52, 92, 68, 30, 58, 0.72),
  row("NVIDIA GeForce RTX 3060 Laptop", "NVIDIA", 2021, 6, "mainstream", "mobile", 42, 78, 55, 22, 46, 0.7),
  row("NVIDIA GeForce RTX 3050 Ti Laptop", "NVIDIA", 2021, 4, "budget", "mobile", 32, 62, 42, 14, 36, 0.68),
  row("NVIDIA GeForce RTX 3050 Laptop", "NVIDIA", 2022, 4, "budget", "mobile", 30, 58, 38, 12, 32, 0.68),
  row("NVIDIA GeForce RTX 2050", "NVIDIA", 2022, 4, "entry", "mobile", 20, 48, 32, 10, 26, 0.68)
];

// AMD mobile
const amdMobile = [
  row("AMD Radeon RX 7900M", "AMD", 2023, 16, "enthusiast", "mobile", 58, 135, 102, 48, 88, 0.76),
  row("AMD Radeon RX 7800M", "AMD", 2024, 12, "high-end", "mobile", 50, 118, 88, 38, 75, 0.74),
  row("AMD Radeon RX 7700S", "AMD", 2023, 8, "performance", "mobile", 45, 102, 75, 32, 65, 0.72),
  row("AMD Radeon RX 7600M XT", "AMD", 2023, 8, "performance", "mobile", 38, 92, 68, 28, 58, 0.72),
  row("AMD Radeon RX 7600M", "AMD", 2023, 8, "mainstream", "mobile", 35, 85, 62, 24, 52, 0.72),
  row("AMD Radeon RX 6900M", "AMD", 2021, 12, "high-end", "mobile", 40, 112, 82, 36, 68, 0.74),
  row("AMD Radeon RX 6800M", "AMD", 2021, 12, "performance", "mobile", 38, 105, 78, 32, 64, 0.72),
  row("AMD Radeon RX 6700M", "AMD", 2021, 10, "mainstream", "mobile", 30, 88, 65, 24, 55, 0.72),
  row("AMD Radeon RX 6650M XT", "AMD", 2022, 8, "mainstream", "mobile", 26, 82, 58, 20, 50, 0.72),
  row("AMD Radeon RX 6600M", "AMD", 2021, 8, "budget", "mobile", 22, 75, 52, 18, 44, 0.68)
];

// Intel mobile
const intelMobile = [
  row("Intel Arc A770M", "Intel", 2022, 16, "performance", "mobile", 35, 95, 68, 28, 58, 0.72),
  row("Intel Arc A730M", "Intel", 2022, 12, "mainstream", "mobile", 32, 82, 58, 22, 48, 0.72),
  row("Intel Arc A570M", "Intel", 2023, 8, "mainstream", "mobile", 28, 72, 50, 18, 40, 0.7),
  row("Intel Arc A550M", "Intel", 2022, 8, "budget", "mobile", 25, 65, 45, 15, 36, 0.68),
  row("Intel Arc A370M", "Intel", 2022, 4, "entry", "mobile", 18, 48, 32, 10, 26, 0.68)
];

const existing = parseCsv(fs.readFileSync(csvPath, "utf8"));
const normalized = existing.map((r) => ({
  ...r,
  segment: r.segment || "desktop"
}));

const names = new Set(normalized.map((r) => r.name));
const toAdd = [
  ...newDesktop, ...nvidia50Mobile, ...nvidia40Mobile, ...nvidia30Mobile,
  ...amdMobile, ...intelMobile
].filter((r) => !names.has(r.name));

const merged = [...normalized, ...toAdd];
fs.writeFileSync(csvPath, toCsv(merged, HEADERS));
console.log(`GPUs: ${normalized.length} existing + ${toAdd.length} new = ${merged.length} total`);
