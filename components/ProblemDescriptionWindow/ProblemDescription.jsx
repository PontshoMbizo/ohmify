"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeMathjax from "rehype-mathjax";
import DigitalDataBlock from "./DigitalDataBlock";

export default function ProblemDescription({ problem }) {
  const extraTags = ["Companies", "Hints"];

  const diffBadgeColor = {
    Easy: "badge-success",
    Medium: "badge-warning",
    Hard: "badge-error",
  }[problem.difficulty] || "badge-ghost";

  const description = problem.description
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return (
    <div className="w-full h-full p-6 overflow-y-auto bg-white text-gray-800 border-r border-base-200 scroll-smooth">
      {/* Title */}
      <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">
        {problem.title}
      </h1>

      {/* Meta Badges & Jump Link */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`badge ${diffBadgeColor} font-bold`}>
            {problem.difficulty}
          </span>

          {problem.topic?.map((t, i) => (
            <span
              key={i}
              className="badge badge-outline border-gray-300 bg-gray-50 text-gray-600"
            >
              {t}
            </span>
          ))}

          {extraTags.map((tag, i) => (
            <span key={i} className="badge badge-ghost opacity-50">
              {tag}
            </span>
          ))}
        </div>

        {/* JUMP LINK: Only visible for digital test types */}
        {problem.testType === "digital" && (
          <a
            href="#payload-section"
          >
          <span className="badge bg-green-100 text-green-600 font-bold">
              SRAM payloads
            </span>
          </a>
        )}
      </div>

      {/* Markdown + Math */}
      <div className="prose prose-slate max-w-none mb-10">
        <div className="not-prose">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeMathjax]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-2xl font-black mt-8 mb-3">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl font-bold mt-6 mb-2">{children}</h2>
              ),
              p: ({ children }) => (
                <p className="mb-4 leading-relaxed">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto">
                  <table className="table table-zebra my-6 w-full">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="font-bold bg-gray-100">{children}</th>
              ),
              td: ({ children }) => <td>{children}</td>,
            }}
          >
            {description}
          </ReactMarkdown>
        </div>
      </div>

      {/* Payloads Section with ID for Jump Link */}
      <div id="payload-section">
        <DigitalDataBlock problem={problem} />
      </div>
    </div>
  );
}