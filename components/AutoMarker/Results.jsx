"use client";

import { useState, useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import LoadingAnimation from "@/components/LoadingAnimation";

export default function Results({ chartData }) {
  const [isRendering, setIsRendering] = useState(true);
  const [activeTab, setActiveTab] = useState("time");
  
  const chartRef = useRef(null);
  const phaseRef = useRef(null);

  // Destructure verdict for easier access
  const { passed, score, message, rmse } = chartData.verdict || {
    passed: false,
    score: "0.00",
    message: "No Data",
    rmse: 0
  };

  useEffect(() => {
    const setupChart = async () => {
      const zoomPlugin = (await import("chartjs-plugin-zoom")).default;
      ChartJS.register(
        CategoryScale, LinearScale, LogarithmicScale, 
        PointElement, LineElement, BarElement, 
        Title, Tooltip, Legend, zoomPlugin
      );

      setIsRendering(true);
      const timer = setTimeout(() => setIsRendering(false), 500);
      return () => clearTimeout(timer);
    };
    setupChart();
  }, [chartData, activeTab]);

  const handleResetZoom = () => {
    if (chartRef.current) chartRef.current.resetZoom();
    if (phaseRef.current) phaseRef.current.resetZoom();
  };

  /**
   * Transforms frequency and magnitude/phase arrays into {x, y} objects for Chart.js.
   * Filters out x <= 0 to prevent Logarithmic Scale errors.
   */
  const formatXYData = (labels, dataArr) => {
    if (!labels || !dataArr) return [];
    return dataArr
      .map((val, i) => ({ x: parseFloat(labels[i]), y: val }))
      .filter((p) => p.x > 0);
  };

  const getBaseOptions = (xAxisType = "category", xTitle = "Time (ms)", yTitle = "Value") => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    normalized: true,
    scales: {
      x: { 
        type: xAxisType, 
        title: { display: true, text: xTitle }, 
        ticks: { maxTicksLimit: 10 } 
      },
      y: { 
        title: { display: true, text: yTitle }, 
        beginAtZero: xAxisType !== "logarithmic" 
      },
    },
    plugins: {
      legend: { display: true, position: "top" },
      zoom: { 
        pan: { enabled: true, mode: "x" }, 
        zoom: { wheel: { enabled: true }, mode: "x" } 
      },
    },
  });

  return (
    <div className="relative space-y-6 mt-4 min-h-[650px] animate-in fade-in duration-500">
      
      {/* SCORECARD */}
      <div className={`px-6 rounded-2xl border-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm transition-colors ${
        passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
      }`}>
        <div className="flex items-center gap-5">
          <div>
            <h2 className={`text-2xl font-black uppercase tracking-tight ${
              passed ? "text-green-800" : "text-red-800"
            }`}>
              {message}
            </h2>
          </div>
        </div>
        
        <div className="flex gap-10 items-center p-4 rounded-xl">
          <div className="text-center">
            <p className="text-[10px] uppercase font-bold opacity-40 mb-1">Accuracy</p>
            <p className={`text-2xl font-mono font-bold ${passed ? "text-green-600" : "text-red-600"}`}>
              {score}%
            </p>
          </div>
          <div className="h-10 w-[1px] bg-black/10"></div>
          <div className="text-center">
            <p className="text-[10px] uppercase font-bold opacity-40 mb-1">RMSE</p>
            <p className="text-2xl font-mono font-bold text-gray-700">
              {parseFloat(rmse).toFixed(4)}
            </p>
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex items-center justify-center gap-10">
        <div className="tabs tabs-boxed bg-base-200 p-1 font-semibold border border-base-300">
          <button className={`tab transition-all ${activeTab === 'time' ? 'tab-active' : ''}`} onClick={() => setActiveTab('time')}>Time Domain</button>
          <button className={`tab transition-all ${activeTab === 'spectrum' ? 'tab-active' : ''}`} onClick={() => setActiveTab('spectrum')}>Spectrum (FFT)</button>
          <button className={`tab transition-all ${activeTab === 'bode' ? 'tab-active' : ''}`} onClick={() => setActiveTab('bode')}>Bode Plot</button>
        </div>
        <button onClick={handleResetZoom} className="btn btn-sm btn-ghost border border-base-300">
          Reset Zoom
        </button>
      </div>

      {isRendering ? (
        <div className="flex flex-col items-center justify-center h-[400px]"><LoadingAnimation /></div>
      ) : (
        <div className="space-y-6">
          {/* TIME DOMAIN */}
          {activeTab === "time" && (
            <div className="p-4 bg-white border rounded-xl shadow-sm h-[400px]">
              <Line ref={chartRef} options={getBaseOptions("category", "Time (ms)", "Voltage (V)")} 
                data={{
                  labels: chartData.labels,
                  datasets: [
                    { label: "Expected", data: chartData.solutionData, borderColor: "rgba(59, 130, 246, 0.3)", borderDash: [6, 4], pointRadius: 0, borderWidth: 2 },
                    { label: "Your Output", data: chartData.userData, borderColor: "rgb(34, 197, 94)", pointRadius: 0, borderWidth: 2.5 },
                  ],
                }} 
              />
            </div>
          )}

          {/* SPECTRUM (STEM) */}
          {activeTab === "spectrum" && (
            <div className="p-4 bg-white border rounded-xl shadow-sm h-[400px]">
              <Bar ref={chartRef} options={{ ...getBaseOptions("linear", "Frequency (Hz)", "Magnitude"), barPercentage: 0.1, categoryPercentage: 1.0 }}
                data={{
                  datasets: [
                    { label: "Expected", data: formatXYData(chartData.freqLabels, chartData.solutionSpectrum), backgroundColor: "rgba(59, 130, 246, 0.4)", borderColor: "rgb(59, 130, 246)", borderWidth: 1 },
                    { label: "Your Output", data: formatXYData(chartData.freqLabels, chartData.userSpectrum), backgroundColor: "rgba(34, 197, 94, 0.6)", borderColor: "rgb(34, 197, 94)", borderWidth: 1 },
                  ],
                }}
              />
            </div>
          )}

          {/* BODE (MAG & PHASE) */}
          {activeTab === "bode" && (
            <div className="space-y-4">
              <div className="p-4 bg-white border rounded-xl shadow-sm h-[300px]">
                <Line 
                  ref={chartRef} 
                  options={getBaseOptions("logarithmic", "Frequency (Hz)", "Gain (dB)")}
                  data={{
                    datasets: [
                      { label: "Expected Gain", data: formatXYData(chartData.freqLabels, chartData.solutionBodeMag), borderColor: "rgba(59, 130, 246, 0.3)", borderDash: [4, 4], pointRadius: 0 },
                      { label: "User Gain", data: formatXYData(chartData.freqLabels, chartData.userBodeMag), borderColor: "rgb(34, 197, 94)", pointRadius: 0 },
                    ],
                  }}
                />
              </div>
              <div className="p-4 bg-white border rounded-xl shadow-sm h-[300px]">
                <Line 
                  ref={phaseRef} 
                  options={getBaseOptions("logarithmic", "Frequency (Hz)", "Phase (deg)")}
                  data={{
                    datasets: [
                      { label: "Expected Phase", data: formatXYData(chartData.freqLabels, chartData.solutionBodePhase), borderColor: "rgba(168, 85, 247, 0.3)", borderDash: [4, 4], pointRadius: 0 },
                      { label: "User Phase", data: formatXYData(chartData.freqLabels, chartData.userBodePhase), borderColor: "rgb(249, 115, 22)", pointRadius: 0 },
                    ],
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}