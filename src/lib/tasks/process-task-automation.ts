import { prisma } from "@/lib/prisma";

type Input = {
  eventType: string;
  taskId: string;
};

export async function processTaskAutomation(input: Input) {
  const { eventType, taskId } = input;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      client: true,
      assignedTo: true,
      assignedBy: true,
    },
  });

  if (!task) return;

  const workflowId = task.client?.workflowId ?? null;

  const templates = await prisma.taskAutomationTemplate.findMany({
    where: {
      isActive: true,
      triggerEventType: eventType,
      AND: [
        {
          OR: [{ triggerStatus: task.status }, { triggerStatus: null }],
        },
        {
          OR: [{ workflowId }, { workflowId: null }],
        },
      ],
    },
  });

  for (const template of templates) {
    if (template.sourceTaskTitle) {
      if (
        !task.title
          .toLowerCase()
          .includes(template.sourceTaskTitle.toLowerCase())
      ) {
        continue;
      }
    }

    let assignedToId = task.assignedToId;

    if (template.assignToType === "assigned_user") {
      assignedToId = task.assignedToId;
    } else if (template.assignToType === "self") {
      assignedToId = task.assignedById;
    } else if (template.assignToType === "branch_admin") {
      const branchAdmin = await prisma.user.findFirst({
        where: {
          branchId: task.client?.branchId ?? task.assignedTo?.branchId ?? null,
          isActive: true,
          role: {
            name: {
              in: ["admin", "branch_manager", "super_admin"],
            },
          },
        },
        select: { id: true },
      });

      if (branchAdmin) {
        assignedToId = branchAdmin.id;
      }
    }

    let dueDate: Date | null = null;

    if ((template.offsetDays ?? 0) > 0) {
      dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + template.offsetDays);
    }

    const alreadyExists = await prisma.task.findFirst({
      where: {
        title: template.titleTemplate,
        clientId: task.clientId,
        assignedToId,
        status: "pending",
      },
      select: { id: true },
    });

    if (alreadyExists) {
      continue;
    }

    await prisma.task.create({
      data: {
        title: template.titleTemplate,
        description: template.descriptionTemplate ?? null,
        clientId: task.clientId,
        assignedToId,
        assignedById: task.assignedById,
        dueDate,
        status: "pending",
        reminderEnabled: true,
      },
    });
  }
}