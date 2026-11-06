"use client";

import { CheckCircle2 } from "lucide-react";
import Simulator from "@/components/Simulator";
import SimulatorEmbed from "@/components/SimulatorEmbed";
import { EMBED_CONFIG } from "@/lib/embedConfig";

// Per-strategy labelling conventions the captured circuit must follow
// (see docs/CREATOR-CONVENTIONS.md).
const CONVENTIONS = {
  load: ['Place one voltmeter across the output, info labelled "output"', 'Optional "input" node for the reference'],
  signal: ['One voltmeter across the output', 'Optional "input" node for the reference'],
  digital: ['A "square wave gen" acts as the clock', 'Label a node "clk"', 'Output bus nodes "Output0", "Output1", … (LSB first)'],
  fpga: ['Write the starter Verilog module (can be an incomplete stub)', 'Click "Save starter" — no need to compile first'],
  mcu: ['Write the starter firmware (can be an incomplete stub)', 'Click "Save starter" — no need to build first'],
};

export default function TemplateSection({ problem, updateProblem }) {
  const type = problem.testType || "load";
  const isEmbedded = problem.simulatorType && problem.simulatorType !== "circuitjs";
  const captured = isEmbedded ? !!problem.starterCode : !!problem.templateCircuit;

  const handleCapture = (_data, sim) => {
    if (!sim) return;
    updateProblem({ templateCircuit: sim.exportCircuit() });
  };

  return (
    <section className="flex h-full w-full bg-white">
      {/* SIMULATOR */}
      <div className={`w-[70%] h-full ${isEmbedded ? "bg-white" : "bg-[#070707]"}`}>
        {isEmbedded ? (
          <SimulatorEmbed
            {...EMBED_CONFIG[problem.simulatorType]}
            bridge={{
              mode: "export",
              starterCode: problem.starterCode || "",
              onResult: (r) => updateProblem({ starterCode: r.code }),
            }}
          />
        ) : (
          <Simulator mode="export" onSubmit={handleCapture} />
        )}
      </div>

      {/* SIDEBAR */}
      <div className="w-[30%] h-full p-7 flex flex-col gap-5 border-l border-slate-200 bg-slate-50 overflow-y-auto">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step 3</p>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-blue-600">Starter Template</h2>
          <p className="text-xs text-slate-500 mt-1">
            {isEmbedded
              ? 'Author the starter code, then click "Save starter" in the simulator.'
              : "Design the circuit the solver starts from, then Submit to capture it."}
          </p>
        </div>

        {/* Capture status */}
        <div className={`p-5 rounded-2xl border text-center transition-all
          ${captured ? "bg-green-50 border-green-200" : "bg-white border-dashed border-slate-300"}`}>
          {captured ? (
            <div className="flex items-center justify-center gap-2 text-green-700">
              <CheckCircle2 size={18} />
              <span className="text-sm font-black uppercase tracking-tight">{isEmbedded ? "Starter Code Saved" : "Template Captured"}</span>
            </div>
          ) : isEmbedded ? (
            <p className="text-sm font-bold text-slate-500">Write the starter, then click <span className="text-blue-600">Save starter</span> in the simulator</p>
          ) : (
            <p className="text-sm font-bold text-slate-500">Design, then click <span className="text-blue-600">Submit</span> in the simulator</p>
          )}
        </div>

        {/* Conventions hint */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Labelling — {isEmbedded ? problem.simulatorType : type}</p>
          <ul className="space-y-1.5">
            {CONVENTIONS[isEmbedded ? problem.simulatorType : type].map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
