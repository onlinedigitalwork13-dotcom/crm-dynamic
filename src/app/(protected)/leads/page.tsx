import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import LeadsWorkspaceClient from "./leads-workspace-client";

export default async function LeadsPage() {
  const session = await requireAuth();

  const [leads, users] = await Promise.all([
    prisma.lead.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        passportNumber: true,
        country: true,
        source: true,
        status: true,
        notes: true,
        assignedAt: true,
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
          },
        },

        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },

        agent: {
          select: {
            id: true,
            name: true,
            referralCode: true,
          },
        },

        intakeSubmission: {
          select: {
            id: true,
            status: true,
            submittedAt: true,
            reviewedAt: true,
            convertedAt: true,
            closedAt: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            country: true,
            city: true,
            address: true,
            nationality: true,
            dateOfBirth: true,
            passportNumber: true,
            notes: true,
            internalNotes: true,
            submissionMeta: true,
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
            checkInMethod: true,
            visitReason: true,
            notes: true,
            checkedInAt: true,
            intakeSubmissionId: true,
          },
        },

        followers: {
          select: {
            id: true,
          },
        },

        activities: {
          select: {
            id: true,
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
    <LeadsWorkspaceClient
      leads={leads}
      users={users}
      currentUserRole={session.user.roleName || "user"}
      currentUserBranchId={session.user.branchId ?? null}
      canCrossBranchAssign={
        session.user.roleName === "super_admin" ||
        session.user.roleName === "admin"
      }
    />
  );
}