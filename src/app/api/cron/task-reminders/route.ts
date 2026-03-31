import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notification-service";
import { sendEmail, emailTemplate } from "@/lib/resend";

export async function GET() {
  try {
    const now = new Date();

    const next24Hours = new Date();
    next24Hours.setHours(next24Hours.getHours() + 24);

    const tasks = await prisma.task.findMany({
      where: {
        status: {
          not: "completed",
        },
        reminderEnabled: true,
        dueDate: {
          not: null,
          lte: next24Hours,
          gte: now,
        },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        assignedToId: true,
        lastReminderSentAt: true,
        reminderCount: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    let sent = 0;

    for (const task of tasks) {
      if (task.lastReminderSentAt) {
        const lastSent = new Date(task.lastReminderSentAt);
        const hoursDiff =
          (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);

        if (hoursDiff < 12) {
          continue;
        }
      }

      if (!task.assignedToId) continue;

      await createNotification({
        userId: task.assignedToId,
        title: "Task Due Soon",
        message: `Task "${task.title}" is due soon`,
        type: "task_due",
        link: "/tasks",
      });

      try {
        if (task.assignedTo?.email) {
          await sendEmail({
            to: task.assignedTo.email,
            subject: "Task Due Soon",
            html: emailTemplate({
              title: "Task Due Soon",
              message: `Task "${task.title}" is due within the next 24 hours.`,
              actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/tasks`,
              actionLabel: "Open Tasks",
            }),
          });
        }
      } catch (emailError) {
        console.error(
          `Task reminder email failed for task ${task.id}:`,
          emailError
        );
      }

      await prisma.task.update({
        where: { id: task.id },
        data: {
          lastReminderSentAt: new Date(),
          reminderCount: {
            increment: 1,
          },
        },
      });

      sent++;
    }

    return NextResponse.json({
      success: true,
      checked: tasks.length,
      remindersSent: sent,
    });
  } catch (error) {
    console.error("Task reminder cron error:", error);

    return NextResponse.json(
      { error: "Failed to process reminders" },
      { status: 500 }
    );
  }
}