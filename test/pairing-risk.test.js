"use strict";

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

global.window = global;
global.document = { readyState: "loading", addEventListener() {} };
global.__BOTTLENECK_TEST__ = true;

await import(`file://${path.join(root, "data/config.js").replace(/\\/g, "/")}`);
await import(`file://${path.join(root, "assets/app.js").replace(/\\/g, "/")}`);

const { computeResult, buildAdvice, isSecondResultBetter } = global.__BOTTLENECK_TEST_API__;

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) passed++;
  else {
    failed++;
    console.error("FAIL:", message);
  }
}

function inputs(overrides = {}) {
  return {
    cpu: "Matched CPU",
    gpu: "Matched GPU",
    resolution: "1440p",
    purpose: "aaa",
    ramAmount: "8",
    ramSpeed: "2133",
    ramChannel: "single",
    storage: "hdd",
    rt: "off",
    upscaling: "off",
    ...overrides
  };
}

function installFixtures(cpuFps, gpuFps, gpuVram = 12) {
  global.CPU_DATA = [
    {
      name: "Matched CPU",
      gameFps: cpuFps,
      cpuFps: { "1080p": cpuFps, "1440p": cpuFps, "4k": cpuFps, ultrawide: cpuFps },
      low1Ratio: 0.75,
      sampleCount: 10,
      lastVerified: CONFIG.dataLastReviewed
    }
  ];
  global.GPU_DATA = [
    {
      name: "Matched GPU",
      brand: "NVIDIA",
      vram: gpuVram,
      fps: { "1080p": gpuFps, "1440p": gpuFps, "4k": gpuFps, ultrawide: gpuFps },
      low1Ratio: 0.75,
      sampleCount: 10,
      lastVerified: CONFIG.dataLastReviewed
    }
  ];
}

function testMatchedPairIgnoresSecondaryPressure() {
  installFixtures(100, 100);
  const result = computeResult(inputs());
  const advice = buildAdvice(result)[0];

  assert(result.primaryGap === 0, "exact CPU/GPU match has zero pairing gap");
  assert(result.balanced, "exact CPU/GPU match is balanced despite low RAM and slow storage");
  assert(result.state.label === "Optimal", "exact CPU/GPU match gets the optimal pairing classification");
  assert(advice.title === "Balanced pairing", "secondary pressure does not create a pairing upgrade priority");
}

function testCpuLimitedPairing() {
  installFixtures(70, 100);
  const result = computeResult(inputs({ ramAmount: "32", ramSpeed: "6000", ramChannel: "dual", storage: "nvme4" }));

  assert(result.limiter === "CPU", "slower CPU is the pairing limiter");
  assert(result.primaryGap === 30, "CPU-limited pairing uses the CPU/GPU gap");
  assert(!result.balanced && result.state.label === "High", "CPU-limited pairing is classified from its primary gap");
}

function testSecondaryWarningsDoNotDrivePairingDecisions() {
  installFixtures(70, 100);
  const result = computeResult(inputs());
  const warnings = result.secondaryHealth.filter((item) => item.warning).map((item) => item.key);
  const advice = buildAdvice(result)[0];
  const healthierButWorsePairing = { primaryGap: 40, predictedFps: 200 };

  assert(warnings.includes("RAM"), "low RAM remains a secondary health warning");
  assert(warnings.includes("Storage"), "slow storage remains a secondary health warning");
  assert(result.limiter === "CPU", "secondary warnings do not replace the CPU pairing limiter");
  assert(advice.title === "CPU upgrade signal", "upgrade selection follows the CPU/GPU limiter");
  assert(!isSecondResultBetter(result, healthierButWorsePairing), "comparison winner follows primary gap before FPS");
}

testMatchedPairIgnoresSecondaryPressure();
testCpuLimitedPairing();
testSecondaryWarningsDoNotDrivePairingDecisions();

delete global.__BOTTLENECK_TEST_API__;
delete global.__BOTTLENECK_TEST__;

console.log(`\nPairing risk: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
