import type { ReactNode } from "react";
import { requireAuth } from "@/lib/require-auth";
import MobileSidebarShell from "@/components/layout/mobile-sidebar-shell";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAuth();

  const userName =
    `${session.user.firstName ?? ""} ${session.user.lastName ?? ""}`.trim();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fafc_0%,#eef2ff_22%,#f8fafc_46%,#e2e8f0_100%)]">
      <div className="relative min-h-screen">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-120px] top-[-120px] h-[280px] w-[280px] rounded-full bg-cyan-200/20 blur-3xl" />
          <div className="absolute right-[-120px] top-[80px] h-[260px] w-[260px] rounded-full bg-violet-200/20 blur-3xl" />
          <div className="absolute bottom-[-140px] left-[20%] h-[300px] w-[300px] rounded-full bg-sky-100/30 blur-3xl" />
        </div>

        <MobileSidebarShell
          userName={userName || session.user.email || "User"}
          roleName={session.user.roleName}
        >
          <div className="relative z-10 min-h-screen">
            <div className="mx-auto w-full max-w-[1680px] px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6 xl:px-8">
              <div className="rounded-[28px] border border-white/60 bg-white/70 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                <div className="min-h-[calc(100vh-1.5rem)] rounded-[28px]">
                  <div className="px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6 xl:px-8 xl:py-8">
                    {children}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </MobileSidebarShell>
      </div>
    </div>
  );
}