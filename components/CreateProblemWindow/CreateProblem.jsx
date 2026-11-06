"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { useAuth } from "@/components/Auth/AuthProvider.jsx";
import { GeneralUtils } from "@/lib/GeneralUtils";
import WizardFooter from "./WizardFooter";
import StrategySection from "./Sections/StrategySection";
import DetailsSection from "./Sections/DetailsSection";
import TemplateSection from "./Sections/TemplateSection";
import SolutionSection from "./Sections/SolutionSection";
import ReviewSection from "./Sections/ReviewSection";

const STEPS = [
  { id: 0, label: "Strategy", desc: "How it's graded" },
  { id: 1, label: "Details", desc: "Title, topics & difficulty" },
  { id: 2, label: "Template", desc: "Starter circuit" },
  { id: 3, label: "Solution", desc: "Gold-standard capture" },
  { id: 4, label: "Review", desc: "Confirm & publish" },
];

const requiredTests = GeneralUtils.requiredTests;

const isEmbeddedType = (p) => !!(p.simulatorType && p.simulatorType !== "circuitjs");

// Single source of truth for step gating: drives the stepper lock, the footer's
// disabled Next, and its inline hint. Returns { valid, hint }.
export function stepValidity(step, p) {
  switch (step) {
    case 0:
      return p.testType
        ? { valid: true }
        : { valid: false, hint: "Choose a validation strategy" };
    case 1:
      if (!p.title.trim()) return { valid: false, hint: "Give your challenge a title" };
      if (p.topics.length === 0) return { valid: false, hint: "Select at least one topic" };
      return { valid: true };
    case 2:
      if (isEmbeddedType(p)) {
        return p.starterCode
          ? { valid: true }
          : { valid: false, hint: "Write and save the starter code" };
      }
      return p.templateCircuit
        ? { valid: true }
        : { valid: false, hint: "Design and Submit the starter circuit" };
    case 3: {
      if (isEmbeddedType(p)) {
        const ok = !!p.solutions?.test1?.changes?.length && !!p.testConfig?.signal?.trim();
        return ok ? { valid: true } : { valid: false, hint: "Set the signal/pin name and capture the golden run" };
      }
      const ok = requiredTests(p.testType).every((k) => p.solutions?.[k]);
      return ok ? { valid: true } : { valid: false, hint: "Capture all required golden waveforms" };
    }
    case 4: {
      // Publish gating — everything finalizeProblem requires.
      if (!p.title.trim()) return { valid: false, hint: "Title is required" };
      if (p.topics.length === 0) return { valid: false, hint: "Add at least one topic" };
      if (isEmbeddedType(p)) {
        if (!p.solutions?.test1?.changes?.length || !p.testConfig?.signal?.trim())
          return { valid: false, hint: "Set the signal/pin name and capture the golden run" };
        return { valid: true };
      }
      if (!requiredTests(p.testType).every((k) => p.solutions?.[k]))
        return { valid: false, hint: "Capture all required golden waveforms" };
      if (p.testType === "load" && !(Number(p.testConfig?.rMax) > 0 && Number(p.testConfig?.rMin) > 0))
        return { valid: false, hint: "Set positive Max / Min loads" };
      return { valid: true };
    }
    default:
      return { valid: true };
  }
}

