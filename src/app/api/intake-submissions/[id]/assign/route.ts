import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { createNotification } from "@/lib/notification-service";
import { sendEmail, emailTemplate } from "@/lib/resend";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function normalizeRole(value?: string | null) {
  return (value || "").trim().toLowerCase().replace(/\s+/g, "_");
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const currentUserRole = normalizeRole(session.user.roleName);
    const currentUserBranchId = session.user.branchId ?? null;

    const { id } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const assignedToId =
      typeof body === "object" &&
      body !== null &&
      "assignedToId" in body &&
      typeof (body as { assignedToId?: unknown }).assignedToId === "string"
        ? (body as { assignedToId: string }).assignedToId.trim()
        : "";

    if (!assignedToId) {
      return NextResponse.json(
        { error: "assignedToId is required" },
        { status: 400 }
      );
    }

    const [currentUser, submission, assignedUser] = await Promise.all([
      prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
          id: true,
          isActive: true,
          branchId: true,
          role: { select: { name: true } },
        },
      }),
      prisma.intakeFormSubmission.findUnique({
        where: { id },
        select: {
          id: true,
          branchId: true,
          status: true,
          assignedToId: true,
          firstName: true,
          lastName: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: assignedToId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          isActive: true,
          branchId: true,
          role: { select: { name: true } },
        },
      }),
    ]);

    if (!currentUser || !currentUser.isActive) {
      return NextResponse.json(
        { error: "Current user not found or inactive" },
        { status: 401 }
      );
    }

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    if (!assignedUser || !assignedUser.isActive) {
      return NextResponse.json(
        { error: "Assigned user not found or inactive" },
        { status: 400 }
      );
    }

    const effectiveCurrentRole = normalizeRole(currentUser.role?.name);
    const isAdmin =
      effectiveCurrentRole === "admin" ||
      effectiveCurrentRole === "super_admin";

    if (!isAdmin) {
      if (!currentUser.branchId || !submission.branchId) {
        return NextResponse.json(
          { error: "Branch mismatch" },
          { status: 403 }
        );
      }

      if (currentUser.branchId !== submission.branchId) {
        return NextResponse.json(
          { error: "Cannot assign outside your branch" },
          { status: 403 }
        );
      }

      if (assignedUser.branchId !== submission.branchId) {
        return NextResponse.json(
          { error: "User must belong to same branch" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.intakeFormSubmission.update({
      where: { id },
      data: {
        assignedToId: assignedUser.id,
        assignedAt: new Date(),
        status: "assigned",
      },
      select: {
        id: true,
        status: true,
        assignedAt: true,
        assignedToId: true,
        branchId: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // 🔥 NOTIFICATION START

    const leadName = `${submission.firstName ?? ""} ${
      submission.lastName ?? ""
    }`.trim();

    await createNotification({
      userId: assignedUser.id,
      title: "New Lead Assigned",
      message: `${leadName || "A lead"} has been assigned to you`,
      type: "lead_assigned",
      link: `/intake-submissions`,
    });

    // 🔥 EMAIL START

    try {
      if (assignedUser.email) {
        await sendEmail({
          to: assignedUser.email,
          subject: "New Lead Assigned",
          html: emailTemplate({
            title: "New Lead Assigned",
            message: `${leadName || "A lead"} has been assigned to you`,
            actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/intake-submissions`,
            actionLabel: "View Leads",
          }),
        });
      }
    } catch (emailError) {
      console.error("Lead assignment email error:", emailError);
    }

    // 🔥 END

    return NextResponse.json({
      success: true,
      message: "Submission assigned successfully",
      submission: updated,
    });
  } catch (error) {
    console.error("POST /api/intake-submissions/[id]/assign error:", error);

    return NextResponse.json(
      { error: "Failed to assign submission" },
      { status: 500 }
    );
  }
}