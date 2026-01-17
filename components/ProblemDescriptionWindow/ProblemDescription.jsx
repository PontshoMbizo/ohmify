"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css'; // Essential for symbols to render correctly

export default function ProblemDescription({ problem }) {
  // Reusable tags for UI 
  const extraTags = ["Companies", "Hints"];

  // Mapping difficulty to DaisyUI colors
  const diffBadgeColor = {
    Easy: "badge-success",
    Medium: "badge-warning",
    Hard: "badge-error"
  }[problem.difficulty] || "badge-ghost";

  return (
    <div className="w-full max-h-screen p-6 overflow-y-auto bg-white text-gray-800">
      
      {/* Title */}
      <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">
        {problem.title}
      </h1>

      {/* Meta Badges */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className={`badge ${diffBadgeColor} font-bold`}>
          {problem.difficulty}
        </span>

        {/* Dynamic Topics from Problem Data */}
        {problem.topic?.map((t, i) => (
          <span key={i} className="badge badge-outline border-gray-300 bg-gray-50 text-gray-600">
            {t}
          </span>
        ))}

        {/* Global Extras */}
        {extraTags.map((tag, i) => (
          <span key={i} className="badge badge-ghost opacity-50">{tag}</span>
        ))}
      </div>

      {/* RENDER MARKDOWN DESCRIPTION */}
      <div className="prose prose-slate max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-code:text-blue-600 prose-pre:bg-gray-900 prose-pre:text-gray-100">
      {/* <ReactMarkdown 
          remarkPlugins={[remarkGfm, remarkMath]} 
          rehypePlugins={[rehypeKatex]}
        >
          {problem.description}
        </ReactMarkdown> */}

                <ReactMarkdown 
          remarkPlugins={[remarkGfm, remarkMath]} 
        >
          {problem.description}
        </ReactMarkdown>
      </div>

      {/* Render examples dynamically (if they exist) */}
      {problem.examples && problem.examples.length > 0 && (
        <div className="mt-8 pt-8 border-t border-gray-100">
          {problem.examples.map((ex, i) => (
            <div key={i} className="mb-6">
              <h3 className="font-black text-sm uppercase tracking-widest text-gray-400 mb-2">
                Example {i + 1}
              </h3>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 font-mono text-sm">
                <p><b className="text-gray-400">Input:</b> {ex.input}</p>
                <p><b className="text-gray-400">Output:</b> {ex.output}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}