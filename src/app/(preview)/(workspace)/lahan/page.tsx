import { Farms } from "@/features/farms/components/farms-screen";

// Account data is loaded by the workspace provider before this page can render.
export const instant = false;

export const metadata = { title: "Lahan & sensor | SmartFarm IoT" };
export default function FarmsPage() {
  return <Farms />;
}
