import { Notifications } from "@/features/notifications/components/notifications-screen";

// Account data is loaded by the workspace provider before this page can render.
export const instant = false;

export const metadata = { title: "Notifikasi | SmartFarm IoT" };
export default function NotificationsPage() {
  return <Notifications />;
}
