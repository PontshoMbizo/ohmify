import SimulatorEmbed from "@/components/SimulatorEmbed";

export const metadata = {
  title: "FPGA / Verilog — scope.io",
  description: "Tang Nano 9K Verilog simulator",
};

export default function FpgaToolPage() {
  return (
    <SimulatorEmbed
      src={process.env.NEXT_PUBLIC_NIKA_URL}
      title="FPGA / Verilog · Tang Nano 9K"
      envVar="NEXT_PUBLIC_NIKA_URL"
      accent="text-cyan-600"
    />
  );
}
