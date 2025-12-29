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

// Removed inputWaveform prop as we now use live Vin for both calculations
export default function AutoMarker({ onBack, solution, capturedData }) {
  console.log("AutoMarker received capturedData:", capturedData);
  const [chartData, setChartData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const extractDataPoints = useCallback((text) => {
    if (!text) return [];
    const lines = text.trim().split("\n");
    const dataPoints = [];
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const val = parseFloat(trimmed);
        if (!isNaN(val)) dataPoints.push(val);
      }
    });
    return dataPoints;
  }, []);

  /**
   * Main Processing Logic
   * Uses live captured Vin for BOTH the student and solution Bode plots.
   */
  const processData = useCallback((userVout, userVin, labels, sampleRate, dt) => {
    setIsProcessing(true);

    setTimeout(() => {
      // 1. Parse the Gold Standard Output from Firestore
      const solOutData = extractDataPoints(solution || "");

      // 2. Calculate Time-Domain Accuracy (RMSE)
      const rmse = gradingUtils.calculateRMSE(userVout, solOutData);
      const verdict = gradingUtils.getVerdict(rmse, "analog");

      /** * 3. Frequency Domain Analysis
       * targetBode: The ratio of the gold standard solution against LIVE student input
       * userBode: The ratio of student's live output against LIVE student input
       */
      const targetBode = signalUtils.getFrequencyData(userVin, solOutData, sampleRate);
      const userBode = signalUtils.getFrequencyData(userVin, userVout, sampleRate);

      setChartData({
        labels,
        userData: userVout,
        solutionData: solOutData,
        verdict: { ...verdict, rmse },
        freqLabels: targetBode.freq, 
        
        // Spectrum Tab (raw output magnitudes)
        userSpectrum: userBode.outputSpectrum,
        solutionSpectrum: targetBode.outputSpectrum,

        // Bode Tab (ratio H = Vout/Vin)
        userBodeMag: userBode.bodeMag,      
        userBodePhase: userBode.bodePhase,
        solutionBodeMag: targetBode.bodeMag,
        solutionBodePhase: targetBode.bodePhase
      });

      setIsProcessing(false);
    }, 300);
  }, [solution, extractDataPoints]);

  /**
   * Listen for incoming simulator data
   */
  useEffect(() => {
    if (capturedData && !chartData) {
      // Extract both nodes from the generalized sampling capture
      const userVout = capturedData.data?.output || [];
      const userVin = capturedData.data?.input || [];
      
      processData(
        userVout, 
        userVin,
        capturedData.labels, 
        capturedData.sampleRate, 
        capturedData.dt
      );
    }
  }, [capturedData, chartData, processData]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file || !file.name.endsWith(".txt")) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const lines = content.trim().split("\n");
      const timeMatch = lines[0].match(/time step\s*=\s*([\d.]+)/);
      const dt = timeMatch ? parseFloat(timeMatch[1]) : 0.00001;
      const userData = extractDataPoints(content);
      const labels = userData.map((_, i) => (i * dt * 1000).toFixed(3));
      
      // Legacy fallback: Use userData as Vin to create a normalized baseline
      processData(userData, userData, labels, 1 / dt, dt);
    };
    reader.readAsText(file);
  };

  return (
    <div className="relative space-y-4 min-h-[500px] w-full p-4 overflow-y-auto bg-base-100">
      <div className="flex items-center gap-4">
        <button className="btn btn-circle btn-ghost btn-sm" onClick={onBack}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <h1 className="text-xl font-bold uppercase tracking-tight">Challenge Analysis</h1>
      </div>
      
      {!chartData && !isProcessing && !capturedData && (
        <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-base-300 rounded-2xl bg-base-200">
          <p className="text-sm text-gray-500">Awaiting simulator data submission...</p>
        </div>
      )}

      {isProcessing && (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <LoadingAnimation />
          <p className="text-sm opacity-60 mt-6 animate-pulse uppercase font-semibold tracking-wider">
            Comparing Frequency Response...
          </p>
        </div>
      )}

      {chartData && !isProcessing && (
        <div className="animate-in fade-in duration-500">
          <Results chartData={chartData} />
        </div>
      )}
    </div>
  );
}