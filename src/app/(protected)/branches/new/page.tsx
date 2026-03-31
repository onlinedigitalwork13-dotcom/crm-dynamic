import { requireAuth } from "@/lib/require-auth";
import { prisma } from "@/lib/prisma";
import BranchForm from "@/components/branches/branch-form";

function normalizeRole(roleName?: string | null) {
  return (roleName || "").trim().toLowerCase().replace(/\s+/g, "_");
}

export default async function NewBranchPage() {
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
        <h1 className="text-2xl font-semibold text-slate-900">Create Branch</h1>
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
        <h1 className="text-2xl font-semibold text-slate-900">Create Branch</h1>
        <p className="mt-2 text-sm text-red-600">
          You do not have access to this module.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-7 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
          Office Administration
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
          Create New Branch
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Add a premium branch office record for managers, staff assignment, and
          multi-office operations.
        </p>
      </div>

      <BranchForm mode="create" />
    </div>
  );
}