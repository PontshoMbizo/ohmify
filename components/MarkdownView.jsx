"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeMathjax from "rehype-mathjax";

// Shared GFM + math markdown renderer. Used by the problem statement and the
// Creator Studio live description preview so both render identically.
const components = {
  h1: ({ children }) => <h1 className="text-2xl font-black mt-8 mb-3">{children}</h1>,
  h2: ({ children }) => <h2 className="text-xl font-bold mt-6 mb-2">{children}</h2>,
  p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table className="table table-zebra my-6 w-full">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="font-bold bg-gray-100">{children}</th>,
  td: ({ children }) => <td>{children}</td>,
};

export default function MarkdownView({ children, className = "" }) {
  const text = (children || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return (
    <div className={`prose prose-slate max-w-none ${className}`}>
      <div className="not-prose">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeMathjax]}
          components={components}
        >
          {text}
        </ReactMarkdown>
      </div>
    </div>
  );
}
