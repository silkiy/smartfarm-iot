import { Irrigation } from "@/features/irrigation/components/irrigation-screen";

// Account data is loaded by the workspace provider before this page can render.
export const instant = false;

export const metadata = { title: "Irigasi | SmartFarm IoT" };
export default function IrrigationPage() {
  return <Irrigation />;
}
