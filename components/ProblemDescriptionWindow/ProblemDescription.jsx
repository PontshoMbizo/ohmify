"use client";

import MarkdownView from "@/components/MarkdownView";
import DigitalDataBlock from "./DigitalDataBlock";

export default function ProblemDescription({ problem }) {
  const extraTags = ["Companies", "Hints"];

  const diffBadgeColor = {
    Easy: "badge-success",
    Medium: "badge-warning",
    Hard: "badge-error",
  }[problem.difficulty] || "badge-ghost";

  const boardBadge = {
    fpga: "FPGA · Tang Nano 9K",
    mcu: "MCU · STM32 Blue Pill",
  }[problem.simulatorType];

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

          {boardBadge && (
            <span className="badge bg-indigo-100 text-indigo-700 font-bold">
              {boardBadge}
            </span>
          )}

          {problem.topics?.map((t, i) => (
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
      <MarkdownView className="mb-10">{problem.description}</MarkdownView>

      {/* Payloads Section with ID for Jump Link */}
      <div id="payload-section">
        <DigitalDataBlock problem={problem} />
      </div>
    </div>
  );
}