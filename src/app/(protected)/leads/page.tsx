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
      agent: {
        select: {
          id: true,
          name: true,
          referralCode: true,
          country: true,
          contact: true,
          email: true,
          phone: true,
          isActive: true,
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
          branchId: true,
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
          clientId: true,
          country: true,
          city: true,
          address: true,
          nationality: true,
          passportNumber: true,
          dateOfBirth: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          submissionMeta: true,
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
      activities: {
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
        select: {
          id: true,
          action: true,
          details: true,
          createdAt: true,
          actorUserId: true,
          actorUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
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