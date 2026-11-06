// Shared by every place that embeds fpgasim/mcusim via
// SimulatorEmbed's postMessage bridge (problem creation + solving) — one
// place to change the deployed URL env vars or display titles.
export const EMBED_CONFIG = {
  fpga: { src: process.env.NEXT_PUBLIC_NIKA_URL, title: "FPGA / Verilog", envVar: "NEXT_PUBLIC_NIKA_URL" },
  mcu: { src: process.env.NEXT_PUBLIC_STM_URL, title: "MCU / Bare-metal C", envVar: "NEXT_PUBLIC_STM_URL" },
};
