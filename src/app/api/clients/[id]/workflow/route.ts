import { prisma } from "@/lib/prisma";
import { logClientActivity } from "@/lib/activity-service";
import { createNotification } from "@/lib/notification-service";
import { sendEmail, emailTemplate } from "@/lib/resend";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
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

export async function POST(req: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const formData = await req.formData();
    const workflowId = (formData.get("workflowId") as string) || "";

    const existingClient = await prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        assignedToId: true,
        branchId: true,
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
      },
    });

    if (!existingClient) {
      return Response.json({ error: "Client not found" }, { status: 404 });
    }

    let firstStage: {
      id: string;
      stageName: string;
      orderSequence: number;
      isFinal: boolean;
      workflowId: string;
      createdAt: Date;
      updatedAt: Date;
    } | null = null;

    let workflowName = "Unassigned";

    if (workflowId) {
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        select: { name: true },
      });

      workflowName = workflow?.name || "Unknown Workflow";

      firstStage = await prisma.workflowStage.findFirst({
        where: { workflowId },
        orderBy: { orderSequence: "asc" },
      });
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        workflowId: workflowId || null,
        currentStageId: firstStage?.id || null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        assignedToId: true,
        branchId: true,
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
      },
    });

    await logClientActivity({
      clientId: id,
      type: "workflow_assigned",
      message: workflowId
        ? `Workflow assigned: ${workflowName}`
        : "Workflow unassigned",
    });

    if (firstStage) {
      await logClientActivity({
        clientId: id,
        type: "stage_changed",
        message: `Stage set to: ${firstStage.stageName}`,
      });
    }

    try {
      const previousWorkflowName = existingClient.workflow?.name || null;
      const previousStageName = existingClient.currentStage?.stageName || null;
      const currentWorkflowName = updatedClient.workflow?.name || null;
      const currentStageName = updatedClient.currentStage?.stageName || null;

      const workflowChanged =
        existingClient.workflowId !== updatedClient.workflowId;
      const stageChanged =
        existingClient.currentStageId !== updatedClient.currentStageId;

      const clientName =
        `${updatedClient.firstName} ${updatedClient.lastName}`.trim();

      let matchedRuleCount = 0;

      if (
        updatedClient.workflowId &&
        updatedClient.currentStageId &&
        (workflowChanged || stageChanged)
      ) {
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
        });

        const matchingRules = automationRules.filter((rule) => {
          const fromMatches =
            !rule.fromStageId || rule.fromStageId === existingClient.currentStageId;

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

        matchedRuleCount = matchingRules.length;

        const templateKeys = Array.from(
          new Set(matchingRules.map((rule) => rule.templateKey).filter(Boolean))
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

        for (const rule of matchingRules) {
          const rendered = resolveRenderedTemplate({
            templateKey: rule.templateKey,
            storedTemplate: templateMap.get(rule.templateKey) || null,
            clientId: updatedClient.id,
            clientFirstName: updatedClient.firstName,
            clientLastName: updatedClient.lastName,
            clientEmail: updatedClient.email,
            workflowName: currentWorkflowName,
            previousWorkflowName,
            stageName: currentStageName,
            previousStageName,
          });

          const sendInApp =
            rule.channel === "in_app" || rule.channel === "both";
          const sendEmailChannel =
            rule.channel === "email" || rule.channel === "both";

          let notificationEventId: string | null = null;

          try {
            const event = await prisma.notificationEvent.create({
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
              select: {
                id: true,
              },
            });

            notificationEventId = event.id;
          } catch (eventError) {
            console.error("NotificationEvent create error:", eventError);
          }

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
                    provider: "resend",
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
                      provider: "resend",
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
                }
              } catch (emailError) {
                console.error("Workflow rule client email error:", emailError);

                await prisma.clientCommunication.create({
                  data: {
                    clientId: updatedClient.id,
                    provider: "resend",
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
                      provider: "resend",
                      channel: "email",
                      recipient: updatedClient.email,
                      targetType: rule.targetType,
                      status: "failed",
                      subject: rendered.subject,
                      body: rendered.html,
                      errorMessage:
                        emailError instanceof Error
                          ? emailError.message
                          : "Workflow rule client email failed",
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
              assignedToId: updatedClient.assignedToId,
              branchId: updatedClient.branchId,
            });

            for (const recipient of internalRecipients) {
              if (sendInApp) {
                try {
                  await createNotification({
                    userId: recipient.userId,
                    title: rendered.title || "Client Workflow Updated",
                    message:
                      rendered.message ||
                      `${clientName}: ${
                        currentStageName
                          ? `stage is now ${currentStageName}`
                          : "workflow was updated"
                      }`,
                    type: "client_stage_changed",
                    link: `/clients/${updatedClient.id}`,
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
                    `Workflow rule ${rule.targetType} in-app notification error:`,
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
                    rendered.subject || `Client workflow update: ${clientName}`;

                  const internalMessage =
                    rendered.message ||
                    `${clientName} ${
                      currentStageName
                        ? `moved to stage ${currentStageName}`
                        : "workflow was updated"
                    }${currentWorkflowName ? ` in ${currentWorkflowName}` : ""}.`;

                  const internalEmailResult = await sendEmail({
                    to: recipient.email,
                    subject: internalSubject,
                    html: emailTemplate({
                      title: internalSubject,
                      message: internalMessage,
                      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/clients/${updatedClient.id}`,
                      actionLabel: "Open Client",
                    }),
                  });

                  if (notificationEventId) {
                    await prisma.notificationDelivery.create({
                      data: {
                        notificationEventId,
                        provider: "resend",
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
                    `Workflow rule ${rule.targetType} email error:`,
                    internalEmailError
                  );

                  if (notificationEventId) {
                    await prisma.notificationDelivery.create({
                      data: {
                        notificationEventId,
                        provider: "resend",
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

      if (
        matchedRuleCount === 0 &&
        updatedClient.assignedToId &&
        (workflowChanged || stageChanged)
      ) {
        const activityParts: string[] = [];

        if (workflowChanged) {
          activityParts.push(
            currentWorkflowName
              ? `Workflow updated to ${currentWorkflowName}`
              : "Workflow was removed"
          );
        }

        if (stageChanged && currentStageName) {
          activityParts.push(`Stage is now ${currentStageName}`);
        }

        if (activityParts.length > 0) {
          await createNotification({
            userId: updatedClient.assignedToId,
            title: "Client Workflow Updated",
            message: `${clientName}: ${activityParts.join(" • ")}`,
            type: "client_stage_changed",
            link: `/clients/${updatedClient.id}`,
          });
        }
      }

      if (
        matchedRuleCount === 0 &&
        updatedClient.email &&
        (workflowChanged || stageChanged)
      ) {
        const messageParts: string[] = [];

        if (workflowChanged) {
          if (currentWorkflowName) {
            messageParts.push(
              previousWorkflowName
                ? `Your workflow has been updated from ${previousWorkflowName} to ${currentWorkflowName}.`
                : `Your workflow has been assigned as ${currentWorkflowName}.`
            );
          } else {
            messageParts.push("Your workflow assignment has been removed.");
          }
        }

        if (stageChanged && currentStageName) {
          if (previousStageName) {
            messageParts.push(
              `Your stage has moved from ${previousStageName} to ${currentStageName}.`
            );
          } else {
            messageParts.push(`Your current stage is now ${currentStageName}.`);
          }
        }

        if (messageParts.length > 0) {
          await sendEmail({
            to: updatedClient.email,
            subject: "Workflow Update",
            html: emailTemplate({
              title: "Workflow Update",
              message: messageParts.join(" "),
              actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/clients/${updatedClient.id}`,
              actionLabel: "View Profile",
            }),
          });
        }
      }
    } catch (notificationError) {
      console.error("Workflow notification/email error:", notificationError);
    }

    return NextResponse.redirect(new URL(`/clients/${id}`, req.url));
  } catch (error) {
    console.error("Assign workflow error:", error);
    return Response.json(
      { error: "Failed to assign workflow" },
      { status: 500 }
    );
  }
}