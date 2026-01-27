"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import LoadingAnimation from "@/components/LoadingAnimation";
import { signalUtils } from "@/lib/signalUtils";
import { gradingUtils } from "@/lib/gradingUtils";

const Results = dynamic(() => import("./Results"), { 
  ssr: false,
  loading: () => <LoadingAnimation /> 
});

/**
 * AutoMarker Component
 * Persists test results and active tab via parent-provided props.
 */
export default function AutoMarker({ 
  onBack, 
  solution, 
  capturedData, 
  topics = ["Digital Systems"],
  testbench = {},
  activeTestTab,      // Persisted State from SolveProblem
  setActiveTestTab,   // Persisted Setter from SolveProblem
  testSuite,          // Persisted State from SolveProblem
  setTestSuite        // Persisted Setter from SolveProblem
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const extractDataPoints = useCallback((text) => {
    if (!text) return [];
    return text.trim().split("\n")
      .filter(line => line.trim() && !line.startsWith("#"))
      .map(line => parseFloat(line.trim()))
      .filter(val => !isNaN(val));
  }, []);

  /**
   * DIGITAL PROCESSING
   */
  const processDigital = useCallback((userTable, testKey) => {
    setIsProcessing(true);
    setTimeout(() => {
      try {
        const specificSolution = solution?.[testKey] || "";
        const goldenTable = specificSolution.trim().split("\n").map(val => ({
          decimalOutput: parseInt(val.trim(), 10)
        }));

        const grade = gradingUtils.gradeDigital(userTable, goldenTable);
        const verdict = gradingUtils.getVerdict(grade.matchRatio, topics, true);

        setTestSuite(prev => ({
          ...prev,
          [testKey]: {
            type: "digital",
            table: grade.details,
            verdict: { ...verdict, matchRatio: grade.matchRatio },
            summary: { total: grade.totalCycles, correct: grade.correctCount }
          }
        }));
      } catch (e) {
        console.error("Digital processing error:", e);
      } finally {
        setIsProcessing(false);
      }
    }, 400);
  }, [solution, topics, setTestSuite]);

/**
   * ANALOG PROCESSING
   * Derives NRMSE, Bode Data, and injects Testbench Resistance for current plotting.
   */
  const processAnalog = useCallback((userVout, userVin, timeLabels, sampleRate, testKey) => {
    setIsProcessing(true);

    // 1. Resolve resistance from the testbench metadata passed from parent
    // Mapping our internal test keys to your database schema keys
    const bench = testbench || {}; // Ensure testbench is a prop
    const resistanceMap = {
      test1: bench.noload || 1e12,
      test2: bench.maxload || 1, // Fallback to 1 to avoid div by zero
      test3: bench.minload || 1
    };
    
    const activeResistance = Number(resistanceMap[testKey]);

    setTimeout(() => {
      try {
        // 2. Waveform Extraction
        const specificSolution = solution?.[testKey] || "";
        const solOutData = extractDataPoints(specificSolution);
        
        // 3. Grading Logic
        const nrmse = gradingUtils.calculateNormalizedRMSE(userVout, solOutData);
        const verdict = gradingUtils.getVerdict(nrmse, topics, false);

        // 4. Signal Analysis (Frequency Domain)
        const targetBode = signalUtils.getFrequencyData(userVin, solOutData, sampleRate);
        const userBode = signalUtils.getFrequencyData(userVin, userVout, sampleRate);

        // 5. Update State with all required charting data
        setTestSuite(prev => ({
          ...prev,
          [testKey]: {
            type: "analog",
            resistance: activeResistance, // Crucial for Results.jsx I=V/R
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
            solutionBodePhase: targetBode.bodePhase
          }
        }));
      } catch (err) {
        console.error("Analog Grading Error:", err);
      } finally {
        setIsProcessing(false);
      }
    }, 600);
  }, [solution, extractDataPoints, topics, setTestSuite, testbench]);

  /**
   * TRIGGER LOGIC
   * Runs whenever fresh capturedData is submitted from the simulator.
   */
  useEffect(() => {
    if (capturedData) {
      if (capturedData.type === "digital") {
        processDigital(capturedData.table, activeTestTab);
      } else if (capturedData.type === "analog") {
        const userVout = capturedData.data?.output || [];
        const userVin = capturedData.data?.input || [];
        processAnalog(userVout, userVin, capturedData.timeLabels, capturedData.sampleRate, activeTestTab);
      }
    }
  }, [capturedData, processDigital, processAnalog]); 

  // Dynamically determine labels based on topics
  const isDigital = topics.includes("Digital Systems");
  const tabLabels = isDigital 
    ? ["Input A", "Input B", "Input C"] 
    : ["No Load", "Max Load", "Min Load"];

  return (
    <div className="relative space-y-4 min-h-[500px] w-full p-4 overflow-y-auto bg-base-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="btn btn-circle btn-ghost btn-sm" onClick={onBack}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <h1 className="text-xl font-bold uppercase tracking-tight">Verification Suite</h1>
        </div>
      </div>

      {/* TEST SUITE TABS */}
      <div className="tabs tabs-lifted w-full">
        {["test1", "test2", "test3"].map((tKey, idx) => (
          <button
            key={tKey}
            className={`tab flex gap-2 font-bold transition-all ${activeTestTab === tKey ? "tab-active [--tab-bg:white]" : "opacity-60"}`}
            onClick={() => setActiveTestTab(tKey)}
          >
            {/* Pass/Fail/Empty Indicator Icons */}
            {!testSuite[tKey] ? (
              <span className="w-2 h-2 rounded-full bg-base-300"></span>
            ) : testSuite[tKey].verdict?.passed ? (
              <span className="text-green-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </span>
            ) : (
              <span className="text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </span>
            )}
            {tabLabels[idx]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-b-xl">
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <LoadingAnimation />
            <p className="text-sm opacity-60 mt-6 animate-pulse uppercase font-semibold tracking-wider text-blue-600">
              Evaluating {tabLabels[["test1", "test2", "test3"].indexOf(activeTestTab)]}...
            </p>
          </div>
        ) : (testSuite[activeTestTab] && testSuite[activeTestTab].verdict) ? (
          <div className="animate-in fade-in zoom-in-95 duration-500 p-4">
            <Results chartData={testSuite[activeTestTab]} />
          </div>
        ) : (
          /* AWAITING CAPTURE SCREEN */
          <div className="flex flex-col items-center justify-center p-20 bg-base-50 text-center rounded-b-xl border-dashed border-2 border-base-200 m-4">
            <div className="relative mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 opacity-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
            </div>
            
            <p className="text-sm font-bold opacity-30 uppercase tracking-widest">Awaiting Capture</p>
            <p className="text-xs opacity-40 mt-1 max-w-xs mx-auto leading-relaxed">
              No results found for <strong>{tabLabels[["test1", "test2", "test3"].indexOf(activeTestTab)]}</strong>. 
              Configure your circuit, click Back, and Submit in the simulator to run this test.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}