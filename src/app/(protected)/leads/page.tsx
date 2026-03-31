import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LeadsClient from "./leads-client";

function normalizeRole(value?: string | null) {
  return (value || "").trim().toUpperCase().replace(/\s+/g, "_");
}

export default async function LeadsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  const currentUserId = session.user.id;
  const currentUserRole = normalizeRole(session.user.roleName);
  const currentUserBranchId = session.user.branchId ?? null;

  const canManageAll =
    currentUserRole === "SUPER_ADMIN" || currentUserRole === "ADMIN";

  const canCrossBranchAssign = canManageAll;

  const leads = await prisma.lead.findMany({
    where: canManageAll
      ? undefined
      : {
          OR: [
            ...(currentUserBranchId ? [{ branchId: currentUserBranchId }] : []),
            { assignedToId: currentUserId },
            {
              followers: {
                some: {
                  userId: currentUserId,
                },
              },
            },
          ],
        },
    orderBy: [{ lastActivityAt: "desc" }, { createdAt: "desc" }],
    include: {
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
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          assignedToId: true,
          createdById: true,
        },
      },
      intakeSubmission: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
          assignedToId: true,
        },
      },
      clientCheckIn: {
        select: {
          id: true,
          checkedInAt: true,
          checkInMethod: true,
          visitReason: true,
          notes: true,
        },
      },
      followers: {
        include: {
          user: {
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
          },
        },
        orderBy: {
          createdAt: "asc",
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
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }, { email: "asc" }],
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
    <LeadsClient
      leads={leads}
      users={users}
      currentUserId={currentUserId}
      currentUserRole={currentUserRole}
      currentUserBranchId={currentUserBranchId}
      canCrossBranchAssign={canCrossBranchAssign}
    />
  );
}