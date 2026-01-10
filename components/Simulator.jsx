"use client";

import { useState, useRef } from "react";
import { samplingUtils } from "@/lib/samplingUtils";

export default function Simulator({ 
  circuit, 
  onSubmit, 
  mode = "sample", 
  isDigital = false, 
  timestep = 5e-6 
}) {
  const [fullScreen, setFullScreen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const iframeRef = useRef(null);

  const getSim = () => iframeRef.current?.contentWindow?.CircuitJS1 || null;

  const handleIframeLoad = () => {
    setTimeout(loadCircuit, 1000);
  };

  const loadCircuit = () => {
    const sim = getSim();
    if (!sim) {
      setTimeout(loadCircuit, 10);
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

    if (mode === "export") {
      onSubmit(null, sim); 
      return;
    }

    const currentTime = sim.getTime();
    if (currentTime > 0) {
      alert("Please click 'Reset' in the simulator to return to 0ms for accurate grading.");
      return;
    }

    try {
      setIsAnalyzing(true);
      
      let digitalParams = { clkElm: null, inputs: [], outputs: [] };

      if (isDigital) {
        const elms = sim.getElements();
        
        elms.forEach(elm => {
          // 1. Search getInfo for the clock generator
          const info = elm.getInfo();
          if (info && info[0] && info[0].toLowerCase().includes("square wave gen")) {
            digitalParams.clkElm = elm;
          }
          
          // 2. Search for Labeled Nodes for Bus Packing
          if (elm.getType() === "LabeledNodeElm") {
            const label = elm.getLabelName();
            const inputMatch = label.match(/^Input(\d+)$/);
            const outputMatch = label.match(/^Output(\d+)$/);

            if (inputMatch) digitalParams.inputs.push(label);
            if (outputMatch) digitalParams.outputs.push(label);
          }
        });

        const sortNumericLabels = (arr) => arr.sort((a, b) => {
          const numA = parseInt(a.replace(/\D/g, ""), 10);
          const numB = parseInt(b.replace(/\D/g, ""), 10);
          return numA - numB;
        });

        digitalParams.inputs = sortNumericLabels(digitalParams.inputs);
        digitalParams.outputs = sortNumericLabels(digitalParams.outputs);

        if (!digitalParams.clkElm) {
          throw new Error("Digital Discovery Failed: No element found with 'square wave gen' in its info.");
        }

        if (digitalParams.outputs.length === 0) {
          throw new Error("Digital Discovery Failed: No nodes labeled 'Output0', 'Output1', etc. found.");
        }
      } 
      // Apply universal simulation settings
      sim.setSimRunning(true);
      sim.setMaxTimeStep(timestep);

      let capturedData;
      if (isDigital) {
        capturedData = await samplingUtils.captureDigital(sim, {
          inputs: digitalParams.inputs,
          outputs: digitalParams.outputs,
          numCycles: 330
        });
      } else {
        /**
         * UPDATED: Now uses Voltmeter discovery in samplingUtils.
         * We pass numSamples (30720) directly.
         */
        capturedData = await samplingUtils.captureAnalog(sim, 30720);
      }
      
      onSubmit(capturedData, sim); 
    } catch (err) {
      alert(err.message || err);
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
            <p className="mt-4 font-mono text-sm animate-pulse uppercase">
              {isDigital ? "sampling Logic signals..." : "Sampling Analog Signal..."}
            </p>
          </div>
        )}

        <button 
          onClick={() => setFullScreen(!fullScreen)} 
          className="absolute z-50 p-2 bg-green-500 text-white rounded-full top-2 right-2 shadow-lg transition-transform hover:scale-110 active:scale-95"
        >
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
           </svg>
        </button>

        <button 
          disabled={isAnalyzing} 
          onClick={handleInternalSubmit} 
          className="absolute bottom-6 right-2 z-50 btn btn-primary px-6 uppercase font-bold shadow-xl"
        >
          {isAnalyzing ? "Analyzing..." : "Submit"}
        </button>

        <iframe 
          ref={iframeRef} 
          src="/circuitAPI/circuitjs.html?startCircuit=blank.txt" 
          onLoad={handleIframeLoad} 
          className={`w-full h-full border-none transition-all ${fullScreen ? "fixed inset-0 z-40 w-screen h-screen" : ""}`} 
        />
      </div>
    </div>
  );
}