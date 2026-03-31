import { prisma } from "@/lib/prisma";
import { NotificationEventStatus } from "@prisma/client";

type CreateNotificationEventInput = {
  eventType: string;
  entityType: string;
  entityId: string;
  payload?: Record<string, any>;
  workflowId?: string;
  clientId?: string;
  taskId?: string;
  applicationId?: string;
};

export async function createNotificationEvent(
  input: CreateNotificationEventInput
) {
  return prisma.notificationEvent.create({
    data: {
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: input.entityId,
      payload: input.payload || {},
      workflowId: input.workflowId,
      clientId: input.clientId,
      taskId: input.taskId,
      applicationId: input.applicationId,
      status: NotificationEventStatus.pending,
    },
  });
}