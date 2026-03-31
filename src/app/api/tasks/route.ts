import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/require-api-auth";
import { ok, fail } from "@/lib/api-response";
import { ApiError, isApiError } from "@/lib/api-errors";
import { isAdmin } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit-log-service";
import { createNotificationEvent } from "@/lib/notifications/create-event";
import { processNotificationEvent } from "@/lib/notifications/process-event";
import { createNotification } from "@/lib/notification-service";
import { sendEmail, emailTemplate } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const session = await requireApiAuth();
    const body = await request.json();

    const assignedToId =
      body.assignedToId && String(body.assignedToId).trim().length > 0
        ? String(body.assignedToId)
        : session.user.id;

    const clientId =
      body.clientId && String(body.clientId).trim().length > 0
        ? String(body.clientId)
        : null;

    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      return fail("Task title is required", 400);
    }

    const roleName = session.user.roleName;
    const branchId = session.user.branchId ?? null;

    const assignedTo = await prisma.user.findUnique({
      where: { id: assignedToId },
      select: {
        id: true,
        branchId: true,
        isActive: true,
        firstName: true,
        lastName: true,
        email: true,
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

    let clientBranchId: string | null = null;
    let clientWorkflowId: string | null = null;
    let clientName: string | null = null;

    if (clientId) {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: {
          id: true,
          branchId: true,
          workflowId: true,
          firstName: true,
          lastName: true,
        },
      });

      if (!client) {
        throw new ApiError("Client not found", 404);
      }

      if (!isAdmin(roleName)) {
        if (!branchId) {
          throw new ApiError("Forbidden", 403);
        }

        if (client.branchId && client.branchId !== branchId) {
          throw new ApiError("Forbidden", 403);
        }
      }

      clientBranchId = client.branchId ?? null;
      clientWorkflowId = client.workflowId ?? null;
      clientName = `${client.firstName} ${client.lastName}`;
    }

    const task = await prisma.task.create({
      data: {
        title: body.title.trim(),
        description:
          body.description && typeof body.description === "string"
            ? body.description.trim() || null
            : null,
        clientId,
        assignedToId,
        assignedById: session.user.id,
        status:
          body.status && typeof body.status === "string"
            ? body.status
            : "pending",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        reminderEnabled:
          typeof body.reminderEnabled === "boolean"
            ? body.reminderEnabled
            : true,
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
            workflowId: true,
            email: true,
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
      action: "task.created",
      entityType: "task",
      entityId: task.id,
      message: `Task "${task.title}" created`,
      metadata: {
        clientId: task.clientId,
        assignedToId: task.assignedToId,
        assignedById: task.assignedById,
        status: task.status,
        dueDate: task.dueDate,
        isPersonalTask: !task.clientId,
      },
    });

    try {
      const event = await createNotificationEvent({
        eventType: "TASK_CREATED",
        entityType: "task",
        entityId: task.id,
        taskId: task.id,
        clientId: task.clientId ?? undefined,
        workflowId: task.client?.workflowId ?? clientWorkflowId ?? undefined,
        payload: {
          taskId: task.id,
          taskTitle: task.title,
          taskDescription: task.description,
          taskStatus: task.status,
          dueDate: task.dueDate,
          clientId: task.clientId,
          clientName:
            task.client && task.client.firstName && task.client.lastName
              ? `${task.client.firstName} ${task.client.lastName}`
              : clientName,
          clientEmail: task.client?.email ?? null,
          assignedToId: task.assignedToId,
          assignedToName: task.assignedTo
            ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
            : null,
          assignedToEmail: task.assignedTo?.email ?? null,
          assignedById: task.assignedById,
          assignedByName: task.assignedBy
            ? `${task.assignedBy.firstName} ${task.assignedBy.lastName}`
            : null,
          branchId:
            task.client?.branchId ?? clientBranchId ?? assignedTo.branchId,
          isPersonalTask: !task.clientId,
        },
      });

      await processNotificationEvent(event.id);

      if (task.assignedToId !== task.assignedById) {
        await createNotification({
          userId: task.assignedToId,
          title: "New Task Assigned",
          message: `You have been assigned: ${task.title}`,
          type: "task_assigned",
          link: "/tasks",
        });
      }

      await createNotification({
        userId: task.assignedById,
        title: "Task Created",
        message: `Task "${task.title}" created successfully`,
        type: "task_created",
        link: "/tasks",
      });

      if (
        task.assignedToId !== task.assignedById &&
        task.assignedTo?.email
      ) {
        await sendEmail({
          to: task.assignedTo.email,
          subject: "New Task Assigned",
          html: emailTemplate({
            title: "New Task Assigned",
            message: `You have been assigned a new task: ${task.title}`,
            actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/tasks`,
            actionLabel: "Open Tasks",
          }),
        });
      }

      if (task.assignedBy?.email) {
        await sendEmail({
          to: task.assignedBy.email,
          subject: "Task Created Successfully",
          html: emailTemplate({
            title: "Task Created",
            message: `Your task "${task.title}" was created successfully.`,
            actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/tasks`,
            actionLabel: "View Tasks",
          }),
        });
      }
    } catch (notificationError) {
      console.error("Task notification/email error:", notificationError);
    }

    return ok(task, 201);
  } catch (error) {
    console.error("Tasks POST error:", error);

    if (isApiError(error)) {
      return fail(error.message, error.status, error.details);
    }

    return fail(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
}