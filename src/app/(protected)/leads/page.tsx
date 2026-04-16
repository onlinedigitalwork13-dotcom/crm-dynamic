import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import LeadsClient from "./leads-client";

export default async function LeadsPage() {
  const session = await requireAuth();

  const [leads, users] = await Promise.all([
    prisma.lead.findMany({
      orderBy: [
        {
          lastActivityAt: "desc",
        },
        {
          updatedAt: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      select: {
        id: true,
        branchId: true,
        intakeSubmissionId: true,
        clientId: true,
        clientCheckInId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        passportNumber: true,
        country: true,
        source: true,
        status: true,
        assignedToId: true,
        assignedAt: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        lastActivityAt: true,

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

        intakeSubmission: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            status: true,
            assignedToId: true,
            submissionMeta: true,
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
          select: {
            id: true,
            userId: true,
            createdAt: true,
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
        },
      },
    }),

    prisma.user.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
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
    }),
  ]);

  return (
    <LeadsClient
      leads={leads}
      users={users}
      currentUserId={session.user.id}
      currentUserRole={session.user.roleName || "user"}
      currentUserBranchId={session.user.branchId ?? null}
      canCrossBranchAssign={
        session.user.roleName === "super_admin" ||
        session.user.roleName === "admin"
      }
    />
  );
}