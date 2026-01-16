import Simulator from "@/components/Simulator";
import { Hourglass } from "lucide-react";

export default function TemplateSection({ problem, updateProblem, onNext, onBack }) {
  const handleCapture = (data, sim) => {
    if (!sim) return;
    updateProblem({ templateCircuit: sim.exportCircuit() });
  };

  return (
    <section id="section-3" className="relative flex h-screen w-full shrink-0 bg-white">
      <div className="w-[70%] h-full">
        <Simulator mode="export" onSubmit={handleCapture} />
      </div>
      <div className="w-[30%] h-full p-10 flex flex-col gap-6 bg-base-50 border-l">
        <button onClick={onBack} className="btn btn-ghost p-0 w-fit opacity-50 hover:opacity-100">
           <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2"/><path d="m12 8-4 4 4 4"/><path d="M16 12H8"/>
        </svg>
        </button>
        <h2 className="text-2xl font-black text-blue-600 uppercase tracking-tighter">03. Initial Template</h2>
        <div className={`p-6 rounded-2xl border-2 transition-all text-center ${problem.templateCircuit ? "bg-green-50 border-green-500 text-green-700" : "bg-white border-dashed border-gray-300"}`}>
            <p className="text-sm font-bold">{problem.templateCircuit ? "Template Captured" : "Design and click Submit"}</p>
        </div>
        <button onClick={onNext} className="absolute bottom-12 right-12 btn bg-blue-600 text-white btn-lg rounded-full px-10">Capture Solution</button>
      </div>
    </section>
  );
}