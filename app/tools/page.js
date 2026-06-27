import { Cpu, CircuitBoard, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Tools — scope.io",
  description: "Interactive FPGA and microcontroller simulators",
};

const TOOLS = [
  {
    href: "/tools/fpga",
    title: "FPGA / Verilog",
    board: "Tang Nano 9K",
    desc: "Write Verilog HDL, compile with Icarus Verilog, and watch the waveforms and pin activity on an interactive Tang Nano 9K board.",
    Icon: CircuitBoard,
    accent: "cyan",
  },
  {
    href: "/tools/mcu",
    title: "MCU / C",
    board: "STM32 Blue Pill",
    desc: "Write bare-metal C, cross-compile with arm-none-eabi-gcc, and run it on an emulated STM32F103 with live pin and peripheral traces.",
    Icon: Cpu,
    accent: "teal",
  },
];

const ACCENTS = {
  cyan: {
    icon: "text-cyan-600",
    iconBg: "bg-cyan-50",
    ring: "hover:border-cyan-300",
    link: "text-cyan-600",
  },
  teal: {
    icon: "text-teal-600",
    iconBg: "bg-teal-50",
    ring: "hover:border-teal-300",
    link: "text-teal-600",
  },
};

export default function ToolsPage() {
  return (
    <div className="bg-white min-h-[calc(100vh-3rem)]">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-10">
        {/* Hero */}
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Labs</p>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-cyan-600 leading-none">
            Simulator Tools
          </h1>
          <p className="text-base text-gray-500 max-w-2xl leading-relaxed">
            Free-exploration sandboxes for digital hardware. Pick a board, write code, and probe the
            signals — no problem, no grading. These run as separate simulator services embedded here.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {TOOLS.map(({ href, title, board, desc, Icon, accent }) => {
            const a = ACCENTS[accent];
            return (
              <a
                key={href}
                href={href}
                className={`group p-6 rounded-2xl border border-gray-100 bg-white space-y-4 transition-colors ${a.ring}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${a.iconBg}`}>
                  <Icon className={a.icon} size={24} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{board}</p>
                  <h2 className="text-xl font-black uppercase tracking-tight text-gray-800">{title}</h2>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                <span className={`inline-flex items-center gap-1 text-xs font-black uppercase tracking-wide ${a.link}`}>
                  Open simulator
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
