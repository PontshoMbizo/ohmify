"use client";

import React, { useState } from "react";
import Footer from "@/components/LandingPage/Footer";

const Section = ({ children, className = "" }) => (
  <section className={`space-y-6 ${className}`}>{children}</section>
);

const SectionTitle = ({ number, children, color = "text-green-600" }) => (
  <div className="space-y-1">
    {number && (
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{number}</p>
    )}
    <h2 className={`text-2xl font-black uppercase tracking-tighter ${color}`}>{children}</h2>
  </div>
);

const Step = ({ number, title, children }) => (
  <div className="flex gap-4">
    <div className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
      {number}
    </div>
    <div className="space-y-1">
      <p className="text-sm font-black text-gray-800">{title}</p>
      <p className="text-sm text-gray-500 leading-relaxed">{children}</p>
    </div>
  </div>
);

const InfoBox = ({ children, color = "blue" }) => {
  const colors = {
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    green: "bg-green-50 border-green-200 text-green-800",
    amber: "bg-amber-50 border-amber-200 text-amber-800",
    red: "bg-red-50 border-red-200 text-red-800",
  };
  return (
    <div className={`border rounded-xl px-4 py-3 text-sm font-medium ${colors[color]}`}>
      {children}
    </div>
  );
};

const Badge = ({ children, color = "gray" }) => {
  const colors = {
    gray: "bg-gray-100 text-gray-600",
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    amber: "bg-amber-100 text-amber-700",
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${colors[color]}`}>
      {children}
    </span>
  );
};

const Divider = () => <hr className="border-gray-100" />;

export default function Help() {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: "My circuit looks correct but I keep getting 'Inaccurate' — why?",
      a: "The most common cause is forgetting to click Reset before Submit. If the simulation time is not at t = 0ms when you submit, the captured waveform will be offset from the gold standard. Always reset, then submit."
    },
    {
      q: "What does NRMSE mean?",
      a: "Normalized Root Mean Square Error — a percentage that measures how far your output waveform deviates from the gold standard. 0% is a perfect match. The pass threshold depends on the problem's topic (e.g. Power Electronics allows up to 30%, Control Systems up to 8%)."
    },
    {
      q: "Do I need to wire up both input and output nodes?",
      a: "Yes. The grader samples the node labeled 'output'. For analog/load problems it also captures the node labeled 'input' to produce Bode and spectrum plots. Missing or misspelled labels mean no data is captured."
    },
    {
      q: "My draft disappeared. Can I recover it?",
      a: "Drafts are saved to your browser's localStorage, so they persist across page refreshes on the same device and browser. If you cleared site data or switched browsers, the draft is gone. Use the Reset Template button only if you want to discard your work."
    },
    {
      q: "For a digital problem, do I need to pass all three tests?",
      a: "Yes. All three payload tests (A, B, C) must be passed for the problem to be marked complete. Each test is graded independently — run them one at a time using the test tabs."
    },
    {
      q: "As a creator, can I edit a published problem?",
      a: "Not yet — editing published problems is not supported in the current version. Plan your testbench carefully before publishing."
    },
    {
      q: "What's the difference between Sample Count and Time Step?",
      a: "Time Step (dt) controls the simulation resolution — how many seconds each simulation tick represents. Sample Count is the total number of data points captured. Together they determine the total captured duration: duration = sampleCount × timeStep."
    },
  ];

  return (
    <>
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-16 text-base-content pb-24">

        {/* ── HERO ── */}
        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Documentation</p>
          <h1 className="text-5xl font-black uppercase tracking-tighter text-green-600 leading-none">
            Guide to Ohmify
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl leading-relaxed">
            Ohmify is a circuit-design challenge platform powered by CircuitJS. Browse problems, build solutions in an interactive simulator, and receive automated, waveform-level grading — or create challenges for others.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <a href="#solving" className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wide bg-green-600 text-white hover:bg-green-700 transition-colors">Solving Problems</a>
            <a href="#results" className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wide bg-white border border-gray-200 text-gray-600 hover:border-green-400 transition-colors">Reading Results</a>
            <a href="#types" className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wide bg-white border border-gray-200 text-gray-600 hover:border-green-400 transition-colors">Problem Types</a>
            <a href="#creating" className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wide bg-white border border-gray-200 text-gray-600 hover:border-green-400 transition-colors">Creating Challenges</a>
            <a href="#reference" className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wide bg-white border border-gray-200 text-gray-600 hover:border-green-400 transition-colors">Technical Reference</a>
          </div>
        </div>

        <Divider />

        {/* ── SOLVING A PROBLEM ── */}
        <Section id="solving">
          <SectionTitle number="01">Solving a Problem</SectionTitle>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
            Each problem gives you a starter circuit (the template) and a description of what to design. Your job is to build the solution circuit in the simulator, then submit it for automated grading.
          </p>

          <div className="space-y-5 pt-2">
            <Step number="1" title="Open the Problem">
              From the Problems list, click any challenge to open the problem page. The left panel shows the description; the right panel is the interactive CircuitJS simulator pre-loaded with the template circuit.
            </Step>
            <Step number="2" title="Read the Description Carefully">
              The description specifies what your circuit must do — output voltage levels, frequency response, logic behavior, etc. Note the difficulty and topics, as they influence the grading threshold.
            </Step>
            <Step number="3" title="Design Your Circuit">
              Add, remove, or modify components directly in the simulator. The template provides the I/O scaffolding — do not remove or rename the labeled nodes (typically <code className="bg-gray-100 px-1 rounded text-xs font-mono">output</code> and <code className="bg-gray-100 px-1 rounded text-xs font-mono">input</code>). Build your solution around them.
            </Step>
            <Step number="4" title="Reset the Simulation">
              Before submitting, always click the <strong>Reset</strong> button inside the simulator. This resets simulation time to t = 0ms. Submitting without resetting will capture a waveform that is time-shifted relative to the gold standard, causing incorrect grading.
            </Step>
            <Step number="5" title="Submit">
              Click the <strong>Submit</strong> button. The engine runs the simulation forward, samples the output node, and hands the data to the AutoMarker for grading.
            </Step>
            <Step number="6" title="Review Your Results">
              The AutoMarker opens automatically and shows your score, verdict, and detailed waveform charts. See the Results section below for a full breakdown.
            </Step>
            <Step number="7" title="Iterate">
              Click the back arrow in the AutoMarker to return to the simulator and refine your design. Your last circuit is automatically saved to your browser — you can also refresh the page and continue where you left off.
            </Step>
          </div>

          <InfoBox color="amber">
            <strong>Draft auto-save:</strong> Your circuit is saved to browser localStorage after every Submit. If you accidentally close the tab, your work is still there when you reopen the problem. Use <em>Reset Template</em> (bottom-right corner of the simulator) only if you want to discard your progress and start from scratch.
          </InfoBox>
        </Section>

        <Divider />

        {/* ── RESULTS ── */}
        <Section id="results">
          <SectionTitle number="02" color="text-blue-600">Reading Your Results</SectionTitle>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
            After submitting, the AutoMarker replaces the simulator and shows a detailed analysis. The layout changes slightly depending on whether the problem is analog or digital.
          </p>

          <div className="grid md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3 p-5 rounded-2xl border border-gray-100 bg-white">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Scorecard</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                The top banner shows your <strong>verdict</strong> (Accepted / Inaccurate), a <strong>score %</strong>, and for analog problems, the raw <strong>NRMSE</strong> value. Green = passed, red = failed.
              </p>
            </div>
            <div className="space-y-3 p-5 rounded-2xl border border-gray-100 bg-white">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Test Tabs</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                For Load and Digital problems, three tabs appear (No Load / Max Load / Min Load, or Test A / B / C). Each tab is graded independently. A green checkmark means that test passed.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <p className="text-sm font-black uppercase tracking-widest text-gray-400">Analysis Views (Analog)</p>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { tab: "Time Domain", desc: "Overlays your output voltage against the gold standard over time. For load tests, a second graph shows current (mA) derived from the testbench resistance." },
                { tab: "Frequency Spectrum", desc: "Shows the FFT magnitude of your output vs. the expected output. Useful for filter and DSP problems to verify frequency content." },
                { tab: "Bode Plot", desc: "Shows gain (dB) and phase (°) vs. frequency on a log scale. Ideal for filter cutoff, gain margin, and phase margin verification." },
              ].map(({ tab, desc }) => (
                <div key={tab} className="p-4 rounded-xl border border-gray-100 space-y-2">
                  <p className="text-xs font-black uppercase tracking-wide text-blue-600">{tab}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <p className="text-sm font-black uppercase tracking-widest text-gray-400 pt-2">Analysis Views (Digital)</p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { tab: "Logic Analyzer", desc: "Step-chart comparing expected vs. actual decimal output per clock cycle. Mismatched cycles are highlighted in red." },
                { tab: "Truth Table", desc: "Cycle-by-cycle table showing expected value, your actual output, and a pass/fail indicator. Values are shown in both hex and decimal." },
              ].map(({ tab, desc }) => (
                <div key={tab} className="p-4 rounded-xl border border-gray-100 space-y-2">
                  <p className="text-xs font-black uppercase tracking-wide text-blue-600">{tab}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <InfoBox color="green">
            <strong>Completion:</strong> Once all required tests pass (all 3 for load/digital, test 1 for signal), a "Mission Accomplished" toast appears and your progress is recorded automatically.
          </InfoBox>
        </Section>

        <Divider />

        {/* ── PROBLEM TYPES ── */}
        <Section id="types">
          <SectionTitle number="03">Problem Types & Grading</SectionTitle>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
            Every challenge uses one of three validation strategies. The strategy is chosen by the creator and determines how many tests you need to pass, what the simulator measures, and how your grade is calculated.
          </p>

          <div className="grid md:grid-cols-3 gap-5 pt-2">
            <div className="p-5 rounded-2xl border-2 border-green-200 bg-green-50 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-black uppercase text-green-700">Load Test</p>
                <Badge color="green">Analog / Power</Badge>
              </div>
              <p className="text-xs text-green-800 leading-relaxed">
                Your circuit is tested at three load conditions set by the creator: <strong>No Load</strong> (open circuit), <strong>Max Load</strong>, and <strong>Min Load</strong>. Each measures the output voltage waveform via the node labeled <code className="bg-green-100 px-1 rounded font-mono">output</code>.
              </p>
              <div className="space-y-1 text-[11px] text-green-700 font-medium">
                <p>— 3 tests required to complete</p>
                <p>— Graded by NRMSE vs. gold standard</p>
                <p>— Also captures input for Bode/spectrum</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl border-2 border-blue-200 bg-blue-50 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-black uppercase text-blue-700">Signal Test</p>
                <Badge color="blue">DSP / Waveshaping</Badge>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">
                A single capture of the output waveform — no load variation. Used for filter, waveshaping, and signal-processing problems where the waveform shape itself is the answer.
              </p>
              <div className="space-y-1 text-[11px] text-blue-700 font-medium">
                <p>— 1 test required to complete</p>
                <p>— Graded by NRMSE vs. gold standard</p>
                <p>— Shows time, spectrum, and Bode views</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl border-2 border-purple-200 bg-purple-50 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-black uppercase text-purple-700">Digital Test</p>
                <Badge color="purple">Logic / Gates</Badge>
              </div>
              <p className="text-xs text-purple-800 leading-relaxed">
                Three SRAM payload tests (A, B, C) are pre-loaded into the circuit's memory by the creator. The simulator samples the output bus at every rising clock edge and compares each cycle against the expected value.
              </p>
              <div className="space-y-1 text-[11px] text-purple-700 font-medium">
                <p>— 3 payload tests required to complete</p>
                <p>— Exact cycle-for-cycle match required</p>
                <p>— Values shown in hex (0x…) and decimal</p>
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <p className="text-sm font-black uppercase tracking-widest text-gray-400">Grading Thresholds (NRMSE)</p>
            <p className="text-xs text-gray-500 max-w-xl leading-relaxed">
              For analog problems, the pass threshold is topic-dependent. A lower threshold means stricter grading. If a problem has two topics, the stricter threshold applies.
            </p>
            <div className="overflow-x-auto">
              <table className="table text-sm w-full border border-gray-100 rounded-xl overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-[10px] uppercase tracking-widest font-black text-gray-400">Topic</th>
                    <th className="text-[10px] uppercase tracking-widest font-black text-gray-400">Pass Threshold (NRMSE)</th>
                    <th className="text-[10px] uppercase tracking-widest font-black text-gray-400">Strictness</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Power Electronics", "≤ 30%", "Lenient"],
                    ["RF Electronics", "≤ 12%", "Moderate"],
                    ["Signal Processing", "≤ 10%", "Moderate"],
                    ["Control Systems", "≤ 8%", "Strict"],
                    ["Combinational CCT", "100% match", "Exact"],
                    ["Sequential CCT", "100% match", "Exact"],
                    ["Digital Systems", "100% match", "Exact"],
                    ["Default (unlisted topics)", "≤ 5%", "Strict"],
                  ].map(([topic, threshold, label]) => (
                    <tr key={topic}>
                      <td className="font-medium text-gray-700">{topic}</td>
                      <td className="font-mono text-gray-600">{threshold}</td>
                      <td>
                        <Badge color={label === "Lenient" ? "amber" : label === "Moderate" ? "blue" : label === "Exact" ? "purple" : "gray"}>
                          {label}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        <Divider />

        {/* ── CREATING A PROBLEM ── */}
        <Section id="creating">
          <SectionTitle number="04" color="text-blue-600">Creating a Challenge</SectionTitle>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
            Anyone signed in can publish a challenge via the Create page. The wizard walks you through four steps: details, topics, template circuit, and solution capture.
          </p>

          <InfoBox color="blue">
            <strong>Before you start:</strong> Design and test your solution circuit in CircuitJS before opening the creator wizard. Knowing exactly what your gold standard output looks like will make the capture steps much faster.
          </InfoBox>

          {/* Step 1 */}
          <div className="rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 flex items-center gap-3 border-b border-gray-100">
              <div className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-black shrink-0">1</div>
              <div>
                <p className="text-sm font-black uppercase text-gray-800 tracking-tight">Details</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Title & description</p>
              </div>
            </div>
            <div className="px-6 py-5 space-y-3 text-sm text-gray-600 leading-relaxed">
              <p><strong>Title</strong> — Required. Keep it action-oriented: <em>"Design a Buck Converter"</em>, not <em>"Buck Converter"</em>.</p>
              <p><strong>Description</strong> — Describe what the solver must achieve. Supports full Markdown: headings, tables, code blocks, and inline LaTeX math (e.g. <code className="bg-gray-100 px-1 rounded font-mono text-xs">{'$V_{out} = 3.3\\text{V}$'}</code>). Be explicit about expected output voltages, frequencies, or logic behavior.</p>
              <p><strong>Difficulty</strong> — Easy, Medium, or Hard. This is a guide for solvers, not enforced by the grader.</p>
              <p><strong>Sample Count</strong> — Number of data points to capture per submission (default 30,720, minimum 330). A lower count means faster simulation but less waveform resolution. Keep at default unless you have a specific reason.</p>
              <p className="text-[11px] text-gray-400">Click <strong>Next Step</strong> (requires a title) to proceed.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 flex items-center gap-3 border-b border-gray-100">
              <div className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-black shrink-0">2</div>
              <div>
                <p className="text-sm font-black uppercase text-gray-800 tracking-tight">Topics & Validation</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Category & test strategy</p>
              </div>
            </div>
            <div className="px-6 py-5 space-y-3 text-sm text-gray-600 leading-relaxed">
              <p><strong>Topics</strong> — Select up to 2 tags from the available engineering domains (Power Electronics, Signal Processing, Digital Systems, etc.). Topics affect the grading threshold, so choose them carefully — tagging a lenient analog problem as "Control Systems" will apply a 8% NRMSE threshold.</p>
              <p><strong>Validation Strategy</strong> — Choose one:</p>
              <div className="ml-4 space-y-2">
                <p>• <strong>Load Test</strong> — for power supply, amplifier, or regulator problems with variable output load. You will capture 3 waveforms in Step 4.</p>
                <p>• <strong>Signal Test</strong> — for filter, waveshaping, or DSP problems. You capture a single waveform in Step 4.</p>
                <p>• <strong>Digital Test</strong> — for logic gate, combinational, or sequential circuit problems. You define 3 SRAM payloads and capture 3 clock-edge outputs in Step 4.</p>
              </div>
              <p className="text-[11px] text-gray-400">At least one topic and a validation strategy are required to proceed.</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 flex items-center gap-3 border-b border-gray-100">
              <div className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-black shrink-0">3</div>
              <div>
                <p className="text-sm font-black uppercase text-gray-800 tracking-tight">Template Circuit</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Starter circuit for solvers</p>
              </div>
            </div>
            <div className="px-6 py-5 space-y-3 text-sm text-gray-600 leading-relaxed">
              <p>Build the <strong>starting circuit</strong> that solvers will see when they open your problem. This typically includes the input signal source and any fixed circuit structure the problem requires, plus correctly labeled I/O nodes.</p>
              <p><strong>Node labeling is critical.</strong> The grader reads values by node name. Every circuit must have:</p>
              <div className="ml-4 space-y-1">
                <p>• A node labeled <code className="bg-gray-100 px-1 rounded font-mono text-xs">output</code> — this is what gets sampled and graded.</p>
                <p>• A node labeled <code className="bg-gray-100 px-1 rounded font-mono text-xs">input</code> — required for Bode and spectrum analysis in analog problems.</p>
              </div>
              <p>When the template is ready, click <strong>Submit</strong> inside the simulator. The status indicator on the right will change to "Template Captured". Then click <strong>Next Step</strong>.</p>
              <InfoBox color="amber">
                The template is what solvers start with — do <strong>not</strong> include your solution here. Provide the I/O scaffolding only; leave the actual design work for the solver.
              </InfoBox>
            </div>
          </div>

          {/* Step 4 */}
          <div className="rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 flex items-center gap-3 border-b border-gray-100">
              <div className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-black shrink-0">4</div>
              <div>
                <p className="text-sm font-black uppercase text-gray-800 tracking-tight">Solution Suite</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Gold standard capture</p>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4 text-sm text-gray-600 leading-relaxed">
              <p>The template circuit is pre-loaded with your solution. Build the correct solution circuit here and capture the gold standard output for each test case. This is what every solver's submission will be compared against.</p>

              <div className="space-y-3">
                <p className="font-black text-gray-700 text-xs uppercase tracking-widest">Load Test workflow</p>
                <ol className="list-decimal list-inside space-y-1.5 ml-2">
                  <li>Enter the <strong>Max Load (Ω)</strong> and <strong>Min Load (Ω)</strong> resistor values in the sidebar.</li>
                  <li>Select the <strong>No Load</strong> tab. Set the Voltmeter in the simulator to open-circuit (very high resistance or disconnect). Click Reset, then Submit.</li>
                  <li>Select the <strong>Max Load</strong> tab. Set the Voltmeter resistance to match the Max Load value. Click Reset, then Submit.</li>
                  <li>Select the <strong>Min Load</strong> tab. Set the Voltmeter resistance to match the Min Load value. Click Reset, then Submit.</li>
                </ol>
              </div>

              <div className="space-y-3">
                <p className="font-black text-gray-700 text-xs uppercase tracking-widest">Signal Test workflow</p>
                <ol className="list-decimal list-inside space-y-1.5 ml-2">
                  <li>Build your solution circuit in the simulator.</li>
                  <li>Click Reset, then Submit. One capture is all that is needed.</li>
                </ol>
              </div>

              <div className="space-y-3">
                <p className="font-black text-gray-700 text-xs uppercase tracking-widest">Digital Test workflow</p>
                <ol className="list-decimal list-inside space-y-1.5 ml-2">
                  <li>Enter three SRAM payloads (A, B, C) in the sidebar. Each payload is an address-indexed map of memory values (e.g. <code className="bg-gray-100 px-1 rounded font-mono text-xs">0: 0 17 33</code>).</li>
                  <li>Select the <strong>Test A</strong> tab. Copy Payload A into the simulator's SRAM editor. Click Reset, then Submit.</li>
                  <li>Repeat for Test B and Test C.</li>
                </ol>
              </div>

              <p>Once all required captures are done, click <strong>Publish Challenge</strong>. The problem, template circuit, and all solution waveforms are saved to the database and immediately visible to all users.</p>
              <InfoBox color="red">
                Publishing is permanent in the current version. Double-check your testbench values and solution captures before clicking Publish.
              </InfoBox>
            </div>
          </div>
        </Section>

        <Divider />

        {/* ── TECHNICAL REFERENCE ── */}
        <Section id="reference">
          <SectionTitle number="05">Technical Reference</SectionTitle>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3 p-5 rounded-2xl border border-gray-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Data Format</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Waveform data is stored as newline-separated decimals — one sample value per line. Analog samples are floating-point voltages; digital samples are unsigned integers (0–65535, displayed as hex).
              </p>
              <div className="bg-slate-900 text-slate-300 p-3 rounded-lg font-mono text-[11px] leading-relaxed">
                1.240<br />
                1.452<br />
                1.671<br />
                <span className="text-slate-500">...</span>
              </div>
            </div>

            <div className="space-y-3 p-5 rounded-2xl border border-gray-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Simulation Parameters</p>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="font-medium">Time Step (dt)</span>
                  <span className="font-mono text-gray-500">default: 5×10⁻⁶ s</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="font-medium">Max Sample Count</span>
                  <span className="font-mono text-gray-500">30,720 points</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="font-medium">Min Sample Count</span>
                  <span className="font-mono text-gray-500">330 points</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="font-medium">Digital Max Cycles</span>
                  <span className="font-mono text-gray-500">256 clock edges</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="font-medium">Sample Rate</span>
                  <span className="font-mono text-gray-500">1 / dt</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-5 rounded-2xl border border-gray-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Required Node Labels</p>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex gap-3 items-start">
                  <code className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-mono text-xs shrink-0">output</code>
                  <p>Required on all problems. The grader measures voltage at this node.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <code className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-mono text-xs shrink-0">input</code>
                  <p>Required for Bode and frequency spectrum analysis on analog problems.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-5 rounded-2xl border border-gray-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Available Topic Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Power Electronics", "Wave Shaping", "Digital Systems",
                  "Signal Processing", "Control Systems", "Analog-Digital",
                  "RF Electronics", "Microwave Devices", "Optoelectronics",
                  "Combinational CCT", "Sequential CCT"
                ].map(t => (
                  <Badge key={t} color="gray">{t}</Badge>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Divider />

        {/* ── FAQ ── */}
        <Section>
          <SectionTitle number="06">FAQ</SectionTitle>
          <div className="space-y-2">
            {faqs.map((item, i) => (
              <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left gap-4 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-bold text-gray-800">{item.q}</span>
                  <svg
                    className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-gray-500 leading-relaxed border-t border-gray-50">
                    <p className="pt-3">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>

      </div>
      <Footer />
    </>
  );
}
