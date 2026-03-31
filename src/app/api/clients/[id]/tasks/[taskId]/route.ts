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
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        title: true,
        clientId: true,
      },
    });

    if (!task) {
      return Response.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    if (task.clientId) {
      await logClientActivity({
        clientId: task.clientId,
        type: "task_deleted",
        message: `Task deleted: ${task.title}`,
      });
    }

    return NextResponse.redirect(new URL(`/clients/${id}`, req.url));
  } catch (error) {
    console.error("Delete client task error:", error);
    return Response.json(
      { error: "Failed to delete client task" },
      { status: 500 }
    );
  }
}