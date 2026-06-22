/**
 * waveformCodec.js
 *
 * Shared, isomorphic (server + browser) codec for golden waveform storage.
 *
 * Goldens used to be stored as a newline-delimited *text* string of floats —
 * ~10-18 bytes per sample, re-parsed on every grade, and growing linearly with
 * capture length. This packs them as a base64-encoded Float32Array (~5.3 bytes
 * per sample) behind an "f32:" marker, and supports decimating long captures so
 * storage and the NRMSE/FFT loops don't scale with how long the sim ran.
 *
 * Backward compatible: `decodeWaveform` transparently reads the legacy text
 * format, so existing problems keep working until (optionally) backfilled.
 */

// Marks a packed payload. ":" is outside the base64 alphabet (A-Za-z0-9+/=) and
// never begins a legacy float-text string, so prefix-sniffing is unambiguous.
const PACK_PREFIX = "f32:";

// Target ceiling for a stored golden. Captures longer than this are decimated
// by a stride so the reference (and the grade-time compare) stays bounded. A
// power of two suits the radix-2 FFT in signalUtils.
const MAX_GOLDEN_SAMPLES = 8192;

// ── base64 ⇄ bytes, working in both Node (Buffer) and the browser (atob/btoa) ──

function bytesToBase64(bytes) {
  if (typeof Buffer !== "undefined") return Buffer.from(bytes).toString("base64");
  // Chunk to avoid blowing the call stack on String.fromCharCode(...bigArray).
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

function base64ToBytes(b64) {
  // Copy into a fresh Uint8Array (offset 0) so the Float32Array view below is
  // 4-byte aligned and never points into a pooled Buffer's backing store.
  if (typeof Buffer !== "undefined") return new Uint8Array(Buffer.from(b64, "base64"));
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Pack an array of numbers into an "f32:"-prefixed base64 string.
 * Float32 is plenty: grading thresholds are 5-30% NRMSE, far above its ~1e-6
 * relative precision. Assumes little-endian (true on every platform we run on).
 */
export function encodeWaveform(numbers) {
  const f32 = Float32Array.from(numbers || []);
  return PACK_PREFIX + bytesToBase64(new Uint8Array(f32.buffer));
}

/**
 * Decode either the packed ("f32:") form or the legacy newline-text form into a
 * plain number[]. Empty / nullish input → [].
 */
export function decodeWaveform(str) {
  if (!str) return [];
  if (str.startsWith(PACK_PREFIX)) {
    const bytes = base64ToBytes(str.slice(PACK_PREFIX.length));
    const f32 = new Float32Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 4));
    return Array.from(f32);
  }
  return str.trim().split("\n").map(parseFloat).filter(v => !isNaN(v));
}

/** True if a stored samples string is in the packed format. */
export function isPacked(str) {
  return typeof str === "string" && str.startsWith(PACK_PREFIX);
}

/** Keep every Dth sample (stride decimation). D<=1 returns the array unchanged. */
export function decimate(arr, D) {
  if (!Array.isArray(arr) || D <= 1) return arr;
  const out = [];
  for (let i = 0; i < arr.length; i += D) out.push(arr[i]);
  return out;
}

/**
 * Choose a decimation factor for a golden of the given length.
 * - signal problems keep full resolution (1) — their grading is spectral and
 *   decimation would lower the Nyquist / distort the Bode comparison.
 * - otherwise decimate only when the capture exceeds MAX_GOLDEN_SAMPLES.
 */
export function computeDecimation(length, testType) {
  if (testType === "signal") return 1;
  if (!Number.isFinite(length) || length <= MAX_GOLDEN_SAMPLES) return 1;
  return Math.ceil(length / MAX_GOLDEN_SAMPLES);
}

export const waveformCodec = {
  encodeWaveform,
  decodeWaveform,
  isPacked,
  decimate,
  computeDecimation,
  PACK_PREFIX,
  MAX_GOLDEN_SAMPLES,
};
