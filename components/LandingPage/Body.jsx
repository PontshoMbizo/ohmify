import React from "react";

export default function Body() {
  return (
    <section className="">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-16 px-6 lg:flex-row">
        
        {/* Waitlist Card */}
        <div className="w-full rounded-3xl bg-base-100 p-8 shadow-xl lg:w-1/2 lg:p-12 border border-base-200 transition-colors duration-300">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-base-content">
            Master Circuit Design.
          </h2>
          <p className="mb-8 text-base-content/80">
            Join the waitlist for the most interactive hardware engineering platform. 
            Practice analysis, solve challenges, and tinker in real-time.
          </p>

          <form className="space-y-4">
            <input
              type="email"
              placeholder="email"
              className="w-full border-b-2 border-base-300 bg-transparent px-2 py-3 text-lg transition-colors focus:border-green-500 focus:outline-none text-base-content"
            />
            <textarea
              placeholder="What do you want to learn first?"
              rows="3"
              className="w-full resize-none border-b-2 border-base-300 bg-transparent px-2 py-3 text-lg transition-colors focus:border-green-500 focus:outline-none text-base-content"
            />

            <div className="flex items-center justify-between pt-6">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-base-content/70">
                <input type="checkbox" className="checkbox checkbox-success checkbox-sm" />
                <span>Notify me on launch</span>
              </label>

              <button
                type="submit"
                className="rounded-full bg-green-600 px-8 py-3 font-bold text-white shadow-lg shadow-blue-200 transition-transform hover:scale-105 active:scale-95"
              >
                JOIN WAITLIST
              </button>
            </div>
          </form>
        </div>

        {/* --- MID SECTION: Features & Value Props --- */}
        <div className="flex w-full flex-col justify-center lg:w-1/2">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            
            {/* Feature 1: Real-World Problems */}
            <div className="group rounded-2xl bg-base-100 p-6 shadow-sm border border-base-300 hover:border-green-500 transition-all">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success group-hover:bg-green-600 group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              </div>
              <h4 className="text-sm font-black uppercase tracking-tight text-base-content">Solve Problems</h4>
              <p className="mt-2 text-sm leading-relaxed text-base-content/70">
                Tackle real-world circuit challenges designed to bridge the gap between textbook theory and physical hardware.
              </p>
            </div>

            {/* Feature 2: Community */}
            <div className="group rounded-2xl bg-base-100 p-6 shadow-sm border border-base-300 hover:border-green-500 transition-all">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success group-hover:bg-green-600 group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <h4 className="text-sm font-black uppercase tracking-tight text-base-content">Join Community</h4>
              <p className="mt-2 text-sm leading-relaxed text-base-content/70">
                Connect with hardware enthusiasts and experienced engineers to share designs, insights, and solutions.
              </p>
            </div>

            {/* Feature 3: Skills Elevation */}
            <div className="group rounded-2xl bg-base-100 p-6 shadow-sm border border-base-300 hover:border-green-500 transition-all">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success group-hover:bg-green-600 group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4-4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
              </div>
              <h4 className="text-sm font-black uppercase tracking-tight text-base-content">Elevate Skills</h4>
              <p className="mt-2 text-sm leading-relaxed text-base-content/70">
                From DC basics to high-frequency RF, level up your engineering intuition with interactive simulations.
              </p>
            </div>

            {/* Feature 4: Interactive Creation */}
            <div className="group rounded-2xl bg-base-100 p-6 shadow-sm border border-base-300 hover:border-green-500 transition-all">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success group-hover:bg-green-600 group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"/></svg>
              </div>
              <h4 className="text-sm font-black uppercase tracking-tight text-base-content">Create Challenges</h4>
              <p className="mt-2 text-sm leading-relaxed text-base-content/70">
                Build your own custom circuit problems and contribute to the growing library of Scope.io challenges.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}