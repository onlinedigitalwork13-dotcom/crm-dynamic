import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notification-service";
import { sendEmail, emailTemplate } from "@/lib/resend";

type ClientWorkflowSnapshot = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  assignedToId: string | null;
  branchId: string | null;
  workflowId: string | null;
  currentStageId: string | null;
  workflow: {
    id: string;
    name: string;
  } | null;
  currentStage: {
    id: string;
    stageName: string;
  } | null;
};

type ProcessClientWorkflowAutomationInput = {
  previousClient: ClientWorkflowSnapshot;
  updatedClient: ClientWorkflowSnapshot;
};

type InternalRecipient = {
  userId: string;
  email: string | null;
  fullName: string;
};

function buildFallbackWorkflowTemplate(args: {
  templateKey: string;
  clientName: string;
  workflowName?: string | null;
  stageName?: string | null;
  previousStageName?: string | null;
}) {
  const {
    templateKey,
    clientName,
    workflowName,
    stageName,
    previousStageName,
  } = args;

  switch (templateKey) {
    case "workflow_assigned": {
      const title = "Workflow Assigned";
      const subject = "Your workflow has been assigned";
      const message = workflowName
        ? `Hello ${clientName}, your workflow has been assigned as ${workflowName}.${stageName ? ` Your current stage is ${stageName}.` : ""}`
        : `Hello ${clientName}, your workflow has been assigned.`;

      return {
        title,
        subject,
        message,
        html: emailTemplate({
          title,
          message,
          actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/clients`,
          actionLabel: "View Update",
        }),
      };
    }

    case "workflow_stage_update":
    case "workflow_stage_changed":
    default: {
      const title = "Workflow Update";
      const subject = stageName
        ? `Your application stage is now ${stageName}`
        : "Your workflow has been updated";

      const message = [
        `Hello ${clientName},`,
        workflowName
          ? `your workflow in ${workflowName} has been updated.`
          : "your workflow has been updated.",
        stageName ? `Your current stage is now ${stageName}.` : "",
        previousStageName ? `Previous stage: ${previousStageName}.` : "",
      ]
        .filter(Boolean)
        .join(" ");

      return {
        title,
        subject,
        message,
        html: emailTemplate({
          title,
          message,
          actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/clients`,
          actionLabel: "View Update",
        }),
      };
    }
  }
}

function getTemplateVariables(args: {
  previousClient: ClientWorkflowSnapshot;
  updatedClient: ClientWorkflowSnapshot;
}) {
  const { previousClient, updatedClient } = args;

  return {
    "client.id": updatedClient.id,
    "client.firstName": updatedClient.firstName || "",
    "client.lastName": updatedClient.lastName || "",
    "client.fullName":
      `${updatedClient.firstName || ""} ${updatedClient.lastName || ""}`.trim(),
    "client.email": updatedClient.email || "",
    "workflow.currentName": updatedClient.workflow?.name || "",
    "workflow.previousName": previousClient.workflow?.name || "",
    "stage.currentName": updatedClient.currentStage?.stageName || "",
    "stage.previousName": previousClient.currentStage?.stageName || "",
    "assignedUser.id": updatedClient.assignedToId || "",
  };
}

function renderTemplateString(
  template: string | null | undefined,
  variables: Record<string, string>
) {
  if (!template) return "";

  return template.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_match, key) => {
    return variables[key] ?? "";
  });
}

