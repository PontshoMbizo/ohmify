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
  // 1. Identify if this is a digital problem
  const isDigital = useMemo(() => {
    const digitalTopics = ["Digital Systems", "Combinational CCT", "Sequential CCT", "Analog-Digital"];
    return problem?.topic?.some(t => digitalTopics.includes(t));
  }, [problem?.topic]);

  // 2. Parse the newline-separated string into a numeric array
  const solOutData = useMemo(() => {
    if (!problem?.solutionWaveform) return [];
    return problem.solutionWaveform
      .trim()
      .split("\n")
      .map((v) => parseFloat(v))
      .filter((v) => !isNaN(v));
  }, [problem?.solutionWaveform]);

  // 3. Timestep Logic
  const getTimestepForProblem = () => {
    if (!problem?.topic) return 5e-6;
    if (problem.topic.includes("Power Electronics")) return 1e-3;
    if (problem.topic.some(t => t.includes("RF") || t.includes("Microwave"))) return 1e-9;
    return 5e-6;
  };

  const dt = getTimestepForProblem();

  // 4. Axis Labels
  const labels = useMemo(() => {
    if (isDigital) {
      // For digital, labels are Cycle indices
      return solOutData.map((_, i) => `Cycle ${i}`);
    }
    // For analog, labels are Time in ms
    return solOutData.map((_, i) => (i * dt * 1000).toFixed(4));
  }, [solOutData, dt, isDigital]);

  if (solOutData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border-2 border-dashed border-base-300 rounded-xl bg-base-50 text-gray-400 italic">
        No solution data available for this problem.
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500 overflow-hidden">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">
          {isDigital ? "Digital Logic Sequence" : "Time-Domain Response"}
        </h3>
        <span className="badge badge-sm badge-outline opacity-50">
          {solOutData.length} {isDigital ? "Cycles" : "Samples"}
        </span>
      </div>

      <div className="w-full h-[400px] bg-white p-2 border rounded-xl shadow-sm">
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
                callbacks: {
                  label: (context) => {
                    const val = context.parsed.y;
                    return isDigital 
                      ? ` Decimal: ${val} (0x${val.toString(16).toUpperCase()})` 
                      : ` ${val} V`;
                  },
                  title: (items) => isDigital ? items[0].label : `Time: ${items[0].label} ms`
                }
              },
            },
            scales: {
              x: {
                display: true,
                title: { display: true, text: isDigital ? "Clock Cycles" : "Time (ms)" },
                ticks: { maxTicksLimit: 10 },
              },
              y: {
                display: true,
                title: { display: true, text: isDigital ? "Decimal Output" : "Voltage (V)" },
                beginAtZero: true,
                // If digital, ensure y-axis uses whole numbers
                ticks: isDigital ? { stepSize: 1, precision: 0 } : {},
              },
            },
          }}
          data={{
            labels: labels,
            datasets: [
              {
                label: "Gold Standard",
                data: solOutData,
                borderColor: isDigital ? "rgb(59, 130, 246)" : "rgb(34, 197, 94)",
                borderWidth: 2.5,
                pointRadius: isDigital ? 4 : 0,
                // CRITICAL: Use stepped line for digital logic
                stepped: isDigital ? true : false,
                tension: isDigital ? 0 : 0.1,
                fill: isDigital ? { target: 'origin', above: 'rgba(59, 130, 246, 0.05)' } : false,
              },
            ],
          }}
        />
      </div>
      
      <p className="text-xs text-gray-400 italic">
        {isDigital 
          ? `* Logic analyzer showing ${solOutData.length} clock-synchronized states.`
          : `* Graph displays output voltage over a total duration of ${(solOutData.length * dt * 1000).toFixed(2)} ms.`
        }
      </p>
    </div>
  );
}