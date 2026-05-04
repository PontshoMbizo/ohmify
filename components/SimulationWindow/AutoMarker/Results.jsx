"use client";

import { useState, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import { Line } from "react-chartjs-2";
import { GeneralUtils } from "@/lib/GeneralUtils";

// Register once at module level — never re-register on tab change or re-render
ChartJS.register(
  CategoryScale, LinearScale, LogarithmicScale,
  PointElement, LineElement, Title, Tooltip, Legend, zoomPlugin
);

export default function Results({ chartData }) {
  const [activeTab, setActiveTab] = useState(chartData.type === "digital" ? "logic" : "time");
  const { passed, score, message, nrmse } = chartData.verdict || {};

  const isLoadTest = chartData.type === "analog" && !chartData.isSignalOnly;
  const resistance = chartData.resistance > 0 ? chartData.resistance : 1e12;

  // Stable options factory — memoized per chartData.type so Chart.js doesn't see new objects
  const makeOptions = useMemo(() => (xAxis, xTitle, yTitle, bounds = {}) => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      x: { type: xAxis, title: { display: true, text: xTitle }, ticks: { maxTicksLimit: 10 }, min: bounds.min, max: bounds.max },
      y: { title: { display: true, text: yTitle }, beginAtZero: xAxis !== "logarithmic" }
    },
    plugins: {
      zoom: { pan: { enabled: true, mode: "x" }, zoom: { wheel: { enabled: true }, mode: "x" } },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed.y !== undefined ? ctx.parsed.y : ctx.raw.y;
            if (chartData.type === "digital") return `${ctx.dataset.label}: ${val} (${GeneralUtils.toHex(val)})`;
            const unit = ctx.dataset.label.toLowerCase().includes("current") ? " mA" : " V";
            return `${ctx.dataset.label}: ${val.toFixed(3)}${unit}`;
          }
        }
      },
      legend: { position: "top" }
    }
  }), [chartData.type]);

  const spectrumBounds = useMemo(() => {
    if (!chartData.userSpectrum || !chartData.freqLabels) return { min: 0, max: undefined };
    let maxIdx = 0, maxVal = -1;
    chartData.userSpectrum.forEach((v, i) => { if (v > maxVal) { maxVal = v; maxIdx = i; } });
    const peak = parseFloat(chartData.freqLabels[maxIdx]);
    return { min: Math.max(0, peak * 0.2), max: peak * 5 };
  }, [chartData.userSpectrum, chartData.freqLabels]);

  const formatXY = useMemo(() => (labels, dataArr) => {
    if (!labels || !dataArr) return [];
    return dataArr.map((y, i) => ({ x: parseFloat(labels[i]), y })).filter(p => !isNaN(p.x) && p.x > 0);
  }, []);

  // Memoized chart data objects so Chart.js doesn't see needless identity changes
  const logicData = useMemo(() => ({
    labels: chartData.table?.map(r => `C${r.cycle}`),
    datasets: [
      { label: "Expected", data: chartData.table?.map(r => r.expected), stepped: true, borderColor: "rgba(59,130,246,0.4)", borderDash: [5,5], pointRadius: 0 },
      { label: "Actual", data: chartData.table?.map(r => r.actual), stepped: true, borderColor: passed ? "#22c55e" : "#ef4444", borderWidth: 3, pointBackgroundColor: chartData.table?.map(r => r.passed ? "#22c55e" : "#ef4444"), pointRadius: 4 }
    ]
  }), [chartData.table, passed]);

  const timeData = useMemo(() => ({
    labels: chartData.timeLabels,
    datasets: [
      { label: "Expected Voltage", data: chartData.solutionData, borderColor: "#3b82f644", borderDash: [5,5], pointRadius: 0 },
      { label: "Your Voltage", data: chartData.userData, borderColor: "#22c55e", pointRadius: 0, borderWidth: 2.5 }
    ]
  }), [chartData.timeLabels, chartData.solutionData, chartData.userData]);

  const currentData = useMemo(() => ({
    labels: chartData.timeLabels,
    datasets: [
      { label: "Expected Current", data: chartData.solutionData?.map(v => (v / resistance) * 1000), borderColor: "rgba(59,130,246,0.2)", borderDash: [5,5], pointRadius: 0 },
      { label: "Your Current", data: chartData.userData?.map(v => (v / resistance) * 1000), borderColor: "#f59e0b", pointRadius: 0, borderWidth: 2.5 }
    ]
  }), [chartData.timeLabels, chartData.solutionData, chartData.userData, resistance]);

  const spectrumData = useMemo(() => ({
    datasets: [
      { label: "Expected", data: formatXY(chartData.freqLabels, chartData.solutionSpectrum), borderColor: "rgba(59,130,246,0.4)", backgroundColor: "rgba(59,130,246,0.1)", fill: true, pointRadius: 0, borderWidth: 1 },
      { label: "Your Output", data: formatXY(chartData.freqLabels, chartData.userSpectrum), borderColor: "rgba(34,197,94,1)", backgroundColor: "rgba(34,197,94,0.2)", fill: true, pointRadius: 2, borderWidth: 2 }
    ]
  }), [chartData.freqLabels, chartData.solutionSpectrum, chartData.userSpectrum, formatXY]);

  const bodeGainData = useMemo(() => ({
    datasets: [
      { label: "Expected Gain", data: formatXY(chartData.freqLabels, chartData.solutionBodeMag), borderColor: "rgba(59,130,246,0.3)", borderDash: [4,4], pointRadius: 0 },
      { label: "Your Gain", data: formatXY(chartData.freqLabels, chartData.userBodeMag), borderColor: "#22c55e", pointRadius: 0 }
    ]
  }), [chartData.freqLabels, chartData.solutionBodeMag, chartData.userBodeMag, formatXY]);

  const bodePhaseData = useMemo(() => ({
    datasets: [
      { label: "Expected Phase", data: formatXY(chartData.freqLabels, chartData.solutionBodePhase), borderColor: "rgba(168,85,247,0.3)", borderDash: [4,4], pointRadius: 0 },
      { label: "Your Phase", data: formatXY(chartData.freqLabels, chartData.userBodePhase), borderColor: "#f59e0b", pointRadius: 0 }
    ]
  }), [chartData.freqLabels, chartData.solutionBodePhase, chartData.userBodePhase, formatXY]);

  return (
    <div className="space-y-6">
      {/* SCORECARD */}
      <div className={`p-4 rounded-xl border-2 flex justify-between items-center transition-colors ${passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
        <h2 className={`text-xl font-bold uppercase ${passed ? "text-green-800" : "text-red-800"}`}>{message}</h2>
        <div className="flex gap-8 text-center">
          <div>
            <p className="text-[10px] font-bold opacity-40 uppercase">Grade</p>
            <p className={`text-xl font-mono font-bold ${passed ? "text-green-600" : "text-red-600"}`}>{score}%</p>
          </div>
          {chartData.type === "analog" && (
            <div>
              <p className="text-[10px] font-bold opacity-40 uppercase">NRMSE</p>
              <p className="text-xl font-mono font-bold text-gray-700">{parseFloat(nrmse || 0).toFixed(4)}</p>
            </div>
          )}
        </div>
      </div>

      {/* TABS */}
      <div className="tabs tabs-boxed justify-center bg-base-200 gap-2 p-1">
        {chartData.type === "digital" ? (
          <>
            <button className={`tab transition-all ${activeTab === "logic" ? "tab-active" : ""}`} onClick={() => setActiveTab("logic")}>Logic Analyzer</button>
            <button className={`tab transition-all ${activeTab === "table" ? "tab-active" : ""}`} onClick={() => setActiveTab("table")}>Truth Table</button>
          </>
        ) : (
          <>
            <button className={`tab transition-all ${activeTab === "time" ? "tab-active" : ""}`} onClick={() => setActiveTab("time")}>Time Domain</button>
            <button className={`tab transition-all ${activeTab === "spectrum" ? "tab-active" : ""}`} onClick={() => setActiveTab("spectrum")}>Frequency Spectrum</button>
            <button className={`tab transition-all ${activeTab === "bode" ? "tab-active" : ""}`} onClick={() => setActiveTab("bode")}>Bode Plot</button>
          </>
        )}
      </div>

      <div className="space-y-6 animate-in fade-in duration-300">
        <div className={`${activeTab === "bode" || (activeTab === "time" && isLoadTest) ? "h-[650px]" : "h-[450px]"} bg-white p-4 border rounded-xl shadow-sm`}>

          {activeTab === "logic" && <Line options={makeOptions("category", "Clock Cycle", "Decimal Value")} data={logicData} />}

          {activeTab === "table" && (
            <div className="overflow-auto h-full">
              <table className="table table-zebra w-full text-center font-mono text-xs">
                <thead className="sticky top-0 bg-base-200">
                  <tr><th>Cycle</th><th>Expected</th><th>Actual</th><th>Result</th></tr>
                </thead>
                <tbody>
                  {chartData.table.map((r) => (
                    <tr key={r.cycle}>
                      <td className="opacity-50">{r.cycle}</td>
                      <td className="text-blue-600 font-bold">{GeneralUtils.toHex(r.expected)}</td>
                      <td className={`font-bold ${r.passed ? "text-green-600" : "text-red-600"}`}>{GeneralUtils.toHex(r.actual)}</td>
                      <td className="text-xl">{r.passed ? "✅" : "❌"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "time" && chartData.type === "analog" && (
            <div className="flex flex-col h-full gap-4">
              <div className="flex-1">
                <Line options={makeOptions("category", "Time (ms)", "Voltage (V)")} data={timeData} />
              </div>
              {isLoadTest && (
                <div className="flex-1 border-t border-base-300 pt-4">
                  <Line options={makeOptions("category", "Time (ms)", "Current (mA)")} data={currentData} />
                </div>
              )}
            </div>
          )}

          {activeTab === "spectrum" && (
            <Line options={makeOptions("linear", "Frequency (Hz)", "Magnitude", spectrumBounds)} data={spectrumData} />
          )}

          {activeTab === "bode" && (
            <div className="flex flex-col h-full gap-4">
              <div className="flex-1">
                <Line options={makeOptions("logarithmic", "Frequency (Hz)", "Gain (dB)")} data={bodeGainData} />
              </div>
              <div className="flex-1 border-t border-base-300 pt-4">
                <Line options={makeOptions("logarithmic", "Frequency (Hz)", "Phase (deg)")} data={bodePhaseData} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
