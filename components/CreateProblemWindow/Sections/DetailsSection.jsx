"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { GeneralUtils } from "@/lib/GeneralUtils";
import MarkdownView from "@/components/MarkdownView";

const PROBLEM_TYPES = GeneralUtils.PROBLEM_TYPES;
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

export default function DetailsSection({ problem, updateProblem }) {
  const [tab, setTab] = useState("write"); // write | preview
  const [advanced, setAdvanced] = useState(false);

  const toggleTopic = (type) => {
    const has = problem.topics.includes(type);
    if (has) {
      updateProblem({ topics: problem.topics.filter((t) => t !== type) });
    } else if (problem.topics.length < 2) {
      updateProblem({ topics: [...problem.topics, type] });
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="max-w-2xl mx-auto py-12 px-6 space-y-7">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step 2</p>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-blue-600">Challenge Details</h2>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Challenge Title</label>
          <input
            type="text"
            value={problem.title}
            placeholder="e.g. Design a Buck Converter"
            className="w-full text-2xl font-black text-slate-900 bg-transparent border-0 border-b-2 border-slate-200 focus:border-blue-500 focus:outline-none pb-2 placeholder:text-slate-200 transition-colors"
            onChange={(e) => updateProblem({ title: e.target.value })}
          />
        </div>

        {/* Description with live preview */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</label>
            <div className="inline-flex p-0.5 rounded-lg bg-slate-100 gap-0.5">
              {["write", "preview"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-md px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-all
                    ${tab === t ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-700"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          {tab === "write" ? (
            <textarea
              value={problem.description}
              placeholder="Describe what the user must design. Use action language: 'Design a circuit that…'. Markdown, tables and LaTeX math are supported."
              className="w-full h-56 text-sm text-slate-700 bg-white border border-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none placeholder:text-slate-300 transition-all"
              onChange={(e) => updateProblem({ description: e.target.value })}
            />
          ) : (
            <div className="w-full min-h-56 text-sm text-slate-700 bg-white border border-slate-200 rounded-xl p-4">
              {problem.description.trim()
                ? <MarkdownView>{problem.description}</MarkdownView>
                : <p className="text-slate-300 text-sm">Nothing to preview yet.</p>}
            </div>
          )}
        </div>

        {/* Topics */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Topics</label>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{problem.topics.length} / 2</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PROBLEM_TYPES.map((type) => {
              const selected = problem.topics.includes(type);
              const disabled = !selected && problem.topics.length >= 2;
              return (
                <button
                  key={type}
                  onClick={() => toggleTopic(type)}
                  disabled={disabled}
                  className={`rounded-full px-4 py-2 text-xs font-bold border transition-all
                    ${selected ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : disabled ? "bg-white text-slate-300 border-slate-100 cursor-not-allowed"
                      : "bg-white text-slate-500 border-slate-200 hover:border-blue-400 hover:bg-blue-50"}`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        {/* Difficulty */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Difficulty</label>
          <div className="inline-flex p-0.5 rounded-xl bg-slate-100 gap-0.5">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => updateProblem({ difficulty: d })}
                className={`rounded-lg px-5 py-1.5 text-xs font-black uppercase tracking-widest transition-all
                  ${problem.difficulty === d ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-700"}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced disclosure */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <button
            onClick={() => setAdvanced((a) => !a)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-left"
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Advanced</p>
              <p className="text-xs text-slate-500">Capture resolution &amp; time step — defaults work for most problems.</p>
            </div>
            <ChevronDown size={18} className={`text-slate-400 transition-transform ${advanced ? "rotate-180" : ""}`} />
          </button>
          {advanced && (
            <div className="grid grid-cols-2 gap-4 px-5 pb-5 pt-1 border-t border-slate-100">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sample Count</label>
                <input
                  type="number" min="330" max="30720"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition-all"
                  value={problem.sampleCount}
                  onChange={(e) => updateProblem({ sampleCount: e.target.value })}
                />
                <p className="text-[10px] text-slate-400">Points per golden capture (330–30 720).</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Time Step (s)</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition-all"
                  value={problem.timeStep}
                  onChange={(e) => updateProblem({ timeStep: e.target.value })}
                />
                <p className="text-[10px] text-slate-400">Solver step the golden is graded against.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
