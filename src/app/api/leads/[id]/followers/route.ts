import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function canManageAcrossBranches(roleName: string | null | undefined) {
  return roleName === "SUPER_ADMIN" || roleName === "ADMIN";
}

async function getLeadWithRelations(id: string) {
  return prisma.lead.findUnique({
    where: { id },
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
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const requestedUserId =
      typeof body.userId === "string" && body.userId.trim().length > 0
        ? body.userId.trim()
        : session.user.id;

    const currentUserRole = session.user.roleName ?? "";
    const currentUserBranchId = session.user.branchId ?? null;
    const crossBranchAllowed = canManageAcrossBranches(currentUserRole);

    const lead = await prisma.lead.findUnique({
      where: { id },
      select: {
        id: true,
        branchId: true,
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
          { error: "You do not have permission to follow this lead" },
          { status: 403 }
        );
      }
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: requestedUserId },
      select: {
        id: true,
        isActive: true,
        branchId: true,
      },
    });

    if (!targetUser || !targetUser.isActive) {
      return NextResponse.json(
        { error: "Selected user is not available" },
        { status: 400 }
      );
    }

    if (!crossBranchAllowed) {
      if (
        !lead.branchId ||
        !targetUser.branchId ||
        targetUser.branchId !== lead.branchId
      ) {
        return NextResponse.json(
          { error: "Followers must belong to the same branch" },
          { status: 403 }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.leadFollower.upsert({
        where: {
          leadId_userId: {
            leadId: lead.id,
            userId: targetUser.id,
          },
        },
        update: {},
        create: {
          leadId: lead.id,
          userId: targetUser.id,
        },
      });

      const details: Prisma.InputJsonValue = {
        followerUserId: targetUser.id,
      };

      await tx.lead.update({
        where: { id: lead.id },
        data: {
          lastActivityAt: new Date(),
          activities: {
            create: {
              actorUserId: session.user.id,
              action: "lead_follower_added",
              details,
            },
          },
        },
      });
    });

    const updatedLead = await getLeadWithRelations(lead.id);

    if (!updatedLead) {
      return NextResponse.json(
        { error: "Lead was updated but could not be reloaded" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Follower added successfully",
      lead: updatedLead,
    });
  } catch (error) {
    console.error("POST /api/leads/[id]/followers error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to add follower",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const requestedUserId =
      typeof body.userId === "string" && body.userId.trim().length > 0
        ? body.userId.trim()
        : session.user.id;

    const currentUserRole = session.user.roleName ?? "";
    const currentUserBranchId = session.user.branchId ?? null;
    const crossBranchAllowed = canManageAcrossBranches(currentUserRole);

    const lead = await prisma.lead.findUnique({
      where: { id },
      select: {
        id: true,
        branchId: true,
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
          { error: "You do not have permission to update followers for this lead" },
          { status: 403 }
        );
      }
    }

    if (!crossBranchAllowed && requestedUserId !== session.user.id) {
      return NextResponse.json(
        { error: "You can remove only your own follow unless you are admin" },
        { status: 403 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.leadFollower.deleteMany({
        where: {
          leadId: lead.id,
          userId: requestedUserId,
        },
      });

      const details: Prisma.InputJsonValue = {
        followerUserId: requestedUserId,
      };

      await tx.lead.update({
        where: { id: lead.id },
        data: {
          lastActivityAt: new Date(),
          activities: {
            create: {
              actorUserId: session.user.id,
              action: "lead_follower_removed",
              details,
            },
          },
        },
      });
    });

    const updatedLead = await getLeadWithRelations(lead.id);

    if (!updatedLead) {
      return NextResponse.json(
        { error: "Lead was updated but could not be reloaded" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Follower removed successfully",
      lead: updatedLead,
    });
  } catch (error) {
    console.error("DELETE /api/leads/[id]/followers error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to remove follower",
      },
      { status: 500 }
    );
  }
}