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

export default function AutoMarker({ onBack, solution, capturedData, topics = ["Digital Systems"] }) {
  const [chartData, setChartData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setChartData(null);
  }, [capturedData]);
  console.log("capturedData:", capturedData);
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
  const processDigital = useCallback((userTable) => {
    setIsProcessing(true);
    
    setTimeout(() => {
      let goldenTable = [];
      try {
        const trimmedSolution = solution.trim();
          goldenTable = trimmedSolution.split("\n").map(val => ({
            decimalOutput: parseInt(val.trim(), 10)
          }));

          console.log("in process digital:");
        const grade = gradingUtils.gradeDigital(userTable, goldenTable);
        const verdict = gradingUtils.getVerdict(grade.matchRatio, topics, true);

        setChartData({
          type: "digital",
          table: grade.details,
          verdict: { ...verdict, matchRatio: grade.matchRatio },
          summary: { total: grade.totalCycles, correct: grade.correctCount }
        });
      } catch (e) {
        console.error("Digital solution parsing error:", e);
      } finally {
        setIsProcessing(false);
      }
    }, 400);
  }, [solution, topics]);

  /**
   * ANALOG PROCESSING
   */
  const processAnalog = useCallback((userVout, userVin, timeLabels, sampleRate) => {
    setIsProcessing(true);

    setTimeout(() => {
      const solOutData = extractDataPoints(solution || "");
      const nrmse = gradingUtils.calculateNormalizedRMSE(userVout, solOutData);
      const verdict = gradingUtils.getVerdict(nrmse, topics, false);

      const targetBode = signalUtils.getFrequencyData(userVin, solOutData, sampleRate);
      const userBode = signalUtils.getFrequencyData(userVin, userVout, sampleRate);

      setChartData({
        type: "analog",
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
      });

      setIsProcessing(false);
    }, 600);
  }, [solution, extractDataPoints, topics]);

  useEffect(() => {
    if (capturedData && !chartData) {
      if (capturedData.type === "digital") {
        processDigital(capturedData.table);
      } else if (capturedData.type === "analog") {
        const userVout = capturedData.data?.output || [];
        const userVin = capturedData.data?.input || [];
        processAnalog(userVout, userVin, capturedData.timeLabels, capturedData.sampleRate);
      }
    }
  }, [capturedData, chartData, processDigital, processAnalog]);

  return (
    <div className="relative space-y-4 min-h-[500px] w-full p-4 overflow-y-auto bg-base-100">
      <div className="flex items-center gap-4">
        <button className="btn btn-circle btn-ghost btn-sm" onClick={onBack}>
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h1 className="text-xl font-bold uppercase tracking-tight">
          {capturedData?.type === "digital" ? "Digital Logic Grading" : "Analog Signal Analysis"}
        </h1>
      </div>
      
      {isProcessing ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <LoadingAnimation />
          <p className="text-sm opacity-60 mt-6 animate-pulse uppercase font-semibold tracking-wider">
            {capturedData?.type === "digital" ? "Verifying Bit Vectors..." : "Calculating FFT & NRMSE..."}
          </p>
        </div>
      ) : chartData ? (
        <div className="animate-in fade-in zoom-in-95 duration-500">
          <Results chartData={chartData} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-base-300 rounded-2xl bg-base-200">
          <p className="text-sm text-gray-500">Awaiting simulator data...</p>
        </div>
      )}
    </div>
  );
}