"use client";

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/LandingPage/Footer';

export default function Help() {
  return (
    <>
    <div className="max-w-5xl mx-auto p-6 space-y-16 pb-20 text-base-content">
      
      {/* --- SECTION 1: SYSTEM OVERVIEW --- */}
      <section className="space-y-4">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-green-600">Guide To Ohmify</h1>
        <p className="text-lg opacity-70">
          Ohmify uses CircuitJS by Falstad to simulate real-time electronic behavior. 
          Whether you are dealing with transient analog signals or digital logic, 
          CircuitJS works efficiently to simulate and capture the output waveform.
        </p>
      </section>

      <hr className="border-base-300" />

      {/* --- SECTION 2: HOW IT WORKS (USER) --- */}
      <section className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold uppercase text-green-600">01. Solving a Problem</h2>
          <ul className="space-y-3 list-decimal list-inside opacity-80">
            <li><strong>Design:</strong> Drag and drop components to meet the problem requirements.</li>
            <li><strong>Integrate:</strong> Connect your solution to the initial circuit I/O lines.</li>
            <li><strong>Labeling:</strong> Ensure your I/O nodes from the initial circuit are present (e.g., "output").</li>
            <li><strong>Reset:</strong> Always click the "Reset" button to set simulation time ($t$) to 0ms before submitting.</li>
            <li><strong>Submit:</strong> The engine will sample your circuit and compare it against the Gold Standard.</li>
          </ul>
        </div>
        <div className="bg-base-200 rounded-2xl h-64 flex items-center justify-center border-2 border-dashed border-base-300">
          
        </div>
      </section>

      {/* --- SECTION 3: CREATING A PROBLEM (ADMIN) --- */}
      <section className="grid md:grid-cols-2 gap-12 items-center">
        <div className="bg-base-200 rounded-2xl h-64 flex items-center justify-center border-2 border-dashed border-base-300 md:order-1 order-2">
          
        </div>
        <div className="space-y-4 md:order-2 order-1">
          <h2 className="text-2xl font-bold uppercase text-green-600">02. Creating Challenges</h2>
          <p className="opacity-80">
            To create a valid challenge, you must provide an <strong>Initial Circuit</strong> with labelled I/O nodes, and a <strong>Gold Standard</strong> done by 
            building the solution circuit yourself and clicking "Sample Solution" in the creator dashboard.
          </p>
          <div className="alert alert-info shadow-sm text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>The creator exports a text-based circuit schema and a newline-separated list of voltages.</span>
          </div>
        </div>
      </section>

      {/* --- SECTION 4: CONSTRAINTS & FORMATS --- */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold uppercase text-center">Technical Constraints</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card bg-base-100 border border-base-300 p-6 space-y-2">
            <h3 className="font-bold text-blue-600">Digital Circuit</h3>
            
            <p className="text-sm opacity-70">Requires a <b>Square Wave Generator</b>. It samples data at every rising edge. Max 256 cycles per submission.</p>
          </div>
          
          <div className="card bg-base-100 border border-base-300 p-6 space-y-2">
            <h3 className="font-bold text-green-600">Analog Mode</h3>
            
            <p className="text-sm opacity-70">Uses a fixed timestep ($dt$). Samples a max 30,720 points.</p>
          </div>

          <div className="card bg-base-100 border border-base-300 p-6 space-y-2">
            <h3 className="font-bold text-purple-600">Data Format</h3>
            <div className="bg-slate-900 text-slate-300 p-3 rounded font-mono text-[10px]">
              1.24<br/>1.45<br/>1.67<br/>...
            </div>
            <p className="text-xs opacity-70">Solutions are stored as newline-separated decimals. Digital values are stored as integers (0-65535).</p>
          </div>
        </div>
      </section>
    </div>
    <Footer />
    </>
  );
}