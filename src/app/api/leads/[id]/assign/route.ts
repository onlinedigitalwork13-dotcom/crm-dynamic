import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function canAssignAcrossBranches(roleName: string | null | undefined) {
  return roleName === "SUPER_ADMIN" || roleName === "ADMIN";
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const assignedToId =
      typeof body.assignedToId === "string" ? body.assignedToId.trim() : "";

    if (!assignedToId) {
      return NextResponse.json(
        { error: "assignedToId is required" },
        { status: 400 }
      );
    }

    const currentUserRole = session.user.roleName ?? "";
    const currentUserBranchId = session.user.branchId ?? null;
    const crossBranchAllowed = canAssignAcrossBranches(currentUserRole);

    const lead = await prisma.lead.findUnique({
      where: { id },
      select: {
        id: true,
        branchId: true,
        intakeSubmissionId: true,
        clientId: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (!crossBranchAllowed) {
      if (
        !lead.branchId ||
        !currentUserBranchId ||
        lead.branchId !== currentUserBranchId
      ) {
        return NextResponse.json(
          { error: "You do not have permission to assign this lead" },
          { status: 403 }
        );
      }
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: assignedToId },
      select: {
        id: true,
        isActive: true,
        branchId: true,
      },
    });

    if (!targetUser || !targetUser.isActive) {
      return NextResponse.json(
        { error: "Selected staff member is not available" },
        { status: 400 }
      );
    }

    if (!crossBranchAllowed) {
      if (!lead.branchId || targetUser.branchId !== lead.branchId) {
        return NextResponse.json(
          { error: "You can assign leads only within the same branch" },
          { status: 403 }
        );
      }
    }

    const activityDetails: Prisma.InputJsonValue = {
      assignedToId: targetUser.id,
    };

    await prisma.$transaction(async (tx) => {
      // 1. Update lead assignment
      await tx.lead.update({
        where: { id: lead.id },
        data: {
          assignedToId: targetUser.id,
          assignedAt: new Date(),
          status: "assigned",
          lastActivityAt: new Date(),
          activities: {
            create: {
              actorUserId: session.user.id,
              action: "lead_assigned",
              details: activityDetails,
            },
          },
        },
      });

      // 2. Keep intake submission in sync
      if (lead.intakeSubmissionId) {
        await tx.intakeFormSubmission.update({
          where: { id: lead.intakeSubmissionId },
          data: {
            assignedToId: targetUser.id,
            assignedAt: new Date(),
            status: "assigned",
          },
        });
      }

      // 3. Keep client in sync
      if (lead.clientId) {
        await tx.client.update({
          where: { id: lead.clientId },
          data: {
            assignedToId: targetUser.id,
          },
        });
      }
    });

    const updatedLead = await prisma.lead.findUnique({
      where: { id: lead.id },
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

    if (!updatedLead) {
      return NextResponse.json(
        { error: "Lead was updated but could not be reloaded" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Lead assigned successfully",
      lead: updatedLead,
    });
  } catch (error) {
    console.error("POST /api/leads/[id]/assign error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to assign lead",
      },
      { status: 500 }
    );
  }
}