import { NextResponse } from "next/server";
import { adminDb, FieldValue } from "@/lib/firebaseAdmin";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { gradingUtils } from "@/lib/gradingUtils";
import { signalUtils } from "@/lib/signalUtils";

function extractDataPoints(text) {
  if (!text) return [];
  return text.trim().split("\n")
    .filter(line => line.trim() && !line.startsWith("#"))
    .map(line => parseFloat(line.trim()))
    .filter(val => !isNaN(val));
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      problemId,
      testType,
      testKey,
      topics = [],
      testbench = {},
      userId,
      capturedData,
    } = body;

    // C2: validate required fields
    if (!problemId || !testType || !testKey || !capturedData) {
      return NextResponse.json(
        { error: "Missing required fields: problemId, testType, testKey, capturedData" },
        { status: 400 }
      );
    }
    if (!["load", "signal", "digital"].includes(testType)) {
      return NextResponse.json({ error: `Invalid testType: "${testType}"` }, { status: 400 });
    }
    if (!["test1", "test2", "test3"].includes(testKey)) {
      return NextResponse.json({ error: `Invalid testKey: "${testKey}"` }, { status: 400 });
    }
    if (testType === "digital" && !Array.isArray(capturedData.table)) {
      return NextResponse.json(
        { error: "capturedData.table must be an array for digital type" },
        { status: 400 }
      );
    }
    if (testType !== "digital" && (!Array.isArray(capturedData.output) || !Array.isArray(capturedData.input))) {
      return NextResponse.json(
        { error: "capturedData.output and .input must be arrays for analog types" },
        { status: 400 }
      );
    }

    // C1: fetch problem and solution using the regular client SDK (works in dev
    // without a service account). Admin SDK is only used for the privileged write.
    const problemSnap = await getDoc(doc(db, "Problems", problemId));
    if (!problemSnap.exists()) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    const solutionSnap = await getDocs(collection(db, "Problems", problemId, "solutionWaveform"));
    const solutionsMap = {};
    solutionSnap.forEach(d => {
      solutionsMap[d.id] = d.data().samples || "";
    });

    // C1: grade server-side
    let testResult;

    if (testType === "digital") {
      const userTable = capturedData.table;
      const goldenTable = (solutionsMap[testKey] || "").trim().split("\n")
        .map(val => ({ decimalOutput: parseInt(val.trim(), 10) }));
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
      const solOutData = extractDataPoints(solutionsMap[solKey] || "");
      const nrmse = gradingUtils.calculateNormalizedRMSE(userVout, solOutData);
      const verdict = gradingUtils.getVerdict(nrmse, topics, false);
      const targetBode = signalUtils.getFrequencyData(userVin, solOutData, sampleRate);
      const userBode = signalUtils.getFrequencyData(userVin, userVout, sampleRate);
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

    // C1: write UserProgress via Admin SDK (privileged, can't be forged by the client).
    // Falls back gracefully in dev when FIREBASE_SERVICE_ACCOUNT_JSON is not set.
    let isCompleted = false;
    if (userId && testResult.verdict?.passed) {
      if (adminDb) {
        const isSignalType = testType === "signal";
        const requiredTests = isSignalType ? ["test1"] : ["test1", "test2", "test3"];
        const progressRef = adminDb.collection("UserProgress").doc(`${userId}_${problemId}`);
        const progressSnap = await progressRef.get();
        const passedTests = {
          ...(progressSnap.exists ? (progressSnap.data().passedTests || {}) : {}),
          [testKey]: true,
        };
        isCompleted = requiredTests.every(k => passedTests[k]);
        await progressRef.set({
          userId,
          problemId,
          passedTests,
          status: isCompleted ? "completed" : "in_progress",
          ...(isCompleted ? { completedAt: FieldValue.serverTimestamp(), score: 100 } : {}),
        }, { merge: true });
      } else {
        // Dev fallback: report completion to the UI but skip the Firestore write.
        // Add FIREBASE_SERVICE_ACCOUNT_JSON to .env.local to persist progress.
        const isSignalType = testType === "signal";
        const requiredTests = isSignalType ? ["test1"] : ["test1", "test2", "test3"];
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
