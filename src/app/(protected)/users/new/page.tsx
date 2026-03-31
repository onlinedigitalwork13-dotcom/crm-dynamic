import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/require-role";
import NewUserForm from "./new-user-form";

export default async function NewUserPage() {
  await requireSuperAdmin();

  const [roles, branches] = await Promise.all([
    prisma.role.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.branch.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">Administration</p>
        <h1 className="text-2xl font-bold text-gray-900">Create New User</h1>
        <p className="mt-1 text-sm text-gray-600">
          Add a new system user and assign role-based access.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <NewUserForm roles={roles} branches={branches} />
      </div>
    </div>
  );
}