"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/LandingPage/Footer";
import React from "react";
import { useRouter } from 'next/navigation';

export default function ComingSoon() {
  const router = useRouter();
  return (
    <>
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
    </div>
      <Footer/></>
  );
}
