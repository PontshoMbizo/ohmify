import SimulatorEmbed from "@/components/SimulatorEmbed";

export const metadata = {
  title: "MCU / C — scope.io",
  description: "STM32 Blue Pill bare-metal C simulator",
};

export default function McuToolPage() {
  return (
    <SimulatorEmbed
      src={process.env.NEXT_PUBLIC_STM_URL}
      title="MCU / C · STM32 Blue Pill"
      envVar="NEXT_PUBLIC_STM_URL"
      accent="text-teal-600"
    />
  );
}
