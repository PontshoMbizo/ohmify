"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/Auth/AuthProvider.jsx";

// Step Components
import MetadataSection from "./Sections/MetadataSection";
import TopicSection from "./Sections/TopicSection";
import TemplateSection from "./Sections/TemplateSection";
import SolutionSection from "./Sections/SolutionSection";

export default function CreateProblem() {
  const { user } = useAuth();
  const [isPublishing, setIsPublishing] = useState(false);
  
  const [problem, setProblem] = useState({
    title: "",
    description: "",
    difficulty: "Easy",
    topics: [], 
    sampleCount: 30720,
    templateCircuit: "", 
    solutionData: null,
  });

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = "auto"; };
  }, []);

  const scrollToSection = (index) => {
    const element = document.getElementById(`section-${index}`);
    if (element) element.scrollIntoView({ behavior: "smooth" });
  };

  const updateProblem = (updates) => {
    setProblem(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-base-200">
      <div className="h-screen w-full overflow-hidden">
        <MetadataSection 
          problem={problem} 
          updateProblem={updateProblem} 
          onNext={() => scrollToSection(2)} 
        />
        <TopicSection 
          problem={problem} 
          updateProblem={updateProblem} 
          onNext={() => scrollToSection(3)} 
          onBack={() => scrollToSection(1)} 
        />
        <TemplateSection 
          problem={problem} 
          updateProblem={updateProblem} 
          onNext={() => scrollToSection(4)} 
          onBack={() => scrollToSection(2)} 
        />
        <SolutionSection 
          problem={problem} 
          user={user}
          updateProblem={updateProblem} 
          onBack={() => scrollToSection(3)} 
          isPublishing={isPublishing}
          setIsPublishing={setIsPublishing}
        />
      </div>
    </div>
  );
} 