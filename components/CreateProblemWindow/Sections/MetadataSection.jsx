export default function MetadataSection({ problem, updateProblem, onNext }) {
  return (
    <section id="section-1" className="relative flex h-screen w-full flex-col items-center bg-base-100 shrink-0 px-4">
      <div className="flex w-full max-w-3xl flex-col gap-3">
        <h2 className="text-3xl mt-12 font-black text-green-600 uppercase tracking-tighter">01. Problem Metadata</h2>
        <input 
          type="text" 
          value={problem.title}
          placeholder="Challenge Title" 
          className="input input-bordered input-lg w-full font-bold shadow-sm" 
          onChange={(e) => updateProblem({ title: e.target.value })} 
        />
        <textarea 
          value={problem.description}
          placeholder="Description..." 
          className="h-48 w-full rounded-xl border border-base-300 p-6 text-lg shadow-inner bg-white outline-none focus:ring-2 focus:ring-blue-500/20" 
          onChange={(e) => updateProblem({ description: e.target.value })} 
        />
        <div className="flex gap-4">
            <div className="flex-1">
                <label className="label text-xs font-bold opacity-50 uppercase">Difficulty</label>
                <select className="select select-bordered w-full" value={problem.difficulty} onChange={(e) => updateProblem({ difficulty: e.target.value })}>
                    <option>Easy</option><option>Medium</option><option>Hard</option>
                </select>
            </div>
            <div className="flex-1">
            <label className="label text-xs font-bold opacity-50 uppercase">samples/cycles</label>
              <input
              type="number"
              className="input validator"
              required
              placeholder="number of samples/cycles"
              min="330"
              max="30720"
              onChange={(e) => updateProblem({sampleCount: e.target.value})}
            />
            </div>
        </div>
      </div>
      <button onClick={onNext} className="absolute bottom-18 right-12 btn btn-primary btn-lg rounded-full px-10 shadow-xl">Next Step</button>
    </section>
  );
}