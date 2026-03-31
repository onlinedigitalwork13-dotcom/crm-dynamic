import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function normalizeRole(value?: string | null) {
  return (value || "").trim().toUpperCase().replace(/\s+/g, "_");
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const formData = await request.formData();

    const assignedToIdRaw = formData.get("assignedToId");
    const assignedToId =
      typeof assignedToIdRaw === "string" && assignedToIdRaw.trim()
        ? assignedToIdRaw.trim()
        : null;

    const currentUserRole = normalizeRole(session.user.roleName);
    const currentUserBranchId = session.user.branchId ?? null;
    const canManageAll =
      currentUserRole === "SUPER_ADMIN" || currentUserRole === "ADMIN";

    const client = await prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
        branchId: true,
        assignedToId: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (!canManageAll && currentUserBranchId && client.branchId !== currentUserBranchId) {
      return NextResponse.json(
        { error: "You do not have permission to assign this client" },
        { status: 403 }
      );
    }

    let assignedUserName = "Unassigned";

    if (assignedToId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assignedToId },
        select: {
          id: true,
          isActive: true,
          branchId: true,
          firstName: true,
          lastName: true,
        },
      });

      if (!assignee || !assignee.isActive) {
        return NextResponse.json(
          { error: "Selected staff member is invalid or inactive" },
          { status: 400 }
        );
      }

      if (
        !canManageAll &&
        currentUserBranchId &&
        assignee.branchId !== currentUserBranchId
      ) {
        return NextResponse.json(
          { error: "You can only assign clients within your branch" },
          { status: 403 }
        );
      }

      assignedUserName =
        [assignee.firstName, assignee.lastName].filter(Boolean).join(" ").trim() ||
        assignee.id;
    }

    await prisma.client.update({
      where: { id },
      data: {
        assignedToId,
      },
    });

    await prisma.clientActivity.create({
      data: {
        clientId: id,
        type: "assignment_updated",
        message: assignedToId
          ? `Client assigned to ${assignedUserName}`
          : "Client assignment cleared",
      },
    });

    return NextResponse.redirect(new URL(`/clients/${id}`, request.url));
  } catch (error) {
    console.error("Client assign error:", error);
    return NextResponse.json(
      { error: "Failed to assign client" },
      { status: 500 }
    );
  }
}