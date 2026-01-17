import Simulator from "@/components/Simulator";
import { GeneralUtils } from "@/lib/GeneralUtils";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import {Hourglass} from "lucide-react"

export default function SolutionSection({ problem, user, updateProblem, onBack, isPublishing, setIsPublishing }) {
  
  const handleCaptureSolution = (capturedData) => {
    let dataString = "";
    if (capturedData.type === "digital") {
      dataString = capturedData.table.map(row => row.decimalOutput).join("\n");
    } else {
      dataString = capturedData.data.output.join("\n");
    }
    updateProblem({ solutionData: dataString, timeStep : capturedData.timeStep });
  };

  const finalizeProblem = async () => {
    if (!user) return alert("Sign in required.");
    if (!problem.solutionData) return alert("Please run the simulation and click 'Submit' to capture the solution first.");
    
    setIsPublishing(true);
    try {
      const mainDocData = {
        title: problem.title,
        creatorId: user.uid,
        creatorName: user.displayName,
        description: problem.description,
        difficulty: problem.difficulty,
        topics: problem.topics,
        isDigital: GeneralUtils.isDigitalProblem(problem.topics),
        createdAt: serverTimestamp(),
      };

      const problemRef = await addDoc(collection(db, "Problems"), mainDocData);

      // Save initial circuit state
      await setDoc(doc(db, "Problems", problemRef.id, "initialCircuit", "data"), {
        payload: problem.templateCircuit,
        version: 1
      });

      // Save sampled waveform data
      await setDoc(doc(db, "Problems", problemRef.id, "solutionWaveform", "data"), {
        samples: problem.solutionData,
        sampleCount: problem.sampleCount,
        timeStep: problem.timeStep
      });

      alert("Problem Published Successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Publishing Error:", error);
      alert("Error publishing to database.");
      setIsPublishing(false);
    }
  };

  return (
    <section id="section-4" className="relative flex h-screen w-full shrink-0 bg-white border-t border-gray-100">
      
      {/* Simulator Side */}
      <div className="w-[70%] h-full text-black relative">
        <Simulator 
          nodes={["input", "output"]}
          circuit={problem.templateCircuit} 
          onSubmit={handleCaptureSolution}
          isDigital={GeneralUtils.isDigitalProblem(problem.topics)}
          sampleCount={problem.sampleCount}
        />
      </div>

      {/* Control Side */}
      <div className="w-[30%] h-full p-10 flex flex-col gap-6 bg-base-50 border-l relative">
        
        {/* Fixed Back Button */}
        <button 
          onClick={onBack} 
          className="btn btn-ghost btn-sm p-0 w-fit opacity-50 hover:opacity-100 transition-opacity mb-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2"/><path d="m12 8-4 4 4 4"/><path d="M16 12H8"/>
          </svg>
        </button>

        <h2 className="text-2xl font-black text-blue-600 uppercase tracking-tighter">
          04. Gold Standard
        </h2>
        
        <p className="text-sm opacity-70 leading-relaxed">
          {GeneralUtils.isDigitalProblem(problem.topics) 
            ? "Ensure a 'clk' label is present. Run the simulation and click Submit to capture the bit-vector output." 
            : "Ensure 'input' and 'output' labels are defined. Capture the ideal analog response for verification."}
        </p>

        {/* Sample Status Indicator */}
        <div className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
          problem.solutionData 
            ? "bg-green-50 border-green-500 text-green-700 shadow-sm" 
            : "bg-white border-dashed border-gray-300"
        }`}>
          <div className="flex items-center gap-3">
            {problem.solutionData ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <Hourglass size={18} color="gray"/>
            )}
            <p className="text-center text-sm font-bold uppercase tracking-tight">
              {problem.solutionData ? "Waveform Captured" : "Awaiting Sampling..."}
            </p>
          </div>
          {problem.solutionData && (
            <p className="text-[10px] mt-2 opacity-60 font-mono truncate">
              DATA: {problem.solutionData.substring(0, 30)}...
            </p>
          )}
        </div>

        <div className="mt-auto pt-6 border-t border-gray-200">
          <button 
            disabled={isPublishing || !problem.solutionData} 
            onClick={finalizeProblem} 
            className="btn bg-blue-600 hover:bg-blue-700 btn-lg w-full text-white font-black uppercase shadow-2xl disabled:bg-gray-300 disabled:text-gray-500"
          >
            {isPublishing ? (
              <>
                <span className="loading loading-spinner"></span>
                Publishing...
              </>
            ) : (
              "Finalize & Publish"
            )}
          </button>
          <p className="text-[9px] text-center mt-4 opacity-40 uppercase font-bold tracking-widest">
            Stored in Problems Collection
          </p>
        </div>
      </div>
    </section>
  );
}