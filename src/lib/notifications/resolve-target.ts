import { prisma } from "@/lib/prisma";
import { NotificationTargetType } from "@prisma/client";

type EventPayload = Record<string, any>;

export async function resolveTarget(
  targetType: NotificationTargetType,
  payload: EventPayload
): Promise<{ email?: string; userId?: string; recipientLabel: string | null }> {
  if (targetType === "client") {
    if (!payload.clientId) {
      return { recipientLabel: null };
    }

    const client = await prisma.client.findUnique({
      where: { id: payload.clientId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!client) return { recipientLabel: null };

    return {
      email: client.email || undefined,
      recipientLabel: client.email || `${client.firstName} ${client.lastName}`,
    };
  }

  if (targetType === "assigned_user") {
    if (!payload.assignedToId) {
      return { recipientLabel: null };
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.assignedToId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) return { recipientLabel: null };

    return {
      userId: user.id,
      email: user.email,
      recipientLabel: user.email || `${user.firstName} ${user.lastName}`,
    };
  }

  if (targetType === "branch_admin") {
    if (!payload.branchId) {
      return { recipientLabel: null };
    }

    const adminUser = await prisma.user.findFirst({
      where: {
        branchId: payload.branchId,
        role: {
          name: {
            in: ["Admin", "Branch Admin", "Manager"],
          },
        },
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!adminUser) return { recipientLabel: null };

    return {
      userId: adminUser.id,
      email: adminUser.email,
      recipientLabel:
        adminUser.email || `${adminUser.firstName} ${adminUser.lastName}`,
    };
  }

  if (targetType === "staff") {
    if (!payload.branchId) {
      return { recipientLabel: null };
    }

    const staffUser = await prisma.user.findFirst({
      where: {
        branchId: payload.branchId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!staffUser) return { recipientLabel: null };

    return {
      userId: staffUser.id,
      email: staffUser.email,
      recipientLabel:
        staffUser.email || `${staffUser.firstName} ${staffUser.lastName}`,
    };
  }

  return { recipientLabel: null };
}