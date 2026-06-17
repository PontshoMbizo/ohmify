import { NextResponse } from "next/server";
import { adminDb, adminAuth, FieldValue } from "@/lib/firebaseAdmin";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { gradingUtils } from "@/lib/gradingUtils";
import { signalUtils } from "@/lib/signalUtils";

// firebase-admin requires the Node.js runtime — never let this route be
// promoted to the Edge runtime.
export const runtime = "nodejs";

// Hard caps so a hostile payload can't make the FFT/NRMSE loops chew CPU.
const MAX_ANALOG_SAMPLES = 200_000;
const MAX_DIGITAL_ROWS = 10_000;
// Allowed relative drift between the user's capture rate and the stored
// solution rate before we refuse to compare waveforms sample-by-sample.
const SAMPLE_RATE_TOLERANCE = 0.05;

// In-memory sliding-window rate limiter, keyed by verified uid or client IP.
// Resets on server restart. On serverless (Vercel) this is per-instance and
// therefore best-effort: at hobby-tier traffic requests usually land on one
// warm instance, so it still catches rapid-fire abuse. If real abuse appears
// or the app scales to many instances, swap for Upstash Redis (free tier) —
// keep this function's signature and only change its internals.
const _rateLimitMap = new Map();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 15;
function checkRateLimit(key) {
  const now = Date.now();
  // Opportunistic pruning so the map can't grow unbounded.
  if (_rateLimitMap.size > 5_000) {
    for (const [k, times] of _rateLimitMap) {
      if (times.every(t => now - t >= RATE_WINDOW_MS)) _rateLimitMap.delete(k);
    }
  }
  const times = (_rateLimitMap.get(key) || []).filter(t => now - t < RATE_WINDOW_MS);
  if (times.length >= RATE_MAX) return false;
  _rateLimitMap.set(key, [...times, now]);
  return true;
}

// Extract and verify the Firebase ID token from the Authorization header.
// With Admin SDK: cryptographic verification — uid is trustworthy.
// Without Admin SDK: an unverified decode is only acceptable in development.
// In production a missing Admin SDK means we treat everyone as anonymous
// rather than trusting a forgeable token.
async function getUserIdFromRequest(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);

  if (adminAuth) {
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      return decoded.uid;
    } catch {
      return null;
    }
  }

  if (process.env.NODE_ENV === "production") {
    console.error("[grade] Admin SDK not configured in production — refusing unverified tokens.");
    return null;
  }

  // Dev fallback: decode without signature verification.
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.user_id || payload.sub || null;
  } catch {
    return null;
  }
}

function extractDataPoints(text) {
  if (!text) return [];
  return text.trim().split("\n")
    .filter(line => line.trim() && !line.startsWith("#"))
    .map(line => parseFloat(line.trim()))
    .filter(val => !isNaN(val));
}

// Per-instance TTL cache for problem + solution docs. Solution waveforms are
// ~30k-line strings; re-reading them from Firestore on every submission is the
// single biggest read cost in the app. Problems are immutable after publish in
// practice, so a short TTL is safe. On serverless this only helps warm
// instances — which is exactly where repeated submissions land.
const _problemCache = new Map();
const CACHE_TTL_MS = 5 * 60_000;
const CACHE_MAX_ENTRIES = 50;

// Fetch the problem doc and its solutionWaveform subcollection.
// Prefers the Admin SDK (bypasses rules, single trust path); falls back to
// the client SDK for local development without a service account.
async function fetchProblemAndSolutions(problemId) {
  const cached = _problemCache.get(problemId);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

  const value = await _fetchProblemAndSolutionsUncached(problemId);
  // Don't cache misses (problem may be mid-publish); cap the cache size.
  if (value.problem) {
    if (_problemCache.size >= CACHE_MAX_ENTRIES) {
      const oldest = _problemCache.keys().next().value;
      _problemCache.delete(oldest);
    }
    _problemCache.set(problemId, { at: Date.now(), value });
  }
  return value;
}

async function _fetchProblemAndSolutionsUncached(problemId) {
  const solutions = {};
  if (adminDb) {
    const pSnap = await adminDb.collection("Problems").doc(problemId).get();
    if (!pSnap.exists) return { problem: null, solutions };
    const sSnap = await adminDb.collection("Problems").doc(problemId).collection("solutionWaveform").get();
    sSnap.forEach(d => { solutions[d.id] = d.data(); });
    return { problem: pSnap.data(), solutions };
  }
  const pSnap = await getDoc(doc(db, "Problems", problemId));
  if (!pSnap.exists()) return { problem: null, solutions };
  const sSnap = await getDocs(collection(db, "Problems", problemId, "solutionWaveform"));
  sSnap.forEach(d => { solutions[d.id] = d.data(); });
  return { problem: pSnap.data(), solutions };
}

