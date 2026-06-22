/**
 * backfillWaveforms.mjs — re-encode legacy newline-text golden waveforms into
 * the packed "f32:" base64 format (and, with --decimate, decimate long ones).
 *
 *   node scripts/backfillWaveforms.mjs --dry-run     # report only, no writes
 *   node scripts/backfillWaveforms.mjs               # pack-only (grading unchanged)
 *   node scripts/backfillWaveforms.mjs --decimate    # also decimate long goldens
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_JSON in the environment (or in .env.local).
 *
 * NOTE: the encode/decimate helpers below mirror lib/waveformCodec.js and
 * lib/gradingUtils.js. They're inlined because those are ESM modules in a
 * CommonJS-default package and can't be imported from a plain `node` script.
 * Keep them in sync if the codec changes.
 */
import { appendFileSync } from "node:fs";
import nextEnv from "@next/env";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// ── codec mirror (see lib/waveformCodec.js) ──────────────────────────────────
const PACK_PREFIX = "f32:";
const MAX_GOLDEN_SAMPLES = 8192;

const isPacked = (s) => typeof s === "string" && s.startsWith(PACK_PREFIX);

const encodeWaveform = (nums) => {
  const f32 = Float32Array.from(nums || []);
  return PACK_PREFIX + Buffer.from(new Uint8Array(f32.buffer)).toString("base64");
};

const decodeWaveform = (str) => {
  if (!str) return [];
  if (str.startsWith(PACK_PREFIX)) {
    const bytes = new Uint8Array(Buffer.from(str.slice(PACK_PREFIX.length), "base64"));
    const f32 = new Float32Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 4));
    return Array.from(f32);
  }
  return str.trim().split("\n").map(parseFloat).filter((v) => !isNaN(v));
};

const decimate = (arr, D) => {
  if (!Array.isArray(arr) || D <= 1) return arr;
  const out = [];
  for (let i = 0; i < arr.length; i += D) out.push(arr[i]);
  return out;
};

const computeDecimation = (length, testType) => {
  if (testType === "signal") return 1;
  if (!Number.isFinite(length) || length <= MAX_GOLDEN_SAMPLES) return 1;
  return Math.ceil(length / MAX_GOLDEN_SAMPLES);
};

const nrmse = (user, expected) => {
  if (!user || !expected || user.length === 0) return Infinity;
  const n = Math.min(user.length, expected.length);
  let s = 0;
  for (let i = 0; i < n; i++) { const e = user[i] - expected[i]; s += e * e; }
  const rmse = Math.sqrt(s / n);
  const max = Math.max(...expected);
  const min = Math.min(...expected);
  const range = (max - min) || Math.max(Math.abs(max), Math.abs(min)) || 1;
  return (rmse / range) * 100;
};

const decimationError = (full, D) => {
  if (!Array.isArray(full) || D <= 1 || full.length === 0) return 0;
  const recon = full.map((_, i) => full[Math.min(Math.floor(i / D) * D, full.length - 1)]);
  return nrmse(recon, full);
};

// ── service-account credential (env or .env.local) ───────────────────────────
// Reuse Next's own env loader so multi-line / quoted values in .env.local are
// parsed exactly as `next dev` parses them (loadEnvConfig is on the default
// export under CJS interop).
const { loadEnvConfig } = nextEnv;

function loadServiceAccount() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    loadEnvConfig(process.cwd(), true);
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    console.error("FIREBASE_SERVICE_ACCOUNT_JSON is not set (env or .env.local). Aborting.");
    process.exit(1);
  }
  return JSON.parse(raw);
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const doDecimate = process.argv.includes("--decimate");

  if (!getApps().length) initializeApp({ credential: cert(loadServiceAccount()) });
  const db = getFirestore();

  // The write is irreversible (text → lossy Float32, optionally decimated), so
  // every original doc we touch is appended to a local JSONL backup first.
  const backupPath = dryRun ? null
    : new URL(`./backfill-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`, import.meta.url);

  const problems = await db.collection("Problems").get();
  let scanned = 0, converted = 0, skippedDigital = 0, skippedPacked = 0;
  let bytesBefore = 0, bytesAfter = 0;

  for (const p of problems.docs) {
    const data = p.data();
    const testType = (data.testType || (data.isDigital ? "digital" : "load")).trim();
    const sols = await p.ref.collection("solutionWaveform").get();

    for (const s of sols.docs) {
      scanned++;
      const sd = s.data();
      const samples = sd.samples || "";

      // Digital goldens stay as text (exact integer match); leave them alone.
      if (testType === "digital") { skippedDigital++; continue; }
      if (isPacked(samples)) { skippedPacked++; continue; }

      const points = decodeWaveform(samples);
      if (points.length === 0) continue;

      const D = doDecimate ? computeDecimation(points.length, testType) : 1;
      const packed = encodeWaveform(decimate(points, D));
      const update = {
        samples: packed,
        decimation: D,
        decimationError: doDecimate ? decimationError(points, D) : 0,
      };

      bytesBefore += Buffer.byteLength(samples, "utf8");
      bytesAfter += Buffer.byteLength(packed, "utf8");
      converted++;

      console.log(`${p.id}/${s.id}: ${points.length} samples, D=${D}, ` +
        `${Buffer.byteLength(samples)}→${Buffer.byteLength(packed)} bytes` +
        (dryRun ? "  (dry-run)" : ""));

      if (!dryRun) {
        // Save the original before overwriting it.
        appendFileSync(backupPath, JSON.stringify({ problemId: p.id, key: s.id, before: sd }) + "\n");
        await s.ref.set(update, { merge: true });
      }
    }
  }

  console.log("\n──────── summary ────────");
  console.log(`scanned: ${scanned}  converted: ${converted}  ` +
    `skipped(digital): ${skippedDigital}  skipped(already packed): ${skippedPacked}`);
  if (converted) {
    const pct = (100 * (1 - bytesAfter / bytesBefore)).toFixed(1);
    console.log(`size: ${bytesBefore} → ${bytesAfter} bytes (${pct}% smaller)` +
      (dryRun ? "  [dry-run, nothing written]" : ""));
  }
  if (backupPath && converted) console.log(`backup written: ${backupPath.pathname}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
