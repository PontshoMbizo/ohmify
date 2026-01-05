"use client";

import { useState, useEffect } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, LogarithmicScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import LoadingAnimation from "@/components/LoadingAnimation";
import { GeneralUtils } from "@/lib/GeneralUtils";

export default function Results({ chartData }) {
  const [isRendering, setIsRendering] = useState(true);
  const [activeTab, setActiveTab] = useState(chartData.type === "digital" ? "logic" : "time");
  const { passed, score, message, rmse } = chartData.verdict || {};

  useEffect(() => {
    const setup = async () => {
      const zoomPlugin = (await import("chartjs-plugin-zoom")).default;
      ChartJS.register(CategoryScale, LinearScale, LogarithmicScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, zoomPlugin);
      setIsRendering(true);
      setTimeout(() => setIsRendering(false), 500);
    };
    setup();
  }, [chartData, activeTab]);

 

  const getOptions = (xAxis = "category", xTitle = "Time", yTitle = "Value") => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { type: xAxis, title: { display: true, text: xTitle } },
      y: { title: { display: true, text: yTitle }, beginAtZero: true }
    },
    plugins: {
      zoom: { pan: { enabled: true, mode: "x" }, zoom: { wheel: { enabled: true }, mode: "x" } },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.raw} (${GeneralUtils.toHex(ctx.raw)})`
        }
      }
    }
  });

  return (
    <div className="space-y-6">
      {/* SCORECARD */}
      <div className={`p-4 rounded-xl border-2 flex justify-between items-center ${passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
        <h2 className="text-xl font-bold uppercase">{message}</h2>
        <div className="flex gap-8 text-center">
          <div><p className="text-[10px] font-bold opacity-40">GRADE</p><p className="text-xl font-mono font-bold">{score}%</p></div>
          {chartData.type === "analog" && <div><p className="text-[10px] font-bold opacity-40">RMSE</p><p className="text-xl font-mono font-bold">{parseFloat(rmse).toFixed(4)}</p></div>}
        </div>
      </div>

      {/* TABS */}
      <div className="tabs tabs-boxed justify-center bg-transparent gap-2">
        {chartData.type === "digital" ? (
          <>
            <button className={`tab ${activeTab === 'logic' ? 'tab-active' : ''}`} onClick={() => setActiveTab('logic')}>Logic Analyzer</button>
            <button className={`tab ${activeTab === 'table' ? 'tab-active' : ''}`} onClick={() => setActiveTab('table')}>Truth Table</button>
          </>
        ) : (
          <button className="tab tab-active">Time Domain</button>
        )}
      </div>

      {isRendering ? <div className="h-[400px] flex justify-center"><LoadingAnimation /></div> : (
        <div className="h-[400px] bg-white p-4 border rounded-xl">
          {activeTab === "logic" ? (
            <Line options={getOptions("category", "Clock Cycle", "Decimal Value")} data={{
              labels: chartData.table.map(r => `C${r.cycle}`),
              datasets: [
                { label: "Expected", data: chartData.table.map(r => r.expected), stepped: true, borderColor: "rgba(59, 130, 246, 0.5)", borderDash: [5,5], pointRadius: 0 },
                { label: "Actual", data: chartData.table.map(r => r.actual), stepped: true, borderColor: passed ? "#22c55e" : "#ef4444", borderWidth: 3 }
              ]
            }} />
          ) : activeTab === "table" ? (
            <div className="overflow-auto h-full">
              <table className="table table-zebra w-full text-center font-mono">
                <thead><tr><th>Cycle</th><th>Expected</th><th>Actual</th><th>Result</th></tr></thead>
                <tbody>
                  {chartData.table.map((r, i) => (
                    <tr key={i}><td>{r.cycle}</td><td>{toHex(r.expected)}</td><td className={r.passed ? "text-green-600" : "text-red-600"}>{toHex(r.actual)}</td><td>{r.passed ? "✅" : "❌"}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
             <Line options={getOptions("category", "Time (ms)", "Voltage")} data={{
               labels: chartData.timeLabels,
               datasets: [
                 { label: "Expected", data: chartData.solutionData, borderColor: "#3b82f644", borderDash: [5,5], pointRadius: 0 },
                 { label: "Actual", data: chartData.userData, borderColor: "#22c55e", pointRadius: 0 }
               ]
             }} />
          )}
        </div>
      )}
    </div>
  );
}