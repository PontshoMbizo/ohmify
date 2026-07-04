"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import LoadingAnimation from "@/components/LoadingAnimation";
import { useAuth } from "@/components/Auth/AuthProvider";

// ssr: false because Chart.js requires a browser environment
const Results = dynamic(() => import("./Results"), {
  ssr: false,
  loading: () => <LoadingAnimation />
});

// Shape an analog capture into the request payload the grade API expects.
// topics / testType / testbench are intentionally omitted — the server reads
// them from the problem document so a client can't substitute lenient values.
const buildAnalogPayload = (data) => ({
  output: data.data?.output || [],
  input: data.data?.input || [],
  timeLabels: data.timeLabels,
  sampleRate: data.sampleRate,
});

export default function AutoMarker({
  onBack,
  capturedData,
  topics = [],
  testType = "load",
  testbench = {},
  simulatorType = "circuitjs",
  activeTestTab,
  setActiveTestTab,
  testSuite,
  setTestSuite,
  problemId,
  onCompleted,
}) {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [runError, setRunError] = useState(null);
  const lastProcessedDataRef = useRef(null);
  const activeTestTabRef = useRef(activeTestTab);
  useEffect(() => { activeTestTabRef.current = activeTestTab; }, [activeTestTab]);

  // C1: grading moved server-side — POST to /api/grade instead of running
  // gradingUtils/signalUtils in the browser. Grades a single test key against
  // one capture; throws on a server error so callers can decide whether to
  // continue (load sweep) or surface it (single submit).
  const gradeOne = useCallback(async (testKey, data) => {
    const capturedPayload = simulatorType !== "circuitjs"
      ? { changes: data.changes }
      : testType === "digital"
        ? { table: data.table }
        : buildAnalogPayload(data);

    // Send the Firebase ID token — server extracts uid from it, never trusts body.
    const token = await user?.getIdToken?.() || null;
    const res = await fetch("/api/grade", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        problemId,
        testKey,
        capturedData: capturedPayload,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server error ${res.status}`);
    }

    const { testResult, isCompleted } = await res.json();
    setTestSuite(prev => ({ ...prev, [testKey]: testResult }));
    if (isCompleted) onCompleted?.();
  }, [problemId, testType, simulatorType, user, setTestSuite, onCompleted]);

  // Load-sweep grade: send all three captures in one request. The server grades
  // each against its golden, writes progress once, and returns per-test results
  // plus a per-test errors map (a failure on one test doesn't sink the others).
  // On 413 (oversized batch) we fall back to grading each load individually.
  const gradeBatch = useCallback(async (tests) => {
    const captures = {};
    for (const key of ["test1", "test2", "test3"]) {
      if (tests[key]) captures[key] = buildAnalogPayload(tests[key]);
    }

    const token = await user?.getIdToken?.() || null;
    const res = await fetch("/api/grade", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ problemId, captures }),
    });

    if (res.status === 413) {
      // Body too large for a single round-trip — grade each load separately.
      const failed = [];
      for (const key of ["test1", "test2", "test3"]) {
        if (!tests[key]) continue;
        try {
          await gradeOne(key, tests[key]);
        } catch (err) {
          console.error(`Grading ${key} failed:`, err);
          failed.push(`${key}: ${err.message}`);
        }
      }
      if (failed.length) setRunError(failed.join("\n"));
      return;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server error ${res.status}`);
    }

    const { testResults = {}, errors = {}, isCompleted } = await res.json();
    setTestSuite(prev => ({ ...prev, ...testResults }));
    const errorLines = Object.entries(errors).map(([key, msg]) => `${key}: ${msg}`);
    if (errorLines.length) {
      console.error("Grading errors:", errors);
      setRunError(errorLines.join("\n"));
    }
    if (isCompleted) onCompleted?.();
  }, [problemId, user, setTestSuite, onCompleted, gradeOne]);

  // Single-capture grade (signal/digital, or one tab).
  const gradeTest = useCallback(async (testKey, data) => {
    setIsProcessing(true);
    try {
      await gradeOne(testKey, data);
    } catch (err) {
      console.error("Grading failed:", err);
      setRunError(err.message || "Grading failed — please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [gradeOne]);

  // Load-sweep grade: one Submit produced all three load captures, graded in a
  // single batched request (with a per-load fallback inside gradeBatch).
  const gradeSweep = useCallback(async (tests) => {
    setIsProcessing(true);
    try {
      await gradeBatch(tests);
    } catch (err) {
      console.error("Batch grading failed:", err);
      setRunError(err.message || "Grading failed — please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [gradeBatch]);

  useEffect(() => {
    if (!capturedData || capturedData === lastProcessedDataRef.current) return;
    lastProcessedDataRef.current = capturedData;
    // fpga/mcu: a failed compile/runtime in the embedded sim arrives as
    // `ok: false` — surface the sim's own log instead of calling /api/grade
    // with nothing to compare.
    if (simulatorType !== "circuitjs" && capturedData.ok === false) {
      setRunError(capturedData.log || "Run failed in the simulator.");
      return;
    }
    setRunError(null);
    if (capturedData.type === "loadSweep" && capturedData.tests) {
      gradeSweep(capturedData.tests);
    } else {
      const tabKey = testType === "signal" ? "test1" : activeTestTabRef.current;
      gradeTest(tabKey, capturedData);
    }
  }, [capturedData, gradeTest, gradeSweep, testType, simulatorType]);

  const isDigital = testType === "digital";
  const isSignal = testType === "signal";
  const tabLabels = isDigital ? ["Input A", "Input B", "Input C"] : ["No Load", "Max Load", "Min Load"];
  const currentDisplayKey = isSignal ? "test1" : activeTestTab;
  const currentData = testSuite[currentDisplayKey];

  return (
    <div className="relative space-y-4 min-h-[500px] w-full p-4 overflow-y-auto bg-base-100 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="btn btn-circle btn-ghost btn-sm" onClick={onBack}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1 className="text-xl font-bold uppercase tracking-tight">
            {isSignal ? "Signal Analysis" : "Verification Suite"}
          </h1>
        </div>
      </div>

      {/* Signed-out submissions grade normally but the server never writes
          UserProgress — without this notice the missing completion is silent. */}
      {!user && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-xs font-semibold">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-4 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
          You&apos;re not signed in — this attempt is graded but won&apos;t be saved to your progress.
        </div>
      )}

      {/* MULTI-TEST TABS: hidden for signal problems */}
      {!isSignal && (
        <div className="tabs tabs-lifted w-full">
          {["test1", "test2", "test3"].map((tKey, idx) => (
            <button
              key={tKey}
              className={`tab flex gap-2 font-bold transition-all ${activeTestTab === tKey ? "tab-active [--tab-bg:white]" : "opacity-60"}`}
              onClick={() => setActiveTestTab(tKey)}
            >
              {!testSuite[tKey] ? (
                <span className="w-2 h-2 rounded-full bg-base-300" />
              ) : testSuite[tKey].verdict?.passed ? (
                <span className="text-green-500">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                </span>
              ) : (
                <span className="text-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-4"><path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                </span>
              )}
              {tabLabels[idx]}
            </button>
          ))}
        </div>
      )}

      <div className="bg-white">
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <LoadingAnimation />
            <p className="text-sm opacity-60 mt-6 animate-pulse uppercase font-semibold tracking-wider text-green-600">Processing Waveform…</p>
          </div>
        ) : runError ? (
          // A fresh failure must outrank a stale verdict: runError is cleared at
          // the start of every grade attempt, so if it's set it belongs to the
          // LATEST submit — showing the previous run's Results here would
          // silently mask a compile/grade failure behind an old "Accepted".
          <div className="flex flex-col items-center justify-center p-20 bg-red-50 text-center rounded-xl border-dashed border-2 border-red-200 m-4">
            <p className="text-sm font-bold text-red-600 uppercase tracking-widest text-center">Run Failed</p>
            <pre className="text-xs text-red-700 mt-2 max-w-lg mx-auto whitespace-pre-wrap text-left">{runError}</pre>
          </div>
        ) : currentData?.verdict ? (
          <div className="animate-in fade-in zoom-in-95 duration-500 p-4">
            <Results chartData={currentData} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-20 bg-base-50 text-center rounded-xl border-dashed border-2 border-base-200 m-4">
            <p className="text-sm font-bold opacity-30 uppercase tracking-widest text-center">Awaiting Capture</p>
            <p className="text-xs opacity-40 mt-1 max-w-xs mx-auto">Click Submit in the simulator to generate the analysis.</p>
          </div>
        )}
      </div>
    </div>
  );
}
