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

function formatPersonName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Unnamed";
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const formData = await request.formData();

    const action = String(formData.get("_action") || "");
    const userIdRaw = formData.get("userId");
    const suppliedUserId =
      typeof userIdRaw === "string" && userIdRaw.trim() ? userIdRaw.trim() : null;

    const currentUserId = session.user.id;
    const currentUserRole = normalizeRole(session.user.roleName);
    const currentUserBranchId = session.user.branchId ?? null;
    const canManageAll =
      currentUserRole === "SUPER_ADMIN" || currentUserRole === "ADMIN";

    const client = await prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
        branchId: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (!canManageAll && currentUserBranchId && client.branchId !== currentUserBranchId) {
      return NextResponse.json(
        { error: "You do not have permission to manage followers for this client" },
        { status: 403 }
      );
    }

    if (action === "follow_me") {
      const me = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
          firstName: true,
          lastName: true,
        },
      });

      await prisma.clientFollower.upsert({
        where: {
          clientId_userId: {
            clientId: id,
            userId: currentUserId,
          },
        },
        update: {},
        create: {
          clientId: id,
          userId: currentUserId,
        },
      });

      await prisma.clientActivity.create({
        data: {
          clientId: id,
          type: "follower_added",
          message: `${formatPersonName(me?.firstName, me?.lastName)} followed this client`,
        },
      });

      return NextResponse.redirect(new URL(`/clients/${id}`, request.url));
    }

    if (action === "unfollow_me") {
      const me = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
          firstName: true,
          lastName: true,
        },
      });

      await prisma.clientFollower.deleteMany({
        where: {
          clientId: id,
          userId: currentUserId,
        },
      });

      await prisma.clientActivity.create({
        data: {
          clientId: id,
          type: "follower_removed",
          message: `${formatPersonName(me?.firstName, me?.lastName)} unfollowed this client`,
        },
      });

      return NextResponse.redirect(new URL(`/clients/${id}`, request.url));
    }

    if (action === "add_follower") {
      if (!suppliedUserId) {
        return NextResponse.json({ error: "User is required" }, { status: 400 });
      }

      const user = await prisma.user.findUnique({
        where: { id: suppliedUserId },
        select: {
          id: true,
          isActive: true,
          branchId: true,
          firstName: true,
          lastName: true,
        },
      });

      if (!user || !user.isActive) {
        return NextResponse.json(
          { error: "Selected user is invalid or inactive" },
          { status: 400 }
        );
      }

      if (
        !canManageAll &&
        currentUserBranchId &&
        user.branchId !== currentUserBranchId
      ) {
        return NextResponse.json(
          { error: "You can only add followers from your branch" },
          { status: 403 }
        );
      }

      await prisma.clientFollower.upsert({
        where: {
          clientId_userId: {
            clientId: id,
            userId: suppliedUserId,
          },
        },
        update: {},
        create: {
          clientId: id,
          userId: suppliedUserId,
        },
      });

      await prisma.clientActivity.create({
        data: {
          clientId: id,
          type: "follower_added",
          message: `${formatPersonName(user.firstName, user.lastName)} was added as a follower`,
        },
      });

      return NextResponse.redirect(new URL(`/clients/${id}`, request.url));
    }

    if (action === "remove_follower") {
      if (!suppliedUserId) {
        return NextResponse.json({ error: "User is required" }, { status: 400 });
      }

      if (!canManageAll && suppliedUserId !== currentUserId) {
        return NextResponse.json(
          { error: "You can only remove yourself unless you are admin" },
          { status: 403 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: suppliedUserId },
        select: {
          firstName: true,
          lastName: true,
        },
      });

      await prisma.clientFollower.deleteMany({
        where: {
          clientId: id,
          userId: suppliedUserId,
        },
      });

      await prisma.clientActivity.create({
        data: {
          clientId: id,
          type: "follower_removed",
          message: `${formatPersonName(user?.firstName, user?.lastName)} was removed as a follower`,
        },
      });

      return NextResponse.redirect(new URL(`/clients/${id}`, request.url));
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Client followers error:", error);
    return NextResponse.json(
      { error: "Failed to update followers" },
      { status: 500 }
    );
  }
}