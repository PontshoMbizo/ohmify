"use client";
import Navbar from "@/components/Navbar";
import React from "react";
import { useRouter } from 'next/navigation';

export default function ComingSoon() {
  const router = useRouter();
  return (
    <div className="min-h-screen w-full bg-white overflow-hidden relative">

      <Navbar/>

      {/* Main Content */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-2 gap-12 px-6 pt-5">

        {/* LEFT PANEL */}
        <div className="relative flex flex-col justify-center">

          {/* Hero Illustration Placeholder */}
          <div className="relative">
            <img
              src="coming-soon.png"
              alt="Hero"
              className="h-90 w-auto"
            />
          </div>

          {/* Title */}
          <h1 className="text-5xl font-extrabold tracking-wide text-gray-800">
            BUILD,
            <br />
            TINKER
          </h1>

          {/* Decorative Elements */}
          <div className="absolute top-16 right-24 h-4 w-4 rounded-full bg-pink-400 opacity-70" />
          <div className="absolute bottom-16 left-24 h-6 w-1 rounded bg-green-500" />
        </div>

        {/* RIGHT PANEL */}
        <div className="flex flex-col justify-center">

          <h2 className="mb-8 text-3xl font-bold tracking-wide text-gray-700">
            COMING SOON...
          </h2>

            <form className="space-y-4 max-w-md">
              <input
                type="email"
                placeholder="Email"
                className="w-full border-b border-gray-300 px-2 py-2 focus:outline-none focus:border-blue-500"
              />
              <textarea
                placeholder="Message"
                rows="4"
                className="w-full border-b border-gray-300 px-2 py-2 focus:outline-none focus:border-blue-500 resize-none"
              />

            {/* Checkbox + Button */}
            <div className="flex items-center justify-between pt-4">
              <label className="flex items-center gap-2 text-sm text-gray-500">
                <input type="checkbox" className="checkbox checkbox-success" />
                Agree validation of terms
              </label>

              <button
                type="submit"
                className="rounded-md bg-blue-500 px-6 py-2 text-white hover:bg-blue-600"
              >
                SEND
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* BOTTOM WAVE SECTION */}
      <div className="absolute bottom-0 w-full">
        <div className="h-64 bg-gradient-to-r from-green-400 via-green-500 to-green-700 rounded-t-[100%]" />
      </div>

      {/* ABOUT SECTION */}
      <div className="relative z-10 mt-32 ml-10 px-6 pb-12 text-white">
        <div className="max-w-4xl">
          <h3 className="mb-2 text-lg font-bold">Ohmify</h3>
          <p className="text-sm opacity-90">
            an innovative platform designed to help users learn and
            practice circuit design and analysis through interactive problem-solving.
            Our mission is to make hardware/electronics education accessible, engaging, and
            effective for learners/hobbiests of all levels.
          </p>

          {/* Social Icons */}
          <div className="mt-4 flex gap-4">
            <a><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram-icon lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg></a>
            <a><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube-icon lucide-youtube"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4A49.55,49.55,0,0,1,5.3,18.4A2,2,0,0,1,3.9,17Z"/><path d="m10,15 l5,-3 -5,-3z"/></svg></a>
            </div>
        </div>
      </div>

      {/* VIDEO PREVIEW */}
      <div className="absolute bottom-10 right-20 hidden lg:block">
        <div className="h-32 w-56 rounded-xl bg-white/30 backdrop-blur flex items-center justify-center">
          ▶
        </div>
      </div>
    </div>
  );
}
