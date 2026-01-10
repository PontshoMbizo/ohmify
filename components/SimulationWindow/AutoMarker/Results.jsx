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
  Legend 
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import LoadingAnimation from "@/components/LoadingAnimation";
import { GeneralUtils } from "@/lib/GeneralUtils";

export default function Results({ chartData }) {
  const [isRendering, setIsRendering] = useState(true);
  const [activeTab, setActiveTab] = useState(chartData.type === "digital" ? "logic" : "time");
  const { passed, score, message, nrmse } = chartData.verdict || {};
  
  const chartRef = useRef(null);
  const phaseRef = useRef(null);

  useEffect(() => {
    const setup = async () => {
      const zoomPlugin = (await import("chartjs-plugin-zoom")).default;
      ChartJS.register(
        CategoryScale, 
        LinearScale, 
        LogarithmicScale, 
        PointElement, 
        LineElement, 
        BarElement, 
        Title, 
        Tooltip, 
        Legend, 
        zoomPlugin
      );
      setIsRendering(true);
      setTimeout(() => setIsRendering(false), 500);
    };
    setup();
  }, [chartData, activeTab]);

  /**
   * Helper to format data for XY scatter/line plots.
   * Filters non-positive X values to prevent Chart.js Logarithmic scale crashes.
   */
  const formatXYData = (labels, dataArr) => {
    if (!labels || !dataArr) return [];
    return dataArr
      .map((val, i) => ({ x: parseFloat(labels[i]), y: val }))
      .filter((p) => p.x > 0); 
  };

  const getOptions = (xAxis = "category", xTitle = "Time", yTitle = "Value") => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      x: { 
        type: xAxis, 
        title: { display: true, text: xTitle },
        ticks: { maxTicksLimit: 10 }
      },
      y: { 
        title: { display: true, text: yTitle }, 
        beginAtZero: xAxis !== "logarithmic" 
      }
    },
    plugins: {
      zoom: { 
        pan: { enabled: true, mode: "x" }, 
        zoom: { wheel: { enabled: true }, mode: "x" } 
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed.y !== undefined ? ctx.parsed.y : ctx.raw.y;
            if (chartData.type === "digital") {
               return `${ctx.dataset.label}: ${val} (${GeneralUtils.toHex(val)})`;
            }
            return `${ctx.dataset.label}: ${val.toFixed(4)}`;
          }
        }
      },
      legend: { position: "top" }
    }
  });

  return (
    <div className="space-y-6">
      {/* --- SCORECARD --- */}
      <div className={`p-4 rounded-xl border-2 flex justify-between items-center transition-colors ${
        passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
      }`}>
        <h2 className={`text-xl font-bold uppercase ${passed ? "text-green-800" : "text-red-800"}`}>
          {message}
        </h2>
        <div className="flex gap-8 text-center">
          <div>
            <p className="text-[10px] font-bold opacity-40 uppercase">Grade</p>
            <p className={`text-xl font-mono font-bold ${passed ? "text-green-600" : "text-red-600"}`}>
              {score}%
            </p>
          </div>
          {chartData.type === "analog" && (
            <div>
              <p className="text-[10px] font-bold opacity-40 uppercase">NRMSE</p>
              <p className="text-xl font-mono font-bold text-gray-700">
                {parseFloat(nrmse).toFixed(4)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* --- TABS --- */}
      <div className="tabs tabs-boxed justify-center bg-base-200 gap-2 p-1">
        {chartData.type === "digital" ? (
          <>
            <button className={`tab transition-all ${activeTab === 'logic' ? 'tab-active' : ''}`} onClick={() => setActiveTab('logic')}>Logic Analyzer</button>
            <button className={`tab transition-all ${activeTab === 'table' ? 'tab-active' : ''}`} onClick={() => setActiveTab('table')}>Truth Table</button>
          </>
        ) : (
          <>
            <button className={`tab transition-all ${activeTab === 'time' ? 'tab-active' : ''}`} onClick={() => setActiveTab('time')}>Time Domain</button>
            <button className={`tab transition-all ${activeTab === 'spectrum' ? 'tab-active' : ''}`} onClick={() => setActiveTab('spectrum')}>Spectrum (FFT)</button>
            <button className={`tab transition-all ${activeTab === 'bode' ? 'tab-active' : ''}`} onClick={() => setActiveTab('bode')}>Bode Plot</button>
          </>
        )}
      </div>

      {isRendering ? (
        <div className="h-[450px] flex justify-center items-center"><LoadingAnimation /></div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className={`${activeTab === "bode" ? "h-[650px]" : "h-[450px]"} bg-white p-4 border rounded-xl shadow-sm`}>
            
            {/* DIGITAL: Logic Analyzer (Stepped Decimal Waveform) */}
            {activeTab === "logic" && (
              <Line 
                options={getOptions("category", "Clock Cycle", "Decimal Value")} 
                data={{
                  labels: chartData.table.map(r => `C${r.cycle}`),
                  datasets: [
                    { 
                      label: "Expected", 
                      data: chartData.table.map(r => r.expected), 
                      stepped: true, 
                      borderColor: "rgba(59, 130, 246, 0.4)", 
                      borderDash: [5,5], 
                      pointRadius: 0 
                    },
                    { 
                      label: "Actual", 
                      data: chartData.table.map(r => r.actual), 
                      stepped: true, 
                      borderColor: passed ? "#22c55e" : "#ef4444", 
                      borderWidth: 3,
                      pointBackgroundColor: chartData.table.map(r => r.passed ? "#22c55e" : "#ef4444"),
                      pointRadius: 4
                    }
                  ]
                }} 
              />
            )}

            {/* DIGITAL: Truth Table Comparison */}
            {activeTab === "table" && (
              <div className="overflow-auto h-full">
                <table className="table table-zebra w-full text-center font-mono">
                  <thead className="sticky top-0 bg-base-200">
                    <tr><th>Cycle</th><th>Expected</th><th>Actual</th><th>Result</th></tr>
                  </thead>
                  <tbody>
                    {chartData.table.map((r, i) => (
                      <tr key={i}>
                        <td className="opacity-50">{r.cycle}</td>
                        <td className="text-blue-600 font-bold">{GeneralUtils.toHex(r.expected)}</td>
                        <td className={`font-bold ${r.passed ? "text-green-600" : "text-red-600"}`}>
                          {GeneralUtils.toHex(r.actual)}
                        </td>
                        <td className="text-xl">{r.passed ? "✅" : "❌"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ANALOG: Time Domain Transient Analysis */}
            {activeTab === "time" && (
              <Line 
                options={getOptions("category", "Time (ms)", "Voltage (V)")} 
                data={{
                  labels: chartData.timeLabels,
                  datasets: [
                    { label: "Expected", data: chartData.solutionData, borderColor: "#3b82f644", borderDash: [5,5], pointRadius: 0 },
                    { label: "Your Output", data: chartData.userData, borderColor: "#22c55e", pointRadius: 0, borderWidth: 2.5 }
                  ]
                }} 
              />
            )}

            {/* ANALOG: Frequency Spectrum (FFT Magnitude) */}
            {activeTab === "spectrum" && (
              <Bar 
                options={{...getOptions("linear", "Frequency (Hz)", "Magnitude"), barPercentage: 0.5}} 
                data={{
                  datasets: [
                    { label: "Expected", data: formatXYData(chartData.freqLabels, chartData.solutionSpectrum), backgroundColor: "rgba(59, 130, 246, 0.4)" },
                    { label: "Your Output", data: formatXYData(chartData.freqLabels, chartData.userSpectrum), backgroundColor: "rgba(34, 197, 94, 0.7)" }
                  ]
                }} 
              />
            )}

            {/* ANALOG: Bode Plot (Magnitude & Phase Response) */}
            {activeTab === "bode" && (
              <div className="flex flex-col h-full gap-4">
                <div className="flex-1">
                  <Line 
                    options={getOptions("logarithmic", "Frequency (Hz)", "Gain (dB)")} 
                    data={{
                      datasets: [
                        { label: "Expected Gain", data: formatXYData(chartData.freqLabels, chartData.solutionBodeMag), borderColor: "rgba(59, 130, 246, 0.3)", borderDash: [4,4], pointRadius: 0 },
                        { label: "Your Gain", data: formatXYData(chartData.freqLabels, chartData.userBodeMag), borderColor: "#22c55e", pointRadius: 0 }
                      ]
                    }} 
                  />
                </div>
                <div className="flex-1 border-t border-base-300 pt-4">
                  <Line 
                    options={getOptions("logarithmic", "Frequency (Hz)", "Phase (deg)")} 
                    data={{
                      datasets: [
                        { label: "Expected Phase", data: formatXYData(chartData.freqLabels, chartData.solutionBodePhase), borderColor: "rgba(168, 85, 247, 0.3)", borderDash: [4,4], pointRadius: 0 },
                        { label: "Your Phase", data: formatXYData(chartData.freqLabels, chartData.userBodePhase), borderColor: "#f59e0b", pointRadius: 0 }
                      ]
                    }} 
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}