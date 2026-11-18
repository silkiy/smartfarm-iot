import { UsersScreen } from "@/features/users/components/users-screen";
// Account data is loaded by the workspace provider before this page can render.
export const instant = false;

export const metadata = { title: "Pengguna & penugasan | SmartFarm IoT" };
export default function UsersPage() {
  return <UsersScreen />;
}
