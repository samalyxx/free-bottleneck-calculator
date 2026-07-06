(function () {
  "use strict";

  const cfg = window.CONFIG;
  const {
    resolutionProfiles,
    purposeProfiles,
    storageScores,
    ramSpeedProfiles,
    vramRequirements,
    thresholds,
    defaults,
    rayTracing,
    upscalingProfiles,
    vendorUpscaling,
    buildPresets,
    confidence: confidenceCfg,
    themeKey
  } = cfg;

  const RESOLUTIONS = ["1080p", "1440p", "4k", "ultrawide"];
  const STATE_KEYS = [
    "cpu",
    "gpu",
    "resolution",
    "purpose",
    "ramAmount",
    "ramSpeed",
    "ramChannel",
    "storage",
    "rt",
    "upscaling",
    "compare",
    "cpuB",
    "gpuB",
    "resolutionB",
    "purposeB"
  ];

  function clamp(num, min, max) {
    return Math.min(max, Math.max(min, num));
  }

  function track(event, data) {
    if (typeof window.__bottleneckTrack === "function") {
      window.__bottleneckTrack(event, data);
    }
  }

  function validateDataset() {
    const issues = [];
    window.CPU_DATA.forEach((cpu) => {
      if (!cpu.name || typeof cpu.gameFps !== "number") {
        issues.push(`CPU missing fields: ${cpu.name || "unknown"}`);
      }
      if (cpu.cpuFps) {
        RESOLUTIONS.forEach((r) => {
          if (typeof cpu.cpuFps[r] !== "number") issues.push(`CPU ${cpu.name} missing cpuFps.${r}`);
        });
      }
    });
    window.GPU_DATA.forEach((gpu) => {
      if (!gpu.name || typeof gpu.vram !== "number" || !gpu.fps) {
        issues.push(`GPU missing fields: ${gpu.name || "unknown"}`);
      } else {
        RESOLUTIONS.forEach((r) => {
          if (typeof gpu.fps[r] !== "number") issues.push(`GPU ${gpu.name} missing fps.${r}`);
        });
      }
    });
    if (issues.length) console.warn("[Bottleneck Calculator] Data validation:", issues);
  }

  function getRamScore(amount, speed, channel, purposeKey) {
    const speedProfile = ramSpeedProfiles[speed] || { score: 85 };
    let score = speedProfile.score;
    if (amount < 16) score -= purposeKey === "esports" ? 22 : 32;
    else if (amount === 16 && (purposeKey === "streaming" || purposeKey === "creation")) score -= 16;
    else if (amount >= 32) score += 4;
    else if (amount >= 64) score += 6;
    if (channel === "single") score -= 14;
    return clamp(score, 15, 105);
  }

  function getRequiredVram(resolutionKey, purposeKey) {
    const req = vramRequirements[resolutionKey];
    const purpose = purposeProfiles[purposeKey];
    return req.aaa + purpose.vramBonus;
  }

  function getRtMultiplier(gpu, rtKey) {
    if (rtKey === "off") return 1;
    const rtScore = gpu.rt || 0;
    const efficiency = rtScore / 100;
    return rayTracing.on.basePenalty + efficiency * (1 - rayTracing.on.basePenalty);
  }

  function getUpscalingMultiplier(gpu, upscalingKey) {
    if (upscalingKey === "off") return 1;
    const vendor = gpu.brand;
    const vendorProfile = vendorUpscaling[vendor]?.[upscalingKey];
    if (vendorProfile) return vendorProfile.multiplier;
    return upscalingProfiles[upscalingKey]?.multiplier || 1;
  }

  function getUpscalingLabel(gpu, upscalingKey) {
    if (upscalingKey === "off") return "Off";
    return vendorUpscaling[gpu.brand]?.[upscalingKey]?.label || upscalingProfiles[upscalingKey]?.label || upscalingKey;
  }

  function getGpuCeiling(gpu, resKey, purposeKey, rtKey, upscalingKey) {
    const purpose = purposeProfiles[purposeKey];
    let ceiling = gpu.fps[resKey] * purpose.gpuMultiplier;
    ceiling *= getRtMultiplier(gpu, rtKey);
    ceiling *= getUpscalingMultiplier(gpu, upscalingKey);
    return ceiling;
  }

  function getCpuCeiling(cpu, resKey, purposeKey) {
    const base = cpu.cpuFps?.[resKey] ?? cpu.gameFps;
    return base * purposeProfiles[purposeKey].cpuMultiplier;
  }

  function estimateOnePercentLow(predictedFps, limiter, cpu, gpu, ramPressure) {
    let ratio = limiter === "CPU"
      ? (cpu.low1Ratio ?? (cpu.x3d ? 0.82 : 0.72))
      : (gpu.low1Ratio ?? 0.75);
    if (ramPressure > 20) ratio -= 0.06;
    return Math.round(predictedFps * clamp(ratio, 0.55, 0.9));
  }

  function getConfidence(cpu, gpu, cpuCeiling, gpuCeiling, gap) {
    const daysSinceCpu = Math.floor((Date.now() - new Date(cpu.lastVerified || cfg.dataLastReviewed).getTime()) / 86400000);
    const daysSinceGpu = Math.floor((Date.now() - new Date(gpu.lastVerified || cfg.dataLastReviewed).getTime()) / 86400000);
    const daysSinceReview = Math.max(daysSinceCpu, daysSinceGpu);
    const minSamples = Math.min(cpu.sampleCount ?? 0, gpu.sampleCount ?? 0);

    let score = 100;
    if (daysSinceReview > confidenceCfg.dataStaleDays) score -= 30;
    else if (daysSinceReview > confidenceCfg.dataFreshDays) score -= 12;
    if (minSamples < confidenceCfg.minSamplesMedium) score -= 25;
    else if (minSamples < confidenceCfg.minSamplesHigh) score -= 10;
    if (gap > 45) score -= 15;
    else if (gap > 25) score -= 8;
    const spread = Math.abs(cpuCeiling - gpuCeiling) / Math.max(cpuCeiling, gpuCeiling);
    if (spread > 0.5) score -= 12;

    if (score >= 75) return { level: "High", className: "confidence-high" };
    if (score >= 50) return { level: "Medium", className: "confidence-medium" };
    return { level: "Low", className: "confidence-low" };
  }

  function classify(score) {
    if (score < thresholds.balanced) {
      return { label: "Optimal", color: "#0055ff", stroke: "text-primary-container", text: "text-primary-container", bar: "bg-primary-container" };
    }
    if (score < thresholds.moderate) {
      return { label: "Moderate", color: "#ba1a1a", stroke: "text-error", text: "text-error", bar: "bg-error" };
    }
    return { label: "High", color: "#ba1a1a", stroke: "text-error", text: "text-error", bar: "bg-error" };
  }

  function shortName(full) {
    const parts = full.split(" ");
    return parts.length > 3 ? parts.slice(-3).join(" ") : full;
  }

  function renderGauge(pct, meta) {
    const dash = Math.min(Math.round(pct), 100);
    return `<div class="w-24 h-24 relative flex items-center justify-center shrink-0">
      <svg class="w-full h-full -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
        <path class="text-surface-container-high" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="3"></path>
        <path class="${meta.stroke}" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-dasharray="${dash}, 100" stroke-linecap="round" stroke-width="3"></path>
      </svg>
      <span class="absolute text-xl font-bold ${meta.text}">${dash}%</span>
    </div>`;
  }

  function limiterSummary(result) {
    if (result.balanced) return { title: "Optimal Balance.", body: "Components are well matched for this resolution." };
    if (result.limiter === "CPU") {
      return { title: `${result.state.label} CPU Bottleneck.`, body: `CPU is limiting before GPU at ${result.res.label}.` };
    }
    return { title: `${result.state.label} GPU Bottleneck.`, body: `GPU is the main limiter at ${result.res.label}, which is often expected.` };
  }

  function renderCompareCard(container, result, buildLabel, badge, isWinner) {
    if (!result) {
      container.innerHTML = `<div class="compare-card p-6"><p class="text-on-surface-variant">Select valid CPU and GPU.</p></div>`;
      return;
    }
    const meta = classify(result.top.value);
    const summary = limiterSummary(result);
    const ramLabel = `${result.ramAmount} GB ${result.ramChannel === "dual" ? "DDR" : "DDR"} @ ${document.getElementById("ramSpeed")?.value || "3200"}`;
    const tags = [
      { text: `${result.gpu.vram} GB VRAM`, highlight: result.limiter === "GPU" },
      { text: `${result.ramAmount} GB RAM`, highlight: false },
      { text: `Est. ${result.predictedFps} FPS`, highlight: true }
    ];

    container.innerHTML = `
      <div class="compare-card ${isWinner ? "compare-card-winner" : ""} flex flex-col relative">
        ${isWinner ? `<div class="absolute top-0 right-0 bg-primary-container text-on-primary font-mono text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-bl-lg z-10">Optimized</div>` : ""}
        <div class="p-5 border-b border-outline-variant bg-surface-container flex justify-between items-center">
          <h3 class="text-lg font-semibold text-on-surface">${buildLabel}</h3>
          ${badge ? `<span class="chip uppercase text-[10px]">${badge}</span>` : ""}
        </div>
        <div class="p-5 space-y-5 flex-grow">
          <div class="space-y-3">
            <div>
              <span class="field-label">Processor (CPU)</span>
              <div class="field-input flex items-center">${result.cpu.name}</div>
            </div>
            <div>
              <span class="field-label">Graphics Card (GPU)</span>
              <div class="field-input flex items-center ${isWinner ? "border-primary/40" : ""}">${result.gpu.name}</div>
            </div>
          </div>
          <div class="pt-4 border-t border-outline-variant">
            <h4 class="field-label mb-3">Bottleneck Risk (${result.res.label})</h4>
            <div class="flex items-center gap-5">
              ${renderGauge(result.top.value, meta)}
              <div>
                <p class="font-semibold text-on-surface">${summary.title}</p>
                <p class="text-on-surface-variant text-sm mt-1">${summary.body}</p>
              </div>
            </div>
          </div>
          <div class="flex flex-wrap gap-2 pt-4 border-t border-outline-variant">
            ${tags.map((t) => `<span class="chip ${t.highlight && isWinner ? "chip-highlight font-bold text-primary-container" : ""}">${t.text}</span>`).join("")}
          </div>
        </div>
      </div>`;
  }

  function renderResult(container, result, suggestions, label) {
    if (!result) {
      container.innerHTML = `<p class="text-on-surface-variant font-sans text-base">Select valid CPU and GPU to see results.</p>`;
      return;
    }

    const meta = classify(result.top.value);
    const advice = buildAdvice(result)[0];
    const scoreBars = result.scores
      .map((item) => {
        const barMeta = item.key === "CPU" ? { bar: "bg-secondary", text: "text-secondary" } : item.key === "GPU" ? { bar: "bg-primary-container", text: "text-primary-container" } : item.key === "RAM" ? { bar: "bg-tertiary", text: "text-tertiary" } : { bar: "bg-outline", text: "text-outline" };
        return `<div class="flex flex-col gap-1.5">
          <div class="flex justify-between font-mono text-xs font-bold">
            <span class="text-on-surface">${item.key}${item.key === "CPU" ? ` (${shortName(result.cpu.name)})` : item.key === "GPU" ? ` (${shortName(result.gpu.name)})` : item.key === "RAM" ? ` (${result.ramAmount}GB)` : ""}</span>
            <span class="${barMeta.text}">${item.value}%</span>
          </div>
          <div class="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
            <div class="${barMeta.bar} h-full rounded-full" style="width:${item.value}%"></div>
          </div>
        </div>`;
      })
      .join("");

    const suggestionHtml = suggestions
      ? `<div class="mt-6 p-4 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface-variant">
          <p class="mb-2"><strong class="text-on-surface">Balanced pairing:</strong> With ${shortName(result.cpu.name)}, try ${shortName(suggestions.gpuForCpu || "")}. With ${shortName(result.gpu.name)}, try ${shortName(suggestions.cpuForGpu || "")}.</p>
          ${suggestions.upgrades.length ? `<p><strong class="text-on-surface">Upgrade shortlist:</strong> ${suggestions.upgrades.map((u) => u.name).join(", ")}</p>` : ""}
        </div>`
      : "";

    container.innerHTML = `
      <div class="result-panel">
        <div class="flex items-center justify-between mb-6 pl-2">
          <h2 class="text-xl font-semibold text-on-surface flex items-center gap-2">
            <span class="material-symbols-outlined material-symbols-filled text-primary-container text-xl">analytics</span>
            Analysis Results${label ? ` · ${label}` : ""}
          </h2>
          <span class="chip uppercase text-[10px]">Confidence: ${result.confidence.level}</span>
        </div>
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 bg-surface-container-low p-5 rounded-xl border border-outline-variant pl-3">
          <div>
            <span class="field-label tracking-widest">Bottleneck Risk</span>
            <div class="flex items-end gap-2 mt-1">
              <span class="text-4xl sm:text-5xl font-bold ${meta.text} leading-none">${result.top.value}%</span>
              <span class="font-mono text-xs font-bold ${meta.text} uppercase pb-1">${meta.label}</span>
            </div>
          </div>
          ${renderGauge(result.top.value, meta)}
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
            <span class="field-label">Est. Average FPS (${result.res.label})</span>
            <span class="font-mono text-2xl font-bold text-on-surface block mt-1">${result.predictedFps} FPS</span>
          </div>
          <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
            <span class="field-label">Est. 1% Lows (${result.res.label})</span>
            <span class="font-mono text-2xl font-bold text-on-surface block mt-1">${result.onePercentLow} FPS</span>
          </div>
        </div>
        <div class="flex-grow flex flex-col gap-4 mb-6">
          <h3 class="field-label border-b border-outline-variant pb-2 tracking-widest">Component Utilization Ceiling</h3>
          ${scoreBars}
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-auto">
          <div class="bg-surface-container-low border border-outline-variant p-4 rounded-xl">
            <h3 class="text-base font-semibold text-on-surface mb-2 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary-container text-lg">upgrade</span>
              Upgrade Signal
            </h3>
            <p class="text-sm text-on-surface-variant leading-relaxed">${advice.body}</p>
            <div class="inline-flex items-center gap-2 mt-4 chip">
              <span class="w-2 h-2 rounded-full bg-primary-container"></span>
              <span class="font-bold uppercase text-[10px]">${result.balanced ? "Optimal System Balance" : `${result.limiter}-Limited`}</span>
            </div>
          </div>
          <div class="bg-surface-container-low border border-outline-variant p-4 rounded-xl">
            <h3 class="text-base font-semibold text-on-surface mb-2 flex items-center gap-2">
              <span class="material-symbols-outlined text-on-surface-variant text-lg">help</span>
              Interpreting Data
            </h3>
            <ul class="text-sm text-on-surface-variant space-y-2">
              <li class="flex gap-2"><span class="text-primary-container">→</span> GPU near 99% means maximum graphical performance at this resolution.</li>
              <li class="flex gap-2"><span class="text-primary-container">→</span> High CPU + low GPU usage indicates a CPU bottleneck.</li>
              <li class="flex gap-2"><span class="text-primary-container">→</span> Large gaps between avg FPS and 1% lows suggest stutter.</li>
            </ul>
          </div>
        </div>
        ${suggestionHtml}
      </div>`;
  }

  function computeResult(inputs) {
    const cpu = window.CPU_DATA.find((item) => item.name === inputs.cpu);
    const gpu = window.GPU_DATA.find((item) => item.name === inputs.gpu);
    if (!cpu || !gpu) return null;

    const resKey = inputs.resolution;
    const res = resolutionProfiles[resKey];
    const purposeKey = inputs.purpose;
    const purpose = purposeProfiles[purposeKey];
    const ramAmount = Number(inputs.ramAmount);
    const ramSpeed = Number(inputs.ramSpeed);
    const storage = storageScores[inputs.storage];

    const cpuCeiling = getCpuCeiling(cpu, resKey, purposeKey);
    const gpuCeiling = getGpuCeiling(gpu, resKey, purposeKey, inputs.rt, inputs.upscaling);
    const predictedFps = Math.min(cpuCeiling, gpuCeiling);
    const maxCeiling = Math.max(cpuCeiling, gpuCeiling);
    const primaryGap = maxCeiling > 0 ? ((maxCeiling - predictedFps) / maxCeiling) * 100 : 0;
    const limiter = cpuCeiling < gpuCeiling ? "CPU" : "GPU";

    const cpuGap = clamp(cpuCeiling < gpuCeiling ? primaryGap : 0, 0, thresholds.maxGap);
    const gpuGap = clamp(gpuCeiling < cpuCeiling ? primaryGap : 0, 0, thresholds.maxGap);

    const ramHealth = getRamScore(ramAmount, ramSpeed, inputs.ramChannel, purposeKey);
    const ramPressure = clamp((100 - ramHealth) * purpose.ramMultiplier, 0, thresholds.maxGap);
    const storagePressure = clamp((100 - storage.score) * purpose.storageMultiplier, 0, thresholds.maxGap);

    const requiredVram = getRequiredVram(resKey, purposeKey);
    const vramPressure =
      gpu.vram >= requiredVram ? 0 : clamp(((requiredVram - gpu.vram) / requiredVram) * 100, 0, thresholds.maxGap);

    const scores = [
      { key: "CPU", value: Math.round(cpuGap), text: "The processor is likely to limit frame rate or frame pacing first." },
      {
        key: "GPU",
        value: Math.round(Math.max(gpuGap, vramPressure * 0.6)),
        text:
          vramPressure > gpuGap
            ? "The graphics card may lack VRAM for this resolution and workload, causing texture or stutter issues."
            : "The graphics card is likely to be the main performance limiter."
      },
      { key: "RAM", value: Math.round(ramPressure), text: "Memory capacity, speed, or channel config may cause stutter or weak multitasking." },
      { key: "Storage", value: Math.round(storagePressure), text: "Storage may affect load times, asset streaming, or open-world smoothness." }
    ].sort((a, b) => b.value - a.value);

    const top = scores[0];
    const state = classify(top.value);
    const balanced = top.value < thresholds.balanced;
    const onePercentLow = estimateOnePercentLow(predictedFps, limiter, cpu, gpu, ramPressure);
    const confidence = getConfidence(cpu, gpu, cpuCeiling, gpuCeiling, top.value);

    return {
      cpu,
      gpu,
      res,
      resKey,
      purpose,
      purposeKey,
      ramAmount,
      ramSpeed,
      ramChannel: inputs.ramChannel,
      storage,
      rt: inputs.rt,
      upscaling: inputs.upscaling,
      cpuCeiling,
      gpuCeiling,
      predictedFps: Math.round(predictedFps),
      onePercentLow,
      limiter,
      primaryGap: Math.round(primaryGap),
      scores,
      top,
      state,
      balanced,
      vramPressure,
      requiredVram,
      confidence
    };
  }

  function suggestBalancedPairing(inputs, result) {
    const resKey = inputs.resolution;
    const purposeKey = inputs.purpose;
    const targetFps = result.cpuCeiling;

    const gpuMatch = window.GPU_DATA.reduce((best, gpu) => {
      const ceiling = getGpuCeiling(gpu, resKey, purposeKey, inputs.rt, inputs.upscaling);
      const diff = Math.abs(ceiling - targetFps);
      if (!best || diff < best.diff) return { item: gpu, diff, ceiling };
      return best;
    }, null);

    const cpuMatch = window.CPU_DATA.reduce((best, cpu) => {
      const ceiling = getCpuCeiling(cpu, resKey, purposeKey);
      const diff = Math.abs(ceiling - result.gpuCeiling);
      if (!best || diff < best.diff) return { item: cpu, diff, ceiling };
      return best;
    }, null);

    const upgrades = [];
    if (result.limiter === "CPU") {
      const currentFps = result.cpu.cpuFps?.[resKey] ?? result.cpu.gameFps;
      const better = window.CPU_DATA.filter((c) => (c.cpuFps?.[resKey] ?? c.gameFps) > currentFps)
        .sort((a, b) => (a.cpuFps?.[resKey] ?? a.gameFps) - (b.cpuFps?.[resKey] ?? b.gameFps))
        .slice(0, 3);
      upgrades.push(...better.map((c) => ({ type: "CPU", name: c.name })));
    } else if (result.limiter === "GPU") {
      const better = window.GPU_DATA.filter((g) => g.fps[resKey] > result.gpu.fps[resKey])
        .sort((a, b) => a.fps[resKey] - b.fps[resKey])
        .slice(0, 3);
      upgrades.push(...better.map((g) => ({ type: "GPU", name: g.name })));
    }

    return {
      gpuForCpu: gpuMatch?.item?.name,
      cpuForGpu: cpuMatch?.item?.name,
      upgrades
    };
  }

  function buildAdvice(result) {
    const general = [
      {
        title: "Read the result correctly",
        body: "A bottleneck percentage estimates component mismatch for this workload, not exact FPS loss. Different games, drivers, and settings can shift the result."
      },
      {
        title: "Best next check",
        body: "Compare benchmark videos or reviews that use your resolution, target settings, and similar CPU/GPU pairing before buying parts."
      }
    ];

    const vramAdvice =
      result.vramPressure > 0
        ? {
            title: "VRAM warning",
            body: `${result.gpu.name} has ${result.gpu.vram} GB VRAM. For ${result.res.label} ${result.purpose.label}, ${result.requiredVram} GB is recommended. Lower texture settings or choose a card with more VRAM.`
          }
        : null;

    const specific = {
      CPU: {
        title: "CPU upgrade signal",
        body: "Prioritize CPU, platform, or faster memory if you play high-refresh esports, strategy, simulation, or heavily modded games. X3D chips excel in cache-sensitive titles."
      },
      GPU: {
        title: "GPU upgrade signal",
        body: "A stronger GPU, lower graphics settings, upscaling (DLSS/FSR/XeSS), or a lower resolution should have the biggest effect on average FPS."
      },
      RAM: {
        title: "RAM upgrade signal",
        body:
          result.ramAmount < 16
            ? "Move to at least 16 GB for modern gaming; 32 GB is safer for streaming, mods, and creator work."
            : result.ramChannel === "single"
              ? "Enable dual-channel memory (two matched sticks). Single-channel can cost 10-15% FPS in CPU-bound scenarios."
              : "Check background apps, EXPO/XMP profile, and whether 32 GB makes sense for your workload."
      },
      Storage: {
        title: "Storage upgrade signal",
        body: "Install active games on an SSD. NVMe is useful for large modern games, frequent loading, and asset-heavy open-world titles."
      }
    };

    const items = [specific[result.top.key]];
    if (vramAdvice) items.push(vramAdvice);
    return items.concat(general);
  }

  function readBuildForm(prefix) {
    const p = prefix || "";
    const cpuId = p ? p + "cpu" : "cpu";
    const gpuId = p ? p + "gpu" : "gpu";
    return {
      cpu: comboboxes[cpuId]?.getValue_() || document.getElementById(cpuId + "-hidden")?.value,
      gpu: comboboxes[gpuId]?.getValue_() || document.getElementById(gpuId + "-hidden")?.value,
      resolution: document.getElementById(p + "resolution").value,
      purpose: document.getElementById(p + "purpose").value,
      ramAmount: document.getElementById("ramAmount").value,
      ramSpeed: document.getElementById("ramSpeed").value,
      ramChannel: document.getElementById("ramChannel").value,
      storage: document.getElementById("storage").value,
      rt: document.getElementById("rt").value,
      upscaling: document.getElementById("upscaling").value
    };
  }

  function applyBuildForm(data, prefix) {
    const p = prefix || "";
    const cpuId = p ? p + "cpu" : "cpu";
    const gpuId = p ? p + "gpu" : "gpu";
    if (comboboxes[cpuId] && data.cpu) comboboxes[cpuId].setValue(data.cpu, false);
    if (comboboxes[gpuId] && data.gpu) comboboxes[gpuId].setValue(data.gpu, false);
    const set = (id, val) => {
      const el = document.getElementById(p + id);
      if (el && val != null) el.value = val;
    };
    set("resolution", data.resolution);
    set("purpose", data.purpose);
    if (!prefix) {
      set("ramAmount", data.ramAmount);
      set("ramSpeed", data.ramSpeed);
      set("ramChannel", data.ramChannel);
      set("storage", data.storage);
      set("rt", data.rt);
      set("upscaling", data.upscaling);
    }
    const compareEl = document.getElementById("compareMode");
    if (compareEl && data.compare != null) {
      compareEl.checked = data.compare === "1" || data.compare === true;
    }
  }

  function getDefaultState() {
    return { ...defaults, resolution: "1440p", purpose: "aaa", ramAmount: "16", ramSpeed: "3200", ramChannel: "dual", storage: "nvme3", rt: "off", upscaling: "off", compare: "0" };
  }

  function cleanIncomingStateUrl() {
    const params = new URLSearchParams(location.search);
    const hash = location.hash.slice(1);
    const hashParams = new URLSearchParams(hash.startsWith("calculator?") ? hash.slice("calculator?".length) : hash);
    const hasStateQuery = STATE_KEYS.some((key) => params.has(key));
    const hasStateHash = hash.includes("=") && STATE_KEYS.some((key) => hashParams.has(key));
    if (!hasStateQuery && !hasStateHash) return;

    STATE_KEYS.forEach((key) => {
      params.delete(key);
    });
    const query = params.toString();
    const cleanHash = hasStateHash || !location.hash ? "#calculator" : location.hash;
    history.replaceState(null, "", `${location.pathname}${query ? `?${query}` : ""}${cleanHash}`);
  }

  function resetCalculatorState() {
    applyBuildForm(getDefaultState(), "");
    cleanIncomingStateUrl();
  }

  function updateSeo(result) {
    if (!result) return;
    const title = `${result.cpu.name} + ${result.gpu.name} Bottleneck at ${result.res.label} | PC Bottleneck Calculator`;
    document.title = title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.content = `Estimate bottleneck for ${result.cpu.name} and ${result.gpu.name} at ${result.res.label}. ~${result.predictedFps} FPS avg, ${result.top.key} ${result.top.value}% risk.`;
    }
  }

  function runCalculation() {
    const buildA = readBuildForm("");
    const resultA = computeResult(buildA);
    const suggestions = resultA ? suggestBalancedPairing(buildA, resultA) : null;
    const compareOn = document.getElementById("compareMode").checked;

    if (compareOn) {
      const buildB = {
        ...buildA,
        cpu: comboboxes.bcpu?.getValue_() || document.getElementById("bcpu-hidden")?.value,
        gpu: comboboxes.bgpu?.getValue_() || document.getElementById("bgpu-hidden")?.value,
        resolution: document.getElementById("bresolution").value,
        purpose: document.getElementById("bpurpose").value
      };
      const resultB = computeResult(buildB);
      const winnerB = resultB && resultA && (resultB.top.value < resultA.top.value || (resultB.top.value === resultA.top.value && resultB.predictedFps > resultA.predictedFps));
      renderCompareCard(document.getElementById("compareBuildA"), resultA, "Build A", "Current", !winnerB);
      renderCompareCard(document.getElementById("compareBuildB"), resultB, "Build B", null, winnerB);
    } else {
      renderResult(document.getElementById("resultA"), resultA, suggestions, null);
    }
    updateSeo(resultA);

    track("calculate", { limiter: resultA?.limiter, gap: resultA?.top?.value, compare: compareOn });
  }

  function toggleCompareUI() {
    const on = document.getElementById("compareMode").checked;
    document.getElementById("buildBFields").hidden = !on;
    document.getElementById("resultPanel").hidden = on;
    document.getElementById("compareLayout").hidden = !on;
    runCalculation();
  }

  function initTheme() {
    const saved = localStorage.getItem(themeKey);
    applyTheme(saved === "dark" ? "dark" : "light");
  }

  function applyTheme(theme) {
    const next = theme === "dark" ? "dark" : "light";
    const isDark = next === "dark";
    document.documentElement.setAttribute("data-theme", next);
    const btn = document.getElementById("themeToggle");
    if (btn) {
      btn.textContent = isDark ? "Light mode" : "Dark mode";
      btn.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
      btn.setAttribute("aria-pressed", String(isDark));
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem(themeKey, next);
    track("theme_toggle", { theme: next });
  }

  const comboboxes = {};

  function initComboboxes() {
    const mk = (id, data, defaultVal, opts = {}) => {
      const container = document.getElementById(id + "-combo");
      if (!container) return;
      container.dataset.name = id;
      comboboxes[id] = new window.Combobox(container, {
        data,
        value: defaultVal,
        placeholder: "Type to search...",
        getLabel: opts.getLabel || ((item) => item.name),
        getValue: (item) => item.name,
        getBrand: opts.getBrand || ((item) => item.brand),
        onChange: () => {
          document.getElementById(id + "-hidden").value = comboboxes[id].getValue_();
          runCalculation();
        }
      });
      document.getElementById(id + "-hidden").value = comboboxes[id].getValue_();
    };
    const gpuOpts = {
      getLabel: (item) => `${item.name} (${item.vram} GB)`,
      getBrand: (item) => `${item.brand} · ${item.segment === "mobile" ? "Laptop" : "Desktop"}`
    };
    mk("cpu", window.CPU_DATA, defaults.cpu);
    mk("gpu", window.GPU_DATA, defaults.gpu, gpuOpts);
    mk("bcpu", window.CPU_DATA, defaults.cpu);
    mk("bgpu", window.GPU_DATA, defaults.gpu, gpuOpts);
  }

  function initPresets() {
    const container = document.getElementById("buildPresets");
    if (!container || !buildPresets) return;
    container.innerHTML = buildPresets
      .map(
        (p) =>
          `<button type="button" class="btn-secondary preset-btn" data-cpu="${p.cpu}" data-gpu="${p.gpu}" data-resolution="${p.resolution}" data-purpose="${p.purpose}">${p.label}</button>`
      )
      .join("");
    container.querySelectorAll(".preset-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        comboboxes.cpu?.setValue(btn.dataset.cpu, false);
        comboboxes.gpu?.setValue(btn.dataset.gpu, false);
        document.getElementById("cpu-hidden").value = btn.dataset.cpu;
        document.getElementById("gpu-hidden").value = btn.dataset.gpu;
        document.getElementById("resolution").value = btn.dataset.resolution;
        document.getElementById("purpose").value = btn.dataset.purpose;
        runCalculation();
        track("preset_apply", { label: btn.textContent });
      });
    });
  }

  function initPopularPairings() {
    const container = document.getElementById("popularPairings");
    if (!container || !window.POPULAR_PAIRINGS) return;
    container.innerHTML = window.POPULAR_PAIRINGS.map(
      (p) =>
        `<a class="pairing-link" href="build/${p.slug}/"><span>${p.cpu.split(" ").slice(-2).join(" ")} + ${p.gpu.split(" ").slice(-2).join(" ")}</span><small>${p.resolution} · ~${p.predicted} FPS · ${p.limiter}</small></a>`
    ).join("");
  }

  function initMobileNav() {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.getElementById("primaryNav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      nav.classList.toggle("hidden", !open);
      nav.classList.toggle("flex", open);
    });
  }

  function init() {
    validateDataset();
    initTheme();
    initMobileNav();
    initComboboxes();
    resetCalculatorState();
    toggleCompareUI();
    initPresets();
    initPopularPairings();
    document.getElementById("buildForm").addEventListener("input", runCalculation);
    document.getElementById("buildBFields")?.addEventListener("input", runCalculation);
    document.getElementById("compareMode")?.addEventListener("change", toggleCompareUI);
    document.getElementById("themeToggle")?.addEventListener("click", toggleTheme);
    runCalculation();
    track("page_load", {});
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
