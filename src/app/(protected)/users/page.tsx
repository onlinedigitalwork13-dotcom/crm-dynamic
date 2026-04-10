import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/require-role";
import UsersTable from "./users-table";

function normalizeRoleLabel(roleName?: string | null) {
  if (!roleName) return "Unknown";
  return roleName
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function UsersPage() {
  await requireSuperAdmin();

  const users = await prisma.user.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      isActive: true,
      createdAt: true,
      roleId: true,
      branchId: true,
      role: {
        select: {
          id: true,
          name: true,
        },
      },
      branch: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });

  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.isActive).length;
  const inactiveUsers = totalUsers - activeUsers;
  const uniqueBranches = new Set(
    users.map((user) => user.branch?.id).filter(Boolean)
  ).size;

  const roleCounts = users.reduce<Record<string, number>>((acc, user) => {
    const roleName = user.role?.name || "unknown";
    acc[roleName] = (acc[roleName] || 0) + 1;
    return acc;
  }, {});

  const topRoleEntry = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])[0];
  const topRoleLabel = topRoleEntry
    ? `${normalizeRoleLabel(topRoleEntry[0])} · ${topRoleEntry[1]}`
    : "No roles yet";

  return (
    <div className="space-y-6 xl:space-y-8">
      <section className="relative overflow-hidden rounded-[32px] border border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-7 text-white shadow-[0_24px_80px_-24px_rgba(15,23,42,0.8)] sm:px-8 sm:py-8 xl:px-10 xl:py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.20),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_28%),radial-gradient(circle_at_center,rgba(255,255,255,0.04),transparent_40%)]" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-300/80">
              Administration
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              User Control Center
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Manage system users, branch assignments, permissions, and access
              status from one premium admin workspace designed for speed,
              clarity, and control.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                Most common role
              </p>
              <p className="mt-2 text-sm font-medium text-white">{topRoleLabel}</p>
            </div>

            <Link
              href="/users/new"
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition duration-200 hover:translate-y-[-1px] hover:bg-slate-100"
            >
              + New User
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Users",
            value: totalUsers,
            valueClass: "text-blue-950",
            accent:
              "bg-gradient-to-br from-blue-500/15 via-blue-100/70 to-white",
          },
          {
            label: "Active Users",
            value: activeUsers,
            valueClass: "text-emerald-950",
            accent:
              "bg-gradient-to-br from-emerald-500/15 via-emerald-100/70 to-white",
          },
          {
            label: "Inactive Users",
            value: inactiveUsers,
            valueClass: "text-amber-950",
            accent:
              "bg-gradient-to-br from-amber-500/15 via-amber-100/70 to-white",
          },
          {
            label: "Branches Covered",
            value: uniqueBranches,
            valueClass: "text-violet-950",
            accent:
              "bg-gradient-to-br from-violet-500/15 via-violet-100/70 to-white",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]"
          >
            <div className={`absolute inset-0 ${card.accent}`} />
            <div className="relative">
              <p className="text-sm font-medium text-slate-600">{card.label}</p>
              <p className={`mt-3 text-3xl font-semibold ${card.valueClass}`}>
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </section>

      <UsersTable users={users} />
    </div>
  );
}