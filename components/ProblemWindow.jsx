import React, { useLayoutEffect } from 'react';
import ProblemDescription from "./ProblemDescription";
import ProblemEditorial from "./ProblemEditorial";
import ProblemSolutions from "@/components/ProblemSolutions";

export default function ProblemWindow({problem}) { 

    useLayoutEffect(() => {
    // Scrolls the entire window to the absolute bottom of the document
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth', // Use 'smooth' for animated scrolling and 'auto' for instant scrolling
    });
  }, []);


    return(
        <div className="w-full h-full flex flex-col p-2 gap-4 overflow-hidden">
      <div className="w-full h-full overflow-y-auto">

        {/* name of each tab group should be unique */}
        <div className="tabs tabs-lift">
        {/* Tab 1: Problem description */}
        <label className="tab">
            <input type="radio" name="my_tabs_4" defaultChecked />
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="gray" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text-icon lucide-file-text size-4 me-2"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
            Description
        </label>
        <div className="tab-content bg-base-100 border-base-300 overflow-hidden">
            <ProblemDescription problem={problem}/>
        </div>  

        {/* Tab 2: */}
        <label className="tab">
            <input type="radio" name="my_tabs_4" />
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="gray" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-book-open-icon lucide-book-open size-4 me-2"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>
            Editorial
        </label>
        <div className="tab-content bg-base-100 border-base-300 p-6">
            <ProblemEditorial problem={problem}/>
        </div>

        {/* Tab 3: */}
        <label className="tab">
            <input type="radio" name="my_tabs_4" />
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check-big-icon lucide-circle-check-big size-4 me-2"><path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/></svg>
            Solutions
        </label>
        <div className="tab-content bg-base-100 border-base-300 p-6"><ProblemSolutions problem={problem}/></div>
        </div>


      </div>
    </div>
)};