"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import LoadingAnimation from "@/components/LoadingAnimation";
import { signalUtils } from "@/lib/signalUtils";
import { gradingUtils } from "@/lib/gradingUtils";

// ssr: false because Chart.js requires a browser environment
const Results = dynamic(() => import("./Results"), {
  ssr: false,
  loading: () => <LoadingAnimation />
});

export default function AutoMarker({
  onBack,
  solution,
  capturedData,
  topics = [],
  testType = "load",
  testbench = {},
  activeTestTab,
  setActiveTestTab,
  testSuite,
  setTestSuite
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const lastProcessedDataRef = useRef(null);
  const activeTestTabRef = useRef(activeTestTab);
  useEffect(() => { activeTestTabRef.current = activeTestTab; }, [activeTestTab]);

  const extractDataPoints = useCallback((text) => {
    if (!text) return [];
    return text.trim().split("\n")
      .filter(line => line.trim() && !line.startsWith("#"))
      .map(line => parseFloat(line.trim()))
      .filter(val => !isNaN(val));
  }, []);

  const processDigital = useCallback((userTable, testKey) => {
    setIsProcessing(true);
    const tid = setTimeout(() => {
      try {
        const goldenTable = (solution?.[testKey] || "").trim().split("\n")
          .map(val => ({ decimalOutput: parseInt(val.trim(), 10) }));
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
      } finally {
        setIsProcessing(false);
      }
    }, 150);
    return tid;
  }, [solution, topics, setTestSuite]);

  const processLoad = useCallback((userVout, userVin, timeLabels, sampleRate, testKey) => {
    setIsProcessing(true);
    const bench = testbench || {};
    const resistanceMap = { test1: bench.noload || 1e12, test2: bench.maxload || 1, test3: bench.minload || 1 };
    const activeResistance = Number(resistanceMap[testKey]);

    const tid = setTimeout(() => {
      try {
        const solOutData = extractDataPoints(solution?.[testKey] || "");
        const nrmse = gradingUtils.calculateNormalizedRMSE(userVout, solOutData);
        const verdict = gradingUtils.getVerdict(nrmse, topics, false);
        const targetBode = signalUtils.getFrequencyData(userVin, solOutData, sampleRate);
        const userBode = signalUtils.getFrequencyData(userVin, userVout, sampleRate);
        setTestSuite(prev => ({
          ...prev,
          [testKey]: {
            type: "analog",
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
            solutionBodePhase: targetBode.bodePhase
          }
        }));
      } finally {
        setIsProcessing(false);
      }
    }, 150);
    return tid;
  }, [solution, extractDataPoints, topics, setTestSuite, testbench]);

  const processSignal = useCallback((userVout, userVin, timeLabels, sampleRate) => {
    setIsProcessing(true);
    const tid = setTimeout(() => {
      try {
        const solOutData = extractDataPoints(solution?.test1 || "");
        const nrmse = gradingUtils.calculateNormalizedRMSE(userVout, solOutData);
        const verdict = gradingUtils.getVerdict(nrmse, topics, false);
        const targetBode = signalUtils.getFrequencyData(userVin, solOutData, sampleRate);
        const userBode = signalUtils.getFrequencyData(userVin, userVout, sampleRate);
        setTestSuite(prev => ({
          ...prev,
          test1: {
            type: "analog",
            isSignalOnly: true,
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
      } finally {
        setIsProcessing(false);
      }
    }, 150);
    return tid;
  }, [solution, extractDataPoints, topics, setTestSuite]);

  useEffect(() => {
    if (!capturedData || capturedData === lastProcessedDataRef.current) return;
    lastProcessedDataRef.current = capturedData;

    const tabKey = activeTestTabRef.current;
    if (testType === "digital") {
      processDigital(capturedData.table, tabKey);
    } else if (testType === "load") {
      processLoad(
        capturedData.data?.output || [],
        capturedData.data?.input || [],
        capturedData.timeLabels,
        capturedData.sampleRate,
        tabKey
      );
    } else if (testType === "signal") {
      processSignal(
        capturedData.data?.output || [],
        capturedData.data?.input || [],
        capturedData.timeLabels,
        capturedData.sampleRate
      );
    }
  }, [capturedData, processDigital, processLoad, processSignal, testType]);

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
            <p className="text-sm opacity-60 mt-6 animate-pulse uppercase font-semibold tracking-wider text-blue-600">Processing Waveform...</p>
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
