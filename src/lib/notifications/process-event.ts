import { prisma } from "@/lib/prisma";
import {
  ClientCommunicationStatus,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationEventStatus,
  NotificationProvider,
} from "@prisma/client";
import { renderTemplate } from "./render-template";
import { resolveTarget } from "./resolve-target";
import { sendEmail } from "@/lib/resend";
import { sendInAppNotification } from "@/lib/suprsend";

export async function processNotificationEvent(eventId: string) {
  const event = await prisma.notificationEvent.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new Error("Notification event not found");
  }

  await prisma.notificationEvent.update({
    where: { id: event.id },
    data: { status: NotificationEventStatus.processing, error: null },
  });

  try {
    const rules = await prisma.workflowAutomationRule.findMany({
      where: {
        eventType: event.eventType,
        isActive: true,
        ...(event.workflowId ? { workflowId: event.workflowId } : {}),
      },
    });

    for (const rule of rules) {
      const payload =
        event.payload && typeof event.payload === "object"
          ? (event.payload as Record<string, any>)
          : {};

      const resolved = await resolveTarget(rule.targetType, payload);

      const subject = renderTemplate(
        `${rule.eventType.replaceAll("_", " ")}`,
        payload
      );

      const body = renderTemplate(
        `Event {{eventType}} triggered for {{entityType}}`,
        {
          ...payload,
          eventType: event.eventType,
          entityType: event.entityType,
        }
      );

      if (
        (rule.channel === NotificationChannel.email ||
          rule.channel === NotificationChannel.both) &&
        resolved.email
      ) {
        try {
          const emailResult = await sendEmail({
            to: resolved.email,
            subject,
            html: body,
          });

          await prisma.notificationDelivery.create({
            data: {
              notificationEventId: event.id,
              provider: NotificationProvider.resend,
              channel: NotificationChannel.email,
              recipient: resolved.email,
              targetType: rule.targetType,
              status: NotificationDeliveryStatus.sent,
              subject,
              body,
              providerMessageId:
                typeof emailResult === "object" &&
                emailResult &&
                "id" in emailResult &&
                emailResult.id
                  ? String(emailResult.id)
                  : null,
              sentAt: new Date(),
            },
          });

          if (event.clientId) {
            await prisma.clientCommunication.create({
              data: {
                clientId: event.clientId,
                applicationId: event.applicationId,
                provider: NotificationProvider.resend,
                channel: NotificationChannel.email,
                templateKey: rule.templateKey,
                subject,
                body,
                deliveryStatus: ClientCommunicationStatus.sent,
                providerMessageId:
                  typeof emailResult === "object" &&
                  emailResult &&
                  "id" in emailResult &&
                  emailResult.id
                    ? String(emailResult.id)
                    : null,
                sentAt: new Date(),
              },
            });
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Email send failed";

          await prisma.notificationDelivery.create({
            data: {
              notificationEventId: event.id,
              provider: NotificationProvider.resend,
              channel: NotificationChannel.email,
              recipient: resolved.email,
              targetType: rule.targetType,
              status: NotificationDeliveryStatus.failed,
              subject,
              body,
              errorMessage,
              failedAt: new Date(),
            },
          });

          if (event.clientId) {
            await prisma.clientCommunication.create({
              data: {
                clientId: event.clientId,
                applicationId: event.applicationId,
                provider: NotificationProvider.resend,
                channel: NotificationChannel.email,
                templateKey: rule.templateKey,
                subject,
                body,
                deliveryStatus: ClientCommunicationStatus.failed,
                failedAt: new Date(),
              },
            });
          }
        }
      }

      if (
        (rule.channel === NotificationChannel.in_app ||
          rule.channel === NotificationChannel.both) &&
        resolved.userId
      ) {
        try {
          await sendInAppNotification({
            userId: resolved.userId,
            message: body,
          });

          await prisma.notificationDelivery.create({
            data: {
              notificationEventId: event.id,
              provider: NotificationProvider.suprsend,
              channel: NotificationChannel.in_app,
              recipient: resolved.userId,
              targetType: rule.targetType,
              status: NotificationDeliveryStatus.sent,
              subject,
              body,
              sentAt: new Date(),
            },
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "In-app notification failed";

          await prisma.notificationDelivery.create({
            data: {
              notificationEventId: event.id,
              provider: NotificationProvider.suprsend,
              channel: NotificationChannel.in_app,
              recipient: resolved.userId,
              targetType: rule.targetType,
              status: NotificationDeliveryStatus.failed,
              subject,
              body,
              errorMessage,
              failedAt: new Date(),
            },
          });
        }
      }
    }

    await prisma.notificationEvent.update({
      where: { id: event.id },
      data: { status: NotificationEventStatus.processed },
    });
  } catch (error) {
    await prisma.notificationEvent.update({
      where: { id: event.id },
      data: {
        status: NotificationEventStatus.failed,
        error:
          error instanceof Error ? error.message : "Unknown processing error",
      },
    });

    throw error;
  }
}