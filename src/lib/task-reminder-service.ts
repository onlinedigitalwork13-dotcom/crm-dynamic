import { prisma } from "@/lib/prisma";

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startOfTomorrow() {
  const today = startOfToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
}

export async function getTasksNeedingReminder() {
  const today = startOfToday();
  const tomorrow = startOfTomorrow();

  return prisma.task.findMany({
    where: {
      reminderEnabled: true,
      status: {
        not: "completed",
      },
      dueDate: {
        not: null,
        lt: tomorrow,
      },
      OR: [
        { lastReminderSentAt: null },
        { lastReminderSentAt: { lt: today } },
      ],
    },
    include: {
      client: true,
      assignedTo: true,
      assignedBy: true,
    },
    orderBy: {
      dueDate: "asc",
    },
  });
}

export async function markTaskReminderSent(taskId: string) {
  return prisma.task.update({
    where: { id: taskId },
    data: {
      lastReminderSentAt: new Date(),
      reminderCount: {
        increment: 1,
      },
    },
  });
}