import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import IntakeSubmissionsClient from "./intake-submissions-client";

export default async function IntakeSubmissionsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  const currentUserRole = session.user.roleName ?? "";
  const currentUserBranchId = session.user.branchId ?? null;

  const canManageAll =
    currentUserRole === "SUPER_ADMIN" || currentUserRole === "ADMIN";

  // IMPORTANT:
  // Set this to true so staff can assign to other staff across branches too.
  const canCrossBranchAssign = true;

  const submissions = await prisma.intakeFormSubmission.findMany({
    where: canManageAll
      ? undefined
      : {
          OR: [
            ...(currentUserBranchId ? [{ branchId: currentUserBranchId }] : []),
            { assignedToId: session.user.id },
          ],
        },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      intakeFormRequest: {
        select: {
          id: true,
          title: true,
          token: true,
        },
      },
      branch: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          branchId: true,
        },
      },
      reviewedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      ...(canCrossBranchAssign
        ? {}
        : currentUserBranchId
        ? { branchId: currentUserBranchId }
        : {}),
    },
    orderBy: [
      { firstName: "asc" },
      { lastName: "asc" },
      { email: "asc" },
    ],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      branchId: true,
      role: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return (
    <IntakeSubmissionsClient
      submissions={submissions}
      users={users}
      currentUserRole={currentUserRole}
      currentUserBranchId={currentUserBranchId}
      canCrossBranchAssign={canCrossBranchAssign}
    />
  );
}