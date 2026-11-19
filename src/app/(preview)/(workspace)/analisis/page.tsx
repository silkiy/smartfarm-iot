import { Analytics } from "@/features/analytics/components/analytics-screen";

// Account data is loaded by the workspace provider before this page can render.
export const instant = false;

export const metadata = { title: "Analisis | SmartFarm IoT" };
export default function AnalyticsPage() {
  return <Analytics />;
}
