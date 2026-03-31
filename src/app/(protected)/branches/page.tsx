import Link from "next/link";
import { requireAuth } from "@/lib/require-auth";
import { prisma } from "@/lib/prisma";
import { getBranches } from "@/lib/branch-service";

function normalizeRole(roleName?: string | null) {
  return (roleName || "").trim().toLowerCase().replace(/\s+/g, "_");
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

export default async function BranchesPage() {
  const session = await requireAuth();

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email ?? undefined },
    include: {
      role: true,
    },
  });

  if (!currentUser) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Branches</h1>
        <p className="mt-2 text-sm text-red-600">
          Logged-in user record was not found in the database.
        </p>
      </div>
    );
  }

  const role = normalizeRole(currentUser.role?.name);
  const canAccess = role === "super_admin" || role === "admin";

  if (!canAccess) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Branches</h1>
        <p className="mt-2 text-sm text-red-600">
          You do not have access to this module.
        </p>
      </div>
    );
  }

  const branches = await getBranches();

  const totalBranches = branches.length;
  const activeBranches = branches.filter((branch) => branch.isActive).length;
  const inactiveBranches = totalBranches - activeBranches;
  const totalUsers = branches.reduce(
    (sum, branch) => sum + branch._count.users,
    0
  );

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-7 text-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.7)] ring-1 ring-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_28%)]" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
              Office Administration
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Branches
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Create, manage, and activate branch offices for a truly multi-office
              CRM setup.
            </p>
          </div>

          <Link
            href="/branches/new"
            className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
          >
            Create Branch
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Branches",
            value: totalBranches,
            accent: "from-blue-500/15 to-blue-100",
            valueClass: "text-blue-900",
          },
          {
            label: "Active Branches",
            value: activeBranches,
            accent: "from-emerald-500/15 to-emerald-100",
            valueClass: "text-emerald-900",
          },
          {
            label: "Inactive Branches",
            value: inactiveBranches,
            accent: "from-amber-500/15 to-amber-100",
            valueClass: "text-amber-900",
          },
          {
            label: "Users Across Branches",
            value: totalUsers,
            accent: "from-violet-500/15 to-violet-100",
            valueClass: "text-violet-900",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-70`}
            />
            <div className="relative">
              <p className="text-sm font-medium text-slate-600">{card.label}</p>
              <p className={`mt-3 text-3xl font-semibold ${card.valueClass}`}>
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {branches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <p className="text-sm font-medium text-slate-900">
              No branches created yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Add your first office to start assigning users and operations by
              branch.
            </p>
            <div className="mt-4">
              <Link
                href="/branches/new"
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Create First Branch
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3 font-semibold">Branch</th>
                  <th className="px-3 py-3 font-semibold">Code</th>
                  <th className="px-3 py-3 font-semibold">Location</th>
                  <th className="px-3 py-3 font-semibold">Users</th>
                  <th className="px-3 py-3 font-semibold">Clients</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Created</th>
                  <th className="px-3 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((branch) => (
                  <tr
                    key={branch.id}
                    className="border-b border-slate-100 last:border-b-0"
                  >
                    <td className="px-3 py-4">
                      <div className="font-medium text-slate-900">
                        {branch.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {branch.email || "No email"}
                      </div>
                    </td>

                    <td className="px-3 py-4 text-sm text-slate-700">
                      {branch.code}
                    </td>

                    <td className="px-3 py-4 text-sm text-slate-700">
                      {[branch.city, branch.country].filter(Boolean).join(", ") ||
                        "Not set"}
                    </td>

                    <td className="px-3 py-4 text-sm text-slate-700">
                      {branch._count.users}
                    </td>

                    <td className="px-3 py-4 text-sm text-slate-700">
                      {branch._count.clients}
                    </td>

                    <td className="px-3 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          branch.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {branch.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-3 py-4 text-sm text-slate-700">
                      {formatDate(branch.createdAt)}
                    </td>

                    <td className="px-3 py-4">
                      <Link
                        href={`/branches/${branch.id}/edit`}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Edit Branch
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}