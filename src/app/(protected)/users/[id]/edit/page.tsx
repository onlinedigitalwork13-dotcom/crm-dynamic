import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/require-role";
import EditUserForm from "./edit-user-form";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditUserPage({ params }: PageProps) {
  await requireSuperAdmin();

  const { id } = await params;

  if (!id) {
    notFound();
  }

  const [user, roles, branches] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isActive: true,
        roleId: true,
        branchId: true,
      },
    }),
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

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">Administration</p>
        <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
        <p className="mt-1 text-sm text-gray-600">
          Update user details, role, branch, and account status.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <EditUserForm user={user} roles={roles} branches={branches} />
      </div>
    </div>
  );
}