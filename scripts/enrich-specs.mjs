/**
 * Enrich CSV specs from Wikidata (CC0). Never overwrites fps/low1Ratio/source fields.
 * Run: node scripts/enrich-specs.mjs [--dry-run]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseCsv, toCsv } from "./lib/csv.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dryRun = process.argv.includes("--dry-run");

const PROTECTED = new Set([
  "fps1080p", "fps1440p", "fps4k", "fpsUltrawide", "low1Ratio", "source", "sampleCount", "lastVerified", "tier"
]);

async function queryWikidata(names) {
  const values = names.map((n) => `"${n.replace(/"/g, '\\"')}"`).join(" ");
  const sparql = `
SELECT ?label ?cores ?threads ?vram ?inception WHERE {
  VALUES ?label { ${values} }
  ?item rdfs:label ?label .
  FILTER(LANG(?label) = "en")
  OPTIONAL { ?item wdt:P1141 ?cores . }
  OPTIONAL { ?item wdt:P1142 ?threads . }
  OPTIONAL { ?item wdt:P1149 ?vram . }
  OPTIONAL { ?item wdt:P571 ?inception . }
}
LIMIT 200`;

  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparql)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/sparql-results+json", "User-Agent": "BottleneckCalculator/3.0" }
  });
  if (!res.ok) throw new Error(`Wikidata HTTP ${res.status}`);
  const json = await res.json();
  const map = new Map();
  for (const b of json.results.bindings) {
    const label = b.label?.value;
    if (!label) continue;
    map.set(label, {
      cores: b.cores?.value ? Number(b.cores.value) : null,
      threads: b.threads?.value ? Number(b.threads.value) : null,
      vram: b.vram?.value ? Number(b.vram.value) : null,
      year: b.inception?.value ? Number(b.inception.value.slice(0, 4)) : null
    });
  }
  return map;
}

function enrichRows(rows, wikidata, specFields) {
  let updated = 0;
  for (const row of rows) {
    const wd = wikidata.get(row.name);
    if (!wd) continue;
    for (const [field, wdField] of specFields) {
      if (PROTECTED.has(field)) continue;
      const val = wd[wdField];
      if (val != null && val !== "" && (!row[field] || row[field] === "")) {
        row[field] = String(val);
        updated++;
      }
    }
  }
  return updated;
}

async function main() {
  const cpuPath = path.join(root, "data/sources/cpus.csv");
  const gpuPath = path.join(root, "data/sources/gpus.csv");
  const cpuRows = parseCsv(fs.readFileSync(cpuPath, "utf8"));
  const gpuRows = parseCsv(fs.readFileSync(gpuPath, "utf8"));
  const allNames = [...cpuRows.map((r) => r.name), ...gpuRows.map((r) => r.name)];

  let wikidata = new Map();
  try {
    wikidata = await queryWikidata(allNames.slice(0, 50));
    console.log(`Wikidata returned ${wikidata.size} matches (batch of 50)`);
  } catch (err) {
    console.warn("Wikidata enrichment skipped:", err.message);
    return;
  }

  const cpuUpdated = enrichRows(cpuRows, wikidata, [
    ["cores", "cores"],
    ["threads", "threads"],
    ["year", "year"]
  ]);
  const gpuUpdated = enrichRows(gpuRows, wikidata, [
    ["vram", "vram"],
    ["year", "year"]
  ]);

  if (dryRun) {
    console.log(`Dry run: would update ${cpuUpdated + gpuUpdated} fields`);
    return;
  }

  const cpuHeaders = Object.keys(cpuRows[0]);
  const gpuHeaders = Object.keys(gpuRows[0]);
  fs.writeFileSync(cpuPath, toCsv(cpuRows, cpuHeaders));
  fs.writeFileSync(gpuPath, toCsv(gpuRows, gpuHeaders));
  console.log(`Enriched ${cpuUpdated + gpuUpdated} spec fields from Wikidata`);
}

main().catch((err) => {
  console.warn("Enrichment failed (non-fatal):", err.message);
  process.exit(0);
});
