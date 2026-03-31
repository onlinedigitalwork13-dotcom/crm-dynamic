import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/require-api-auth";
import { ApiError, isApiError } from "@/lib/api-errors";
import { isAdmin } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit-log-service";
import { createNotificationEvent } from "@/lib/notifications/create-event";
import { processNotificationEvent } from "@/lib/notifications/process-event";
import { processTaskAutomation } from "@/lib/tasks/process-task-automation";
import { createNotification } from "@/lib/notification-service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ALLOWED_STATUSES = ["pending", "in_progress", "completed"] as const;

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireApiAuth();
    const { id } = await context.params;

    const formData = await request.formData();
    const rawStatus = formData.get("status");
    const nextStatus =
      typeof rawStatus === "string" ? rawStatus.trim() : "";

    if (
      !ALLOWED_STATUSES.includes(
        nextStatus as (typeof ALLOWED_STATUSES)[number]
      )
    ) {
      throw new ApiError("Invalid task status", 400);
    }

    const existingTask = await prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        status: true,
        clientId: true,
        assignedToId: true,
        assignedById: true,
        dueDate: true,
        reminderEnabled: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            branchId: true,
            workflowId: true,
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

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: nextStatus,
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
            email: true,
            branchId: true,
            workflowId: true,
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
      action: "task.status_updated",
      entityType: "task",
      entityId: updatedTask.id,
      message: `Task "${updatedTask.title}" status changed from "${existingTask.status}" to "${updatedTask.status}"`,
      metadata: {
        previousStatus: existingTask.status,
        newStatus: updatedTask.status,
        clientId: updatedTask.clientId,
        assignedToId: updatedTask.assignedToId,
      },
    });

    try {
      const event = await createNotificationEvent({
        eventType: "TASK_STATUS_CHANGED",
        entityType: "task",
        entityId: updatedTask.id,
        taskId: updatedTask.id,
        clientId: updatedTask.clientId ?? undefined,
        workflowId: updatedTask.client?.workflowId ?? undefined,
        payload: {
          taskId: updatedTask.id,
          taskTitle: updatedTask.title,
          previousStatus: existingTask.status,
          newStatus: updatedTask.status,
          clientId: updatedTask.clientId,
          clientName: updatedTask.client
            ? `${updatedTask.client.firstName} ${updatedTask.client.lastName}`
            : null,
          clientEmail: updatedTask.client?.email ?? null,
          assignedToId: updatedTask.assignedToId,
          assignedToName: updatedTask.assignedTo
            ? `${updatedTask.assignedTo.firstName} ${updatedTask.assignedTo.lastName}`
            : null,
          assignedToEmail: updatedTask.assignedTo?.email ?? null,
          assignedById: updatedTask.assignedById,
          assignedByName: updatedTask.assignedBy
            ? `${updatedTask.assignedBy.firstName} ${updatedTask.assignedBy.lastName}`
            : null,
          branchId:
            updatedTask.client?.branchId ??
            updatedTask.assignedTo?.branchId ??
            null,
        },
      });

      await processNotificationEvent(event.id);

      await processTaskAutomation({
        eventType: "TASK_STATUS_CHANGED",
        taskId: updatedTask.id,
      });
      if (
  updatedTask.status === "completed" &&
  updatedTask.assignedById !== updatedTask.assignedToId
) {
  await createNotification({
    userId: updatedTask.assignedById,
    title: "Task Completed",
    message: `Task "${updatedTask.title}" has been completed`,
    type: "task_completed",
    link: "/tasks",
  });
}
    } catch (notificationError) {
      console.error("Task status notification error:", notificationError);
    }

    return NextResponse.redirect(new URL("/tasks", request.url), {
      status: 303,
    });
  } catch (error) {
    console.error("Task status POST error:", error);

    if (isApiError(error)) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
          details: error.details ?? null,
        },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}