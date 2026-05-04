"use client";

export default function MetadataSection({ problem, updateProblem, onNext }) {
  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="max-w-2xl mx-auto py-12 px-6 space-y-6">

        {/* Title input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Challenge Title
          </label>
          <input
            type="text"
            value={problem.title}
            placeholder="e.g. Design a Buck Converter"
            className="w-full text-2xl font-black text-gray-900 bg-transparent border-0 border-b-2 border-gray-200 focus:border-green-500 focus:outline-none pb-2 placeholder:text-gray-200 transition-colors"
            onChange={(e) => updateProblem({ title: e.target.value })}
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Problem Description
          </label>
          <textarea
            value={problem.description}
            placeholder="Describe what the user must design. Use action language: 'Design a circuit that...' Supports Markdown."
            className="w-full h-52 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 resize-none placeholder:text-gray-300 transition-all"
            onChange={(e) => updateProblem({ description: e.target.value })}
          />
        </div>

        {/* Difficulty + Samples */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Difficulty
            </label>
            <select
              className="w-full text-sm font-semibold bg-white border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all"
              value={problem.difficulty}
              onChange={(e) => updateProblem({ difficulty: e.target.value })}
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Sample Count
            </label>
            <input
              type="number"
              className="w-full text-sm font-semibold bg-white border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all"
              value={problem.sampleCount}
              min="330"
              max="30720"
              onChange={(e) => updateProblem({ sampleCount: e.target.value })}
            />
          </div>
        </div>

        {/* Hint text */}
        <p className="text-xs text-gray-300 font-medium">
          Tip: Use Markdown in your description — tables, code blocks, and math (LaTeX) are all supported.
        </p>

        <div className="flex justify-end pt-2">
          <button
            onClick={onNext}
            disabled={!problem.title.trim()}
            className="px-8 py-2.5 rounded-full text-sm font-black uppercase tracking-widest bg-green-600 text-white shadow-md hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none transition-all"
          >
            Next Step
          </button>
        </div>
      </div>
    </div>
  );
}