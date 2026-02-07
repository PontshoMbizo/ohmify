"use client";

import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function SampleSolution({ problem }) {
  // 1. Identify problem type using the new testType metadata
  const isDigital = problem?.testType === "digital";

  // 2. Parse only the "No-Load" (test1) solution data
  const solOutData = useMemo(() => {
    // Access the test1 slot from the solutions map assembled in ProblemPage
    const rawData = problem?.solutions?.test1; 
    if (!rawData) return [];

    return rawData
      .trim()
      .split("\n")
      .map((v) => parseFloat(v))
      .filter((v) => !isNaN(v));
  }, [problem?.solutions]);

  // 3. Timestep Logic 
  const dt = useMemo(() => {
    return Number(problem?.timeStep) || 5e-6;
  }, [problem?.timeStep]);

  // 4. Axis Labels
  const labels = useMemo(() => {
    if (isDigital) {
      return solOutData.map((_, i) => `Cycle ${i}`);
    }
    return solOutData.map((_, i) => (i * dt * 1000).toFixed(4));
  }, [solOutData, dt, isDigital]);

  if (solOutData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-base-300 rounded-xl bg-base-50 text-gray-400 gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-xs font-bold uppercase tracking-widest opacity-40">No Reference Waveform</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500 overflow-hidden">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600">
          {isDigital ? "Reference Logic Sequence" : "No-Load Time-Domain Response"}
        </h3>
        <span className="badge badge-sm badge-ghost font-mono opacity-50">
          {solOutData.length} {isDigital ? "Cycles" : "Samples"}
        </span>
      </div>

      <div className="w-full h-[350px] bg-white p-4 border rounded-2xl shadow-sm">
        <Line
          options={{
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#1e293b',
                bodyColor: '#1e293b',
                borderColor: '#e2e8f0',
                borderWidth: 1,
                callbacks: {
                  label: (context) => {
                    const val = context.parsed.y;
                    return isDigital 
                      ? ` Decimal: ${val} (0x${val.toString(16).toUpperCase()})` 
                      : ` ${val.toFixed(4)} V`;
                  },
                  title: (items) => isDigital ? items[0].label : `Time: ${items[0].label} ms`
                }
              },
            },
            scales: {
              x: {
                display: true,
                title: { display: true, text: isDigital ? "Clock Cycles" : "Time (ms)", font: { size: 10, weight: 'bold' } },
                ticks: { maxTicksLimit: 8, font: { size: 10 } },
                grid: { display: false }
              },
              y: {
                display: true,
                title: { display: true, text: isDigital ? "Decimal Output" : "Voltage (V)", font: { size: 10, weight: 'bold' } },
                beginAtZero: true,
                ticks: {
                    font: { size: 10 },
                    ...(isDigital ? { stepSize: 1, precision: 0 } : {})
                }
              },
            },
          }}
          data={{
            labels: labels,
            datasets: [
              {
                label: "Gold Standard",
                data: solOutData,
                borderColor: isDigital ? "#3b82f6" : "#22c55e",
                borderWidth: 3,
                pointRadius: isDigital ? 4 : 0,
                stepped: isDigital,
                tension: 0,
                fill: isDigital ? { target: 'origin', above: 'rgba(59, 130, 246, 0.03)' } : false,
              },
            ],
          }}
        />
      </div>
      
      <div className="p-3 bg-base-50 rounded-lg border border-base-200">
        <p className="text-[10px] text-gray-500 leading-relaxed uppercase font-bold tracking-tight">
          {isDigital 
            ? `* Reference sequence for the first ${solOutData.length} cycles.`
            : `* Showing the ideal voltage response with no external load (Open Circuit).`
          }
        </p>
      </div>
    </div>
  );
}