export default function CreateProblem() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type, text }

  const [problem, setProblem] = useState({
    title: "",
    description: "",
    difficulty: "Easy",
    topics: [],
    testType: "load",
    simulatorType: "circuitjs",
    sampleCount: 30720,
    timeStep: "5e-6",
    testConfig: { noLoad: 1e12, rMax: 10000, rMin: 100 },
    solutions: {},
    templateCircuit: "",
    starterCode: "",
  });

  const updateProblem = (patch) => setProblem((prev) => ({ ...prev, ...patch }));

  const problemType = problem.testType || "load";
  const isEmbedded = isEmbeddedType(problem);
  const validity = stepValidity(step, problem);
  // A step is reachable only when every prior step is valid.
  const canReach = (i) => STEPS.slice(0, i).every((s) => stepValidity(s.id, problem).valid);

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  // Atomic publish — moved here from SolutionSection so the wizard owns one
  // Publish action. Logic (validation + batch writes + packed/decimated
  // solution docs) is unchanged.
  const finalizeProblem = async () => {
    setStatusMessage(null);
    if (!user) {
      setStatusMessage({ type: "error", text: "You must be signed in to publish." });
      return;
    }

    const { test1, test2, test3 } = problem.solutions;
    if (problemType === "signal" && !test1) {
      setStatusMessage({ type: "error", text: "Capture the signal waveform first." });
      return;
    }
    if (problemType !== "signal" && (!test1 || !test2 || !test3)) {
      setStatusMessage({ type: "error", text: "Capture all 3 test cases before publishing." });
      return;
    }
    if (isEmbedded && !problem.testConfig?.signal?.trim()) {
      setStatusMessage({ type: "error", text: "Set the signal/pin name to grade." });
      return;
    }

    const timeStepNum = Number(problem.timeStep);
    if (!timeStepNum || timeStepNum <= 0) {
      setStatusMessage({ type: "error", text: "Invalid time step value." });
      return;
    }

    if (problemType === "load") {
      const rMax = Number(problem.testConfig?.rMax);
      const rMin = Number(problem.testConfig?.rMin);
      if (!rMax || rMax <= 0 || !rMin || rMin <= 0) {
        setStatusMessage({ type: "error", text: "Max and Min load must be positive resistances." });
        return;
      }
    }

    setIsPublishing(true);
    try {
      let testbench = {};
      if (problemType === "digital") {
        testbench = {
          payload1: String(problem.testConfig?.payload1 || ""),
          payload2: String(problem.testConfig?.payload2 || ""),
          payload3: String(problem.testConfig?.payload3 || ""),
        };
      } else if (problemType === "load") {
        testbench = {
          noload: 1e12,
          maxload: Number(problem.testConfig?.rMax),
          minload: Number(problem.testConfig?.rMin),
        };
      } else if (problem.simulatorType === "fpga") {
        testbench = {
          testbench: String(problem.testConfig?.testbench || ""),
          signal: String(problem.testConfig?.signal || "").trim(),
          duration: Number(problem.testConfig?.duration) || 2000000,
        };
      } else if (problem.simulatorType === "mcu") {
        testbench = {
          engine: problem.testConfig?.engine || "mainline",
          signal: String(problem.testConfig?.signal || "").trim(),
        };
      } else {
        testbench = { isSignal: true };
      }

      const problemData = {
        title: problem.title.trim(),
        difficulty: problem.difficulty,
        description: problem.description,
        topics: problem.topics,
        creatorId: user.uid,
        creatorName: user.displayName || "Anonymous",
        createdAt: serverTimestamp(),
        testbench,
        testType: problemType,
        simulatorType: problem.simulatorType || "circuitjs",
        timeStep: problem.timeStep,
        sampleCount: Number(problem.sampleCount) || 30720,
        ...(isEmbedded ? { starterCode: problem.starterCode || "" } : {}),
      };

      const batch = writeBatch(db);
      const problemRef = doc(collection(db, "Problems"));
      batch.set(problemRef, problemData);
      batch.set(doc(db, "Problems", problemRef.id, "initialCircuit", "data"), {
        version: 1,
        payload: problem.templateCircuit,
      });

      const fallbackRate = 1 / timeStepNum;
      const tests = problemType === "signal" ? { test1 } : { test1, test2, test3 };
      for (const [key, value] of Object.entries(tests)) {
        if (isEmbedded) {
          batch.set(doc(db, "Problems", problemRef.id, "solutionWaveform", key), {
            kind: problem.simulatorType === "fpga" ? "fpga-vcd" : "mcu-trace",
            referenceCode: value.code,
            changes: value.changes,
          });
        } else {
          batch.set(doc(db, "Problems", problemRef.id, "solutionWaveform", key), {
            samples: value,
            sampleRate: problem.captureRates?.[key] || fallbackRate,
            decimation: problem.decimations?.[key] || 1,
            decimationError: problem.decimationErrors?.[key] || 0,
          });
        }
      }

      await batch.commit();
      setStatusMessage({ type: "success", text: "Challenge published!" });
      setTimeout(() => router.push("/"), 1200);
    } catch (e) {
      console.error("Publishing Error:", e);
      setStatusMessage({ type: "error", text: `Publishing failed: ${e.message}` });
      setIsPublishing(false);
    }
  };

  const isReview = step === STEPS.length - 1;

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#f8f9fa] font-sans text-slate-800">
      {/* ── STEPPER RAIL ── */}
      <aside className="w-60 shrink-0 h-full bg-white border-r border-slate-200 flex flex-col">
        <nav className="flex-1 px-4 py-8 space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 mb-5">
            New Challenge
          </p>
          {STEPS.map((s) => {
            const isActive = s.id === step;
            const isDone = s.id < step && stepValidity(s.id, problem).valid;
            const reachable = canReach(s.id);
            return (
              <button
                key={s.id}
                onClick={() => reachable && setStep(s.id)}
                disabled={!reachable}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all
                  ${isActive ? "bg-blue-50" : reachable ? "hover:bg-slate-50 cursor-pointer" : "cursor-default"}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-black transition-all
                  ${isActive ? "bg-blue-600 text-white" : isDone ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-300"}`}>
                  {isDone ? <Check size={13} strokeWidth={3.5} /> : s.id + 1}
                </div>
                <div>
                  <p className={`text-sm font-bold leading-none ${isActive ? "text-blue-700" : isDone ? "text-slate-500" : "text-slate-300"}`}>
                    {s.label}
                  </p>
                  <p className={`text-[10px] mt-0.5 ${reachable ? "text-slate-400" : "text-slate-200"}`}>{s.desc}</p>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="px-5 pb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
            <span className="text-[10px] font-black text-blue-600">{step + 1}/{STEPS.length}</span>
          </div>
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-12 shrink-0 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{STEPS[step].label}</span>
            <span className="text-slate-200 text-sm">·</span>
            <span className="text-xs text-slate-400">{STEPS[step].desc}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300 border border-slate-200 rounded px-2 py-1">Draft</span>
            <Link href="/" className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors">Cancel</Link>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          {step === 0 && <StrategySection problem={problem} updateProblem={updateProblem} />}
          {step === 1 && <DetailsSection problem={problem} updateProblem={updateProblem} />}
          {step === 2 && <TemplateSection problem={problem} updateProblem={updateProblem} />}
          {step === 3 && <SolutionSection problem={problem} updateProblem={updateProblem} />}
          {step === 4 && (
            <ReviewSection problem={problem} statusMessage={statusMessage} goToStep={setStep} />
          )}
        </main>

        <WizardFooter
          onBack={step > 0 ? goBack : null}
          onNext={isReview ? finalizeProblem : goNext}
          nextLabel={isReview ? "Publish Challenge" : "Next Step"}
          disabled={!validity.valid}
          hint={validity.hint}
          busy={isPublishing}
        />
      </div>
    </div>
  );
}
