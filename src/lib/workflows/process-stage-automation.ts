import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notification-service";
import { sendEmail, emailTemplate } from "@/lib/resend";

type ProcessStageAutomationInput = {
  clientId: string;
  workflowId: string | null;
  fromStageId: string | null;
  toStageId: string | null;
};

type InternalRecipient = {
  userId: string;
  email: string | null;
  fullName: string;
};

function buildWorkflowTemplate(args: {
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
    case "stage_changed":
    case "client_stage_changed":
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
  clientId: string;
  clientFirstName: string;
  clientLastName: string;
  clientEmail?: string | null;
  workflowName?: string | null;
  previousWorkflowName?: string | null;
  stageName?: string | null;
  previousStageName?: string | null;
  assignedUserId?: string | null;
}) {
  const {
    clientId,
    clientFirstName,
    clientLastName,
    clientEmail,
    workflowName,
    previousWorkflowName,
    stageName,
    previousStageName,
    assignedUserId,
  } = args;

  return {
    "client.id": clientId,
    "client.firstName": clientFirstName || "",
    "client.lastName": clientLastName || "",
    "client.fullName": `${clientFirstName || ""} ${clientLastName || ""}`.trim(),
    "client.email": clientEmail || "",
    "workflow.currentName": workflowName || "",
    "workflow.previousName": previousWorkflowName || "",
    "stage.currentName": stageName || "",
    "stage.previousName": previousStageName || "",
    "assignedUser.id": assignedUserId || "",
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
  storedTemplate?: {
    key: string;
    subject: string | null;
    body: string;
  } | null;
  clientId: string;
  clientFirstName: string;
  clientLastName: string;
  clientEmail?: string | null;
  workflowName?: string | null;
  previousWorkflowName?: string | null;
  stageName?: string | null;
  previousStageName?: string | null;
  assignedUserId?: string | null;
}) {
  const {
    templateKey,
    storedTemplate,
    clientId,
    clientFirstName,
    clientLastName,
    clientEmail,
    workflowName,
    previousWorkflowName,
    stageName,
    previousStageName,
    assignedUserId,
  } = args;

  const clientName =
    `${clientFirstName || ""} ${clientLastName || ""}`.trim() || "Client";

  if (!storedTemplate) {
    return buildWorkflowTemplate({
      templateKey,
      clientName,
      workflowName,
      stageName,
      previousStageName,
    });
  }

  const variables = getTemplateVariables({
    clientId,
    clientFirstName,
    clientLastName,
    clientEmail,
    workflowName,
    previousWorkflowName,
    stageName,
    previousStageName,
    assignedUserId,
  });

  const renderedSubject = storedTemplate.subject
    ? renderTemplateString(storedTemplate.subject, variables)
    : "Workflow Update";

  const renderedBody = renderTemplateString(storedTemplate.body, variables);

  return {
    title: renderedSubject || "Workflow Update",
    subject: renderedSubject || "Workflow Update",
    message: renderedBody,
    html: emailTemplate({
      title: renderedSubject || "Workflow Update",
      message: renderedBody,
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/clients/${clientId}`,
      actionLabel: "View Update",
    }),
  };
}

async function resolveInternalRecipients(args: {
  targetType: string;
  assignedToId?: string | null;
  branchId?: string | null;
}) {
  const { targetType, assignedToId, branchId } = args;

  if (targetType === "assigned_user") {
    if (!assignedToId) return [];

    const assignedUser = await prisma.user.findUnique({
      where: { id: assignedToId },
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
    if (!branchId) return [];

    const users = await prisma.user.findMany({
      where: {
        branchId,
        isActive: true,
        role: {
          name: {
            in: ["admin", "super_admin", "ADMIN", "SUPER_ADMIN"],
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
    if (!branchId) return [];

    const users = await prisma.user.findMany({
      where: {
        branchId,
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

export async function processStageAutomation({
  clientId,
  workflowId,
  fromStageId,
  toStageId,
}: ProcessStageAutomationInput) {
  if (!clientId || !workflowId || !toStageId) {
    return;
  }

  const rules = await prisma.workflowAutomationRule.findMany({
    where: {
      workflowId,
      isActive: true,
      OR: [
        {
          eventType: "STAGE_CHANGED",
          toStageId,
          OR: [{ fromStageId: null }, { fromStageId }],
        },
        {
          eventType: "WORKFLOW_STAGE_CHANGED",
          toStageId,
          OR: [{ fromStageId: null }, { fromStageId }],
        },
        {
          eventType: "CLIENT_STAGE_CHANGED",
          toStageId,
          OR: [{ fromStageId: null }, { fromStageId }],
        },
      ],
    },
    orderBy: {
      createdAt: "asc",
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

  if (!rules.length) {
    return;
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      branchId: true,
      assignedToId: true,
      workflowId: true,
      currentStageId: true,
      workflow: {
        select: {
          id: true,
          name: true,
        },
      },
      currentStage: {
        select: {
          id: true,
          stageName: true,
        },
      },
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  });

  if (!client) {
    return;
  }

  const previousStage = fromStageId
    ? await prisma.workflowStage.findUnique({
        where: { id: fromStageId },
        select: {
          id: true,
          stageName: true,
        },
      })
    : null;

  const branchManager = client.branchId
    ? await prisma.user.findFirst({
        where: {
          branchId: client.branchId,
          isActive: true,
          role: {
            name: "branch_manager",
          },
        },
        select: {
          id: true,
        },
      })
    : null;

  const templateKeys = Array.from(
    new Set(rules.map((rule) => rule.templateKey).filter(Boolean))
  );

  const storedTemplates =
    templateKeys.length > 0
      ? await prisma.communicationTemplate.findMany({
          where: {
            key: {
              in: templateKeys,
            },
            isActive: true,
          },
          select: {
            key: true,
            subject: true,
            body: true,
          },
        })
      : [];

  const templateMap = new Map(
    storedTemplates.map((template) => [template.key, template])
  );

  for (const rule of rules) {
    if (rule.eventType === "STAGE_CHANGED" && rule.targetType === "assigned_user") {
      const existingTask = client.tasks.find(
        (task) =>
          task.title.trim().toLowerCase() ===
          rule.templateKey.trim().toLowerCase()
      );

      if (!existingTask && branchManager?.id) {
        await prisma.task.create({
          data: {
            title: rule.templateKey,
            description: rule.description || null,
            clientId: client.id,
            assignedToId: branchManager.id,
            assignedById: branchManager.id,
            status: "pending",
            reminderEnabled: true,
          },
        });
      }
    }

    const rendered = resolveRenderedTemplate({
      templateKey: rule.templateKey,
      storedTemplate: templateMap.get(rule.templateKey) || null,
      clientId: client.id,
      clientFirstName: client.firstName,
      clientLastName: client.lastName,
      clientEmail: client.email,
      workflowName: client.workflow?.name || null,
      previousWorkflowName: client.workflow?.name || null,
      stageName: client.currentStage?.stageName || null,
      previousStageName: previousStage?.stageName || null,
      assignedUserId: client.assignedToId,
    });

    const sendInApp = rule.channel === "in_app" || rule.channel === "both";
    const sendEmailChannel = rule.channel === "email" || rule.channel === "both";

    let notificationEventId: string | null = null;

    try {
      const event = await prisma.notificationEvent.create({
        data: {
          eventType: rule.eventType,
          entityType: "client_stage",
          entityId: client.id,
          workflowId: client.workflowId,
          clientId: client.id,
          status: "processing",
          payload: {
            ruleId: rule.id,
            ruleName: rule.name,
            templateKey: rule.templateKey,
            targetType: rule.targetType,
            channel: rule.channel,
            provider: rule.provider,
            fromStageId,
            toStageId,
            previousStageName: previousStage?.stageName || null,
            currentStageName: client.currentStage?.stageName || null,
            workflowName: client.workflow?.name || null,
          },
        },
        select: {
          id: true,
        },
      });

      notificationEventId = event.id;
    } catch (eventError) {
      console.error("NotificationEvent create error:", eventError);
    }

    if (rule.targetType === "client") {
      if (sendEmailChannel && client.email) {
        try {
          const emailResult = await sendEmail({
            to: client.email,
            subject: rendered.subject,
            html: rendered.html,
          });

          await prisma.clientCommunication.create({
            data: {
              clientId: client.id,
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

          if (notificationEventId) {
            await prisma.notificationDelivery.create({
              data: {
                notificationEventId,
                provider: rule.provider,
                channel: "email",
                recipient: client.email,
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
          }
        } catch (emailError) {
          console.error("Stage automation client email error:", emailError);

          await prisma.clientCommunication.create({
            data: {
              clientId: client.id,
              provider: rule.provider,
              channel: "email",
              templateKey: rule.templateKey,
              subject: rendered.subject,
              body: rendered.html,
              deliveryStatus: "failed",
              failedAt: new Date(),
            },
          });

          if (notificationEventId) {
            await prisma.notificationDelivery.create({
              data: {
                notificationEventId,
                provider: rule.provider,
                channel: "email",
                recipient: client.email,
                targetType: rule.targetType,
                status: "failed",
                subject: rendered.subject,
                body: rendered.html,
                errorMessage:
                  emailError instanceof Error
                    ? emailError.message
                    : "Stage automation client email failed",
                failedAt: new Date(),
              },
            });
          }
        }
      }
    }

    if (
      rule.targetType === "assigned_user" ||
      rule.targetType === "branch_admin" ||
      rule.targetType === "staff"
    ) {
      const internalRecipients = await resolveInternalRecipients({
        targetType: rule.targetType,
        assignedToId: client.assignedToId,
        branchId: client.branchId,
      });

      for (const recipient of internalRecipients) {
        if (sendInApp) {
          try {
            await createNotification({
              userId: recipient.userId,
              title: rendered.title || "Client Stage Updated",
              message:
                rendered.message ||
                `${client.firstName} ${client.lastName} moved to ${
                  client.currentStage?.stageName || "a new stage"
                }.`,
              type: "client_stage_changed",
              link: `/clients/${client.id}`,
            });

            if (notificationEventId) {
              await prisma.notificationDelivery.create({
                data: {
                  notificationEventId,
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
            }
          } catch (inAppError) {
            console.error(
              `Stage automation ${rule.targetType} in-app error:`,
              inAppError
            );

            if (notificationEventId) {
              await prisma.notificationDelivery.create({
                data: {
                  notificationEventId,
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
            }
          }
        }

        if (sendEmailChannel && recipient.email) {
          try {
            const internalSubject =
              rendered.subject ||
              `Client stage update: ${client.firstName} ${client.lastName}`;

            const internalMessage =
              rendered.message ||
              `${client.firstName} ${client.lastName} moved to ${
                client.currentStage?.stageName || "a new stage"
              }${client.workflow?.name ? ` in ${client.workflow.name}` : ""}.`;

            const internalEmailResult = await sendEmail({
              to: recipient.email,
              subject: internalSubject,
              html: emailTemplate({
                title: internalSubject,
                message: internalMessage,
                actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/clients/${client.id}`,
                actionLabel: "Open Client",
              }),
            });

            if (notificationEventId) {
              await prisma.notificationDelivery.create({
                data: {
                  notificationEventId,
                  provider: rule.provider,
                  channel: "email",
                  recipient: recipient.email,
                  targetType: rule.targetType,
                  status: "sent",
                  subject: internalSubject,
                  body: internalMessage,
                  providerMessageId:
                    internalEmailResult &&
                    typeof internalEmailResult === "object" &&
                    "data" in internalEmailResult &&
                    internalEmailResult.data &&
                    typeof internalEmailResult.data === "object" &&
                    "id" in internalEmailResult.data
                      ? String(internalEmailResult.data.id)
                      : null,
                  sentAt: new Date(),
                },
              });
            }
          } catch (internalEmailError) {
            console.error(
              `Stage automation ${rule.targetType} email error:`,
              internalEmailError
            );

            if (notificationEventId) {
              await prisma.notificationDelivery.create({
                data: {
                  notificationEventId,
                  provider: rule.provider,
                  channel: "email",
                  recipient: recipient.email,
                  targetType: rule.targetType,
                  status: "failed",
                  subject: rendered.subject,
                  body: rendered.message,
                  errorMessage:
                    internalEmailError instanceof Error
                      ? internalEmailError.message
                      : "Internal email failed",
                  failedAt: new Date(),
                },
              });
            }
          }
        }
      }
    }

    if (notificationEventId) {
      try {
        const deliveries = await prisma.notificationDelivery.count({
          where: {
            notificationEventId,
          },
        });

        const failedDeliveries = await prisma.notificationDelivery.count({
          where: {
            notificationEventId,
            status: "failed",
          },
        });

        await prisma.notificationEvent.update({
          where: {
            id: notificationEventId,
          },
          data: {
            status:
              deliveries > 0 && failedDeliveries < deliveries
                ? "processed"
                : failedDeliveries > 0
                  ? "failed"
                  : "processed",
            error:
              deliveries > 0 && failedDeliveries === deliveries
                ? "All deliveries failed."
                : null,
          },
        });
      } catch (updateEventError) {
        console.error(
          "NotificationEvent update status error:",
          updateEventError
        );
      }
    }
  }
}