window.CONFIG = {
  dataLastReviewed: "2026-07-06",
  methodology: "FPS anchors normalized from aggregated TechPowerUp GPU relative performance, Tom's Hardware CPU/GPU hierarchies, and per-resolution gaming benchmarks (2024–2026). CPU gameFps is a resolution-independent gaming throughput index; GPU fps values are per-resolution AAA-ultra basket averages.",

  resolutionProfiles: {
    "1080p": { label: "1080p", key: "1080p" },
    "1440p": { label: "1440p", key: "1440p" },
    "4k": { label: "4K", key: "4k" },
    ultrawide: { label: "3440 x 1440 ultrawide", key: "ultrawide" }
  },

  purposeProfiles: {
    esports: {
      label: "esports / high FPS",
      cpuMultiplier: 1.18,
      gpuMultiplier: 0.88,
      ramMultiplier: 1.05,
      storageMultiplier: 0.85,
      vramBonus: 0
    },
    aaa: {
      label: "AAA gaming",
      cpuMultiplier: 1.0,
      gpuMultiplier: 1.0,
      ramMultiplier: 1.0,
      storageMultiplier: 1.0,
      vramBonus: 0
    },
    streaming: {
      label: "gaming and streaming",
      cpuMultiplier: 1.15,
      gpuMultiplier: 0.98,
      ramMultiplier: 1.25,
      storageMultiplier: 1.0,
      vramBonus: 0
    },
    creation: {
      label: "gaming and creator apps",
      cpuMultiplier: 1.1,
      gpuMultiplier: 0.95,
      ramMultiplier: 1.35,
      storageMultiplier: 1.15,
      vramBonus: 2
    }
  },

  vramRequirements: {
    "1080p": { base: 6, aaa: 8, rt: 10 },
    "1440p": { base: 8, aaa: 10, rt: 12 },
    "4k": { base: 10, aaa: 12, rt: 16 },
    ultrawide: { base: 8, aaa: 10, rt: 12 }
  },

  storageScores: {
    hdd: { score: 34, label: "hard drive" },
    sata: { score: 72, label: "SATA SSD" },
    nvme3: { score: 88, label: "PCIe 3.0 NVMe SSD" },
    nvme4: { score: 96, label: "PCIe 4.0 NVMe SSD" },
    nvme5: { score: 100, label: "PCIe 5.0 NVMe SSD" }
  },

  ramSpeedProfiles: {
    2133: { type: "DDR4", score: 72 },
    2400: { type: "DDR4", score: 78 },
    2666: { type: "DDR4", score: 82 },
    2933: { type: "DDR4", score: 86 },
    3200: { type: "DDR4", score: 90 },
    3600: { type: "DDR4", score: 96 },
    4000: { type: "DDR4", score: 98 },
    4800: { type: "DDR5", score: 88 },
    5200: { type: "DDR5", score: 92 },
    5600: { type: "DDR5", score: 96 },
    6000: { type: "DDR5", score: 100 },
    6400: { type: "DDR5", score: 101 },
    7200: { type: "DDR5", score: 102 },
    8000: { type: "DDR5", score: 103 }
  },

  defaults: {
    cpu: "AMD Ryzen 7 9800X3D",
    gpu: "NVIDIA GeForce RTX 5070"
  },

  thresholds: {
    balanced: 10,
    moderate: 25,
    maxGap: 65
  },

  rayTracing: {
    off: { label: "Off", multiplier: 1.0 },
    on: { label: "On", basePenalty: 0.55 }
  },

  vendorUpscaling: {
    NVIDIA: {
      quality: { label: "DLSS Quality", multiplier: 1.35 },
      balanced: { label: "DLSS Balanced", multiplier: 1.55 },
      performance: { label: "DLSS Performance", multiplier: 1.85 }
    },
    AMD: {
      quality: { label: "FSR Quality", multiplier: 1.28 },
      balanced: { label: "FSR Balanced", multiplier: 1.48 },
      performance: { label: "FSR Performance", multiplier: 1.75 }
    },
    Intel: {
      quality: { label: "XeSS Quality", multiplier: 1.3 },
      balanced: { label: "XeSS Balanced", multiplier: 1.5 },
      performance: { label: "XeSS Performance", multiplier: 1.78 }
    }
  },

  upscalingProfiles: {
    off: { label: "Off", multiplier: 1.0 },
    quality: { label: "Quality (DLSS/FSR/XeSS)", multiplier: 1.3 },
    balanced: { label: "Balanced", multiplier: 1.5 },
    performance: { label: "Performance", multiplier: 1.8 }
  },

  buildPresets: [
    { label: "Budget 1080p", cpu: "AMD Ryzen 5 5600", gpu: "NVIDIA GeForce RTX 4060", resolution: "1080p", purpose: "aaa" },
    { label: "1440p value", cpu: "AMD Ryzen 7 7800X3D", gpu: "NVIDIA GeForce RTX 4070 Super", resolution: "1440p", purpose: "aaa" },
    { label: "4K high-end", cpu: "AMD Ryzen 7 9800X3D", gpu: "NVIDIA GeForce RTX 5080", resolution: "4k", purpose: "aaa" },
    { label: "Esports 1080p", cpu: "AMD Ryzen 7 9800X3D", gpu: "NVIDIA GeForce RTX 5070", resolution: "1080p", purpose: "esports" }
  ],

  siteUrl: "https://freebottleneckcalculator.com",

  confidence: {
    dataFreshDays: 90,
    dataStaleDays: 180,
    minSamplesHigh: 10,
    minSamplesMedium: 5
  },

  themeKey: "bottleneck-theme"
};
