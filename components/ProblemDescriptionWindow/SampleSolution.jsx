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
  const isDigital = problem?.testType === "digital";
  const dt = Number(problem?.timeStep) || 5e-6;

  // Helper to parse specific solution slots
  const parseSolutionData = (key) => {
    const rawData = problem?.solutions?.[key];
    if (!rawData) return [];

    return rawData
      .trim()
      .split("\n")
      .map((v) => parseFloat(v))
      .filter((v) => !isNaN(v));
  };

  // the three test scenarios
  const testScenarios = [
    { id: "test1", label: isDigital ? "Reference Case A" : "No-Load Response", color: "#3b82f6" },
    { id: "test2", label: isDigital ? "Reference Case B" : "Max-Load Response", color: "#a855f7" },
    { id: "test3", label: isDigital ? "Reference Case C" : "Min-Load Response", color: "#22c55e" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {testScenarios.map((scenario) => {
        const solData = parseSolutionData(scenario.id);
        
        // Only render the graph if data exists for this slot
        if (solData.length === 0) return null;

        const labels = isDigital 
          ? solData.map((_, i) => `Cycle ${i}`)
          : solData.map((_, i) => (i * dt * 1000).toFixed(4));

        return (
          <div key={scenario.id} className="space-y-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                {scenario.label}
              </h3>
              <span className="badge badge-sm badge-ghost font-mono opacity-50">
                {solData.length} {isDigital ? "Cycles" : "Samples"}
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
                      data: solData,
                      borderColor: isDigital ? scenario.color : scenario.color,
                      borderWidth: 3,
                      pointRadius: isDigital ? 4 : 0,
                      stepped: isDigital,
                      tension: 0,
                      fill: isDigital ? { target: 'origin', above: `${scenario.color}10` } : false,
                    },
                  ],
                }}
              />
            </div>
          </div>
        );
      })}

      {/* If no data at all is found */}
      {problem?.solutions && Object.keys(problem.solutions).length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-base-300 rounded-xl bg-base-50 text-gray-400 gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-xs font-bold uppercase tracking-widest opacity-40">No Reference Waveforms</p>
        </div>
      )}
    </div>
  );
}