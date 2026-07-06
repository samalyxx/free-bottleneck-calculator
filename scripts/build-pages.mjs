/**
 * Generate SEO pages for popular CPU+GPU pairings
 * Run: node scripts/build-pages.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { slugify } from "./lib/csv.mjs";
import { SITE_URL, escapeHtml, renderPageShell } from "./lib/site.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const today = new Date().toISOString().slice(0, 10);

global.window = global;
await import(`file://${path.join(root, "data/config.js").replace(/\\/g, "/")}`);
await import(`file://${path.join(root, "data/cpus.js").replace(/\\/g, "/")}`);
await import(`file://${path.join(root, "data/gpus.js").replace(/\\/g, "/")}`);

const POPULAR_PAIRINGS = [
  ["AMD Ryzen 7 9800X3D", "NVIDIA GeForce RTX 5070", "1440p"],
  ["AMD Ryzen 7 9800X3D", "NVIDIA GeForce RTX 5080", "1440p"],
  ["AMD Ryzen 7 7800X3D", "NVIDIA GeForce RTX 4070 Super", "1440p"],
  ["AMD Ryzen 5 5600", "NVIDIA GeForce RTX 4060", "1080p"],
  ["AMD Ryzen 5 5600", "NVIDIA GeForce RTX 3060 12GB", "1080p"],
  ["AMD Ryzen 5 7600", "AMD Radeon RX 7800 XT", "1440p"],
  ["Intel Core i5-12400F", "NVIDIA GeForce RTX 4060", "1080p"],
  ["Intel Core i5-14600K", "NVIDIA GeForce RTX 4070 Super", "1440p"],
  ["AMD Ryzen 7 9800X3D", "NVIDIA GeForce RTX 5090", "4k"],
  ["AMD Ryzen 5 5600", "NVIDIA GeForce RTX 5090", "1080p"],
  ["AMD Ryzen 7 9700X", "AMD Radeon RX 9070 XT", "1440p"],
  ["Intel Core Ultra 9 285K", "NVIDIA GeForce RTX 5080", "1440p"],
  ["AMD Ryzen 5 7600", "NVIDIA GeForce RTX 5060", "1080p"],
  ["AMD Ryzen 7 7800X3D", "AMD Radeon RX 7900 XTX", "4k"],
  ["Intel Core i7-14700K", "NVIDIA GeForce RTX 4070 Ti Super", "1440p"]
];

function getCpuCeiling(cpu, res) {
  return cpu.cpuFps?.[res] ?? cpu.gameFps;
}

function computePair(cpu, gpu, resolution) {
  const cpuCeiling = getCpuCeiling(cpu, resolution);
  const gpuCeiling = gpu.fps[resolution];
  const predicted = Math.min(cpuCeiling, gpuCeiling);
  const limiter = cpuCeiling < gpuCeiling ? "CPU" : "GPU";
  const gap = Math.round(((Math.max(cpuCeiling, gpuCeiling) - predicted) / Math.max(cpuCeiling, gpuCeiling)) * 100);
  const lowRatio = limiter === "CPU" ? (cpu.low1Ratio ?? 0.72) : (gpu.low1Ratio ?? 0.75);
  const onePercentLow = Math.round(predicted * lowRatio);
  return { predicted: Math.round(predicted), onePercentLow, limiter, gap, cpuCeiling: Math.round(cpuCeiling), gpuCeiling: Math.round(gpuCeiling) };
}

function buildHash(cpu, gpu, resolution) {
  const params = new URLSearchParams({
    cpu, gpu, resolution, purpose: "aaa", ramAmount: "16", ramSpeed: "3200",
    ramChannel: "dual", storage: "nvme3", rt: "off", upscaling: "off", compare: "0"
  });
  return "#" + params.toString();
}

function resLabel(resolution) {
  if (resolution === "4k") return "4K";
  if (resolution === "ultrawide") return "3440x1440 ultrawide";
  return resolution;
}

function upgradeAdvice(limiter, resolution, gap) {
  if (limiter === "CPU") {
    return `At ${resLabel(resolution)}, the ${escapeHtml("CPU")} is the weaker link with a ${gap}% bottleneck gap. A faster gaming processor — especially an X3D chip for cache-sensitive titles — or lowering resolution would raise FPS. Dual-channel RAM with XMP/EXPO enabled also helps CPU-bound scenarios.`;
  }
  return `At ${resLabel(resolution)}, the GPU is the main limiter (${gap}% gap), which is normal for AAA gaming at this resolution. Upgrading the graphics card, enabling DLSS/FSR/XeSS, or lowering ray tracing settings would improve frame rates.`;
}

function renderPage(cpu, gpu, resolution, result) {
  const slug = `${slugify(cpu.name)}-${slugify(gpu.name)}`;
  const res = resLabel(resolution);
  const title = `${cpu.name} + ${gpu.name} Bottleneck at ${res}`;
  const desc = `${cpu.name} and ${gpu.name} bottleneck analysis at ${res}. Estimated ~${result.predicted} FPS average, ~${result.onePercentLow} FPS 1% low, ${result.limiter}-limited with ${result.gap}% gap.`;
  const calcUrl = `../../index.html${buildHash(cpu.name, gpu.name, resolution)}`;
  const canonical = `${SITE_URL}/build/${slug}/`;

  const faq = [
    {
      q: `Is ${cpu.name} good enough for ${gpu.name}?`,
      a: result.limiter === "CPU"
        ? `At ${res}, the CPU may hold back the ${gpu.name}. Estimated gap is ${result.gap}%. For higher FPS, consider a faster CPU or lower resolution.`
        : `Yes — at ${res}, the ${gpu.name} is the limiter, so the ${cpu.name} has headroom. This is a balanced pairing for this resolution.`
    },
    {
      q: `What FPS can I expect with ${cpu.name} and ${gpu.name}?`,
      a: `Our model estimates roughly ${result.predicted} FPS average and ${result.onePercentLow} FPS 1% lows at ${res} in AAA gaming with default settings. Actual results vary by game.`
    },
    {
      q: `Should I upgrade the CPU or GPU in this build?`,
      a: result.limiter === "CPU"
        ? `Upgrade the CPU first if you want higher FPS at ${res}. The processor is limiting before the graphics card.`
        : `Upgrade the GPU first. The graphics card is the bottleneck, which is expected at ${res}.`
    }
  ];

  const faqHtml = faq
    .map((f) => `<article class="content-panel"><h3 class="text-base font-semibold text-on-surface mb-2">${escapeHtml(f.q)}</h3><p class="text-sm text-on-surface-variant">${escapeHtml(f.a)}</p></article>`)
    .join("");

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a }
    }))
  };

  const body = `<main class="site-wrap py-10 md:py-12">
    <section class="mb-8 border-b border-surface-container-highest pb-6">
      <p class="section-eyebrow">Build analysis</p>
      <h1 class="text-2xl md:text-3xl font-semibold text-on-surface mb-2">${escapeHtml(cpu.name)} + ${escapeHtml(gpu.name)}</h1>
      <p class="text-on-surface-variant">Bottleneck estimate at ${escapeHtml(res)} for AAA gaming. CPU ceiling ~${result.cpuCeiling} FPS · GPU ceiling ~${result.gpuCeiling} FPS.</p>
    </section>
    <article class="panel-card p-6 mb-8">
      <h2 class="text-xl font-semibold text-on-surface mb-4">Estimated performance</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div class="panel-card p-4 bg-surface-container-low"><span class="field-label">Average FPS</span><strong class="text-2xl font-bold block mt-1">~${result.predicted}</strong></div>
        <div class="panel-card p-4 bg-surface-container-low"><span class="field-label">1% low FPS</span><strong class="text-2xl font-bold block mt-1">~${result.onePercentLow}</strong></div>
        <div class="panel-card p-4 bg-surface-container-low"><span class="field-label">Limiter</span><strong class="text-2xl font-bold block mt-1">${result.limiter}</strong></div>
        <div class="panel-card p-4 bg-surface-container-low"><span class="field-label">Gap</span><strong class="text-2xl font-bold text-primary-container block mt-1">${result.gap}%</strong></div>
      </div>
      <p class="text-sm text-on-surface-variant mb-4">${upgradeAdvice(result.limiter, resolution, result.gap)}</p>
      <a href="${calcUrl}" class="btn-primary">Customize in calculator</a>
    </article>
    <section class="content-section !py-0 mb-8">
      <article class="content-panel content-panel-wide">
        <h2 class="text-xl font-semibold mb-3">About this pairing</h2>
        <p class="text-sm text-on-surface-variant mb-3">The ${escapeHtml(cpu.name)} paired with the ${escapeHtml(gpu.name)} is a ${result.gap <= 10 ? "well-balanced" : result.gap <= 25 ? "moderately imbalanced" : "significantly imbalanced"} combination at ${escapeHtml(res)}.</p>
        <p class="text-sm text-on-surface-variant">Use our <a class="text-primary font-semibold" href="${calcUrl}">free bottleneck calculator</a> for RAM, storage, and RT settings.</p>
      </article>
    </section>
    <section id="faq" class="content-section !py-0 mb-8">
      <article class="content-panel content-panel-wide"><h2 class="text-xl font-semibold mb-2">FAQ</h2></article>
      ${faqHtml}
    </section>
    <section class="content-section !py-0 pb-8">
      <article class="content-panel content-panel-wide">
        <h2 class="text-xl font-semibold mb-3">Related resources</h2>
        <ul class="guide-list text-sm">
          <li><a href="../../blog/what-is-cpu-bottleneck/">What is a CPU bottleneck?</a></li>
          <li><a href="../../blog/cpu-vs-gpu-bottleneck/">CPU vs GPU bottleneck explained</a></li>
          <li><a href="../../index.html#popular">Browse popular pairings</a></li>
        </ul>
      </article>
    </section>
  </main>`;

  return renderPageShell({
    title: `${title} | PC Bottleneck Calculator`,
    description: desc,
    canonical,
    depth: 2,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: title,
        description: desc,
        url: canonical
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Popular builds", item: `${SITE_URL}/#popular` },
          { "@type": "ListItem", position: 3, name: `${cpu.name} + ${gpu.name}`, item: canonical }
        ]
      },
      faqLd
    ],
    body,
    scripts: `<script src="../../assets/theme.js" defer></script>`
  });
}

const buildDir = path.join(root, "build");
if (fs.existsSync(buildDir)) fs.rmSync(buildDir, { recursive: true });
fs.mkdirSync(buildDir, { recursive: true });

const pairingMeta = [];

for (const [cpuName, gpuName, resolution] of POPULAR_PAIRINGS) {
  const cpu = CPU_DATA.find((c) => c.name === cpuName);
  const gpu = GPU_DATA.find((g) => g.name === gpuName);
  if (!cpu || !gpu) {
    console.warn(`Skipping missing pairing: ${cpuName} + ${gpuName}`);
    continue;
  }
  const result = computePair(cpu, gpu, resolution);
  const slug = `${slugify(cpuName)}-${slugify(gpuName)}`;
  const pageDir = path.join(buildDir, slug);
  fs.mkdirSync(pageDir, { recursive: true });
  fs.writeFileSync(path.join(pageDir, "index.html"), renderPage(cpu, gpu, resolution, result));
  pairingMeta.push({ cpu: cpuName, gpu: gpuName, resolution, slug, ...result });
}

const pairingsJs = `// AUTO-GENERATED by scripts/build-pages.mjs on ${today}\nwindow.POPULAR_PAIRINGS = ${JSON.stringify(pairingMeta, null, 2)};\n`;
fs.writeFileSync(path.join(root, "data/popular-pairings.js"), pairingsJs);
console.log(`Generated ${pairingMeta.length} SEO build pages and popular-pairings.js`);
