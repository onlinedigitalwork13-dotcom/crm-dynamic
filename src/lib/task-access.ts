import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import { isAdmin, hasBranchScopedAccess } from "@/lib/permissions";

type AccessContext = {
  userId: string;
  roleName?: string | null;
  branchId?: string | null;
};

export async function getAccessibleTaskOrThrow(
  taskId: string,
  context: AccessContext
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      title: true,
      description: true,
      clientId: true,
      assignedToId: true,
      assignedById: true,
      status: true,
      dueDate: true,
      reminderEnabled: true,
      lastReminderSentAt: true,
      reminderCount: true,
      createdAt: true,
      updatedAt: true,
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          branchId: true,
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
      assignedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          branchId: true,
        },
      },
    },
  });

  if (!task) {
    throw new ApiError("Task not found", 404);
  }

  if (isAdmin(context.roleName)) {
    return task;
  }

  if (hasBranchScopedAccess(context.roleName, context.branchId)) {
    const sameAssignedUserBranch = task.assignedTo?.branchId === context.branchId;
    const sameClientBranch = task.client?.branchId === context.branchId;
    const directlyAssigned = task.assignedToId === context.userId;
    const directlyCreated = task.assignedById === context.userId;

    if (sameAssignedUserBranch || sameClientBranch || directlyAssigned || directlyCreated) {
      return task;
    }
  }

  throw new ApiError("Forbidden", 403);
}