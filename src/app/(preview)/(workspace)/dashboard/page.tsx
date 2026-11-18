import { Dashboard } from "@/features/dashboard/components/dashboard-screen";

// Account data is loaded by the workspace provider before this page can render.
export const instant = false;

export const metadata = { title: "Dashboard | SmartFarm IoT" };
export default function DashboardPage() {
  return <Dashboard />;
}