export async function POST(request) {
  try {
    // Authenticate first — userId comes from the verified token, never the body.
    const verifiedUid = await getUserIdFromRequest(request);

    const body = await request.json();
    const { problemId, testKey, capturedData } = body;

    // Rate-limit everyone: verified users by uid, anonymous users by IP.
    const rateKey = verifiedUid
      || `ip:${request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"}`;
    if (!checkRateLimit(rateKey)) {
      return NextResponse.json(
        { error: "Too many submissions. Wait a minute and try again." },
        { status: 429 }
      );
    }

    // Validate required fields.
    if (!problemId || typeof problemId !== "string" || !testKey || !capturedData) {
      return NextResponse.json(
        { error: "Missing required fields: problemId, testKey, capturedData" },
        { status: 400 }
      );
    }
    if (!["test1", "test2", "test3"].includes(testKey)) {
      return NextResponse.json({ error: `Invalid testKey: "${testKey}"` }, { status: 400 });
    }

    // Fetch problem + solutions server-side. testType, topics and testbench
    // are read from the problem document — NEVER from the request body, where
    // a client could substitute lenient values to lower its own bar.
    const { problem, solutions: solutionsMap } = await fetchProblemAndSolutions(problemId);
    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    const testType = problem.testType?.trim() || (problem.isDigital ? "digital" : "load");
    const topics = Array.isArray(problem.topics) ? problem.topics : [];
    const testbench = problem.testbench || {};

    if (!["load", "signal", "digital"].includes(testType)) {
      console.error(`[grade] Problem ${problemId} has invalid testType "${testType}"`);
      return NextResponse.json(
        { error: "Problem is misconfigured (invalid testType). Contact the problem creator." },
        { status: 500 }
      );
    }

    // Shape validation, now that the authoritative testType is known.
    if (testType === "digital") {
      if (!Array.isArray(capturedData.table)) {
        return NextResponse.json(
          { error: "capturedData.table must be an array for digital problems" },
          { status: 400 }
        );
      }
      if (capturedData.table.length > MAX_DIGITAL_ROWS) {
        return NextResponse.json(
          { error: `capturedData.table exceeds the maximum of ${MAX_DIGITAL_ROWS} rows` },
          { status: 400 }
        );
      }
    } else {
      if (!Array.isArray(capturedData.output) || !Array.isArray(capturedData.input)) {
        return NextResponse.json(
          { error: "capturedData.output and .input must be arrays for analog problems" },
          { status: 400 }
        );
      }
      if (capturedData.output.length > MAX_ANALOG_SAMPLES || capturedData.input.length > MAX_ANALOG_SAMPLES) {
        return NextResponse.json(
          { error: `capturedData arrays exceed the maximum of ${MAX_ANALOG_SAMPLES} samples` },
          { status: 400 }
        );
      }
      // Reject non-finite values that would break FFT / NRMSE.
      const allFinite = (arr) => arr.every(v => typeof v === "number" && isFinite(v));
      if (!allFinite(capturedData.output) || !allFinite(capturedData.input)) {
        return NextResponse.json(
          { error: "capturedData arrays must contain only finite numbers" },
          { status: 400 }
        );
      }
    }

    // Grade server-side.
    let testResult;

    if (testType === "digital") {
      const userTable = capturedData.table;
      const goldenValues = (solutionsMap[testKey]?.samples || "").trim().split("\n")
        .map(val => parseInt(val.trim(), 10))
        .filter(Number.isFinite);

      // Guard against a missing or malformed solution doc — surface a clear
      // message so the creator knows to fix the problem, not the user.
      if (goldenValues.length === 0) {
        console.error(`[grade] Empty digital solution for problem ${problemId} key ${testKey}`);
        return NextResponse.json(
          { error: "Solution data is missing or malformed. Contact the problem creator." },
          { status: 500 }
        );
      }

      const goldenTable = goldenValues.map(v => ({ decimalOutput: v }));
      const grade = gradingUtils.gradeDigital(userTable, goldenTable);
      const verdict = gradingUtils.getVerdict(grade.matchRatio, topics, true);
      testResult = {
        type: "digital",
        table: grade.details,
        verdict: { ...verdict, matchRatio: grade.matchRatio },
        summary: { total: grade.totalCycles, correct: grade.correctCount },
      };
    } else {
      const { output: userVout = [], input: userVin = [], timeLabels = [], sampleRate = 1 } = capturedData;
      const resistanceMap = {
        test1: testbench.noload || 1e12,
        test2: testbench.maxload || 1,
        test3: testbench.minload || 1,
      };
      const activeResistance = Number(resistanceMap[testKey]);
      const solKey = testType === "signal" ? "test1" : testKey;
      const solutionDoc = solutionsMap[solKey] || {};
      const solOutData = extractDataPoints(solutionDoc.samples || "");

      if (solOutData.length === 0) {
        console.error(`[grade] Empty solution data for problem ${problemId} key ${solKey}`);
        return NextResponse.json(
          { error: "Solution data is missing or malformed. Contact the problem creator." },
          { status: 500 }
        );
      }

      // A submission shorter than the solution would only be compared over its
      // own length — matching the first N samples would be enough to pass.
      // Require a full-length capture.
      if (userVout.length < solOutData.length) {
        return NextResponse.json(
          { error: `Capture too short: got ${userVout.length} samples, expected at least ${solOutData.length}. Reset the simulator and capture the full window.` },
          { status: 400 }
        );
      }

      // Comparing sample-by-sample is meaningless if the user's simulator runs
      // at a different time step than the one the solution was captured with.
      const storedRate = Number(solutionDoc.sampleRate);
      const userRate = Number(sampleRate);
      if (isFinite(storedRate) && storedRate > 0 && isFinite(userRate) && userRate > 0) {
        const drift = Math.abs(userRate - storedRate) / storedRate;
        if (drift > SAMPLE_RATE_TOLERANCE) {
          return NextResponse.json(
            { error: "Simulation time step doesn't match this problem's reference. Reset the circuit template (which restores the correct time step) and capture again." },
            { status: 400 }
          );
        }
      }

      const nrmse = gradingUtils.calculateNormalizedRMSE(userVout, solOutData);
      const verdict = gradingUtils.getVerdict(nrmse, topics, false);
      const targetBode = signalUtils.getFrequencyData(userVin, solOutData, userRate);
      const userBode = signalUtils.getFrequencyData(userVin, userVout, userRate);
      testResult = {
        type: "analog",
        isSignalOnly: testType === "signal",
        resistance: activeResistance,
        timeLabels,
        userData: userVout,
        solutionData: solOutData,
        verdict: { ...verdict, nrmse },
        freqLabels: targetBode.freq,
        userSpectrum: userBode.outputSpectrum,
        solutionSpectrum: targetBode.outputSpectrum,
        userBodeMag: userBode.bodeMag,
        userBodePhase: userBode.bodePhase,
        solutionBodeMag: targetBode.bodeMag,
        solutionBodePhase: targetBode.bodePhase,
      };
    }

    // Write UserProgress via Admin SDK. uid comes from verified token only.
    let isCompleted = false;
    if (verifiedUid && testResult.verdict?.passed) {
      const isSignalType = testType === "signal";
      const requiredTests = isSignalType ? ["test1"] : ["test1", "test2", "test3"];
      if (adminDb) {
        const progressRef = adminDb.collection("UserProgress").doc(`${verifiedUid}_${problemId}`);
        const progressSnap = await progressRef.get();
        const passedTests = {
          ...(progressSnap.exists ? (progressSnap.data().passedTests || {}) : {}),
          [testKey]: true,
        };
        isCompleted = requiredTests.every(k => passedTests[k]);
        await progressRef.set({
          userId: verifiedUid,
          problemId,
          passedTests,
          status: isCompleted ? "completed" : "in_progress",
          ...(isCompleted ? { completedAt: FieldValue.serverTimestamp(), score: 100 } : {}),
        }, { merge: true });
      } else {
        // Dev fallback: no Admin SDK — progress is not persisted.
        isCompleted = testKey === requiredTests[requiredTests.length - 1];
        console.warn("[grade] Admin SDK not configured — progress not persisted.");
      }
    }

    return NextResponse.json({ testResult, isCompleted });
  } catch (err) {
    console.error("Grade API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
