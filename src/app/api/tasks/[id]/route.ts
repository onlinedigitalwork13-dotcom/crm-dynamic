import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/require-api-auth";
import { ok, fail } from "@/lib/api-response";
import { ApiError, isApiError } from "@/lib/api-errors";
import { isAdmin } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit-log-service";
import { createNotification } from "@/lib/notification-service";
import { sendEmail, emailTemplate } from "@/lib/resend";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  try {
    const session = await requireApiAuth();
    const { id } = await context.params;

    const task = await prisma.task.findUnique({
      where: { id },
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

    const roleName = session.user.roleName;
    const branchId = session.user.branchId ?? null;
    const userId = session.user.id;

    if (!isAdmin(roleName)) {
      const hasAccess =
        task.assignedToId === userId ||
        task.assignedById === userId ||
        (!!branchId &&
          (task.assignedTo?.branchId === branchId ||
            task.client?.branchId === branchId));

      if (!hasAccess) {
        throw new ApiError("Forbidden", 403);
      }
    }

    return ok(task);
  } catch (error) {
    console.error("Task GET by id error:", error);

    if (isApiError(error)) {
      return fail(error.message, error.status, error.details);
    }

    return fail(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireApiAuth();
    const { id } = await context.params;
    const body = await request.json();

    const existingTask = await prisma.task.findUnique({
      where: { id },
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
        client: {
          select: {
            id: true,
            branchId: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            branchId: true,
            isActive: true,
          },
        },
      },
    });

    if (!existingTask) {
      throw new ApiError("Task not found", 404);
    }

    const roleName = session.user.roleName;
    const branchId = session.user.branchId ?? null;
    const userId = session.user.id;

    if (!isAdmin(roleName)) {
      const hasAccess =
        existingTask.assignedToId === userId ||
        existingTask.assignedById === userId ||
        (!!branchId &&
          (existingTask.assignedTo?.branchId === branchId ||
            existingTask.client?.branchId === branchId));

      if (!hasAccess) {
        throw new ApiError("Forbidden", 403);
      }
    }

    const nextAssignedToId =
      body.assignedToId && String(body.assignedToId).trim().length > 0
        ? String(body.assignedToId)
        : existingTask.assignedToId;

    const nextClientId =
      body.clientId === null
        ? null
        : body.clientId && String(body.clientId).trim().length > 0
        ? String(body.clientId)
        : existingTask.clientId;

    if (nextAssignedToId) {
      const assignedTo = await prisma.user.findUnique({
        where: { id: nextAssignedToId },
        select: {
          id: true,
          branchId: true,
          isActive: true,
        },
      });

      if (!assignedTo) {
        throw new ApiError("Assigned user not found", 404);
      }

      if (!assignedTo.isActive) {
        throw new ApiError("Assigned user is inactive", 400);
      }

      if (!isAdmin(roleName)) {
        if (!branchId || assignedTo.branchId !== branchId) {
          throw new ApiError("Forbidden", 403);
        }
      }
    }

    if (nextClientId) {
      const client = await prisma.client.findUnique({
        where: { id: nextClientId },
        select: {
          id: true,
          branchId: true,
        },
      });

      if (!client) {
        throw new ApiError("Client not found", 404);
      }

      if (!isAdmin(roleName)) {
        if (!branchId || client.branchId !== branchId) {
          throw new ApiError("Forbidden", 403);
        }
      }
    }

    const previousAssignedToId = existingTask.assignedToId;
    const previousStatus = existingTask.status;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title:
          typeof body.title === "string" && body.title.trim()
            ? body.title.trim()
            : existingTask.title,
        description:
          body.description === null
            ? null
            : typeof body.description === "string"
            ? body.description.trim() || null
            : existingTask.description,
        clientId: nextClientId,
        assignedToId: nextAssignedToId,
        status:
          typeof body.status === "string" && body.status.trim()
            ? body.status
            : existingTask.status,
        dueDate:
          body.dueDate === null
            ? null
            : body.dueDate
            ? new Date(body.dueDate)
            : existingTask.dueDate,
        reminderEnabled:
          typeof body.reminderEnabled === "boolean"
            ? body.reminderEnabled
            : existingTask.reminderEnabled,
      },
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

    await createAuditLog({
      actorUserId: session.user.id,
      action: "task.updated",
      entityType: "task",
      entityId: updatedTask.id,
      message: `Task "${updatedTask.title}" updated`,
      metadata: {
        clientId: updatedTask.clientId,
        assignedToId: updatedTask.assignedToId,
        status: updatedTask.status,
        dueDate: updatedTask.dueDate,
        previousAssignedToId,
        previousStatus,
      },
    });

    try {
      const taskLink = "/tasks";
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
      const taskUrl = `${appUrl}/tasks`;

      const wasReassigned =
        updatedTask.assignedToId &&
        updatedTask.assignedToId !== previousAssignedToId;

      const wasCompleted =
        previousStatus !== "completed" && updatedTask.status === "completed";

      if (wasReassigned && updatedTask.assignedToId) {
        await createNotification({
          userId: updatedTask.assignedToId,
          title: "Task Assigned",
          message: `You have been assigned: ${updatedTask.title}`,
          type: "task_assigned",
          link: taskLink,
        });

        if (updatedTask.assignedTo?.email) {
          await sendEmail({
            to: updatedTask.assignedTo.email,
            subject: "New Task Assigned",
            html: emailTemplate({
              title: "New Task Assigned",
              message: `You have been assigned: ${updatedTask.title}`,
              actionUrl: taskUrl,
              actionLabel: "Open Tasks",
            }),
          });
        }
      }

      if (wasCompleted && updatedTask.assignedById) {
        await createNotification({
          userId: updatedTask.assignedById,
          title: "Task Completed",
          message: `Task "${updatedTask.title}" has been completed`,
          type: "task_completed",
          link: taskLink,
        });

        if (updatedTask.assignedBy?.email) {
          await sendEmail({
            to: updatedTask.assignedBy.email,
            subject: "Task Completed",
            html: emailTemplate({
              title: "Task Completed",
              message: `Task "${updatedTask.title}" has been completed.`,
              actionUrl: taskUrl,
              actionLabel: "View Tasks",
            }),
          });
        }
      }
    } catch (notificationError) {
      console.error("Task PATCH notification/email error:", notificationError);
    }

    return ok(updatedTask);
  } catch (error) {
    console.error("Task PATCH error:", error);

    if (isApiError(error)) {
      return fail(error.message, error.status, error.details);
    }

    return fail(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const session = await requireApiAuth();
    const { id } = await context.params;

    const existingTask = await prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        clientId: true,
        assignedToId: true,
        assignedById: true,
        client: {
          select: {
            branchId: true,
          },
        },
        assignedTo: {
          select: {
            branchId: true,
          },
        },
      },
    });

    if (!existingTask) {
      throw new ApiError("Task not found", 404);
    }

    const roleName = session.user.roleName;
    const branchId = session.user.branchId ?? null;
    const userId = session.user.id;

    if (!isAdmin(roleName)) {
      const hasAccess =
        existingTask.assignedToId === userId ||
        existingTask.assignedById === userId ||
        (!!branchId &&
          (existingTask.assignedTo?.branchId === branchId ||
            existingTask.client?.branchId === branchId));

      if (!hasAccess) {
        throw new ApiError("Forbidden", 403);
      }
    }

    await prisma.task.delete({
      where: { id },
    });

    await createAuditLog({
      actorUserId: session.user.id,
      action: "task.deleted",
      entityType: "task",
      entityId: existingTask.id,
      message: `Task "${existingTask.title}" deleted`,
      metadata: {
        clientId: existingTask.clientId,
        assignedToId: existingTask.assignedToId,
      },
    });

    return ok({ success: true });
  } catch (error) {
    console.error("Task DELETE error:", error);

    if (isApiError(error)) {
      return fail(error.message, error.status, error.details);
    }

    return fail(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
}