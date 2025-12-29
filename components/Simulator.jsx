"use client";

import { useState, useRef } from "react";
import { samplingUtil } from "@/lib/samplingUtil";

// Added 'nodes' prop with a default value of ["output"]
export default function Simulator({ circuit, onSubmit, mode = "sample", nodes = ["output"] }) {
  const [fullScreen, setFullScreen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const iframeRef = useRef(null);

  const getSim = () => iframeRef.current?.contentWindow?.CircuitJS1 || null;

  const handleIframeLoad = () => {
    setTimeout(tryLoadCircuit, 1000);
  };

  const tryLoadCircuit = () => {
    const sim = getSim();
    if (!sim) {
      setTimeout(tryLoadCircuit, 10);
      return;
    }
    try {
      sim.importCircuit(circuit, false);
      sim.setSimRunning(false);
    } catch (e) {
      console.error("❌ Error loading circuit:", e);
    }
  };

  const handleInternalSubmit = async () => {
    const sim = getSim();
    if (!sim) return;

    // MODE 1: EXPORT (Used in Section 3)
    if (mode === "export") {
      const circuitString = sim.exportCircuit();
      onSubmit(null, sim); 
      return;
    }

    // MODE 2: SAMPLE (Used in Section 4 & Student Mode)
    const currentTime = sim.getTime();
    if (currentTime > 0) {
      alert(
        `Simulation is at t = ${(currentTime * 1000).toFixed(2)}ms.\n\n` +
        "Please click 'Reset' in the simulator to return to 0ms for accurate grading."
      );
      return;
    }

    // Dynamic Validation: Ensure ALL requested nodes exist before starting
    const missingNodes = nodes.filter(node => {
      const v = sim.getNodeVoltage(node);
      return v === undefined || isNaN(v);
    });

    if (missingNodes.length > 0) {
      alert(`Verification Failed: Missing labeled node(s): ${missingNodes.join(", ")}`);
      return;
    }

    try {
      setIsAnalyzing(true);
      sim.setSimRunning(true);

      /** * Switch to generalized utility:
       * Now passing the 'nodes' array to capture multiple points (input, output, etc.)
       */
      const capturedData = await samplingUtil.captureNodes(sim, nodes, 30720);
      
      onSubmit(capturedData, sim); 
    } catch (err) {
      console.error("❌ Analysis Error:", err);
      alert(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-2 bg-base-100">
      <div className="relative h-full w-full rounded-lg border bg-base-200 overflow-hidden shadow-inner">
        
        {isAnalyzing && (
          <div className="absolute inset-0 z-[60] bg-black/10 backdrop-blur-sm flex flex-col items-center justify-center text-white text-center">
            <span className="loading loading-ring loading-lg text-green-400"></span>
            <p className="mt-4 font-mono text-sm tracking-widest animate-pulse uppercase">
              Sampling: {nodes.join(" & ")}...
            </p>
          </div>
        )}

        {/* ... Buttons and Iframe remain unchanged ... */}
        <button
          onClick={() => setFullScreen(!fullScreen)}
          className={"absolute z-50 p-2 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-all active:scale-90" + (fullScreen ? " top-4 right-4" : " top-2 right-2")}
        >
          {fullScreen ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
          )}
        </button>

        <button
          disabled={isAnalyzing}
          onClick={handleInternalSubmit}
          className="absolute bottom-6 right-2 z-50 btn btn-primary shadow-2xl px-6 border-none bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 transition-colors uppercase tracking-wider font-bold"
        >
          {isAnalyzing ? "Sampling..." : "submit"}
        </button>

        <iframe
          ref={iframeRef}
          src="/circuitAPI/circuitjs.html?startCircuit=blank.txt"
          onLoad={handleIframeLoad}
          className={"w-full h-full border-none transition-all " + (fullScreen ? "fixed inset-0 z-40 w-screen h-screen" : "")}
        />
      </div>
    </div>
  );
}