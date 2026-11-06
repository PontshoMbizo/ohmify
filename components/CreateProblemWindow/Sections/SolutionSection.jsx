"use client";

import { useState } from "react";
import Simulator from "@/components/Simulator";
import SimulatorEmbed from "@/components/SimulatorEmbed";
import { EMBED_CONFIG } from "@/lib/embedConfig";
import { encodeWaveform, decimate, computeDecimation } from "@/lib/waveformCodec";
import { gradingUtils } from "@/lib/gradingUtils";

export default function SolutionSection({ problem, updateProblem }) {
  const [activeTest, setActiveTest] = useState("test1");
  const [statusMessage, setStatusMessage] = useState(null); // { type, text }
  const problemType = problem.testType || "load";
  const isEmbedded = problem.simulatorType && problem.simulatorType !== "circuitjs";

  const handleBenchChange = (key, value) => {
    updateProblem({ testConfig: { ...problem.testConfig, [key]: value } });
  };

  // fpga/mcu golden: store the run verbatim ({code, changes}) — no
  // decimation/encoding step, these are discrete value-change lists, not
  // continuous analog samples.
  const handleEmbedResult = (r) => {
    if (!r.ok) {
      setStatusMessage({ type: "error", text: r.log || "Run failed." });
      return;
    }
    if (!r.changes || r.changes.length === 0) {
      setStatusMessage({
        type: "error",
        text: `No changes captured for signal "${problem.testConfig?.signal || ""}". Check the signal name and testbench, then try again.`,
      });
      return;
    }
    updateProblem({ solutions: { ...problem.solutions, test1: { code: r.code, changes: r.changes } } });
    setStatusMessage({ type: "success", text: `Captured ${r.changes.length} change(s).` });
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
      setStatusMessage({ type: "success", text: "All three loads captured." });
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
        solutions: { ...problem.solutions, [targetKey]: table.map((row) => row.decimalOutput).join("\n") },
        captureRates: { ...(problem.captureRates || {}), [targetKey]: capturedData.sampleRate || null },
        decimations: { ...(problem.decimations || {}), [targetKey]: 1 },
      });
      setStatusMessage({ type: "success", text: `${targetKey} captured.` });
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
      captureRates: { ...(problem.captureRates || {}), [targetKey]: capturedData.sampleRate || null },
      decimations: { ...(problem.decimations || {}), [targetKey]: decimation },
      decimationErrors: { ...(problem.decimationErrors || {}), [targetKey]: decimationError },
    });
    setStatusMessage({ type: "success", text: "Waveform captured." });
  };

  // Resistances for the automated load sweep (load problems only).
  const loads = problemType === "load"
    ? { test1: 1e12, test2: Number(problem.testConfig?.rMax), test3: Number(problem.testConfig?.rMin) }
    : null;

  const benchInputClass =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition-all";

  const loadTabs = [
    { id: "test1", label: problemType === "digital" ? "Test A" : "No Load" },
    { id: "test2", label: problemType === "digital" ? "Test B" : "Max Load" },
    { id: "test3", label: problemType === "digital" ? "Test C" : "Min Load" },
  ];

  return (
    <section className="flex h-full w-full bg-white">
      {/* SIMULATOR */}
      <div className={`w-[70%] h-full ${isEmbedded ? "bg-white" : "bg-[#070707]"}`}>
        {isEmbedded ? (
          <SimulatorEmbed
            {...EMBED_CONFIG[problem.simulatorType]}
            bridge={{
              mode: "capture",
              starterCode: problem.starterCode || "",
              testbench: problem.testConfig?.testbench,
              engine: problem.testConfig?.engine,
              signal: problem.testConfig?.signal,
              duration: problem.testConfig?.duration,
              onResult: handleEmbedResult,
            }}
          />
        ) : (
          <Simulator
            circuit={problem.templateCircuit}
            onSubmit={handleCaptureSolution}
            sampleCount={problem.sampleCount}
            isDigital={problemType === "digital"}
            loads={loads}
            timeStep={problem.timeStep}
          />
        )}
      </div>

      {/* SIDEBAR */}
      <div className="w-[30%] h-full p-7 flex flex-col gap-5 border-l border-slate-200 bg-slate-50 overflow-y-auto">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step 4 · {isEmbedded ? problem.simulatorType : problemType} mode</p>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-blue-600">Solution Suite</h2>
        </div>

        {/* Testbench config — embedded sims (fpga/mcu) */}
        {isEmbedded && (
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {problem.simulatorType === "fpga" ? "Testbench" : "Engine"}
            </p>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Signal / Pin to grade</label>
              <input
                type="text"
                placeholder={problem.simulatorType === "fpga" ? "leds" : "PC13"}
                className={benchInputClass}
                value={problem.testConfig?.signal || ""}
                onChange={(e) => handleBenchChange("signal", e.target.value)}
              />
            </div>
            {problem.simulatorType === "fpga" ? (
              <>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Self-checking Testbench (optional)</label>
                  <textarea
                    placeholder="module tb; ... $dumpfile(...); $dumpvars; ..."
                    className="w-full h-24 rounded-lg border border-slate-800 bg-slate-900 text-blue-300 font-mono text-[10px] leading-relaxed p-2 outline-none focus:border-blue-500 transition-all"
                    value={problem.testConfig?.testbench || ""}
                    onChange={(e) => handleBenchChange("testbench", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Duration (ns)</label>
                  <input
                    type="number"
                    className={benchInputClass}
                    value={problem.testConfig?.duration || 2000000}
                    onChange={(e) => handleBenchChange("duration", Number(e.target.value))}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">QEMU Engine</label>
                <select
                  className={benchInputClass}
                  value={problem.testConfig?.engine || "mainline"}
                  onChange={(e) => handleBenchChange("engine", e.target.value)}
                >
                  <option value="mainline">mainline (qemu-system-arm)</option>
                  <option value="xpack">xPack (native GPIO)</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Testbench config */}
        {!isEmbedded && problemType !== "signal" && (
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {problemType === "digital" ? "Memory Payloads (SRAM Map)" : "Testbench Loads (Ω)"}
            </p>
            {problemType === "digital" ? (
              ["payload1", "payload2", "payload3"].map((key, i) => (
                <div key={key} className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Payload {String.fromCharCode(65 + i)}</label>
                  <textarea
                    placeholder={"0: 0 17 33...\n8: 110 120..."}
                    className="w-full h-20 rounded-lg border border-slate-800 bg-slate-900 text-blue-300 font-mono text-[10px] leading-relaxed p-2 outline-none focus:border-blue-500 transition-all"
                    value={problem.testConfig?.[key] || ""}
                    onChange={(e) => handleBenchChange(key, e.target.value)}
                  />
                </div>
              ))
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Max Load (Ω)</label>
                  <input type="number" className={benchInputClass} value={problem.testConfig?.rMax || ""} onChange={(e) => handleBenchChange("rMax", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Min Load (Ω)</label>
                  <input type="number" className={benchInputClass} value={problem.testConfig?.rMin || ""} onChange={(e) => handleBenchChange("rMin", e.target.value)} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Per-test progress */}
        {problemType !== "signal" ? (
          <div className="inline-flex p-1 rounded-xl bg-slate-200 gap-0.5">
            {loadTabs.map((t) => {
              const done = !!problem.solutions[t.id];
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTest(t.id)}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all
                    ${activeTest === t.id ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  {done ? "✓ " : ""}{t.label}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{isEmbedded ? "Golden Run" : "Signal Capture"}</p>
            <p className="text-sm font-bold text-slate-700">
              {isEmbedded
                ? problem.solutions.test1 ? `Captured ✓ (${problem.solutions.test1.changes?.length || 0} changes)` : "Awaiting capture…"
                : problem.solutions.test1 ? "Waveform captured ✓" : "Awaiting capture…"}
            </p>
          </div>
        )}

        {/* Instruction */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-amber-400 mt-1 shrink-0" />
            <p className="text-[11px] leading-relaxed text-slate-500 font-medium italic">
              {isEmbedded && 'Set the signal/pin name above, write the reference solution, then click "Capture golden" in the simulator.'}
              {!isEmbedded && problemType === "digital" && "Paste the payload above into the simulator SRAM, click RESET, then SUBMIT."}
              {!isEmbedded && problemType === "load" && 'Set Max/Min loads above and label the output voltmeter "output". One SUBMIT captures all three loads.'}
              {!isEmbedded && problemType === "signal" && "Capture the gold-standard output for this circuit."}
            </p>
          </div>
        </div>

        {statusMessage && (
          <div className={`px-4 py-3 rounded-xl text-xs font-bold ${statusMessage.type === "error" ? "bg-red-50 text-red-600 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
            {statusMessage.text}
          </div>
        )}
      </div>
    </section>
  );
}
