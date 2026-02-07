import React from "react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-16 pb-16">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-6 px-6 lg:grid-cols-2">
        
        {/* LEFT PANEL: Illustration & Decorative Elements */}
        <div className="relative flex flex-col items-center lg:items-start">
          <div className="relative mb-6">
            <img
              src="coming-soon.png"
              alt="Circuit Hero"
              className="h-88  w-auto object-contain lg:h-96"
            />
            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 h-6 w-6 rounded-full bg-blue-600 opacity-70 animate-pulse" />
          </div>
        </div>

        {/* RIGHT PANEL: Hero Text */}
        <div className="flex flex-col">
          <div className="absolute left-20 top-26 h-10 w-3 rounded bg-green-500" />
          <h1 className="text-center text-6xl font-black leading-none tracking-tighter text-gray-900 lg:text-left lg:text-8xl">
            BUILD,
            <br />
            TINKER,
            <br />
            <span className="text-green-500">SOLVE.</span>
          </h1>
          <p className="mt-6 text-center text-lg text-gray-600 lg:text-left lg:text-xl">
            The ultimate playground for hardware engineers. 
            Interactive circuit design at your fingertips.
          </p>
        </div>
      </div>
    </section>
  );
}