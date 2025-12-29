export default function ProblemDescription({problem}) {

  // Reusable tags for UI — not tied to individual problems
  const globalTags = ["Topics", "Companies", "Hints"];

  return (
    <div className="w-full h-[calc(100vh-1rem)] p-6 overflow-y-auto">

      <h1 className="text-[1.5em] font-semibold mb-2">{problem.title}</h1>

      <div className="flex items-center gap-3 mb-4">
        <span className="badge badge-success">{problem.difficulty}</span>

        {/* Shared tags */}
        {globalTags.map((tag, i) => (
          <span key={i} className="badge badge-outline bg-gray-200">{tag}</span>
        ))}
      </div>

      {/* Description & formula lines */}
      <p className="leading-7 mb-4">{problem.description}</p>

      {/* Render examples dynamically */}
      {problem.examples.map((ex, i) => (
        <div key={i} className="mb-4">
          <h3 className="font-semibold text-lg mt-4 mb-1">Example {i + 1}:</h3>
          <div className="bg-base-200 p-4 rounded">
            <p><b>Input:</b> {ex.input}</p>
            <p><b>Output:</b> {ex.output}</p>
          </div>
        </div>
      ))}

    </div>
  );
}
