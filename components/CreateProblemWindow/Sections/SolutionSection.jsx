"use client";

import Simulator from "@/components/Simulator";
import { db } from "@/lib/firebase";
import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { encodeWaveform, decimate, computeDecimation } from "@/lib/waveformCodec";
import { gradingUtils } from "@/lib/gradingUtils";

export default function SolutionSection({ problem, user, updateProblem, onBack, isPublishing, setIsPublishing }) {
  const [activeTest, setActiveTest] = useState("test1");
  const [statusMessage, setStatusMessage] = useState(null); // { type: "error"|"success", text: string }
  const router = useRouter();
  const problemType = problem.testType || "load";

  const handleBenchChange = (key, value) => {
    updateProblem({
      testConfig: { ...problem.testConfig, [key]: value }
    });
  };

  // Encode an analog/signal output array into the packed, optionally-decimated
  // storage form, returning { samples, decimation, decimationError }. The error
  // quantifies how much the decimated reference deviates from the full capture;
  // the grader subtracts it as headroom so a solver isn't penalised for it.
  // Digital goldens stay as newline text (tiny, graded by exact integer match).
  const encodeGolden = (outputArr) => {
    const D = computeDecimation(outputArr.length, problemType);
    return {
      samples: encodeWaveform(decimate(outputArr, D)),
      decimation: D,
      decimationError: gradingUtils.decimationError(outputArr, D),
    };
  };

  // Load problems capture all three golden waveforms in one automated sweep,
  // so the golden is captured at the exact loads (and the same code path) the
  // solver is graded against.
  const handleCaptureSolution = (capturedData) => {
    if (capturedData.type === "loadSweep") {
      const solutions = { ...problem.solutions };
      const captureRates = { ...(problem.captureRates || {}) };
      const decimations = { ...(problem.decimations || {}) };
      const decimationErrors = { ...(problem.decimationErrors || {}) };
      for (const [key, cap] of Object.entries(capturedData.tests || {})) {
        const output = cap.data?.output || [];
        // Validate the raw capture before encoding — an empty solution doc
        // would make every future submission fail with a 500.
        if (output.length === 0) {
          setStatusMessage({ type: "error", text: `${key} capture produced no data. Check the circuit and loads, then try again.` });
          return;
        }
        const { samples, decimation, decimationError } = encodeGolden(output);
        solutions[key] = samples;
        captureRates[key] = cap.sampleRate || null;
        decimations[key] = decimation;
        decimationErrors[key] = decimationError;
      }
      updateProblem({ solutions, captureRates, decimations, decimationErrors });
      setStatusMessage(null);
      return;
    }

    const targetKey = problemType === "signal" ? "test1" : activeTest;

    if (problemType === "digital") {
      const table = capturedData.table || [];
      if (table.length === 0) {
        setStatusMessage({ type: "error", text: "Capture produced no data. Check the circuit and try again." });
        return;
      }
      updateProblem({
        solutions: { ...problem.solutions, [targetKey]: table.map(row => row.decimalOutput).join("\n") },
        captureRates: { ...(problem.captureRates || {}), [targetKey]: capturedData.sampleRate || null },
        decimations: { ...(problem.decimations || {}), [targetKey]: 1 },
      });
      setStatusMessage(null);
      return;
    }

    const output = capturedData.data?.output || [];
    if (output.length === 0) {
      setStatusMessage({ type: "error", text: "Capture produced no data. Check the circuit and try again." });
      return;
    }
    const { samples, decimation, decimationError } = encodeGolden(output);
    updateProblem({
      solutions: { ...problem.solutions, [targetKey]: samples },
      // Record the sample rate the capture actually ran at. The form's
      // timeStep field is only a fallback — the sim's real dt is the truth,
      // and the grade API compares user captures against this value.
      captureRates: { ...(problem.captureRates || {}), [targetKey]: capturedData.sampleRate || null },
      decimations: { ...(problem.decimations || {}), [targetKey]: decimation },
      decimationErrors: { ...(problem.decimationErrors || {}), [targetKey]: decimationError },
    });
    setStatusMessage(null);
  };

  // Resistances for the automated load sweep (load problems only), taken from
  // the testbench inputs above. Captured the same way the solver is graded.
  const loads = problemType === "load"
    ? {
        test1: 1e12,
        test2: Number(problem.testConfig?.rMax),
        test3: Number(problem.testConfig?.rMin),
      }
    : null;

  const finalizeProblem = async () => {
    setStatusMessage(null);

    if (!user) {
      setStatusMessage({ type: "error", text: "You must be signed in to publish." });
      return;
    }

    const { test1, test2, test3 } = problem.solutions;
    if (problemType === "signal" && !test1) {
      setStatusMessage({ type: "error", text: "Capture the signal waveform first." });
      return;
    }
    if (problemType !== "signal" && (!test1 || !test2 || !test3)) {
      setStatusMessage({ type: "error", text: "Capture all 3 test cases before publishing." });
      return;
    }

    const timeStepNum = Number(problem.timeStep);
    if (!timeStepNum || timeStepNum <= 0) {
      setStatusMessage({ type: "error", text: "Invalid time step value." });
      return;
    }

    // Validate load values before they're frozen into the testbench —
    // a 0 Ω load silently becomes the grading resistance for current charts.
    if (problemType === "load") {
      const rMax = Number(problem.testConfig?.rMax);
      const rMin = Number(problem.testConfig?.rMin);
      if (!rMax || rMax <= 0 || !rMin || rMin <= 0) {
        setStatusMessage({ type: "error", text: "Max and Min load must be positive resistances." });
        return;
      }
    }

    setIsPublishing(true);

    try {
      let testbench = {};
      if (problemType === "digital") {
        testbench = {
          payload1: String(problem.testConfig?.payload1 || ""),
          payload2: String(problem.testConfig?.payload2 || ""),
          payload3: String(problem.testConfig?.payload3 || "")
        };
      } else if (problemType === "load") {
        testbench = {
          noload: 1e12,
          maxload: Number(problem.testConfig?.rMax),
          minload: Number(problem.testConfig?.rMin)
        };
      } else {
        testbench = { isSignal: true };
      }

      const problemData = {
        title: problem.title.trim(),
        difficulty: problem.difficulty,
        description: problem.description,
        topics: problem.topics,
        creatorId: user.uid,
        creatorName: user.displayName || "Anonymous",
        createdAt: serverTimestamp(),
        testbench,
        testType: problemType,
        timeStep: problem.timeStep,
        // Stored as a number — the metadata input yields a string.
        sampleCount: Number(problem.sampleCount) || 30720
      };

      // Atomic publish: problem doc, template circuit, and all solution
      // waveforms commit together or not at all. The previous sequential
      // writes could fail halfway and leave a problem that 500s on grading.
      const batch = writeBatch(db);
      const problemRef = doc(collection(db, "Problems"));
      batch.set(problemRef, problemData);
      batch.set(doc(db, "Problems", problemRef.id, "initialCircuit", "data"), {
        version: 1,
        payload: problem.templateCircuit
      });

      const fallbackRate = 1 / timeStepNum;
      const tests = problemType === "signal" ? { test1 } : { test1, test2, test3 };

      for (const [key, value] of Object.entries(tests)) {
        batch.set(doc(db, "Problems", problemRef.id, "solutionWaveform", key), {
          samples: value,
          // Prefer the rate the capture actually ran at; fall back to the form value.
          sampleRate: problem.captureRates?.[key] || fallbackRate,
          // Decimation factor baked into the stored golden (1 = none). Read
          // server-side at grade time to decimate the user capture to match.
          decimation: problem.decimations?.[key] || 1,
          // NRMSE the decimation injects into the reference; the grader subtracts
          // it as headroom so a solver isn't penalised for it.
          decimationError: problem.decimationErrors?.[key] || 0
        });
      }

      await batch.commit();

      setStatusMessage({ type: "success", text: "Challenge published!" });
      setTimeout(() => router.push("/"), 1200);
    } catch (e) {
      console.error("Publishing Error:", e);
      setStatusMessage({ type: "error", text: `Publishing failed: ${e.message}` });
      setIsPublishing(false);
    }
  };

  return (
    <section id="section-4" className="relative flex h-full w-full bg-white">
      {/* LEFT: SIMULATOR VIEWPORT */}
      <div className="w-[70%] h-full bg-base-100">
        <Simulator
          circuit={problem.templateCircuit}
          onSubmit={handleCaptureSolution}
          sampleCount={problem.sampleCount}
          isDigital={problemType === "digital"}
          loads={loads}
          timeStep={problem.timeStep}
        />
      </div>

      {/* RIGHT: SIDEBAR CONTROLS */}
      <div className="w-[30%] h-full p-8 flex flex-col gap-6 border-l bg-slate-50 overflow-y-auto text-black shadow-inner">
        <div>
          <h2 className="text-2xl font-black uppercase italic text-blue-600 tracking-tighter">04. Solution Suite</h2>
          <p className="text-[10px] opacity-60 uppercase font-bold tracking-widest text-slate-400">
            {problemType} mode
          </p>
        </div>

        {/* DYNAMIC METADATA INPUTS */}
        {problemType !== "signal" && (
          <div className="grid grid-cols-1 gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {problemType === "digital" ? "Memory Payloads (SRAM Map)" : "Testbench Loads (Ohms)"}
            </p>

            {problemType === "digital" ? (
              <div className="space-y-3">
                {["payload1", "payload2", "payload3"].map((key, i) => (
                  <div key={key} className="form-control">
                    <label className="label py-0">
                      <span className="label-text text-[9px] font-bold uppercase opacity-50">Payload {String.fromCharCode(65 + i)}</span>
                    </label>
                    <textarea
                      placeholder={"0: 0 17 33...\n8: 110 120..."}
                      className="textarea textarea-bordered textarea-xs w-full font-mono h-24 text-[10px] leading-relaxed bg-slate-900 text-blue-300 border-slate-800"
                      value={problem.testConfig?.[key] || ""}
                      onChange={(e) => handleBenchChange(key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="form-control">
                  <label className="label py-0"><span className="label-text text-[9px] font-bold uppercase opacity-50">Max Load (Ω)</span></label>
                  <input type="number" className="input input-bordered input-sm w-full font-mono"
                    value={problem.testConfig?.rMax || ""} onChange={(e) => handleBenchChange("rMax", e.target.value)} />
                </div>
                <div className="form-control">
                  <label className="label py-0"><span className="label-text text-[9px] font-bold uppercase opacity-50">Min Load (Ω)</span></label>
                  <input type="number" className="input input-bordered input-sm w-full font-mono"
                    value={problem.testConfig?.rMin || ""} onChange={(e) => handleBenchChange("rMin", e.target.value)} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TEST SELECTOR TABS */}
        {problemType !== "signal" ? (
          <div className="tabs tabs-boxed bg-slate-200 p-1 rounded-xl">
            {[
              { id: "test1", label: problemType === "digital" ? "Test A" : "No Load" },
              { id: "test2", label: problemType === "digital" ? "Test B" : "Max Load" },
              { id: "test3", label: problemType === "digital" ? "Test C" : "Min Load" }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTest(t.id)}
                className={`tab flex-1 font-black uppercase text-[10px] transition-all rounded-lg ${activeTest === t.id ? "tab-active bg-blue-600 text-white shadow-md" : "text-slate-500"}`}
              >
                {problem.solutions[t.id] ? "✓ " : ""}{t.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg animate-pulse">
            <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Signal Capture Mode</p>
            <p className="text-sm font-bold">{problem.solutions.test1 ? "Waveform Captured ✓" : "Awaiting Capture..."}</p>
          </div>
        )}

        {/* DYNAMIC INSTRUCTION CARD */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-amber-400 mt-1 shrink-0" />
            <p className="text-[10px] leading-relaxed text-slate-500 font-medium italic">
              {problemType === "digital" && "ACTION: Copy the payload above, paste into simulator SRAM, click RESET, then click SUBMIT in the simulator window."}
              {problemType === "load" && "ACTION: Set the Max/Min loads above and label the output voltmeter \"output\". One SUBMIT captures all three loads (No-load / Max / Min) automatically."}
              {problemType === "signal" && "ACTION: Capture the gold standard output for this circuit's primary logic function."}
            </p>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="mt-auto space-y-3 pt-6 border-t border-slate-200">
          {statusMessage && (
            <div className={`px-4 py-3 rounded-xl text-xs font-bold ${statusMessage.type === "error" ? "bg-red-50 text-red-600 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
              {statusMessage.text}
            </div>
          )}
          <button onClick={onBack} className="btn btn-ghost w-full btn-sm opacity-50 uppercase font-black tracking-widest">Back</button>
          <button
            disabled={isPublishing || (problemType === "signal" ? !problem.solutions.test1 : !(problem.solutions.test1 && problem.solutions.test2 && problem.solutions.test3))}
            onClick={finalizeProblem}
            className="btn btn-primary w-full shadow-xl font-black uppercase tracking-widest bg-blue-600 border-none hover:bg-blue-700"
          >
            {isPublishing ? <span className="loading loading-spinner"></span> : "Publish Challenge"}
          </button>
        </div>
      </div>
    </section>
  );
}
