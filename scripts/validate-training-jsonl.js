/**
 * Validate train JSONL before RunPod training.
 * Usage: node scripts/validate-training-jsonl.js [path]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.resolve(process.cwd(), process.argv[2] || "train.jsonl");

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const raw = fs.readFileSync(filePath, "utf8");
const { size } = fs.statSync(filePath);
const lines = raw.split("\n").filter((l) => l.trim());

let valid = 0;
const types = {};
let badLine = null;

for (let i = 0; i < lines.length; i++) {
  try {
    const obj = JSON.parse(lines[i]);
    valid++;
    const t = obj._export_type || "unknown";
    types[t] = (types[t] || 0) + 1;
    if (!Array.isArray(obj.messages) || obj.messages.length < 3) {
      throw new Error("messages array too short");
    }
  } catch (err) {
    badLine = { index: i + 1, message: err.message, chars: lines[i].length };
    break;
  }
}

console.log(`File: ${filePath}`);
console.log(`Bytes: ${size}`);
console.log(`Lines: ${lines.length}`);
console.log(`Valid: ${valid}`);
console.log(`Types: ${JSON.stringify(types)}`);

if (badLine) {
  console.error(`INVALID at line ${badLine.index}: ${badLine.message} (${badLine.chars} chars)`);
  process.exit(1);
}

console.log("\nOK — safe to train. Do not open JSONL in Jupyter JSON viewer (JSONL ≠ single JSON file).");
