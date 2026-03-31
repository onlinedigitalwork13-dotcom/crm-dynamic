import { prisma } from "@/lib/prisma";
import { logClientActivity } from "@/lib/activity-service";
import { createNotification } from "@/lib/notification-service";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const formData = await req.formData();

    const title = ((formData.get("title") as string) || "").trim();
    const description = ((formData.get("description") as string) || "").trim();
    const assignedToId = ((formData.get("assignedToId") as string) || "").trim();
    const assignedById = ((formData.get("assignedById") as string) || "").trim();
    const dueDateRaw = ((formData.get("dueDate") as string) || "").trim();

    if (!title || !assignedToId || !assignedById) {
      return Response.json(
        { error: "Title, assignedToId and assignedById are required" },
        { status: 400 }
      );
    }

    const assignedTo = await prisma.user.findUnique({
      where: { id: assignedToId },
      select: { firstName: true, lastName: true },
    });

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        clientId: id,
        assignedToId,
        assignedById,
        dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
      },
    });

    if (task.assignedToId !== task.assignedById) {
      await createNotification({
        userId: task.assignedToId,
        title: "New Task Assigned",
        message: `You have been assigned: ${task.title}`,
        type: "task_assigned",
        link: "/tasks",
      });
    }

    await logClientActivity({
      clientId: id,
      type: "task_created",
      message: `Task created: ${title}${
        assignedTo
          ? ` (Assigned to ${assignedTo.firstName} ${assignedTo.lastName})`
          : ""
      }`,
    });

    return NextResponse.redirect(new URL(`/clients/${id}`, req.url));
  } catch (error) {
    console.error("Create client task error:", error);
    return Response.json(
      { error: "Failed to create client task" },
      { status: 500 }
    );
  }
}