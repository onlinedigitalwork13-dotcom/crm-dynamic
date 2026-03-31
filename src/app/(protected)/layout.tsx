import type { ReactNode } from "react";
import { requireAuth } from "@/lib/require-auth";
import MobileSidebarShell from "@/components/layout/mobile-sidebar-shell";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAuth();

  const userName = `${session.user.firstName ?? ""} ${session.user.lastName ?? ""}`.trim();

  return (
    <div className="min-h-screen bg-gray-100">
      <MobileSidebarShell
        userName={userName || session.user.email || "User"}
        roleName={session.user.roleName}
      >
        {children}
      </MobileSidebarShell>
    </div>
  );
}