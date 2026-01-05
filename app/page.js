"use client";
import Navbar from "@/components/Navbar";
import Hero from "@/components/LandingPage/Hero";
import Body from "@/components/LandingPage/Body";
import Footer from "@/components/LandingPage/Footer";
import React from "react";

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-white font-sans text-gray-800">
      <Navbar />
      <Hero />
      <Body />
      <Footer />
    </div>
  );
}