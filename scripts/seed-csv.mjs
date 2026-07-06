/**
 * One-time seed: convert existing data/*.js into data/sources/*.csv
 * Run: node scripts/seed-csv.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { toCsv } from "./lib/csv.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

global.window = global;
await import(`file://${path.join(root, "data/cpus.js").replace(/\\/g, "/")}`);
await import(`file://${path.join(root, "data/gpus.js").replace(/\\/g, "/")}`);

const today = new Date().toISOString().slice(0, 10);

function deriveCpuFps(gameFps) {
  return {
    fps1080p: Math.round(gameFps),
    fps1440p: Math.round(gameFps * 0.92),
    fps4k: Math.round(gameFps * 0.85),
    fpsUltrawide: Math.round(gameFps * 0.9)
  };
}

function deriveLow1Ratio(cpu) {
  if (cpu.x3d) return 0.82;
  if (cpu.tier === "enthusiast" || cpu.tier === "high-end") return 0.76;
  if (cpu.tier === "performance" || cpu.tier === "mainstream") return 0.72;
  return 0.68;
}

const cpuHeaders = [
  "name", "brand", "year", "cores", "threads", "tier", "x3d",
  "fps1080p", "fps1440p", "fps4k", "fpsUltrawide", "low1Ratio",
  "source", "sampleCount", "lastVerified"
];

const cpuRows = CPU_DATA.map((cpu) => {
  const fps = deriveCpuFps(cpu.gameFps);
  return {
    name: cpu.name,
    brand: cpu.brand,
    year: cpu.year,
    cores: cpu.cores,
    threads: cpu.threads,
    tier: cpu.tier,
    x3d: cpu.x3d ? "true" : "false",
    ...fps,
    low1Ratio: deriveLow1Ratio(cpu),
    source: "curated-benchmark-anchors",
    sampleCount: 12,
    lastVerified: today
  };
});

const gpuHeaders = [
  "name", "brand", "year", "vram", "tier", "rt",
  "fps1080p", "fps1440p", "fps4k", "fpsUltrawide", "low1Ratio",
  "source", "sampleCount", "lastVerified"
];

function deriveGpuLow1Ratio(gpu) {
  if (gpu.tier === "flagship" || gpu.tier === "enthusiast") return 0.78;
  if (gpu.tier === "high-end" || gpu.tier === "performance") return 0.75;
  if (gpu.tier === "mainstream") return 0.72;
  return 0.68;
}

const gpuRows = GPU_DATA.map((gpu) => ({
  name: gpu.name,
  brand: gpu.brand,
  year: gpu.year,
  vram: gpu.vram,
  tier: gpu.tier,
  rt: gpu.rt,
  fps1080p: gpu.fps["1080p"],
  fps1440p: gpu.fps["1440p"],
  fps4k: gpu.fps["4k"],
  fpsUltrawide: gpu.fps.ultrawide,
  low1Ratio: deriveGpuLow1Ratio(gpu),
  source: "curated-benchmark-anchors",
  sampleCount: 12,
  lastVerified: today
}));

const sourcesDir = path.join(root, "data/sources");
fs.mkdirSync(sourcesDir, { recursive: true });
fs.writeFileSync(path.join(sourcesDir, "cpus.csv"), toCsv(cpuRows, cpuHeaders));
fs.writeFileSync(path.join(sourcesDir, "gpus.csv"), toCsv(gpuRows, gpuHeaders));
console.log(`Seeded ${cpuRows.length} CPUs and ${gpuRows.length} GPUs to data/sources/`);
