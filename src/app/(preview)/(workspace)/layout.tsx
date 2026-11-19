import { AppShell } from "@/components/layout/workspace-shell";
import { auth } from "@/auth";
import { WorkspaceProvider } from "@/features/workspace/workspace-provider";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

// This boundary waits for a private session and account data, not an instant UI.
export const instant = false;

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <p className="panel" role="status">
          Memuat sesi…
        </p>
      }
    >
      <AuthenticatedWorkspace>{children}</AuthenticatedWorkspace>
    </Suspense>
  );
}

async function AuthenticatedWorkspace({
  children,
}: {
  children: React.ReactNode;
}) {
  // Session cryptography must run only after an actual request arrives.
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return (
    <WorkspaceProvider>
      <AppShell>{children}</AppShell>
    </WorkspaceProvider>
  );
}
