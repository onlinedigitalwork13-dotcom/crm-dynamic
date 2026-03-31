import { prisma } from "@/lib/prisma";
import { logClientActivity } from "@/lib/activity-service";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
    taskId: string;
  }>;
};

export async function POST(req: Request, context: RouteContext) {
  const { id, taskId } = await context.params;

  try {
    const formData = await req.formData();

    const title = ((formData.get("title") as string) || "").trim();
    const description = ((formData.get("description") as string) || "").trim();
    const assignedToId = ((formData.get("assignedToId") as string) || "").trim();
    const dueDateRaw = ((formData.get("dueDate") as string) || "").trim();

    if (!title || !assignedToId) {
      return NextResponse.json(
        { error: "Title and assignedToId are required" },
        { status: 400 }
      );
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        clientId: true,
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    const assignedTo = await prisma.user.findUnique({
      where: { id: assignedToId },
      select: { firstName: true, lastName: true },
    });

    await prisma.task.update({
      where: { id: taskId },
      data: {
        title,
        description: description || null,
        assignedToId,
        dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
      },
    });

    if (task.clientId) {
      await logClientActivity({
        clientId: task.clientId,
        type: "task_updated",
        message: `Task updated: ${title}${
          assignedTo ? ` (Assigned to ${assignedTo.firstName} ${assignedTo.lastName})` : ""
        }`,
      });
    }

    return NextResponse.redirect(new URL(`/clients/${id}`, req.url), 303);
  } catch (error) {
    console.error("Edit client task error:", error);
    return NextResponse.json(
      { error: "Failed to update client task" },
      { status: 500 }
    );
  }
}