"use client";
import Hero from "@/components/LandingPage/Hero";
import Body from "@/components/LandingPage/Body";
import Footer from "@/components/LandingPage/Footer";
import React from "react";

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-base-100 font-sans text-base-content transition-colors duration-300">
      <Hero />
      <Body />
      <Footer />
    </div>
  );
}