function resolveRenderedTemplate(args: {
  templateKey: string;
  template:
    | {
        subject: string | null;
        body: string;
      }
    | null
    | undefined;
  previousClient: ClientWorkflowSnapshot;
  updatedClient: ClientWorkflowSnapshot;
}) {
  const { templateKey, template, previousClient, updatedClient } = args;

  const clientName =
    `${updatedClient.firstName || ""} ${updatedClient.lastName || ""}`.trim() ||
    "Client";

  if (!template) {
    return buildFallbackWorkflowTemplate({
      templateKey,
      clientName,
      workflowName: updatedClient.workflow?.name || null,
      stageName: updatedClient.currentStage?.stageName || null,
      previousStageName: previousClient.currentStage?.stageName || null,
    });
  }

  const variables = getTemplateVariables({
    previousClient,
    updatedClient,
  });

  const title = template.subject
    ? renderTemplateString(template.subject, variables)
    : "Workflow Update";

  const body = renderTemplateString(template.body, variables);

  return {
    title,
    subject: title,
    message: body,
    html: emailTemplate({
      title,
      message: body,
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/clients/${updatedClient.id}`,
      actionLabel: "Open Client",
    }),
  };
}

async function resolveInternalRecipients(args: {
  targetType: string;
  updatedClient: ClientWorkflowSnapshot;
}) {
  const { targetType, updatedClient } = args;

  if (targetType === "assigned_user") {
    if (!updatedClient.assignedToId) return [];

    const assignedUser = await prisma.user.findUnique({
      where: { id: updatedClient.assignedToId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!assignedUser) return [];

    return [
      {
        userId: assignedUser.id,
        email: assignedUser.email,
        fullName: `${assignedUser.firstName} ${assignedUser.lastName}`.trim(),
      },
    ] satisfies InternalRecipient[];
  }

  if (targetType === "branch_admin") {
    if (!updatedClient.branchId) return [];

    const users = await prisma.user.findMany({
      where: {
        branchId: updatedClient.branchId,
        isActive: true,
        role: {
          name: {
            in: ["ADMIN", "SUPER_ADMIN", "admin", "super_admin"],
          },
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    return users.map((user) => ({
      userId: user.id,
      email: user.email,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
    }));
  }

  if (targetType === "staff") {
    if (!updatedClient.branchId) return [];

    const users = await prisma.user.findMany({
      where: {
        branchId: updatedClient.branchId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    return users.map((user) => ({
      userId: user.id,
      email: user.email,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
    }));
  }

  return [];
}

export async function processClientWorkflowAutomation({
  previousClient,
  updatedClient,
}: ProcessClientWorkflowAutomationInput) {
  const previousWorkflowName = previousClient.workflow?.name || null;
  const previousStageName = previousClient.currentStage?.stageName || null;
  const currentWorkflowName = updatedClient.workflow?.name || null;
  const currentStageName = updatedClient.currentStage?.stageName || null;

  const workflowChanged = previousClient.workflowId !== updatedClient.workflowId;
  const stageChanged = previousClient.currentStageId !== updatedClient.currentStageId;

  if (!updatedClient.workflowId || !(workflowChanged || stageChanged)) {
    return {
      matchedRuleCount: 0,
      workflowChanged,
      stageChanged,
    };
  }

  const automationRules = await prisma.workflowAutomationRule.findMany({
    where: {
      workflowId: updatedClient.workflowId,
      isActive: true,
      eventType: {
        in: [
          "WORKFLOW_ASSIGNED",
          "WORKFLOW_STAGE_CHANGED",
          "CLIENT_STAGE_CHANGED",
        ],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      fromStage: {
        select: {
          id: true,
          stageName: true,
        },
      },
      toStage: {
        select: {
          id: true,
          stageName: true,
        },
      },
    },
  });

  const matchingRules = automationRules.filter((rule) => {
    const fromMatches =
      !rule.fromStageId || rule.fromStageId === previousClient.currentStageId;

    const toMatches =
      !rule.toStageId || rule.toStageId === updatedClient.currentStageId;

    if (workflowChanged && !stageChanged) {
      return (
        fromMatches &&
        toMatches &&
        (rule.eventType === "WORKFLOW_ASSIGNED" ||
          rule.eventType === "WORKFLOW_STAGE_CHANGED")
      );
    }

    if (stageChanged) {
      return (
        fromMatches &&
        toMatches &&
        (rule.eventType === "WORKFLOW_STAGE_CHANGED" ||
          rule.eventType === "CLIENT_STAGE_CHANGED")
      );
    }

    return false;
  });

  if (matchingRules.length === 0) {
    return {
      matchedRuleCount: 0,
      workflowChanged,
      stageChanged,
    };
  }

  const templateKeys = Array.from(
    new Set(matchingRules.map((rule) => rule.templateKey).filter(Boolean))
  );

  const templates = await prisma.communicationTemplate.findMany({
    where: {
      key: {
        in: templateKeys,
      },
      isActive: true,
    },
    select: {
      id: true,
      key: true,
      subject: true,
      body: true,
      channel: true,
    },
  });

  const templateMap = new Map(templates.map((template) => [template.key, template]));

  for (const rule of matchingRules) {
    const template = templateMap.get(rule.templateKey);

    const rendered = resolveRenderedTemplate({
      templateKey: rule.templateKey,
      template,
      previousClient,
      updatedClient,
    });

    const sendInApp = rule.channel === "in_app" || rule.channel === "both";
    const sendEmailChannel = rule.channel === "email" || rule.channel === "both";

    const notificationEvent = await prisma.notificationEvent.create({
      data: {
        eventType: rule.eventType,
        entityType: "client_workflow",
        entityId: updatedClient.id,
        workflowId: updatedClient.workflowId,
        clientId: updatedClient.id,
        status: "processing",
        payload: {
          ruleId: rule.id,
          ruleName: rule.name,
          templateKey: rule.templateKey,
          targetType: rule.targetType,
          channel: rule.channel,
          provider: rule.provider,
          previousWorkflowName,
          previousStageName,
          currentWorkflowName,
          currentStageName,
        },
      },
    });

    let deliverySuccessCount = 0;
    let deliveryFailureCount = 0;

    if (rule.targetType === "client") {
      if (sendEmailChannel && updatedClient.email) {
        try {
          const emailResult = await sendEmail({
            to: updatedClient.email,
            subject: rendered.subject,
            html: rendered.html,
          });

          await prisma.clientCommunication.create({
            data: {
              clientId: updatedClient.id,
              provider: rule.provider,
              channel: "email",
              templateKey: rule.templateKey,
              subject: rendered.subject,
              body: rendered.html,
              deliveryStatus: "sent",
              providerMessageId:
                emailResult &&
                typeof emailResult === "object" &&
                "data" in emailResult &&
                emailResult.data &&
                typeof emailResult.data === "object" &&
                "id" in emailResult.data
                  ? String(emailResult.data.id)
                  : null,
              sentAt: new Date(),
            },
          });

          await prisma.notificationDelivery.create({
            data: {
              notificationEventId: notificationEvent.id,
              provider: rule.provider,
              channel: "email",
              recipient: updatedClient.email,
              targetType: rule.targetType,
              status: "sent",
              subject: rendered.subject,
              body: rendered.html,
              providerMessageId:
                emailResult &&
                typeof emailResult === "object" &&
                "data" in emailResult &&
                emailResult.data &&
                typeof emailResult.data === "object" &&
                "id" in emailResult.data
                  ? String(emailResult.data.id)
                  : null,
              sentAt: new Date(),
            },
          });

          deliverySuccessCount += 1;
        } catch (emailError) {
          await prisma.clientCommunication.create({
            data: {
              clientId: updatedClient.id,
              provider: rule.provider,
              channel: "email",
              templateKey: rule.templateKey,
              subject: rendered.subject,
              body: rendered.html,
              deliveryStatus: "failed",
              failedAt: new Date(),
            },
          });

          await prisma.notificationDelivery.create({
            data: {
              notificationEventId: notificationEvent.id,
              provider: rule.provider,
              channel: "email",
              recipient: updatedClient.email,
              targetType: rule.targetType,
              status: "failed",
              subject: rendered.subject,
              body: rendered.html,
              errorMessage:
                emailError instanceof Error ? emailError.message : "Email failed",
              failedAt: new Date(),
            },
          });

          deliveryFailureCount += 1;
        }
      }
    } else {
      const recipients = await resolveInternalRecipients({
        targetType: rule.targetType,
        updatedClient,
      });

      for (const recipient of recipients) {
        if (sendInApp) {
          try {
            await createNotification({
              userId: recipient.userId,
              title: rendered.title || "Client Workflow Updated",
              message:
                rendered.message ||
                `${updatedClient.firstName} ${updatedClient.lastName}`.trim(),
              type: "client_stage_changed",
              link: `/clients/${updatedClient.id}`,
            });

            await prisma.notificationDelivery.create({
              data: {
                notificationEventId: notificationEvent.id,
                provider: "system",
                channel: "in_app",
                recipient: recipient.userId,
                targetType: rule.targetType,
                status: "delivered",
                subject: rendered.subject,
                body: rendered.message,
                deliveredAt: new Date(),
              },
            });

            deliverySuccessCount += 1;
          } catch (inAppError) {
            await prisma.notificationDelivery.create({
              data: {
                notificationEventId: notificationEvent.id,
                provider: "system",
                channel: "in_app",
                recipient: recipient.userId,
                targetType: rule.targetType,
                status: "failed",
                subject: rendered.subject,
                body: rendered.message,
                errorMessage:
                  inAppError instanceof Error
                    ? inAppError.message
                    : "In-app notification failed",
                failedAt: new Date(),
              },
            });

            deliveryFailureCount += 1;
          }
        }

        if (sendEmailChannel && recipient.email) {
          try {
            const emailResult = await sendEmail({
              to: recipient.email,
              subject: rendered.subject,
              html: rendered.html,
            });

            await prisma.notificationDelivery.create({
              data: {
                notificationEventId: notificationEvent.id,
                provider: rule.provider,
                channel: "email",
                recipient: recipient.email,
                targetType: rule.targetType,
                status: "sent",
                subject: rendered.subject,
                body: rendered.html,
                providerMessageId:
                  emailResult &&
                  typeof emailResult === "object" &&
                  "data" in emailResult &&
                  emailResult.data &&
                  typeof emailResult.data === "object" &&
                  "id" in emailResult.data
                    ? String(emailResult.data.id)
                    : null,
                sentAt: new Date(),
              },
            });

            deliverySuccessCount += 1;
          } catch (emailError) {
            await prisma.notificationDelivery.create({
              data: {
                notificationEventId: notificationEvent.id,
                provider: rule.provider,
                channel: "email",
                recipient: recipient.email,
                targetType: rule.targetType,
                status: "failed",
                subject: rendered.subject,
                body: rendered.html,
                errorMessage:
                  emailError instanceof Error ? emailError.message : "Email failed",
                failedAt: new Date(),
              },
            });

            deliveryFailureCount += 1;
          }
        }
      }
    }

    await prisma.notificationEvent.update({
      where: {
        id: notificationEvent.id,
      },
      data: {
        status: deliverySuccessCount > 0 ? "processed" : "failed",
        error:
          deliverySuccessCount === 0 && deliveryFailureCount > 0
            ? "All deliveries failed."
            : null,
      },
    });
  }

  return {
    matchedRuleCount: matchingRules.length,
    workflowChanged,
    stageChanged,
  };
}