/**
 * Split train.jsonl for RunPod Jupyter upload (6 MB limit per file).
 *
 * Usage:
 *   node scripts/split-training-jsonl.js train.jsonl
 *   → train.jsonl.part001, train.jsonl.part002, ...
 *
 * On Pod after uploading all parts:
 *   cat train.jsonl.part* > train.jsonl
 *   python3 -c "import json; n=sum(1 for l in open('train.jsonl') if l.strip() and json.loads(l)); print('OK', n)"
 */

import fs from "fs";
import path from "path";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB — under Jupyter 6 MB cap
const inputPath = path.resolve(process.cwd(), process.argv[2] || "train.jsonl");

if (!fs.existsSync(inputPath)) {
  console.error(`Not found: ${inputPath}`);
  process.exit(1);
}

const raw = fs.readFileSync(inputPath, "utf8");
const lines = raw.split("\n").filter((l) => l.trim());

let part = 1;
let chunk = [];
let chunkBytes = 0;
const written = [];

function flush() {
  if (!chunk.length) return;
  const name = `${inputPath}.part${String(part).padStart(3, "0")}`;
  fs.writeFileSync(name, chunk.join("\n") + "\n", "utf8");
  const size = fs.statSync(name).size;
  written.push({ name: path.basename(name), lines: chunk.length, bytes: size });
  console.log(`Wrote ${path.basename(name)} — ${chunk.length} lines, ${size} bytes`);
  part++;
  chunk = [];
  chunkBytes = 0;
}

for (const line of lines) {
  const lineBytes = Buffer.byteLength(line + "\n", "utf8");
  if (chunk.length && chunkBytes + lineBytes > MAX_BYTES) flush();
  chunk.push(line);
  chunkBytes += lineBytes;
}
flush();

console.log(`\nSplit ${lines.length} records into ${written.length} part(s).`);
console.log("\nUpload ALL parts to /workspace on RunPod, then:");
console.log(`  cat ${path.basename(inputPath)}.part* > ${path.basename(inputPath)}`);
console.log("  rm -f train.jsonl.part*");
